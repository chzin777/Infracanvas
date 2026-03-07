"use client";

import { useCallback, useEffect, useState } from "react";
import type { ViewMode } from "./nodes/nodeTypes";
import { getNodeTypesByViewGrouped } from "./nodes/nodeTypes";
import { FlowchartShapeIcon } from "./FlowchartShapeIcon";

interface SidebarProps {
  viewMode: ViewMode;
  onDragStart?: (event: React.DragEvent, nodeTypeId: string, label: string) => void;
  onDragEnd?: (event: React.DragEvent) => void;
}

export function Sidebar({ viewMode, onDragStart, onDragEnd }: SidebarProps) {
  const [search, setSearch] = useState("");
  const grouped = getNodeTypesByViewGrouped(viewMode);

  const handleDragStart = useCallback(
    (e: React.DragEvent, nodeTypeId: string, label: string, componentType?: string) => {
      e.dataTransfer.setData("application/reactflow-node", JSON.stringify({ nodeTypeId, label, componentType: componentType || "infra" }));
      e.dataTransfer.effectAllowed = "move";
      onDragStart?.(e, nodeTypeId, label);
    },
    [onDragStart]
  );

  const filterNodes = (nodes: typeof grouped[0]["nodes"]) =>
    search.trim()
      ? nodes.filter(
          (n) =>
            n.label.toLowerCase().includes(search.toLowerCase()) ||
            n.id.toLowerCase().includes(search.toLowerCase())
        )
      : nodes;

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark flex flex-col">
      <div className="p-4">
        <div className="relative mb-4">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar nós..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-slate-100"
          />
        </div>
        <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-220px)]" key={viewMode}>
          <div className="sidebar-content-animate space-y-6">
          {grouped.map(({ group, label, nodes }) => {
            const filtered = filterNodes(nodes);
            if (filtered.length === 0) return null;
            return (
              <div key={group}>
                <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-3">
                  {label}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {filtered.map((def) => {
                    const isFlowchart = def.componentType === "flowchart";
                    const Icon = def.icon;
                    return (
                      <div
                        key={def.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, def.id, def.label, def.componentType)}
                        onDragEnd={onDragEnd}
                        className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:bg-primary/5 cursor-grab group transition-all active:cursor-grabbing"
                      >
                        {isFlowchart ? (
                          <div className="mb-1 flex items-center justify-center w-8 h-8 text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors">
                            <FlowchartShapeIcon nodeTypeId={def.id} className="w-7 h-7" />
                          </div>
                        ) : (
                          <Icon
                            className="mb-1 text-slate-600 dark:text-slate-400 group-hover:text-primary h-6 w-6"
                            strokeWidth={1.8}
                          />
                        )}
                        <span className="text-[10px] font-medium">{def.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </div>
      <ImportAssetsButton />
    </aside>
  );
}

function ImportAssetsButton() {
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => setShowToast(false), 3000);
    return () => clearTimeout(timer);
  }, [showToast]);

  return (
    <div className="mt-auto p-4 border-t border-slate-200 dark:border-slate-800 relative">
      <button
        type="button"
        onClick={() => setShowToast(true)}
        className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
      >
        <span className="material-symbols-outlined text-lg">add</span>
        Importar Assets
      </button>
      {showToast && (
        <div className="absolute left-4 right-4 bottom-full mb-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium rounded-lg px-3 py-2.5 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200 shadow-lg">
          <span className="material-symbols-outlined text-base text-amber-400">construction</span>
          Funcionalidade em desenvolvimento
        </div>
      )}
    </div>
  );
}
