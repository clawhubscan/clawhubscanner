import { useState, useEffect } from "react";
import { RepoSidebar } from "./RepoSidebar";
import { ChatInterface } from "./ChatInterface";
import { FilePreview } from "./FilePreview";

export function RepoLayout({ repoContext, hiddenFiles = [], repoData }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [previewFile, setPreviewFile] = useState(null);

  // Listen for file preview events from SmartLink
  useEffect(() => {
    const handleOpenPreview = (event) => {
      setPreviewFile(event.detail);
    };

    window.addEventListener("open-file-preview", handleOpenPreview);
    return () => {
      window.removeEventListener("open-file-preview", handleOpenPreview);
    };
  }, []);

  return (
    <div className="code-analyzer-scope h-screen flex bg-black overflow-hidden">
      <RepoSidebar
        fileTree={repoContext.fileTree}
        repoName={`${repoContext.owner}/${repoContext.repo}`}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onFileDoubleClick={(path) => setPreviewFile(path)}
        hiddenFiles={hiddenFiles}
        repoData={repoData}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <ChatInterface
          repoContext={repoContext}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
      </div>

      <FilePreview
        isOpen={!!previewFile}
        filePath={previewFile}
        repoOwner={repoContext.owner}
        repoName={repoContext.repo}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  );
}
