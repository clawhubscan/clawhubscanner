import { useState, useEffect, useMemo, useRef } from "react";
import mermaid from "mermaid";
import { validateMermaidSyntax, sanitizeMermaidCode, generateMermaidFromJSON } from "../../lib/code-analyzer/diagram-utils";
import { Download, X, Maximize2, ZoomIn, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: "base",
  securityLevel: "strict",
  themeVariables: {
    primaryColor: "#18181b",
    primaryTextColor: "#e4e4e7",
    primaryBorderColor: "#3f3f46",
    lineColor: "#a1a1aa",
    secondaryColor: "#27272a",
    tertiaryColor: "#27272a",
    fontFamily: "ui-sans-serif, system-ui, sans-serif",
  },
});

export function Mermaid({ chart }) {
  const [svg, setSvg] = useState("");
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const diagramRef = useRef(null);
  const modalRef = useRef(null);

  const id = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < chart.length; i++) {
      const char = chart.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `mermaid-${Math.abs(hash).toString(36)}`;
  }, [chart]);

  useEffect(() => {
    if (!chart) return;

    let mounted = true;

    const renderDiagram = async () => {
      try {
        let codeToRender = chart;

        // Check if the content is JSON
        if (chart.trim().startsWith("{")) {
          try {
            const data = JSON.parse(chart);
            codeToRender = generateMermaidFromJSON(data);
          } catch (e) {
            // Continue with original content
          }
        }

        const sanitized = sanitizeMermaidCode(codeToRender);
        const validation = validateMermaidSyntax(sanitized);

        if (!validation.valid) {
          console.warn("Validation warning:", validation.error);
        }

        try {
          const { svg } = await mermaid.render(id, sanitized);
          if (mounted) {
            setSvg(svg);
            setError(null);
          }
          return;
        } catch (renderError) {
          console.warn("Render failed:", renderError.message);
          if (mounted) {
            const errorMessage = renderError.message || "Syntax error in diagram";
            const isInternalError =
              errorMessage.includes("dmermaid") ||
              errorMessage.includes("#") ||
              errorMessage.startsWith("Parse error");
            setError(isInternalError ? "Syntax error in diagram" : errorMessage);
          }
        }
      } catch (error) {
        console.error("Complete render failure:", error);
        if (mounted) {
          setError("Failed to render diagram");
        }
      }
    };

    renderDiagram();

    return () => {
      mounted = false;
    };
  }, [chart, id]);

  const handleRetry = async () => {
    if (!chart) return;
    setError(null);

    try {
      const sanitized = sanitizeMermaidCode(chart);

      const response = await fetch("/api/code-analyzer/fix-mermaid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: sanitized }),
      });

      if (response.ok) {
        const { fixed } = await response.json();
        if (fixed) {
          const { svg } = await mermaid.render(id + "-fixed", fixed);
          setSvg(svg);
          setError(null);
          return;
        }
      }
      setError("Could not automatically fix the diagram. Please try asking again.");
    } catch (e) {
      setError(e.message || "Failed to fix diagram");
    }
  };

  const exportToPNG = async (e) => {
    e?.stopPropagation();
    const element = isModalOpen ? modalRef.current : diagramRef.current;
    if (!element) return;

    try {
      // Dynamic import of html2canvas
      const html2canvas = (await import("html2canvas-pro")).default;
      const canvas = await html2canvas(element, {
        backgroundColor: "#18181b",
        scale: 2,
      });

      const link = document.createElement("a");
      link.download = `diagram-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  return (
    <>
      <div
        className="my-4 group relative cursor-zoom-in"
        onClick={() => setIsModalOpen(true)}
      >
        <div
          ref={diagramRef}
          className="overflow-x-auto bg-zinc-950/50 p-4 rounded-lg border border-white/5 hover:border-white/10 transition-colors"
          dangerouslySetInnerHTML={{ __html: svg }}
          style={{ minHeight: svg ? "auto" : "200px" }}
        />

        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
          <button
            onClick={exportToPNG}
            className="p-2 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg backdrop-blur-sm"
            title="Export as PNG"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            className="p-2 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg backdrop-blur-sm"
            title="View Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/90 backdrop-blur-sm rounded-lg p-4 text-center">
            <p className="text-red-400 text-sm mb-3 max-w-[90%] break-words">{error}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRetry();
              }}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Fix Diagram
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="code-analyzer-scope fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-8"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-6xl max-h-[90vh] bg-zinc-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-zinc-900/50">
                <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <ZoomIn className="w-4 h-4" />
                  Diagram Preview
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={exportToPNG}
                    className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                    title="Export as PNG"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-4 bg-zinc-950/50 relative">
                <div
                  ref={modalRef}
                  className="min-w-min min-h-min [&>svg]:w-auto [&>svg]:h-auto"
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
