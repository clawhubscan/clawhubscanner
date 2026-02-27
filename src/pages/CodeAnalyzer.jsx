import { useParams, useSearchParams } from "react-router-dom";
import { CodeAnalyzerHome } from "./CodeAnalyzerHome";
import { CodeAnalyzerChat } from "./CodeAnalyzerChat";

// Importar estilos SOLO para Code Analyzer (sin Tailwind)
import "../styles/code-analyzer-styles.css";

export default function CodeAnalyzer() {
  const { owner, repo } = useParams();
  const [searchParams] = useSearchParams();
  const profile = searchParams.get("profile");

  // If we have owner and repo, show the chat
  if (owner && repo) {
    return <CodeAnalyzerChat />;
  }

  // If we have a profile query, show profile (or redirect to chat)
  if (profile) {
    // For now, redirect to home - profile chat can be implemented later
    return <CodeAnalyzerHome />;
  }

  // Otherwise show home
  return <CodeAnalyzerHome />;
}
