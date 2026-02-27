import { motion } from "framer-motion";
import { Github, Loader2, CheckCircle, AlertCircle } from "lucide-react";

const LOADING_STEPS = [
  { id: "fetch", label: "Fetching repository structure" },
  { id: "analyze", label: "Analyzing file tree" },
  { id: "prepare", label: "Preparing chat interface" },
];

export function RepoLoader({ owner, repo, currentStep = 0, error = null }) {
  return (
    <div className="code-analyzer-scope min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
              <Github className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Loading Repository</h1>
              <p className="text-zinc-400 text-sm mt-1">
                {owner}/{repo}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {LOADING_STEPS.map((step, index) => {
              const isComplete = index < currentStep;
              const isCurrent = index === currentStep;
              const hasError = error && isCurrent;

              return (
                <div
                  key={step.id}
                  className="flex items-center gap-3"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      isComplete
                        ? "bg-green-500/20 text-green-400"
                        : hasError
                        ? "bg-red-500/20 text-red-400"
                        : isCurrent
                        ? "bg-purple-500/20 text-purple-400"
                        : "bg-zinc-800 text-zinc-600"
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : hasError ? (
                      <AlertCircle className="w-4 h-4" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span className="text-xs font-medium">{index + 1}</span>
                    )}
                  </div>
                  <span
                    className={`text-sm ${
                      isComplete
                        ? "text-green-400"
                        : hasError
                        ? "text-red-400"
                        : isCurrent
                        ? "text-white"
                        : "text-zinc-600"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="mt-8">
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
                initial={{ width: 0 }}
                animate={{
                  width: error
                    ? `${(currentStep / LOADING_STEPS.length) * 100}%`
                    : `${((currentStep + 0.5) / LOADING_STEPS.length) * 100}%`,
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
