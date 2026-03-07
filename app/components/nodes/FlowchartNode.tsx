"use client";

import { memo, useState, useCallback } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";

export const DEFAULT_FC_COLOR = "#6366f1";

export interface FlowchartNodeData extends Record<string, unknown> {
  nodeTypeId: string;
  label?: string;
  color?: string;
  width?: number;
  height?: number;
}

export type FlowchartNodeType = Node<FlowchartNodeData, "flowchart">;

const DEFAULT_SIZES: Record<string, { w: number; h: number }> = {
  "fc-process":    { w: 160, h: 80 },
  "fc-decision":   { w: 150, h: 120 },
  "fc-terminal":   { w: 160, h: 60 },
  "fc-io":         { w: 180, h: 80 },
  "fc-document":   { w: 160, h: 100 },
  "fc-predefined": { w: 160, h: 80 },
};

function hexToRgb(hex: string): string {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

function ShapeSVG({ shape, w, h, color, selected }: {
  shape: string; w: number; h: number; color: string; selected: boolean;
}) {
  const fill = "var(--node-bg)";
  const stroke = color;
  const sw = selected ? 2.5 : 2;
  const m = 3;

  switch (shape) {
    case "fc-decision":
      return (
        <polygon
          points={`${w / 2},${m} ${w - m},${h / 2} ${w / 2},${h - m} ${m},${h / 2}`}
          fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"
        />
      );
    case "fc-terminal":
      return (
        <rect
          x={m} y={m} width={w - m * 2} height={h - m * 2}
          rx={h / 2} ry={h / 2}
          fill={fill} stroke={stroke} strokeWidth={sw}
        />
      );
    case "fc-io": {
      const skew = w * 0.13;
      return (
        <polygon
          points={`${skew + m},${m} ${w - m},${m} ${w - skew - m},${h - m} ${m},${h - m}`}
          fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"
        />
      );
    }
    case "fc-document": {
      const cy = h * 0.15;
      return (
        <path
          d={`M${m},${m + 6} Q${m},${m} ${m + 6},${m} L${w - m - 6},${m} Q${w - m},${m} ${w - m},${m + 6}
              L${w - m},${h - cy - m}
              C${w * 0.72},${h + cy * 0.6 - m} ${w * 0.28},${h - cy * 2.5 - m} ${m},${h - cy - m} Z`}
          fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"
        />
      );
    }
    case "fc-predefined":
      return (
        <>
          <rect
            x={m} y={m} width={w - m * 2} height={h - m * 2}
            rx={4} fill={fill} stroke={stroke} strokeWidth={sw}
          />
          <line x1={w * 0.1} y1={m} x2={w * 0.1} y2={h - m} stroke={stroke} strokeWidth={1.5} opacity={0.6} />
          <line x1={w * 0.9} y1={m} x2={w * 0.9} y2={h - m} stroke={stroke} strokeWidth={1.5} opacity={0.6} />
        </>
      );
    default:
      return (
        <rect
          x={m} y={m} width={w - m * 2} height={h - m * 2}
          rx={8} fill={fill} stroke={stroke} strokeWidth={sw}
        />
      );
  }
}

function FlowchartNodeComponent({ data, selected }: NodeProps<FlowchartNodeType>) {
  const shape = data.nodeTypeId || "fc-process";
  const label = data.label ?? "Processo";
  const color = data.color ?? DEFAULT_FC_COLOR;
  const defaults = DEFAULT_SIZES[shape] || { w: 160, h: 80 };
  const w = typeof data.width === "number" ? data.width : defaults.w;
  const h = typeof data.height === "number" ? data.height : defaults.h;
  const rgb = hexToRgb(color);

  const [editing, setEditing] = useState(false);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(true);
  }, []);

  return (
    <div
      className="relative"
      style={{
        width: `${w}px`,
        height: `${h}px`,
        filter: selected ? `drop-shadow(0 0 10px rgba(${rgb}, 0.35))` : undefined,
      }}
      onDoubleClick={handleDoubleClick}
    >
      <svg
        width={w}
        height={h}
        className="absolute inset-0"
        style={{ overflow: "visible" }}
      >
        <ShapeSVG shape={shape} w={w} h={h} color={color} selected={!!selected} />
      </svg>

      <Handle id="top" type="source" position={Position.Top} className="!border-2 !pointer-events-auto" style={{ borderColor: color }} />
      <Handle id="left" type="source" position={Position.Left} className="!border-2 !pointer-events-auto" style={{ borderColor: color }} />
      <Handle id="right" type="source" position={Position.Right} className="!border-2 !pointer-events-auto" style={{ borderColor: color }} />
      <Handle id="bottom" type="source" position={Position.Bottom} className="!border-2 !pointer-events-auto" style={{ borderColor: color }} />

      <div className="absolute inset-0 flex items-center justify-center px-4 pointer-events-none">
        {editing ? (
          <input
            autoFocus
            className="nodrag nopan bg-transparent text-center text-sm font-medium text-[var(--foreground)] outline-none border-b border-white/30 pointer-events-auto w-full"
            defaultValue={label}
            onBlur={(e) => {
              setEditing(false);
              const newLabel = e.target.value.trim();
              if (newLabel && newLabel !== label) {
                e.target.dispatchEvent(new CustomEvent("fc-label-change", {
                  bubbles: true,
                  detail: { nodeId: data.nodeTypeId, label: newLabel },
                }));
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              if (e.key === "Escape") { setEditing(false); }
            }}
          />
        ) : (
          <span
            className="text-center text-sm font-medium text-[var(--foreground)] select-none"
            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

export const FlowchartNode = memo(FlowchartNodeComponent);
