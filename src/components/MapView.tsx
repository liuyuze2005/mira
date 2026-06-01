"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type { MapGraph, MapNode } from "@/lib/types";

interface Props {
  graph: MapGraph;
  onUpdate?: (graph: MapGraph) => void;
}

// Auto-position nodes if no positions exist
function scatterNodes(nodes: MapNode[]): MapNode[] {
  const cols = Math.ceil(Math.sqrt(nodes.length));
  return nodes.map((n, i) => {
    if (n.position?.x !== undefined && n.position?.y !== undefined) return n;
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      ...n,
      position: {
        x: 15 + (col / Math.max(cols - 1, 1)) * 70,
        y: 15 + (row / Math.max(cols - 1, 1)) * 70,
      },
    };
  });
}

export default function MapView({ graph, onUpdate }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodes = scatterNodes(graph.nodes);

  // View state: zoom + pan
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const [dragging, setDragging] = useState<{ nodeId: string; startX: number; startY: number } | null>(null);
  const [panning, setPanning] = useState<{ startX: number; startY: number; vx: number; vy: number } | null>(null);

  // Map view mode
  const [viewMode, setViewMode] = useState<"topdown" | "isometric">("topdown");

  // Update node position
  const updateNodePos = useCallback((nodeId: string, x: number, y: number) => {
    const updated = {
      ...graph,
      nodes: graph.nodes.map(n =>
        n.id === nodeId ? { ...n, position: { x: Math.max(4, Math.min(92, x)), y: Math.max(5, Math.min(88, y)) } } : n
      ),
    };
    onUpdate?.(updated);
  }, [graph, onUpdate]);

  // Pointer handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    const nodeEl = target.closest("[data-node-id]") as HTMLElement | null;

    if (nodeEl) {
      // Start dragging node
      const nodeId = nodeEl.dataset.nodeId!;
      setDragging({ nodeId, startX: e.clientX, startY: e.clientY });
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } else {
      // Start panning
      setPanning({ startX: e.clientX, startY: e.clientY, vx: view.x, vy: view.y });
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragging) {
      const dx = (e.clientX - dragging.startX) / view.scale;
      const dy = (e.clientY - dragging.startY) / view.scale;
      const node = nodes.find(n => n.id === dragging.nodeId);
      if (node) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const x = node.position.x + (dx / rect.width) * 100;
          const y = node.position.y + (dy / rect.height) * 100;
          updateNodePos(dragging.nodeId, x, y);
        }
        setDragging({ nodeId: dragging.nodeId, startX: e.clientX, startY: e.clientY });
      }
    } else if (panning) {
      setView({
        ...view,
        x: panning.vx + (e.clientX - panning.startX),
        y: panning.vy + (e.clientY - panning.startY),
      });
    }
  };

  const handlePointerUp = () => {
    setDragging(null);
    setPanning(null);
  };

  // Zoom with scroll wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.3, Math.min(3, view.scale * delta));
    setView({ ...view, scale: newScale });
  };

  return (
    <div className="bg-surface rounded-xl border border-secondary/10 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-secondary/10">
        <h3 className="font-[family-name:var(--font-serif)] text-primary font-semibold text-sm">
          🗺 {graph.name}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode("topdown")}
            className={`px-2 py-1 rounded text-xs transition-colors ${viewMode === "topdown" ? "bg-tertiary/20 text-tertiary" : "text-muted hover:text-secondary"}`}
          >
            俯视
          </button>
          <button
            onClick={() => setViewMode("isometric")}
            className={`px-2 py-1 rounded text-xs transition-colors ${viewMode === "isometric" ? "bg-tertiary/20 text-tertiary" : "text-muted hover:text-secondary"}`}
          >
            立体
          </button>
          <button
            onClick={() => setView({ x: 0, y: 0, scale: 1 })}
            className="px-2 py-1 text-muted hover:text-secondary text-xs transition-colors"
          >
            重置
          </button>
          <span className="text-muted text-[10px] ml-2">{Math.round(view.scale * 100)}%</span>
        </div>
      </div>

      {/* Map Canvas */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[4/3] bg-elevated overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        style={{ touchAction: "none" }}
      >
        {/* SVG for edges */}
        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
            transformOrigin: "0 0",
          }}
        >
          {graph.edges.map((edge, i) => {
            const from = nodes.find(n => n.id === edge.from);
            const to = nodes.find(n => n.id === edge.to);
            if (!from || !to) return null;
            const containerW = containerRef.current?.clientWidth || 800;
            const containerH = containerRef.current?.clientHeight || 600;

            const x1 = (from.position.x / 100) * containerW;
            const y1 = (from.position.y / 100) * containerH;
            const x2 = (to.position.x / 100) * containerW;
            const y2 = (to.position.y / 100) * containerH;

            return (
              <g key={i}>
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="#6B6358" strokeWidth="1.5" strokeDasharray="4 2"
                />
                <text
                  x={(x1 + x2) / 2}
                  y={(y1 + y2) / 2 - 5}
                  fill="#A6977B"
                  fontSize="10"
                  textAnchor="middle"
                  fontFamily="system-ui"
                >
                  {edge.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Nodes */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
            transformOrigin: "0 0",
          }}
        >
          {nodes.map(node => {
            const isHighlighted = graph.chapterHighlights?.includes(node.id);
            return (
              <button
                key={node.id}
                data-node-id={node.id}
                className={`absolute -translate-x-1/2 -translate-y-1/2 px-2 py-1.5 rounded-lg text-center border transition-colors
                  ${isHighlighted
                    ? "bg-tertiary/20 text-tertiary border-tertiary/40 ring-1 ring-tertiary/30"
                    : "bg-neutral/80 text-secondary border-secondary/20 hover:border-tertiary/40"
                  }`}
                style={{
                  left: `${node.position.x}%`,
                  top: `${node.position.y}%`,
                  cursor: dragging ? "grabbing" : "grab",
                  touchAction: "none",
                }}
              >
                <div className="text-[11px] font-semibold leading-tight">{node.name}</div>
                <div className="text-[9px] opacity-60">{node.type}</div>
              </button>
            );
          })}
        </div>

        {/* Compass */}
        <div className="absolute bottom-3 left-3 text-muted text-[10px] bg-neutral/70 px-2 py-1 rounded pointer-events-none">
          ↑ N
        </div>
      </div>

      {/* Legend */}
      <div className="p-2 border-t border-secondary/10 flex items-center gap-3 text-[10px] text-muted">
        <span>拖拽节点调整位置</span>
        <span>·</span>
        <span>滚轮缩放</span>
        <span>·</span>
        <span>拖拽空白平移</span>
        <span>·</span>
        <span>{graph.nodes.length} 地点 · {graph.edges.length} 连接</span>
      </div>
    </div>
  );
}
