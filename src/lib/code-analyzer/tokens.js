// Token counting utilities

const CHARS_PER_TOKEN = 4;
export const MAX_TOKENS = 100000;

export function countMessageTokens(messages) {
  if (!messages || !Array.isArray(messages)) return 0;
  
  return messages.reduce((total, msg) => {
    const content = typeof msg === "string" ? msg : (msg.content || msg.parts || "");
    return total + Math.ceil(String(content).length / CHARS_PER_TOKEN);
  }, 0);
}

export function formatTokenCount(tokens) {
  if (tokens < 1000) return tokens.toString();
  if (tokens < 10000) return (tokens / 1000).toFixed(1) + "k";
  return Math.round(tokens / 1000) + "k";
}

export function getTokenWarningLevel(tokens) {
  const percentage = (tokens / MAX_TOKENS) * 100;
  if (percentage >= 90) return "danger";
  if (percentage >= 70) return "warning";
  return "safe";
}

export function isRateLimitError(error) {
  if (!error) return false;
  const message = error.message || String(error);
  return message.toLowerCase().includes("rate limit") || 
         message.includes("429") ||
         message.includes("quota");
}

export function getRateLimitErrorMessage(error) {
  return "Rate limit exceeded. Please wait a moment before trying again.";
}
