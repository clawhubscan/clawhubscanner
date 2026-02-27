// Vercel Serverless Function for analyzing which files are relevant

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { question, filePaths, owner, repo } = req.body;

  if (!question || !filePaths) {
    return res.status(400).json({ error: "Missing question or filePaths" });
  }

  // For simple questions, use heuristic selection
  const keywordsToExtensions = {
    security: [".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".php", ".rb", ".go", ".rs", "package.json"],
    vulnerability: [".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".php", ".rb", ".go", ".rs", "package.json"],
    architecture: [".md", ".json", ".yaml", ".yml", ".toml"],
    readme: ["README.md", "readme.md", "README", "readme"],
    config: [".json", ".yaml", ".yml", ".toml", ".config.js", ".config.ts"],
    test: [".test.", ".spec.", "__tests__"],
    style: [".css", ".scss", ".sass", ".less", ".styled."],
    api: ["api/", "routes/", "controllers/", "handlers/"],
  };

  // Simple keyword matching for file selection
  const lowercaseQuestion = question.toLowerCase();
  let relevantExtensions = [];

  for (const [keyword, extensions] of Object.entries(keywordsToExtensions)) {
    if (lowercaseQuestion.includes(keyword)) {
      relevantExtensions.push(...extensions);
    }
  }

  // Default to common code files if no specific match
  if (relevantExtensions.length === 0) {
    relevantExtensions = [".js", ".jsx", ".ts", ".tsx", ".py", ".go", ".rs", ".java", ".md", ".json"];
  }

  // Filter files by extensions and limit
  let selectedFiles = filePaths.filter((path) => {
    const lowerPath = path.toLowerCase();
    return relevantExtensions.some((ext) => lowerPath.includes(ext));
  });

  // Always include important files
  const importantFiles = ["README.md", "package.json", "tsconfig.json", "pyproject.toml", "go.mod", "Cargo.toml"];
  for (const important of importantFiles) {
    const found = filePaths.find((p) => p.toLowerCase().endsWith(important.toLowerCase()));
    if (found && !selectedFiles.includes(found)) {
      selectedFiles.unshift(found);
    }
  }

  // Limit to 15 files max
  selectedFiles = selectedFiles.slice(0, 15);

  // If we have very few files, use AI to select
  if (selectedFiles.length < 3 && OPENAI_API_KEY) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a code analysis assistant. Given a question and a list of file paths, select the most relevant files (max 10) that would help answer the question. Return ONLY a JSON array of file paths, nothing else.`,
            },
            {
              role: "user",
              content: `Question: ${question}\n\nAvailable files:\n${filePaths.slice(0, 100).join("\n")}\n\nReturn a JSON array of the most relevant file paths:`,
            },
          ],
          max_tokens: 1000,
          temperature: 0,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "[]";
        try {
          const aiSelected = JSON.parse(content.replace(/```json?|```/g, "").trim());
          if (Array.isArray(aiSelected) && aiSelected.length > 0) {
            selectedFiles = aiSelected.filter((f) => filePaths.includes(f)).slice(0, 15);
          }
        } catch (e) {
          // Keep heuristic selection
        }
      }
    } catch (e) {
      // Keep heuristic selection
    }
  }

  return res.status(200).json({
    relevantFiles: selectedFiles,
    fileCount: selectedFiles.length,
  });
}
