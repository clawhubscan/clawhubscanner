import { useState, useRef, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Send,
  Loader2,
  FileCode,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Github,
  Menu,
  MessageCircle,
  Trash2,
} from "lucide-react";
import { BotIcon } from "./icons/BotIcon";
import { UserIcon } from "./icons/UserIcon";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/code-analyzer/utils";
import { EnhancedMarkdown } from "./EnhancedMarkdown";
import {
  countMessageTokens,
  formatTokenCount,
  getTokenWarningLevel,
  isRateLimitError,
  getRateLimitErrorMessage,
  MAX_TOKENS,
} from "../../lib/code-analyzer/tokens";
import { generateMermaidFromJSON } from "../../lib/code-analyzer/diagram-utils";
import {
  saveConversation,
  loadConversation,
  clearConversation,
} from "../../lib/code-analyzer/storage";
import { repairMarkdown } from "../../lib/code-analyzer/markdown-utils";
import { DevTools } from "./DevTools";
import { ConfirmDialog } from "./ConfirmDialog";
import { CodeBlock } from "./CodeBlock";
import { Mermaid } from "./Mermaid";
import { StreamingProgress } from "./StreamingProgress";

const REPO_SUGGESTIONS = [
  "Show me the user flow chart",
  "Find security vulnerabilities",
  "Evaluate code quality",
  "What's the tech stack?",
  "Explain the architecture",
];

// Extract MessageContent to a memoized component
function MessageContent({ content, messageId }) {
  const repairedContent = useMemo(() => repairMarkdown(content), [content]);
  const componentsRef = useRef(null);

  const components = useMemo(() => {
    const comps = {
      code: ({ className, children, ...props }) => {
        const match = /language-(\w+)/.exec(className || "");
        const isMermaid = match && match[1] === "mermaid";
        const isMermaidJson = match && match[1] === "mermaid-json";

        if (isMermaid) {
          return (
            <Mermaid
              key={messageId}
              chart={String(children).replace(/\n$/, "")}
            />
          );
        }

        if (isMermaidJson) {
          try {
            const jsonContent = String(children).replace(/\n$/, "");
            const data = JSON.parse(jsonContent);
            const chart = generateMermaidFromJSON(data);
            return <Mermaid key={messageId} chart={chart} />;
          } catch (e) {
            return (
              <div className="flex items-center gap-2 p-4 bg-zinc-900/50 rounded-lg border border-white/10">
                <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                <span className="text-zinc-400 text-sm">
                  Generating diagram...
                </span>
              </div>
            );
          }
        }

        return match ? (
          <CodeBlock
            language={match[1]}
            value={String(children).replace(/\n$/, "")}
            components={componentsRef.current}
          />
        ) : (
          <code
            className="bg-zinc-800 px-1.5 py-0.5 rounded text-red-400 font-mono text-sm"
            {...props}
          >
            {children}
          </code>
        );
      },
      pre: ({ children }) => <>{children}</>,
      table: ({ children }) => (
        <div className="overflow-x-auto my-4">
          <table className="min-w-full border-collapse border border-zinc-700">
            {children}
          </table>
        </div>
      ),
      thead: ({ children }) => (
        <thead className="bg-zinc-800">{children}</thead>
      ),
      tbody: ({ children }) => (
        <tbody className="bg-zinc-900/50">{children}</tbody>
      ),
      tr: ({ children }) => (
        <tr className="border-b border-zinc-700">{children}</tr>
      ),
      th: ({ children }) => (
        <th className="px-4 py-2 text-left text-sm font-semibold text-white border border-zinc-700">
          {children}
        </th>
      ),
      td: ({ children }) => (
        <td className="px-4 py-2 text-sm text-zinc-300 border border-zinc-700">
          {children}
        </td>
      ),
    };
    componentsRef.current = comps;
    return comps;
  }, [messageId]);

  return <EnhancedMarkdown content={repairedContent} components={components} />;
}

export function ChatInterface({ repoContext, onToggleSidebar }) {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "model",
      content: `Hello! I've analyzed **${repoContext.owner}/${repoContext.repo}**. Ask me anything about the code structure, dependencies, or specific features.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [scanning, setScanning] = useState(false);
  const messagesEndRef = useRef(null);
  const [initialized, setInitialized] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Streaming state
  const [streamingStatus, setStreamingStatus] = useState(null);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState("");
  const [ownerProfile, setOwnerProfile] = useState(null);

  // Fetch owner profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch(
          `https://api.github.com/users/${repoContext.owner}`
        );
        if (response.ok) {
          const profile = await response.json();
          setOwnerProfile(profile);
        }
      } catch (e) {
        console.error("Failed to load owner profile:", e);
      }
    };
    loadProfile();
  }, [repoContext.owner]);

  // Load conversation on mount
  const toastShownRef = useRef(false);
  useEffect(() => {
    const saved = loadConversation(repoContext.owner, repoContext.repo);
    if (saved && saved.length > 1) {
      setMessages(saved);
      setShowSuggestions(false);
    }
    setInitialized(true);
  }, [repoContext.owner, repoContext.repo]);

  // Save on every message change
  useEffect(() => {
    if (initialized && messages.length > 1) {
      saveConversation(repoContext.owner, repoContext.repo, messages);
    }
  }, [messages, initialized, repoContext.owner, repoContext.repo]);

  // Calculate total token count
  const totalTokens = useMemo(() => {
    return countMessageTokens(
      messages.map((m) => ({ role: m.role, parts: m.content }))
    );
  }, [messages]);

  const tokenWarningLevel = getTokenWarningLevel(totalTokens);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
    setShowSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    if (totalTokens >= MAX_TOKENS) {
      alert("Conversation limit reached. Please clear the chat.");
      return;
    }

    setShowSuggestions(false);

    const userMsg = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Handle security scan
    if (
      input.toLowerCase().includes("find security vulnerabilities") ||
      input.toLowerCase().includes("scan for vulnerabilities")
    ) {
      setScanning(true);
      try {
        setStreamingStatus({ message: "Preparing security scan...", progress: 10 });

        const filesToScan = repoContext.fileTree.map((f) => ({
          path: f.path,
          sha: f.sha,
        }));

        const codeFileCount = filesToScan.filter((f) =>
          /\.(js|jsx|ts|tsx|py|java|php|rb|go|rs)$/i.test(f.path) ||
          f.path === "package.json"
        ).length;

        setStreamingStatus({
          message: `Scanning ${Math.min(codeFileCount, 20)} code files...`,
          progress: 30,
        });

        setStreamingStatus({
          message: "Running pattern-based analysis...",
          progress: 50,
        });

        const response = await fetch("/api/code-analyzer/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            owner: repoContext.owner,
            repo: repoContext.repo,
            files: filesToScan,
          }),
        });

        const { findings, summary } = await response.json();

        setStreamingStatus({ message: "Analyzing results...", progress: 90 });

        let content = "";

        if (summary.total === 0) {
          const filesScanned = summary.debug?.filesSuccessfullyFetched || 0;
          content = `✅ **Security scan complete!**\n\nI've scanned **${filesScanned} files** and found **no security vulnerabilities**.\n\nYour code looks secure! 🔒`;
        } else {
          const filesScanned = summary.debug?.filesSuccessfullyFetched || 0;
          content = `⚠️ **Security scan complete!**\n\nI've scanned **${filesScanned} files** and found **${summary.total} potential issue${summary.total !== 1 ? "s" : ""}**.\n\n`;

          if (summary.critical > 0) content += `🔴 **${summary.critical} Critical**\n`;
          if (summary.high > 0) content += `🟠 **${summary.high} High**\n`;
          if (summary.medium > 0) content += `🟡 **${summary.medium} Medium**\n`;
          if (summary.low > 0) content += `🔵 **${summary.low} Low**\n`;

          content += `\nHere are the key findings:\n\n`;

          findings.slice(0, 5).forEach((f) => {
            content += `### ${f.title}\n`;
            content += `**Severity**: ${f.severity.toUpperCase()}\n`;
            content += `**File**: \`${f.file}\` ${f.line ? `(Line ${f.line})` : ""}\n`;
            content += `**Issue**: ${f.description}\n`;
            content += `**Fix**: ${f.recommendation}\n\n`;
          });

          if (findings.length > 5) {
            content += `*...and ${findings.length - 5} more issue${findings.length - 5 !== 1 ? "s" : ""}.*`;
          }
        }

        const modelMsg = {
          id: (Date.now() + 1).toString(),
          role: "model",
          content: content,
          vulnerabilities: findings,
        };
        setMessages((prev) => [...prev, modelMsg]);
        setStreamingStatus(null);
        setLoading(false);
        setScanning(false);
        return;
      } catch (error) {
        console.error("Scan failed:", error);
        setStreamingStatus(null);
        setScanning(false);
        setLoading(false);

        const errorMsg = {
          id: (Date.now() + 1).toString(),
          role: "model",
          content:
            "I encountered an error while scanning for security vulnerabilities. Please try again.",
        };
        setMessages((prev) => [...prev, errorMsg]);
        return;
      }
    }

    // Normal chat flow
    try {
      const filePaths = repoContext.fileTree.map((f) => f.path);

      // Step 1: Analyze files
      setStreamingStatus({ message: "Selecting relevant files...", progress: 10 });

      const analyzeResponse = await fetch("/api/code-analyzer/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: input,
          filePaths,
          owner: repoContext.owner,
          repo: repoContext.repo,
        }),
      });

      const { relevantFiles, fileCount } = await analyzeResponse.json();

      // Step 2: Fetch files
      setStreamingStatus({
        message: `Fetching ${fileCount} file${fileCount !== 1 ? "s" : ""} from GitHub...`,
        progress: 40,
      });

      const filesToFetch = relevantFiles.map((path) => {
        const node = repoContext.fileTree.find((f) => f.path === path);
        return { path, sha: node?.sha || "" };
      });

      const fetchResponse = await fetch("/api/code-analyzer/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: repoContext.owner,
          repo: repoContext.repo,
          files: filesToFetch,
        }),
      });

      const { context } = await fetchResponse.json();

      // Step 3: Generate response
      setStreamingStatus({ message: "Generating response...", progress: 70 });

      const chatResponse = await fetch("/api/code-analyzer/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: input,
          context,
          repoInfo: { owner: repoContext.owner, repo: repoContext.repo },
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          ownerProfile,
        }),
      });

      // Handle streaming response
      const reader = chatResponse.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                answer += parsed.content;
                setCurrentStreamingMessage(answer);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      const modelMsg = {
        id: (Date.now() + 1).toString(),
        role: "model",
        content: answer,
        relevantFiles,
      };

      setMessages((prev) => [...prev, modelMsg]);
      setStreamingStatus(null);
      setCurrentStreamingMessage("");
    } catch (error) {
      console.error(error);

      if (isRateLimitError(error)) {
        alert(getRateLimitErrorMessage(error));
      }

      const errorMsg = {
        id: (Date.now() + 1).toString(),
        role: "model",
        content:
          "I encountered an error while analyzing the code. Please try again or rephrase your question.",
      };
      setMessages((prev) => [...prev, errorMsg]);
      setStreamingStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    clearConversation(repoContext.owner, repoContext.repo);
    setMessages([
      {
        id: "welcome",
        role: "model",
        content: `Hello! I've analyzed **${repoContext.owner}/${repoContext.repo}**. Ask me anything about the code structure, dependencies, or specific features.`,
      },
    ]);
    setShowSuggestions(true);
  };

  return (
    <div className="flex flex-col h-full bg-black text-white">
      {/* Repo Header */}
      <div className="border-b border-white/10 p-4 bg-zinc-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-4 max-w-3xl mx-auto">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="md:hidden p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-zinc-400" />
            </button>
          )}
          <Link
            to="/code-analyzer"
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Back to home"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-400 hover:text-white" />
          </Link>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Github className="w-5 h-5 text-zinc-400 shrink-0" />
            <h1 className="text-lg font-semibold text-zinc-100 truncate">
              {repoContext.owner}/{repoContext.repo}
            </h1>
          </div>

          <div
            className={cn(
              "ml-auto hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              tokenWarningLevel === "danger" &&
                "bg-red-500/10 text-red-400 border border-red-500/20",
              tokenWarningLevel === "warning" &&
                "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
              tokenWarningLevel === "safe" &&
                "bg-zinc-800 text-zinc-400 border border-white/10"
            )}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>
              {formatTokenCount(totalTokens)} / {formatTokenCount(MAX_TOKENS)}{" "}
              tokens
            </span>
          </div>

          <div className="hidden md:block">
            <DevTools
              repoContext={repoContext}
              onSendMessage={(role, content) => {
                setMessages((prev) => [
                  ...prev,
                  {
                    id: Date.now().toString(),
                    role,
                    content,
                  },
                ]);
              }}
            />
          </div>

          <button
            onClick={() => setShowClearConfirm(true)}
            className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
            title="Clear Chat"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-4 max-w-3xl mx-auto",
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
                  msg.role === "model"
                    ? "bg-gradient-to-br from-purple-600 to-blue-600"
                    : "bg-gradient-to-br from-zinc-700 to-zinc-900 border border-white/10"
                )}
              >
                {msg.role === "model" ? (
                  <BotIcon className="w-6 h-6 text-white" />
                ) : (
                  <UserIcon className="w-6 h-6 text-white" />
                )}
              </div>

              <div
                className={cn(
                  "flex flex-col gap-2",
                  msg.role === "user"
                    ? "items-end max-w-[85%] md:max-w-[80%]"
                    : "items-start max-w-full md:max-w-full w-full min-w-0"
                )}
              >
                <div
                  className={cn(
                    "p-4 rounded-2xl overflow-hidden w-full min-w-0",
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-tr-none"
                      : "bg-zinc-900 border border-white/10 rounded-tl-none"
                  )}
                >
                  <div className="prose prose-invert prose-sm max-w-none leading-relaxed break-words overflow-hidden w-full min-w-0">
                    <MessageContent content={msg.content} messageId={msg.id} />
                  </div>
                </div>

                {msg.relevantFiles && msg.relevantFiles.length > 0 && (
                  <details className="group mt-1">
                    <summary className="flex items-center gap-2 text-xs text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors select-none">
                      <FileCode className="w-3 h-3" />
                      <span>{msg.relevantFiles.length} files analyzed</span>
                      <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
                    </summary>
                    <ul className="mt-2 space-y-1 text-xs text-zinc-600 pl-4">
                      {msg.relevantFiles.map((file, i) => (
                        <li key={i} className="font-mono">
                          {file}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {(loading || streamingStatus) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-4 max-w-3xl mx-auto"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shrink-0 shadow-lg animate-pulse">
              <BotIcon className="w-6 h-6 text-white opacity-80" />
            </div>
            <div className="bg-zinc-900 border border-white/10 p-4 rounded-2xl rounded-tl-none flex-1">
              {streamingStatus ? (
                <StreamingProgress
                  message={streamingStatus.message}
                  progress={streamingStatus.progress}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                  <span className="text-zinc-400 text-sm">
                    Analyzing code...
                  </span>
                </div>
              )}

              {currentStreamingMessage && (
                <div className="prose prose-invert prose-sm max-w-none leading-relaxed break-words overflow-hidden w-full min-w-0 mt-4 border-t border-white/10 pt-4">
                  <MessageContent
                    content={currentStreamingMessage}
                    messageId="streaming"
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-white/10 bg-black/50 backdrop-blur-lg space-y-3">
        {showSuggestions && messages.length === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-zinc-400">Try asking:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {REPO_SUGGESTIONS.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-sm px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 hover:border-purple-600/50 rounded-full text-zinc-300 hover:text-white transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              totalTokens >= MAX_TOKENS
                ? "Conversation limit reached. Please clear chat."
                : "Ask a question about the code..."
            }
            className={cn(
              "w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-600/50 transition-all",
              totalTokens >= MAX_TOKENS && "opacity-50 cursor-not-allowed"
            )}
            disabled={totalTokens >= MAX_TOKENS}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading || totalTokens >= MAX_TOKENS}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-zinc-400 hover:text-white disabled:opacity-50 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>

      <ConfirmDialog
        isOpen={showClearConfirm}
        title="Clear Chat History?"
        message="This will permanently delete all messages in this conversation. This action cannot be undone."
        confirmText="Clear Chat"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={handleClearChat}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
}
