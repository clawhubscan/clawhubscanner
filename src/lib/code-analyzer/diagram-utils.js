// Mermaid diagram utilities

const SHAPE_MAP = {
  rect: { open: "[", close: "]" },
  rounded: { open: "(", close: ")" },
  circle: { open: "((", close: "))" },
  diamond: { open: "{", close: "}" },
  database: { open: "[(", close: ")]" },
  cloud: { open: "))", close: "((" },
  hexagon: { open: "{{", close: "}}" },
};

const EDGE_MAP = {
  arrow: "-->",
  dotted: "-.->",
  thick: "==>",
  line: "---",
};

export function sanitizeMermaidText(text) {
  if (!text) return "";
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/`/g, "'")
    .replace(/"/g, "'")
    .replace(/'/g, "'")
    .replace(/[<>]/g, "")
    .replace(/[\\/]/g, " ")
    .replace(/[\n\r]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 50);
}

export function sanitizeNodeId(id) {
  if (!id) return "node" + Math.random().toString(36).slice(2, 8);
  return id
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/^[0-9]/, "_$&")
    .slice(0, 30);
}

export function generateMermaidFromJSON(data) {
  if (!data || !data.nodes || !Array.isArray(data.nodes)) {
    return "graph TD\n  A[Invalid Data]";
  }

  const direction = data.direction || "TD";
  const lines = [`graph ${direction}`];

  if (data.title) {
    lines.unshift(`%% ${sanitizeMermaidText(data.title)}`);
  }

  for (const node of data.nodes) {
    const id = sanitizeNodeId(node.id);
    const label = sanitizeMermaidText(node.label || node.id);
    const shape = SHAPE_MAP[node.shape] || SHAPE_MAP.rect;
    lines.push(`  ${id}${shape.open}"${label}"${shape.close}`);
  }

  if (data.edges && Array.isArray(data.edges)) {
    for (const edge of data.edges) {
      const from = sanitizeNodeId(edge.from);
      const to = sanitizeNodeId(edge.to);
      const edgeType = EDGE_MAP[edge.type] || EDGE_MAP.arrow;
      
      if (edge.label) {
        const label = sanitizeMermaidText(edge.label);
        lines.push(`  ${from} ${edgeType}|"${label}"| ${to}`);
      } else {
        lines.push(`  ${from} ${edgeType} ${to}`);
      }
    }
  }

  return lines.join("\n");
}

export function validateMermaidSyntax(code) {
  if (!code || typeof code !== "string") {
    return { valid: false, error: "Empty or invalid code" };
  }

  const lines = code.trim().split("\n").filter((l) => l.trim());
  
  if (lines.length < 2) {
    return { valid: false, error: "Diagram too short" };
  }

  const validTypes = [
    "graph", "flowchart", "sequenceDiagram", "classDiagram",
    "stateDiagram", "erDiagram", "gantt", "pie", "gitGraph",
  ];
  
  const firstLine = lines[0].trim().toLowerCase();
  const hasValidType = validTypes.some((type) => firstLine.startsWith(type));

  if (!hasValidType) {
    return { valid: false, error: "Invalid diagram type" };
  }

  return { valid: true };
}

export function sanitizeMermaidCode(code) {
  if (!code) return "graph TD\n  A[No content]";

  let cleaned = code
    .replace(/\r\n/g, "\n")
    .replace(/%%[^\n]*/g, "")
    .trim();

  const lines = cleaned.split("\n");
  if (!lines[0].match(/^(graph|flowchart|sequenceDiagram|classDiagram)/i)) {
    cleaned = "graph TD\n" + cleaned;
  }

  cleaned = cleaned
    .replace(/-->\|([^|]+)\|>/g, "-->|$1|")
    .replace(/-\.->/g, "-.->")
    .replace(/\[([^\]]*[<>][^\]]*)\]/g, (_, label) => `["${sanitizeMermaidText(label)}"]`)
    .replace(/(\w+)\[([^\]"]+)\]/g, (match, id, label) => {
      if (label.includes(" ")) {
        return `${id}["${sanitizeMermaidText(label)}"]`;
      }
      return match;
    });

  return cleaned;
}

export function getFallbackTemplate(type = "basic") {
  const templates = {
    basic: `graph TD
    A[Start] --> B[Process]
    B --> C[End]`,
    error: `graph TD
    A[Diagram Error] --> B[Please try again]`,
  };
  return templates[type] || templates.basic;
}
