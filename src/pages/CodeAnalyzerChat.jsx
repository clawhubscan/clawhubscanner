import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { RepoLoader } from "../components/code-analyzer/RepoLoader";
import { RepoLayout } from "../components/code-analyzer/RepoLayout";

// Hidden file patterns
const HIDDEN_PATTERNS = [
  { pattern: /^\./, reason: "Hidden file" },
  { pattern: /node_modules/, reason: "Dependencies" },
  { pattern: /\.lock$/, reason: "Lock file" },
  { pattern: /\.min\.(js|css)$/, reason: "Minified" },
  { pattern: /dist\//, reason: "Build output" },
  { pattern: /build\//, reason: "Build output" },
  { pattern: /\.map$/, reason: "Source map" },
  { pattern: /vendor\//, reason: "Vendor" },
  { pattern: /__pycache__/, reason: "Python cache" },
];

function isHiddenFile(path) {
  for (const { pattern, reason } of HIDDEN_PATTERNS) {
    if (pattern.test(path)) {
      return { hidden: true, reason };
    }
  }
  return { hidden: false };
}

export function CodeAnalyzerChat() {
  const { owner, repo } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const profile = searchParams.get("profile");

  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState(null);
  const [repoContext, setRepoContext] = useState(null);
  const [hiddenFiles, setHiddenFiles] = useState([]);
  const [repoData, setRepoData] = useState(null);

  useEffect(() => {
    // Handle profile-only queries (redirect to profile page if needed)
    if (!owner && !repo && profile) {
      // For now, redirect to home with message
      // TODO: Implement profile chat
      navigate("/code-analyzer");
      return;
    }

    if (!owner || !repo) {
      navigate("/code-analyzer");
      return;
    }

    loadRepository();
  }, [owner, repo]);

  const loadRepository = async () => {
    try {
      // Step 0: Fetch repo structure
      setLoadingStep(0);

      const response = await fetch("/api/code-analyzer/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo,
          files: [], // Empty to just get tree
          fetchTree: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch repository");
      }

      const { tree, repoInfo } = await response.json();

      // Step 1: Analyze file tree
      setLoadingStep(1);
      setRepoData(repoInfo);

      // Filter hidden files
      const hidden = [];
      const visibleTree = tree.filter((file) => {
        const check = isHiddenFile(file.path);
        if (check.hidden) {
          hidden.push({ path: file.path, reason: check.reason });
          return false;
        }
        return true;
      });

      setHiddenFiles(hidden);

      // Step 2: Prepare interface
      setLoadingStep(2);

      // Small delay for UX
      await new Promise((resolve) => setTimeout(resolve, 500));

      setRepoContext({
        owner,
        repo,
        fileTree: visibleTree,
      });

      setLoadingStep(3);
    } catch (err) {
      console.error("Failed to load repository:", err);
      setError(err.message);
    }
  };

  // Show loader while loading
  if (!repoContext) {
    return (
      <RepoLoader
        owner={owner}
        repo={repo}
        currentStep={loadingStep}
        error={error}
      />
    );
  }

  // Show main layout
  return (
    <RepoLayout
      repoContext={repoContext}
      hiddenFiles={hiddenFiles}
      repoData={repoData}
    />
  );
}
