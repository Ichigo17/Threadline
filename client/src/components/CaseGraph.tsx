import { useRef, useEffect, useCallback } from "react";
import { Network } from "lucide-react";
import type { IncidentLink, Document } from "../types";

interface CaseGraphProps {
  links: IncidentLink[];
  documents: Document[];
  onSelectLink: (id: string) => void;
}

interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface GraphEdge {
  source: string;
  target: string;
  confidence: string;
  linkId: string;
  dismissed: boolean;
  validated: boolean;
}

function confidenceStroke(confidence: string, validated: boolean, dismissed: boolean) {
  if (dismissed) return "rgba(75,85,99,0.2)";
  if (validated) return "rgba(16,185,129,0.6)";
  switch (confidence) {
    case "Strong":
      return "rgba(239,68,68,0.5)";
    case "Moderate":
      return "rgba(245,158,11,0.5)";
    default:
      return "rgba(59,130,246,0.3)";
  }
}

function truncateLabel(text: string, maxLen: number) {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1) + "\u2026";
}

export default function CaseGraph({ links, documents, onSelectLink }: CaseGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);
  const animFrameRef = useRef<number>(0);
  const hoveredEdgeRef = useRef<string | null>(null);

  const activeLinks = links.filter((l) => !l.dismissed);

  const buildGraph = useCallback(() => {
    const nodeSet = new Set<string>();
    const docMap = new Map(documents.map((d) => [d.id, d]));

    activeLinks.forEach((l) => {
      nodeSet.add(l.source_doc_a);
      nodeSet.add(l.source_doc_b);
    });

    if (nodeSet.size === 0) {
      documents.forEach((d) => nodeSet.add(d.id));
    }

    const canvas = canvasRef.current;
    const w = canvas?.width || 800;
    const h = canvas?.height || 600;
    const cx = w / 2;
    const cy = h / 2;
    const ids = Array.from(nodeSet);
    const radius = Math.min(w, h) * 0.3;

    nodesRef.current = ids.map((id, i) => {
      const angle = (2 * Math.PI * i) / ids.length - Math.PI / 2;
      return {
        id,
        label: truncateLabel(docMap.get(id)?.title || id, 30),
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
        vx: 0,
        vy: 0,
      };
    });

    edgesRef.current = activeLinks.map((l) => ({
      source: l.source_doc_a,
      target: l.source_doc_b,
      confidence: l.confidence,
      linkId: l.id,
      dismissed: l.dismissed,
      validated: l.is_investigator_validated,
    }));
  }, [activeLinks, documents]);

  useEffect(() => {
    buildGraph();
  }, [buildGraph]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeObserver = new ResizeObserver(() => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
        buildGraph();
      }
    });
    resizeObserver.observe(canvas.parentElement!);

    function draw() {
      if (!ctx || !canvas) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const nodes = nodesRef.current;
      const edges = edgesRef.current;
      const nodeMap = new Map(nodes.map((n) => [n.id, n]));

      edges.forEach((edge) => {
        const src = nodeMap.get(edge.source);
        const tgt = nodeMap.get(edge.target);
        if (!src || !tgt) return;

        const isHovered = hoveredEdgeRef.current === edge.linkId;
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        ctx.strokeStyle = confidenceStroke(edge.confidence, edge.validated, edge.dismissed);
        ctx.lineWidth = isHovered ? 3 : edge.confidence === "Strong" ? 2 : 1.5;
        if (edge.dismissed) ctx.setLineDash([4, 4]);
        else ctx.setLineDash([]);
        ctx.stroke();

        if (!edge.dismissed) {
          const mx = (src.x + tgt.x) / 2;
          const my = (src.y + tgt.y) / 2;
          ctx.font = "10px Inter, sans-serif";
          ctx.fillStyle = isHovered ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)";
          ctx.textAlign = "center";
          ctx.fillText(edge.confidence, mx, my - 6);
        }
      });

      nodes.forEach((node) => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(6,182,212,0.8)";
        ctx.fill();
        ctx.strokeStyle = "rgba(6,182,212,0.3)";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.font = "11px Inter, sans-serif";
        ctx.fillStyle = "rgba(209,213,219,0.85)";
        ctx.textAlign = "center";
        ctx.fillText(node.label, node.x, node.y + 20);
      });

      animFrameRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
    };
  }, [buildGraph]);

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const nodeMap = new Map(nodesRef.current.map((n) => [n.id, n]));

    for (const edge of edgesRef.current) {
      const src = nodeMap.get(edge.source);
      const tgt = nodeMap.get(edge.target);
      if (!src || !tgt) continue;

      const ex = (src.x + tgt.x) / 2;
      const ey = (src.y + tgt.y) / 2;
      const dist = Math.sqrt((mx - ex) ** 2 + (my - ey) ** 2);
      if (dist < 20) {
        onSelectLink(edge.linkId);
        return;
      }
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Network className="w-5 h-5 text-cyan-400" />
          Case Graph
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          {documents.length} nodes &middot; {activeLinks.length} active edges
        </p>
      </div>
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full h-full cursor-crosshair"
        />
        {documents.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-gray-600">No documents loaded.</p>
          </div>
        )}
      </div>
    </div>
  );
}
