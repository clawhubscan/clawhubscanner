// Vercel Serverless Function for chat with streaming

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { question, context, repoInfo, history = [], ownerProfile } = req.body;

  if (!question || !context) {
    return res.status(400).json({ error: "Missing question or context" });
  }

  // Build system prompt
  const systemPrompt = `You are a helpful AI assistant that analyzes GitHub repositories. You have access to the following repository context:

**Repository**: ${repoInfo?.owner}/${repoInfo?.repo}

${ownerProfile ? `**Owner**: ${ownerProfile.name || ownerProfile.login} - ${ownerProfile.bio || ""}` : ""}

**Code Context**:
${context}

Guidelines:
- Answer questions about the code structure, architecture, and implementation
- When showing code flows or architecture, use Mermaid diagrams with \`\`\`mermaid code blocks
- Be concise but thorough
- Reference specific files when relevant using the format [filename](#preview-path/to/file)
- For tables, use standard markdown table syntax
- If asked about security, analyze patterns carefully
- When showing developer info, use the developer-card format:
  :::developer-card
  username: username
  name: Full Name
  bio: Bio text
  location: Location
  :::
- When showing repo info, use the repo-card format:
  :::repo-card
  owner: owner
  name: repo
  description: Description
  stars: 1234
  forks: 567
  language: JavaScript
  :::`;

  // Build messages array
  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-10).map((m) => ({
      role: m.role === "model" ? "assistant" : "user",
      content: m.content,
    })),
    { role: "user", content: question },
  ];

  try {
    // Set up SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Call OpenAI API with streaming
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 4096,
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      res.write(`data: ${JSON.stringify({ error: error.error?.message || "API error" })}\n\n`);
      res.write("data: [DONE]\n\n");
      return res.end();
    }

    // Stream the response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") {
            res.write("data: [DONE]\n\n");
            break;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }

    res.end();
  } catch (error) {
    console.error("Chat error:", error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  }
}
