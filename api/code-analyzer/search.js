// Vercel Serverless Function for code search

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { owner, repo, filePaths, query, type = "text" } = req.body;

  if (!owner || !repo || !query) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  const headers = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "DYOR-Code-Analyzer",
  };

  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  }

  try {
    const results = [];

    // Limit files to search
    const filesToSearch = filePaths
      .filter((p) => /\.(js|jsx|ts|tsx|py|go|rs|java|rb|php|c|cpp|h|hpp|cs|swift|kt|scala|md|json|yaml|yml)$/i.test(p))
      .slice(0, 30);

    for (const filePath of filesToSearch) {
      try {
        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}`,
          { headers }
        );

        if (!response.ok) continue;

        const data = await response.json();
        if (!data.content) continue;

        const content = Buffer.from(data.content, "base64").toString("utf-8");
        const lines = content.split("\n");

        // Search based on type
        let searchFn;

        switch (type) {
          case "regex":
            try {
              const regex = new RegExp(query, "gi");
              searchFn = (line) => regex.test(line);
            } catch (e) {
              searchFn = (line) => line.toLowerCase().includes(query.toLowerCase());
            }
            break;

          case "ast":
            // AST-like search: look for function/class/variable definitions
            const astPatterns = [
              new RegExp(`function\\s+${query}\\s*\\(`, "i"),
              new RegExp(`const\\s+${query}\\s*=`, "i"),
              new RegExp(`let\\s+${query}\\s*=`, "i"),
              new RegExp(`var\\s+${query}\\s*=`, "i"),
              new RegExp(`class\\s+${query}\\s*[{<]`, "i"),
              new RegExp(`def\\s+${query}\\s*\\(`, "i"),
              new RegExp(`async\\s+function\\s+${query}`, "i"),
              new RegExp(`export\\s+(const|let|var|function|class)\\s+${query}`, "i"),
              new RegExp(`${query}\\s*=\\s*\\(.*\\)\\s*=>`, "i"),
            ];
            searchFn = (line) => astPatterns.some((p) => p.test(line));
            break;

          default: // text
            searchFn = (line) => line.toLowerCase().includes(query.toLowerCase());
        }

        // Find matches
        lines.forEach((line, index) => {
          if (searchFn(line)) {
            results.push({
              file: filePath,
              line: index + 1,
              content: line.trim(),
            });
          }
        });
      } catch (e) {
        console.error(`Error searching ${filePath}:`, e);
      }
    }

    return res.status(200).json(results.slice(0, 100));
  } catch (error) {
    console.error("Search error:", error);
    return res.status(500).json({ error: error.message });
  }
}
