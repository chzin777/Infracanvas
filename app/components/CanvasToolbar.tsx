"use client";

export type CanvasTool = "selection" | "pan" | "text";

interface CanvasToolbarProps {
  tool: CanvasTool;
  onToolChange: (tool: CanvasTool) => void;
  onAddNode: () => void;
  onAddImage: () => void;
  onFitView: () => void;
  /** Quando true, novas conexões são tracejadas e bidirecionais (setas nas duas pontas) */
  connectionBidirectional?: boolean;
  onConnectionBidirectionalChange?: (value: boolean) => void;
  /** Quando true, ao soltar um nó ele se alinha ao nó mais próximo (mesma coluna/linha) */
  snapToAlign?: boolean;
  onSnapToAlignChange?: (value: boolean) => void;
}

export function CanvasToolbar({
  tool,
  onToolChange,
  onAddNode,
  onAddImage,
  onFitView,
  connectionBidirectional = false,
  onConnectionBidirectionalChange,
  snapToAlign = true,
  onSnapToAlignChange,
}: CanvasToolbarProps) {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-2xl px-6 py-3 flex items-center gap-6 z-40 nodrag nopan">
      <button
        type="button"
        onClick={() => onToolChange("pan")}
        className={`p-1 transition-colors rounded ${
          tool === "pan" ? "text-primary bg-primary/10" : "hover:text-primary"
        }`}
        aria-label="Pan"
        title="Modo pan (arrastar canvas)"
      >
        <span className="material-symbols-outlined">pan_tool</span>
      </button>
      <button
        type="button"
        onClick={() => onToolChange("selection")}
        className={`p-1 transition-colors rounded ${
          tool === "selection" ? "text-primary bg-primary/10" : "hover:text-primary"
        }`}
        aria-label="Selecionar"
        title="Modo seleção (mover nós)"
      >
        <span className="material-symbols-outlined">near_me</span>
      </button>
      <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
      <button
        type="button"
        onClick={onAddNode}
        className="p-1 hover:text-primary transition-colors rounded"
        aria-label="Adicionar nó"
        title="Adicionar nó no centro do canvas"
      >
        <span className="material-symbols-outlined">add_box</span>
      </button>
      <button
        type="button"
        onClick={onAddImage}
        className="p-1 hover:text-primary transition-colors rounded"
        aria-label="Adicionar imagem"
        title="Adicionar imagem ao canvas"
      >
        <span className="material-symbols-outlined">image</span>
      </button>
      <button
        type="button"
        onClick={() => onConnectionBidirectionalChange?.(!connectionBidirectional)}
        className={`p-1 transition-colors rounded ${
          connectionBidirectional ? "text-primary bg-primary/10" : "hover:text-primary"
        }`}
        aria-label="Linha bidirecional"
        title={connectionBidirectional ? "Conexão bidirecional (tracejada, setas nas duas pontas)" : "Conexão simples (clique para ativar bidirecional)"}
      >
        <span className="material-symbols-outlined">polyline</span>
      </button>
      <button
        type="button"
        onClick={() => onToolChange("text")}
        className={`p-1 transition-colors rounded ${
          tool === "text" ? "text-primary bg-primary/10" : "hover:text-primary"
        }`}
        aria-label="Texto"
        title="Modo texto (clique no canvas para adicionar)"
      >
        <span className="material-symbols-outlined">text_fields</span>
      </button>
      <button
        type="button"
        onClick={() => onSnapToAlignChange?.(!snapToAlign)}
        className={`p-1 transition-colors rounded ${
          snapToAlign ? "text-primary bg-primary/10" : "hover:text-primary"
        }`}
        aria-label="Alinhar aos nós"
        title={snapToAlign ? "Alinhamento ativo: ao soltar, o nó se alinha ao vizinho" : "Alinhamento desativado: o nó fica onde você soltar"}
      >
        <span className="material-symbols-outlined">align_vertical_center</span>
      </button>
      <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
      <button
        type="button"
        onClick={onFitView}
        className="p-1 hover:text-primary transition-colors rounded"
        aria-label="Ajustar visualização"
        title="Ajustar zoom para exibir todos os nós"
      >
        <span className="material-symbols-outlined">layers</span>
      </button>
    </div>
  );
}
