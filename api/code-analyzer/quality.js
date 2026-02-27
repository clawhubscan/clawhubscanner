// Vercel Serverless Function for code quality analysis

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { owner, repo, filePath } = req.body;

  if (!owner || !repo || !filePath) {
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

    // Basic metrics calculation
    const lines = content.split("\n");
    const codeLines = lines.filter((l) => l.trim() && !l.trim().startsWith("//") && !l.trim().startsWith("#")).length;
    const commentLines = lines.filter((l) => l.trim().startsWith("//") || l.trim().startsWith("#")).length;

    // Calculate complexity (simple heuristic)
    const complexityIndicators = [
      /if\s*\(/g,
      /else\s*{/g,
      /for\s*\(/g,
      /while\s*\(/g,
      /switch\s*\(/g,
      /try\s*{/g,
      /catch\s*\(/g,
      /\?\s*.*\s*:/g, // ternary
    ];

    let complexity = 1;
    for (const pattern of complexityIndicators) {
      const matches = content.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    }

    // Determine complexity level
    let complexityLevel;
    if (complexity <= 5) complexityLevel = "Low";
    else if (complexity <= 15) complexityLevel = "Medium";
    else if (complexity <= 30) complexityLevel = "High";
    else complexityLevel = "Very High";

    // Use AI for detailed analysis if available
    let aiAnalysis = null;
    if (OPENAI_API_KEY) {
      try {
        const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
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
                content: `Analyze this code for quality. Return JSON with: score (0-100), summary (1 sentence), issues (array of {severity, line, message}). Be concise.`,
              },
              {
                role: "user",
                content: `Analyze this ${filePath}:\n\n${content.slice(0, 8000)}`,
              },
            ],
            max_tokens: 1000,
            temperature: 0,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const aiContent = aiData.choices?.[0]?.message?.content || "";
          try {
            aiAnalysis = JSON.parse(aiContent.replace(/```json?|```/g, "").trim());
          } catch (e) {
            // Use basic analysis
          }
        }
      } catch (e) {
        // Use basic analysis
      }
    }

    // Build response
    const baseScore = Math.max(0, 100 - complexity * 2 - (commentLines < codeLines * 0.1 ? 10 : 0));

    return res.status(200).json({
      score: aiAnalysis?.score || Math.min(100, baseScore),
      summary: aiAnalysis?.summary || `File has ${complexityLevel.toLowerCase()} complexity with ${codeLines} lines of code.`,
      metrics: {
        lines: lines.length,
        codeLines,
        commentLines,
        complexity: complexityLevel,
        cyclomaticComplexity: complexity,
      },
      issues: aiAnalysis?.issues || [],
    });
  } catch (error) {
    console.error("Quality analysis error:", error);
    return res.status(500).json({ error: error.message });
  }
}
