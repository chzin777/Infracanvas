"use client";

import { memo } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { NODE_TYPE_DEFINITIONS } from "./nodeTypes";

export const DEFAULT_NODE_COLOR = "#007bff";

export interface InfraNodeData extends Record<string, unknown> {
  nodeTypeId: string;
  label?: string;
  /** Cor do tema em hex (ex.: #007bff) */
  color?: string;
  /** Opacidade 0–100 */
  opacity?: number;
  /** Auto-escala habilitada */
  autoScale?: boolean;
  /** Largura do nó em px (opcional) */
  width?: number;
  /** Altura do nó em px (opcional) */
  height?: number;
  /** URL para exibir num iframe ao invés da visão lógica */
  iframeUrl?: string;
}

export type InfraNodeType = Node<InfraNodeData, "infra">;

function hexToRgb(hex: string): string {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

function InfraNodeComponent({ data, selected }: NodeProps<InfraNodeType>) {
  const def = NODE_TYPE_DEFINITIONS[data.nodeTypeId];
  const label = data.label ?? def?.label ?? "Nó";
  const Icon = def?.icon;
  const color = data.color ?? DEFAULT_NODE_COLOR;
  const opacity = typeof data.opacity === "number" ? data.opacity / 100 : 1;
  const rgb = hexToRgb(color);
  const borderStyle = { borderColor: color, boxShadow: selected ? `0 0 15px rgba(${rgb}, 0.35)` : undefined };
  const handleStyle = { borderColor: color };
  const autoScale = data.autoScale === true;
  const width = typeof data.width === "number" ? data.width : undefined;
  const height = typeof data.height === "number" ? data.height : undefined;
  const sizeStyle = {
    ...(width != null ? { width: `${width}px`, minWidth: `${width}px` } : {}),
    ...(height != null ? { height: `${height}px`, minHeight: `${height}px` } : {}),
  };

  return (
    <div
      className={`
        flex min-w-[140px] flex-col items-center gap-2 rounded-xl border-2 px-4 py-3
        bg-[var(--node-bg)] transition-all duration-200
        ${selected ? "" : ""}
        hover:shadow-[0_0_8px_var(--node-border)]
      `}
      style={{ opacity, ...borderStyle, ...sizeStyle }}
    >
      <Handle id="top" type="source" position={Position.Top} className="!border-2 !pointer-events-auto" style={handleStyle} />
      <Handle id="left" type="source" position={Position.Left} className="!border-2 !pointer-events-auto" style={handleStyle} />
      <Handle id="right" type="source" position={Position.Right} className="!border-2 !pointer-events-auto" style={handleStyle} />
      <Handle id="bottom" type="source" position={Position.Bottom} className="!border-2 !pointer-events-auto" style={handleStyle} />

      {Icon && (
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--foreground)]"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="h-5 w-5" strokeWidth={1.8} style={{ color }} />
        </div>
      )}
      <span className="text-center text-sm font-medium text-[var(--foreground)]">{label}</span>
      {autoScale && (
        <span
          className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide opacity-80"
          style={{ color }}
        >
          Auto-escala
        </span>
      )}
    </div>
  );
}

export const InfraNode = memo(InfraNodeComponent);
