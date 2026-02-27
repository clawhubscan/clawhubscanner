import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Wrench,
  Search,
  Shield,
  FileText,
  TestTube,
  Zap,
  X,
  Loader2,
  HelpCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function Tooltip({ children, text }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-zinc-800 text-xs text-white rounded shadow-lg whitespace-nowrap border border-white/10 z-50 pointer-events-none"
          >
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-800" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DevTools({ repoContext, onSendMessage }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("search");
  const [loadingOperation, setLoadingOperation] = useState(null);
  const [mounted, setMounted] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("text");

  // Quality/Gen State
  const [selectedFile, setSelectedFile] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoadingOperation("search");
    try {
      const filePaths = repoContext.fileTree.map((f) => f.path);

      const response = await fetch("/api/code-analyzer/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: repoContext.owner,
          repo: repoContext.repo,
          filePaths,
          query: searchQuery,
          type: searchType,
        }),
      });

      const results = await response.json();

      let content = `### 🔍 Search Results for "${searchQuery}" (${searchType})\n\n`;
      if (!results.length) {
        content += "No matches found.";
      } else {
        content += `Found **${results.length}** matches:\n\n`;
        results.slice(0, 30).forEach((r) => {
          content += `- [${r.file}](#preview-${r.file}) (Line ${r.line}): \`${r.content.slice(0, 100).trim()}\`\n`;
        });
        if (results.length > 30)
          content += `\n*...and ${results.length - 30} more.*`;
      }

      onSendMessage("model", content);
      setIsOpen(false);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoadingOperation(null);
    }
  };

  const handleQualityAnalysis = async () => {
    if (!selectedFile) return;

    setLoadingOperation("quality");
    try {
      const response = await fetch("/api/code-analyzer/quality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: repoContext.owner,
          repo: repoContext.repo,
          filePath: selectedFile,
        }),
      });

      const report = await response.json();

      if (!report || report.error) {
        throw new Error(report?.error || "Analysis failed");
      }

      let content = `### 🛡️ Quality Report: ${selectedFile}\n\n`;
      content += `**Score**: ${report.score}/100\n\n`;
      content += `**Complexity**: ${report.metrics?.complexity || "N/A"}\n\n`;
      content += `**Summary**: ${report.summary}\n\n`;

      if (report.issues?.length > 0) {
        content += `**Issues**:\n`;
        report.issues.forEach((issue) => {
          content += `- [${issue.severity.toUpperCase()}] Line ${issue.line}: ${issue.message}\n`;
        });
      } else {
        content += "✅ No significant issues found.";
      }

      onSendMessage("model", content);
      setIsOpen(false);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setLoadingOperation(null);
    }
  };

  const handleGenerate = async (type) => {
    if (!selectedFile) return;

    setLoadingOperation(type);
    try {
      const response = await fetch("/api/code-analyzer/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: repoContext.owner,
          repo: repoContext.repo,
          filePath: selectedFile,
          type,
        }),
      });

      const { artifact } = await response.json();

      let title = "";
      switch (type) {
        case "doc":
          title = "📝 Generated Documentation";
          break;
        case "test":
          title = "🧪 Generated Tests";
          break;
        case "refactor":
          title = "✨ Refactoring Suggestions";
          break;
      }

      let content = "";
      if (type === "refactor") {
        content = `### ${title} for \`${selectedFile}\`\n\n${artifact}`;
      } else {
        content = `### ${title} for \`${selectedFile}\`\n\n\`\`\`typescript\n${artifact}\n\`\`\``;
      }
      onSendMessage("model", content);
      setIsOpen(false);
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setLoadingOperation(null);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
        title="Dev Tools"
      >
        <Wrench className="w-5 h-5" />
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <div className="code-analyzer-scope fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl"
                >
                  <div className="flex items-center justify-between p-4 border-b border-white/10 bg-zinc-950/50 rounded-t-2xl">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-purple-400" />
                      Dev Tools
                    </h2>
                    <button
                      onClick={() => !loadingOperation && setIsOpen(false)}
                      className={`text-zinc-400 hover:text-white ${loadingOperation ? "opacity-50 cursor-not-allowed" : ""}`}
                      disabled={!!loadingOperation}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex border-b border-white/10">
                    {["search", "quality", "generate", "help"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        disabled={!!loadingOperation}
                        className={`flex-1 p-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                          activeTab === tab
                            ? "text-purple-400 border-b-2 border-purple-400 bg-purple-400/5"
                            : "text-zinc-400 hover:text-zinc-200"
                        } ${loadingOperation ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        {tab === "search" && <Search className="w-4 h-4" />}
                        {tab === "quality" && <Shield className="w-4 h-4" />}
                        {tab === "generate" && <Zap className="w-4 h-4" />}
                        {tab === "help" && <HelpCircle className="w-4 h-4" />}
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>

                  <div className="p-6 min-h-[300px]">
                    {activeTab === "search" && (
                      <form onSubmit={handleSearch} className="space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-zinc-400 mb-1">
                            Search Query
                          </label>
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-purple-500/50 outline-none"
                            placeholder="Function name, regex pattern..."
                            disabled={!!loadingOperation}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-400 mb-1">
                            Search Type
                          </label>
                          <div className="flex gap-2">
                            {[
                              { type: "text", tip: "Standard string search" },
                              { type: "regex", tip: "Regular expression pattern" },
                              { type: "ast", tip: "Abstract Syntax Tree search" },
                            ].map(({ type, tip }) => (
                              <Tooltip key={type} text={tip}>
                                <button
                                  type="button"
                                  onClick={() => setSearchType(type)}
                                  disabled={!!loadingOperation}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                                    searchType === type
                                      ? "bg-purple-500/20 border-purple-500 text-purple-300"
                                      : "bg-zinc-800 border-white/10 text-zinc-400 hover:bg-zinc-700"
                                  } ${loadingOperation ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                                  {type.toUpperCase()}
                                </button>
                              </Tooltip>
                            ))}
                          </div>
                        </div>
                        <button
                          type="submit"
                          disabled={!!loadingOperation || !searchQuery}
                          className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {loadingOperation === "search" ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Search className="w-4 h-4" />
                          )}
                          Run Search
                        </button>
                      </form>
                    )}

                    {(activeTab === "quality" || activeTab === "generate") && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-zinc-400 mb-1">
                            Select File
                          </label>
                          <select
                            value={selectedFile}
                            onChange={(e) => setSelectedFile(e.target.value)}
                            disabled={!!loadingOperation}
                            className="w-full bg-zinc-950 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-purple-500/50 outline-none appearance-none disabled:opacity-50"
                          >
                            <option value="">-- Choose a file --</option>
                            {repoContext.fileTree
                              .filter((f) =>
                                /\.(js|jsx|ts|tsx|py|go|rs|java)$/.test(f.path)
                              )
                              .map((f) => (
                                <option key={f.path} value={f.path}>
                                  {f.path}
                                </option>
                              ))}
                          </select>
                        </div>

                        {activeTab === "quality" && (
                          <button
                            onClick={handleQualityAnalysis}
                            disabled={!!loadingOperation || !selectedFile}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {loadingOperation === "quality" ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Shield className="w-4 h-4" />
                            )}
                            Analyze Quality
                          </button>
                        )}

                        {activeTab === "generate" && (
                          <div className="grid grid-cols-1 gap-2">
                            <button
                              onClick={() => handleGenerate("doc")}
                              disabled={!!loadingOperation || !selectedFile}
                              className="p-3 bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-lg text-left flex items-center gap-3 transition-colors disabled:opacity-50"
                            >
                              {loadingOperation === "doc" ? (
                                <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                              ) : (
                                <FileText className="w-5 h-5 text-green-400" />
                              )}
                              <div>
                                <div className="text-sm font-medium text-white">
                                  Generate Documentation
                                </div>
                                <div className="text-xs text-zinc-500">
                                  JSDoc/TSDoc comments
                                </div>
                              </div>
                            </button>
                            <button
                              onClick={() => handleGenerate("test")}
                              disabled={!!loadingOperation || !selectedFile}
                              className="p-3 bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-lg text-left flex items-center gap-3 transition-colors disabled:opacity-50"
                            >
                              {loadingOperation === "test" ? (
                                <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                              ) : (
                                <TestTube className="w-5 h-5 text-blue-400" />
                              )}
                              <div>
                                <div className="text-sm font-medium text-white">
                                  Generate Unit Tests
                                </div>
                                <div className="text-xs text-zinc-500">
                                  Jest/Vitest templates
                                </div>
                              </div>
                            </button>
                            <button
                              onClick={() => handleGenerate("refactor")}
                              disabled={!!loadingOperation || !selectedFile}
                              className="p-3 bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-lg text-left flex items-center gap-3 transition-colors disabled:opacity-50"
                            >
                              {loadingOperation === "refactor" ? (
                                <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
                              ) : (
                                <Zap className="w-5 h-5 text-yellow-400" />
                              )}
                              <div>
                                <div className="text-sm font-medium text-white">
                                  Suggest Refactoring
                                </div>
                                <div className="text-xs text-zinc-500">
                                  Improve code quality
                                </div>
                              </div>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "help" && (
                      <div className="space-y-6 text-sm text-zinc-300">
                        <div className="space-y-2">
                          <h3 className="font-semibold text-white flex items-center gap-2">
                            <Search className="w-4 h-4 text-purple-400" />
                            How to Use Advanced Search
                          </h3>
                          <ol className="list-decimal list-inside space-y-1 text-zinc-400 ml-1">
                            <li>Open a repo and click the wrench icon.</li>
                            <li>Select the Search tab.</li>
                            <li>
                              Type a function name and select AST for
                              structure-aware search.
                            </li>
                            <li>See it find the definition instantly.</li>
                          </ol>
                        </div>

                        <div className="space-y-2">
                          <h3 className="font-semibold text-white flex items-center gap-2">
                            <Shield className="w-4 h-4 text-blue-400" />
                            How to Analyze Quality
                          </h3>
                          <ol className="list-decimal list-inside space-y-1 text-zinc-400 ml-1">
                            <li>Click Quality tab.</li>
                            <li>Select a source file.</li>
                            <li>Click Analyze Quality.</li>
                            <li>Review the complexity score and AI feedback.</li>
                          </ol>
                        </div>

                        <div className="space-y-2">
                          <h3 className="font-semibold text-white flex items-center gap-2">
                            <TestTube className="w-4 h-4 text-green-400" />
                            How to Generate Tests
                          </h3>
                          <ol className="list-decimal list-inside space-y-1 text-zinc-400 ml-1">
                            <li>Click Generate tab.</li>
                            <li>Select a file.</li>
                            <li>Click Generate Unit Tests.</li>
                            <li>Copy the generated Jest code block.</li>
                          </ol>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
