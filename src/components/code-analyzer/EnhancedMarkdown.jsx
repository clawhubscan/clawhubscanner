import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { RepoCard } from "./RepoCard";
import { DeveloperCard } from "./DeveloperCard";
import { SmartLink } from "./SmartLink";

/**
 * Parse a string that may contain custom card blocks (repo-card / developer-card)
 */
export function parseCardContent(text) {
  const parts = [];
  let currentIndex = 0;
  const cardRegex = /:::(repo-card|developer-card)\n([\s\S]*?):::/g;
  let match;

  while ((match = cardRegex.exec(text)) !== null) {
    if (match.index > currentIndex) {
      const markdown = text.slice(currentIndex, match.index).trim();
      if (markdown) {
        parts.push({ type: "markdown", content: markdown });
      }
    }
    const cardType = match[1];
    const cardBody = match[2];
    const cardData = {};
    cardBody.split("\n").forEach((line) => {
      const [key, ...rest] = line.split(":");
      if (key && rest.length) {
        cardData[key.trim()] = rest.join(":").trim();
      }
    });
    parts.push({ type: cardType, content: cardData });
    currentIndex = match.index + match[0].length;
  }

  if (currentIndex < text.length) {
    const markdown = text.slice(currentIndex).trim();
    if (markdown) {
      parts.push({ type: "markdown", content: markdown });
    }
  }

  return parts;
}

export function EnhancedMarkdown({ content, components }) {
  const parts = parseCardContent(content);
  
  return (
    <>
      {parts.map((part, index) => {
        if (part.type === "markdown") {
          return (
            <ReactMarkdown
              key={index}
              components={{
                a: SmartLink,
                ...components,
              }}
              remarkPlugins={[remarkGfm]}
            >
              {part.content}
            </ReactMarkdown>
          );
        }
        if (part.type === "repo-card") {
          const data = part.content;
          return (
            <RepoCard
              key={index}
              owner={data.owner || ""}
              name={data.name || ""}
              description={data.description}
              stars={data.stars ? parseInt(data.stars) : undefined}
              forks={data.forks ? parseInt(data.forks) : undefined}
              language={data.language}
            />
          );
        }
        if (part.type === "developer-card") {
          const data = part.content;
          return (
            <DeveloperCard
              key={index}
              username={data.username || ""}
              name={data.name}
              avatar={data.avatar}
              bio={data.bio}
              location={data.location}
              blog={data.blog}
            />
          );
        }
        return null;
      })}
    </>
  );
}
