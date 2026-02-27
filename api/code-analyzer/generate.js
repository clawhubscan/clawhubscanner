// Vercel Serverless Function for artifact generation

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { owner, repo, filePath, type } = req.body;

  if (!owner || !repo || !filePath || !type) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: "AI service not configured" });
  }

  const headers = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "DYOR-Code-Analyzer",
  };

  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  }

  try {
    // Fetch file content
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}`,
      { headers }
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: "Failed to fetch file" });
    }

    const data = await response.json();
    if (!data.content) {
      return res.status(400).json({ error: "No content available" });
    }

    const content = Buffer.from(data.content, "base64").toString("utf-8");

    // Check file size
    const wordCount = content.split(/\s+/).length;
    if (wordCount > 5000) {
      return res.status(400).json({ error: "File is too large (over 5000 words)" });
    }

    // Build prompt based on type
    let systemPrompt;
    switch (type) {
      case "doc":
        systemPrompt = `Generate comprehensive JSDoc/TSDoc documentation for all functions, classes, and exports in this code. Include parameter types, return types, and descriptions. Return ONLY the documented code.`;
        break;
      case "test":
        systemPrompt = `Generate comprehensive unit tests for this code using Jest. Include tests for all exported functions and edge cases. Return ONLY the test file code.`;
        break;
      case "refactor":
        systemPrompt = `Analyze this code and provide specific refactoring suggestions with examples. Focus on: code organization, naming, error handling, performance, and best practices. Be specific and actionable.`;
        break;
      default:
        return res.status(400).json({ error: "Invalid type" });
    }

    // Call OpenAI
    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `File: ${filePath}\n\n${content}` },
        ],
        max_tokens: 4000,
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const error = await aiResponse.json();
      return res.status(500).json({ error: error.error?.message || "AI service error" });
    }

    const aiData = await aiResponse.json();
    const artifact = aiData.choices?.[0]?.message?.content || "";

    return res.status(200).json({ artifact });
  } catch (error) {
    console.error("Generate error:", error);
    return res.status(500).json({ error: error.message });
  }
}
