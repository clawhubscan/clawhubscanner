import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Github, ArrowRight, Sparkles } from "lucide-react";
import { FeatureTiles } from "../components/code-analyzer/FeatureTiles";

const EXAMPLES = [
  { label: "torvalds", type: "profile" },
  { label: "facebook/react", type: "repo" },
  { label: "vercel/next.js", type: "repo" },
];

export function CodeAnalyzerHome() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);

    // Check if it's a profile or repo
    if (query.includes("/")) {
      const [owner, repo] = query.split("/");
      navigate(`/code-analyzer/${owner}/${repo}`);
    } else {
      navigate(`/code-analyzer?profile=${query}`);
    }
  };

  const handleExample = (example) => {
    if (example.type === "profile") {
      navigate(`/code-analyzer?profile=${example.label}`);
    } else {
      navigate(`/code-analyzer/${example.label}`);
    }
  };

  return (
    <div className="code-analyzer-scope min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-600/10 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-600/20 rounded-full blur-[120px]" />

        <div className="relative max-w-5xl mx-auto px-4 pt-20 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-sm mb-8">
              <Sparkles className="w-4 h-4" />
              AI-Powered Code Analysis
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
              Understand Any GitHub
              <br />
              Repository Instantly
            </h1>

            <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-12">
              Chat with AI about any codebase. Get architecture insights,
              security analysis, and documentation in seconds.
            </p>

            {/* Search Form */}
            <form onSubmit={handleSubmit} className="max-w-xl mx-auto mb-8">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative flex items-center bg-zinc-900 rounded-xl border border-white/10">
                  <Github className="w-5 h-5 text-zinc-500 ml-4" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="username or username/repo"
                    className="flex-1 bg-transparent px-4 py-4 text-white placeholder-zinc-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={loading || !query.trim()}
                    className="m-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? (
                      "Loading..."
                    ) : (
                      <>
                        Analyze
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Examples */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="text-zinc-500 text-sm">Try:</span>
              {EXAMPLES.map((example) => (
                <button
                  key={example.label}
                  onClick={() => handleExample(example)}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-white/10 hover:border-purple-500/50 rounded-full text-sm text-zinc-300 hover:text-white transition-all"
                >
                  {example.label}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Powerful Features
          </h2>
          <p className="text-zinc-400">
            Everything you need to understand and analyze code
          </p>
        </div>
        <FeatureTiles />
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-zinc-500">
          <span>Built with AI</span>
          <span>Part of CLAW GITHUB Scanner</span>
        </div>
      </footer>
    </div>
  );
}
