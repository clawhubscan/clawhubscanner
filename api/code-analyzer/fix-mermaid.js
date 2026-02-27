// Vercel Serverless Function for fixing Mermaid diagrams

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Missing code" });
  }

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: "AI service not configured" });
  }

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
            content: `You are a Mermaid diagram expert. Fix the following Mermaid diagram syntax to make it valid. Return ONLY the fixed Mermaid code, no explanations or markdown code blocks.

Common fixes:
- Ensure proper graph declaration (graph TD, flowchart LR, etc.)
- Fix node syntax: A[Text] for rectangles, A(Text) for rounded, A{Text} for diamonds
- Fix edge syntax: --> for arrows, --- for lines
- Escape special characters in labels with quotes: A["Label with (special) chars"]
- Ensure consistent node naming (no spaces in IDs)
- Fix subgraph syntax if present`,
          },
          {
            role: "user",
            content: `Fix this Mermaid diagram:\n\n${code}`,
          },
        ],
        max_tokens: 2000,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(500).json({ error: error.error?.message || "AI service error" });
    }

    const data = await response.json();
    let fixed = data.choices?.[0]?.message?.content || code;

    // Clean up the response
    fixed = fixed
      .replace(/```mermaid\n?/gi, "")
      .replace(/```\n?/g, "")
      .trim();

    return res.status(200).json({ fixed });
  } catch (error) {
    console.error("Fix Mermaid error:", error);
    return res.status(500).json({ error: error.message });
  }
}
