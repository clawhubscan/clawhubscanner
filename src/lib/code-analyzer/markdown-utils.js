// Markdown repair utilities

export function repairMarkdown(content) {
  if (!content) return "";
  
  let repaired = content;

  // Fix unclosed code blocks
  const codeBlockMatches = repaired.match(/```/g);
  if (codeBlockMatches && codeBlockMatches.length % 2 !== 0) {
    repaired += "\n```";
  }

  // Fix unclosed bold/italic
  const boldMatches = repaired.match(/\*\*/g);
  if (boldMatches && boldMatches.length % 2 !== 0) {
    repaired += "**";
  }

  const italicMatches = repaired.match(/(?<!\*)\*(?!\*)/g);
  if (italicMatches && italicMatches.length % 2 !== 0) {
    repaired += "*";
  }

  // Fix unclosed inline code
  const inlineCodeMatches = repaired.match(/(?<!`)`(?!`)/g);
  if (inlineCodeMatches && inlineCodeMatches.length % 2 !== 0) {
    repaired += "`";
  }

  // Fix unclosed links
  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/\]/g) || []).length;
  if (openBrackets > closeBrackets) {
    repaired += "]".repeat(openBrackets - closeBrackets);
  }

  // Fix unclosed parentheses in links
  const linkPattern = /\]\(/g;
  const linkMatches = repaired.match(linkPattern);
  if (linkMatches) {
    const afterLinks = repaired.split(/\]\(/);
    afterLinks.forEach((part, index) => {
      if (index > 0) {
        const openParens = (part.match(/\(/g) || []).length;
        const closeParens = (part.match(/\)/g) || []).length;
        if (openParens > closeParens) {
          // Need to close the link
        }
      }
    });
  }

  return repaired;
}

export function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}
