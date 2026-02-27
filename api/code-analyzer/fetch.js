// Vercel Serverless Function for fetching repository files
// Uses Git Trees API for optimal performance (1 API call vs 20-50)

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { owner, repo, files = [], fetchTree = false } = req.body;

  if (!owner || !repo) {
    return res.status(400).json({ error: "Missing owner or repo" });
  }

  const headers = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "DYOR-Code-Analyzer",
  };

  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  }

  try {
    // Fetch repo info
    const repoResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      { headers }
    );

    if (!repoResponse.ok) {
      const error = await repoResponse.json();
      return res.status(repoResponse.status).json({
        error: error.message || "Repository not found",
      });
    }

    const repoInfo = await repoResponse.json();
    const defaultBranch = repoInfo.default_branch;

    // Fetch file tree using Git Trees API (recursive)
    const treeResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
      { headers }
    );

    if (!treeResponse.ok) {
      return res.status(treeResponse.status).json({
        error: "Failed to fetch repository tree",
      });
    }

    const treeData = await treeResponse.json();

    // Filter to only include blob files (not directories)
    const tree = treeData.tree
      .filter((item) => item.type === "blob")
      .map((item) => ({
        path: item.path,
        sha: item.sha,
        size: item.size,
        type: item.type,
      }));

    // If just fetching tree, return it
    if (fetchTree || files.length === 0) {
      return res.status(200).json({
        tree,
        repoInfo: {
          description: repoInfo.description,
          stargazers_count: repoInfo.stargazers_count,
          forks_count: repoInfo.forks_count,
          open_issues_count: repoInfo.open_issues_count,
          updated_at: repoInfo.updated_at,
          language: repoInfo.language,
        },
      });
    }

    // Fetch specific file contents
    const fileContents = [];

    for (const file of files.slice(0, 20)) {
      // Limit to 20 files
      try {
        // Find the file in tree to get SHA
        const treeFile = tree.find((t) => t.path === file.path);
        if (!treeFile) continue;

        // Use Git Blobs API for efficient fetching
        const blobResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/git/blobs/${treeFile.sha}`,
          { headers }
        );

        if (!blobResponse.ok) continue;

        const blobData = await blobResponse.json();

        // Decode base64 content
        let content;
        if (blobData.encoding === "base64") {
          content = Buffer.from(blobData.content, "base64").toString("utf-8");
        } else {
          content = blobData.content;
        }

        // Truncate very large files
        if (content.length > 50000) {
          content = content.slice(0, 50000) + "\n... (truncated)";
        }

        fileContents.push({
          path: file.path,
          content,
        });
      } catch (e) {
        console.error(`Error fetching ${file.path}:`, e);
      }
    }

    // Build context string
    const context = fileContents
      .map((f) => `### File: ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
      .join("\n\n");

    return res.status(200).json({
      context,
      tree,
      filesLoaded: fileContents.length,
      repoInfo: {
        description: repoInfo.description,
        stargazers_count: repoInfo.stargazers_count,
        forks_count: repoInfo.forks_count,
        open_issues_count: repoInfo.open_issues_count,
        updated_at: repoInfo.updated_at,
        language: repoInfo.language,
      },
    });
  } catch (error) {
    console.error("Fetch error:", error);
    return res.status(500).json({ error: error.message });
  }
}
