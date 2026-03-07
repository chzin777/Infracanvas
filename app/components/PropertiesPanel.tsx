"use client";

import { useEffect, useState } from "react";
import type { InfraNodeData } from "./nodes/InfraNode";
import { DEFAULT_NODE_COLOR } from "./nodes/InfraNode";
import type { TextNodeData } from "./nodes/TextNode";
import type { CanvasNode } from "./canvasTypes";

const THEME_COLORS = [
  { id: "primary", hex: "#007bff", label: "Azul" },
  { id: "emerald", hex: "#10b981", label: "Esmeralda" },
  { id: "amber", hex: "#f59e0b", label: "Âmbar" },
  { id: "rose", hex: "#f43f5e", label: "Rosa" },
  { id: "red", hex: "#ef4444", label: "Vermelho" },
  { id: "violet", hex: "#8b5cf6", label: "Violeta" },
  { id: "cyan", hex: "#06b6d4", label: "Ciano" },
  { id: "slate", hex: "#64748b", label: "Cinza" },
] as const;

interface PropertiesPanelProps {
  selectedNode: CanvasNode | null;
  /** Força a exibição das propriedades de um nó específico, ignorando o nó selecionado no canvas. Útil para o modal. */
  forceNode?: CanvasNode | null;
  focusNodeId?: string | null;
  onFocusNode?: (nodeId: string) => void;
  onClearFocus?: () => void;
  onLabelChange?: (nodeId: string, label: string) => void;
  onColorChange?: (nodeId: string, color: string) => void;
  onAutoScaleChange?: (nodeId: string, enabled: boolean) => void;
  onNodeSizeChange?: (nodeId: string, size: { width?: number; height?: number }) => void;
  onRemove?: (nodeId: string) => void;
  onTextContentChange?: (nodeId: string, content: string) => void;
  onIframeUrlChange?: (nodeId: string, url: string) => void;
  hideNodeSize?: boolean;
}

export function PropertiesPanel({
  selectedNode: selectedNodeFromCanvas,
  forceNode,
  focusNodeId = null,
  onFocusNode,
  onClearFocus,
  onLabelChange,
  onColorChange,
  onAutoScaleChange,
  onNodeSizeChange,
  onRemove,
  onTextContentChange,
  onIframeUrlChange,
  hideNodeSize,
}: PropertiesPanelProps) {
  const selectedNode = forceNode ?? selectedNodeFromCanvas;

  if (!selectedNode) {
    return (
      <aside className="w-72 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark flex flex-col">
        <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-sm">Propriedades</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          {focusNodeId && onClearFocus ? (
            <>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                Visualização focada em um nó
              </p>
              <button
                type="button"
                onClick={onClearFocus}
                className="text-sm px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 font-medium"
              >
                Mostrar tudo
              </button>
            </>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Selecione um nó no canvas para editar suas propriedades
            </p>
          )}
        </div>
      </aside>
    );
  }

  const [selectedColorLocal, setSelectedColorLocal] = useState<string | null>(null);

  useEffect(() => {
    setSelectedColorLocal(null);
  }, [selectedNode?.id]);

  if (selectedNode.type === "text") {
    const data = selectedNode.data as TextNodeData;
    const content = data.content ?? "";
    const textWidth = typeof data.width === "number" ? data.width : 120;
    const textHeight = typeof data.height === "number" ? data.height : 80;
    return (
      <aside className="w-72 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark flex flex-col">
        <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-sm">Propriedades</h3>
          <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded font-bold uppercase tracking-wider">
            Texto
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Conteúdo</label>
            <textarea
              value={content}
              onChange={(e) => onTextContentChange?.(selectedNode.id, e.target.value)}
              className="w-full min-h-[80px] bg-slate-100 dark:bg-slate-800 border-none rounded-lg py-2 px-3 text-sm focus:ring-1 focus:ring-primary text-slate-900 dark:text-slate-100 resize-none"
              placeholder="Digite o texto..."
              rows={4}
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase block">Tamanho do campo</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-xs text-slate-500">Largura (px)</span>
                <input
                  type="number"
                  min={80}
                  max={500}
                  step={10}
                  value={textWidth}
                  onChange={(e) => onNodeSizeChange?.(selectedNode.id, { width: Math.min(500, Math.max(80, Number(e.target.value) || 120)) })}
                  className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg py-2 px-3 text-sm focus:ring-1 focus:ring-primary text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-500">Altura (px)</span>
                <input
                  type="number"
                  min={40}
                  max={400}
                  step={10}
                  value={textHeight}
                  onChange={(e) => onNodeSizeChange?.(selectedNode.id, { height: Math.min(400, Math.max(40, Number(e.target.value) || 80)) })}
                  className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg py-2 px-3 text-sm focus:ring-1 focus:ring-primary text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-background-dark/50">
          <button
            type="button"
            onClick={() => onRemove?.(selectedNode.id)}
            className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-rose-500 text-xs font-bold rounded-lg hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">delete</span>
            Remover elemento
          </button>
        </div>
      </aside>
    );
  }

  const data = selectedNode.data as InfraNodeData;
  const label = data.label ?? "";
  const nodeColor = data.color ?? DEFAULT_NODE_COLOR;
  const displayColor = selectedColorLocal ?? nodeColor;
  const autoScale = data.autoScale === true;

  return (
    <aside className="w-72 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark flex flex-col">
      <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <h3 className="font-bold text-sm">Propriedades</h3>
        <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded font-bold uppercase tracking-wider">
          Nó selecionado
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {onFocusNode && onClearFocus && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Visualização</label>
            {focusNodeId === selectedNode.id ? (
              <button
                type="button"
                onClick={onClearFocus}
                className="w-full py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 text-sm font-medium transition-colors"
              >
                Mostrar tudo
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onFocusNode(selectedNode.id)}
                className="w-full py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-medium transition-colors"
              >
                Focar neste nó
              </button>
            )}
          </div>
        )}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Rótulo</label>
            <input
              type="text"
              value={label}
              onChange={(e) => onLabelChange?.(selectedNode.id, e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg py-2 px-3 text-sm focus:ring-1 focus:ring-primary text-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Endereço IP</label>
            <input
              type="text"
              placeholder="ex.: 10.0.1.52"
              className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg py-2 px-3 text-sm focus:ring-1 focus:ring-primary text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>
          {!hideNodeSize && (
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase block">Tamanho do nó</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-xs text-slate-500">Largura (px)</span>
                <input
                  type="number"
                  min={100}
                  max={400}
                  step={10}
                  value={typeof data.width === "number" ? data.width : 140}
                  onChange={(e) => onNodeSizeChange?.(selectedNode.id, { width: Math.min(400, Math.max(100, Number(e.target.value) || 140)) })}
                  className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg py-2 px-3 text-sm focus:ring-1 focus:ring-primary text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-slate-500">Altura (px)</span>
                <input
                  type="number"
                  min={60}
                  max={250}
                  step={10}
                  value={typeof data.height === "number" ? data.height : 100}
                  onChange={(e) => onNodeSizeChange?.(selectedNode.id, { height: Math.min(250, Math.max(60, Number(e.target.value) || 100)) })}
                  className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg py-2 px-3 text-sm focus:ring-1 focus:ring-primary text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>
          )}
        </div>
        <div className="h-px bg-slate-200 dark:bg-slate-800" />
        <div className="space-y-4">
          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">
            Estilo e visual
          </label>
          <div className="space-y-2.5">
            <span className="text-xs">Cor do nó</span>
            <div className="flex flex-wrap gap-2">
              {THEME_COLORS.map(({ hex, label: colorLabel }) => {
                const isSelected = displayColor.toLowerCase() === hex.toLowerCase();
                return (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => {
                      setSelectedColorLocal(hex);
                      onColorChange?.(selectedNode.id, hex);
                    }}
                    className={`w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 transition-all cursor-pointer ${
                      isSelected ? "scale-110" : "hover:scale-105"
                    }`}
                    style={{
                      backgroundColor: hex,
                      ...(isSelected
                        ? { boxShadow: `0 0 0 2px ${displayColor}` }
                        : {}),
                    }}
                    aria-label={colorLabel}
                    title={colorLabel}
                  />
                );
              })}
            </div>
            <div className="flex items-center gap-2.5 mt-1.5">
              <label className="relative w-9 h-9 rounded-xl overflow-hidden border-2 border-slate-600 hover:border-slate-400 transition-colors cursor-pointer shrink-0 shadow-sm group" title="Escolher cor personalizada">
                <input
                  type="color"
                  value={displayColor}
                  onChange={(e) => {
                    setSelectedColorLocal(e.target.value);
                    onColorChange?.(selectedNode.id, e.target.value);
                  }}
                  className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                />
                <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: displayColor }}>
                  <span className="material-symbols-outlined text-white/80 text-sm drop-shadow group-hover:text-white transition-colors">colorize</span>
                </div>
              </label>
              <input
                type="text"
                value={displayColor}
                onChange={(e) => {
                  const v = e.target.value;
                  setSelectedColorLocal(v);
                  if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                    onColorChange?.(selectedNode.id, v);
                  }
                }}
                className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-lg py-1.5 px-2.5 text-xs font-mono focus:ring-1 focus:ring-primary text-slate-900 dark:text-slate-100"
                placeholder="#007bff"
                maxLength={7}
              />
            </div>
          </div>
        </div>
        <div className="h-px bg-slate-200 dark:bg-slate-800" />
        <div className="space-y-4">
          <label className="text-[10px] font-bold text-slate-500 uppercase block">
            Configuração
          </label>
          <div className="flex items-center justify-between">
            <span className="text-xs">Auto-escala</span>
            <button
              type="button"
              role="switch"
              aria-checked={autoScale}
              aria-label={autoScale ? "Desativar auto-escala" : "Ativar auto-escala"}
              onClick={() => onAutoScaleChange?.(selectedNode.id, !autoScale)}
              className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${
                autoScale ? "bg-primary" : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <span
                className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-200 ${
                  autoScale ? "right-1 left-auto" : "left-1 right-auto"
                }`}
              />
            </button>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase">URL do Iframe</label>
            <input
              type="text"
              placeholder="https://example.com"
              value={data.iframeUrl || ""}
              onChange={(e) => onIframeUrlChange?.(selectedNode.id, e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg py-2 px-3 text-sm focus:ring-1 focus:ring-primary text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs">Monitorar integridade</span>
            <div className="w-10 h-5 bg-slate-300 dark:bg-slate-700 rounded-full relative">
              <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full" />
            </div>
          </div>
        </div>
      </div>
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-background-dark/50">
        <button
          type="button"
          onClick={() => onRemove?.(selectedNode.id)}
          className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-rose-500 text-xs font-bold rounded-lg hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">delete</span>
          Remover elemento
        </button>
      </div>
    </aside>
  );
}
