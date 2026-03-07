"use client";

import type { Edge, Node } from "@xyflow/react";
import type { EdgeDirection } from "./edges/DirectionalEdge";

interface ConnectionPanelProps {
  selectedEdge: Edge | null;
  nodes: Node[];
  onDirectionChange: (edgeId: string, direction: EdgeDirection) => void;
  onRemove: (edgeId: string) => void;
}

function getNodeLabel(node: Node | undefined): string {
  if (!node) return "?";
  const d = node.data as Record<string, unknown> | undefined;
  if (d?.label && typeof d.label === "string") return d.label;
  if (d?.content && typeof d.content === "string") return d.content.slice(0, 20) || "Texto";
  return node.id.slice(0, 8);
}

const MODE_OPTIONS: { value: "single" | "bidirectional"; label: string; title: string }[] = [
  { value: "single", label: "Só um sentido", title: "Tráfego em um único sentido (use o botão abaixo para inverter)" },
  { value: "bidirectional", label: "Manda e recebe", title: "Tráfego nos dois sentidos (bidirecional)" },
];

export function ConnectionPanel({
  selectedEdge,
  nodes,
  onDirectionChange,
  onRemove,
}: ConnectionPanelProps) {
  if (!selectedEdge) return null;

  const direction: EdgeDirection =
    (selectedEdge.data?.direction as EdgeDirection) ??
    (selectedEdge.type === "bidirectional" ? "bidirectional" : "send");

  const isBidirectional = direction === "bidirectional";
  const singleDirection: "send" | "receive" = direction === "receive" ? "receive" : "send";

  const sourceNode = nodes.find((n) => n.id === selectedEdge.source);
  const targetNode = nodes.find((n) => n.id === selectedEdge.target);
  const sourceLabel = getNodeLabel(sourceNode);
  const targetLabel = getNodeLabel(targetNode);

  const whoSends = singleDirection === "send" ? sourceLabel : targetLabel;
  const whoReceives = singleDirection === "send" ? targetLabel : sourceLabel;

  const handleInvertDirection = () => {
    onDirectionChange(selectedEdge.id, singleDirection === "send" ? "receive" : "send");
  };

  return (
    <aside className="w-72 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark flex flex-col">
      <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <h3 className="font-bold text-sm">Conexão</h3>
        <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded font-bold uppercase tracking-wider">
          Linha selecionada
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="rounded-lg bg-slate-100 dark:bg-slate-800/80 px-3 py-2 text-xs space-y-1">
          <div className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Quem manda ↔ Quem recebe
          </div>
          {isBidirectional ? (
            <p className="text-slate-800 dark:text-slate-200 font-medium">
              <span className="text-primary">{sourceLabel}</span>
              <span className="mx-1.5 text-slate-500">↔</span>
              <span className="text-primary">{targetLabel}</span>
            </p>
          ) : (
            <p className="text-slate-800 dark:text-slate-200 font-medium">
              <span className="text-primary">{whoSends}</span>
              <span className="mx-1.5 text-slate-500">→</span>
              <span className="text-slate-700 dark:text-slate-300">{whoReceives}</span>
            </p>
          )}
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-3">
            Sentido do tráfego
          </label>
          <div className="space-y-2">
            {MODE_OPTIONS.map((opt) => {
              const isSelected =
                opt.value === "bidirectional" ? isBidirectional : !isBidirectional;
              return (
                <button
                  key={opt.value}
                  type="button"
                  title={opt.title}
                  onClick={() =>
                    onDirectionChange(
                      selectedEdge.id,
                      opt.value === "bidirectional" ? "bidirectional" : singleDirection
                    )
                  }
                  className={`w-full py-2.5 px-3 rounded-lg text-left text-sm font-medium transition-all flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? "bg-primary/20 text-primary border-2 border-primary"
                      : "bg-slate-100 dark:bg-slate-800 border-2 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSelected ? "bg-primary" : "bg-slate-400"
                    }`}
                  />
                  {opt.label}
                </button>
              );
            })}
          </div>
          {!isBidirectional && (
            <button
              type="button"
              onClick={handleInvertDirection}
              title="Inverter quem manda e quem recebe"
              className="mt-3 w-full py-2 px-3 rounded-lg text-sm font-medium bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-lg">swap_horiz</span>
              Inverter direção
            </button>
          )}
        </div>
      </div>
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-background-dark/50">
        <button
          type="button"
          onClick={() => onRemove(selectedEdge.id)}
          className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-rose-500 text-xs font-bold rounded-lg hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">delete</span>
          Remover conexão
        </button>
      </div>
    </aside>
  );
}
