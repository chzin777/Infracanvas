"use client";

import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  ConnectionMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useState, useEffect, useRef } from "react";
import type { Node, Edge, Connection } from "@xyflow/react";
import type { CanvasNode } from "./canvasTypes";
import type { InfraNodeData } from "./nodes/InfraNode";
import { InfraNode } from "./nodes/InfraNode";
import { TextNode } from "./nodes/TextNode";
import { DirectionalEdge } from "./edges/DirectionalEdge";
import { FlowchartNode } from "./nodes/FlowchartNode";
import { Sidebar } from "./Sidebar";
import { PropertiesPanel } from "./PropertiesPanel";

const nodeTypes = { infra: InfraNode, text: TextNode, flowchart: FlowchartNode };
const edgeTypes = { default: DirectionalEdge, bidirectional: DirectionalEdge };

type ModalTab = "canvas" | "iframe";

interface LogicalViewModalProps {
  nodeId: string;
  nodeLabel: string;
  iframeUrl?: string;
  initialInnerNodes?: CanvasNode[];
  initialInnerEdges?: Edge[];
  onClose: () => void;
  onIframeUrlChange: (nodeId: string, url: string) => void;
  onSaveInnerFlow: (nodeId: string, nodes: CanvasNode[], edges: Edge[]) => void;
}

function ModalLogicalCanvas({
  parentNodeId,
  parentLabel,
  iframeUrl,
  onIframeUrlChange,
  initialNodes: initialNodesProp,
  initialEdges: initialEdgesProp,
  onSaveInnerFlow,
}: {
  parentNodeId: string;
  parentLabel: string;
  iframeUrl?: string;
  onIframeUrlChange: (nodeId: string, url: string) => void;
  initialNodes: CanvasNode[];
  initialEdges: Edge[];
  onSaveInnerFlow: (nodeId: string, nodes: CanvasNode[], edges: Edge[]) => void;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState<CanvasNode>(initialNodesProp);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdgesProp);
  const [selectedNode, setSelectedNode] = useState<CanvasNode | null>(null);
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    const t = setTimeout(() => {
      onSaveInnerFlow(parentNodeId, nodes, edges);
    }, 400);
    return () => clearTimeout(t);
  }, [parentNodeId, nodes, edges, onSaveInnerFlow]);

  const handleDragStart = useCallback((_event: React.DragEvent, nodeTypeId: string, label: string, componentType?: string) => {
    _event.dataTransfer.setData("application/reactflow-node", JSON.stringify({ nodeTypeId, label, componentType: componentType || "infra" }));
    _event.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const raw = event.dataTransfer.getData("application/reactflow-node");
      if (!raw) return;
      try {
        const { nodeTypeId, label, componentType } = JSON.parse(raw) as { nodeTypeId: string; label: string; componentType?: string };
        const bounds = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
        const position = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
        const type = (componentType || "infra") as "infra" | "flowchart";
        const newNode = {
          id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          type,
          position,
          data: { nodeTypeId, label },
        } as CanvasNode;
        setNodes((prev) => [...prev, newNode]);
      } catch {
        // ignore
      }
    },
    [setNodes]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const handleSelectionChange = useCallback((params: { nodes: Node[] }) => {
    const first = params.nodes[0] as CanvasNode | undefined;
    setSelectedNode(first ?? null);
  }, []);

  const handleConnect = useCallback(
    (connection: Connection) => {
      setEdges((prev) => addEdge(connection, prev));
    },
    [setEdges]
  );

  const handleLabelChange = useCallback((nodeId: string, label: string) => {
    setNodes((prev) => prev.map((n) =>
      n.id === nodeId ? { ...n, data: { ...n.data, label } } : n
    ) as CanvasNode[]);
    setSelectedNode((prev) =>
      prev && prev.id === nodeId ? ({ ...prev, data: { ...prev.data, label } } as CanvasNode) : prev
    );
  }, [setNodes]);

  const handleColorChange = useCallback((nodeId: string, color: string) => {
    setNodes((prev) => prev.map((n) =>
      n.id === nodeId ? { ...n, data: { ...n.data, color } } : n
    ) as CanvasNode[]);
    setSelectedNode((prev) =>
      prev && prev.id === nodeId ? ({ ...prev, data: { ...prev.data, color } } as CanvasNode) : prev
    );
  }, [setNodes]);

  const handleAutoScaleChange = useCallback((nodeId: string, autoScale: boolean) => {
    setNodes((prev) => prev.map((n) =>
      n.id === nodeId ? { ...n, data: { ...n.data, autoScale } } : n
    ) as CanvasNode[]);
    setSelectedNode((prev) =>
      prev && prev.id === nodeId ? ({ ...prev, data: { ...prev.data, autoScale } } as CanvasNode) : prev
    );
  }, [setNodes]);

  const handleTextContentChange = useCallback((nodeId: string, content: string) => {
    setNodes((prev) => prev.map((n) =>
      n.id === nodeId && n.type === "text" ? { ...n, data: { ...n.data, content } } : n
    ) as CanvasNode[]);
    setSelectedNode((prev) =>
      prev && prev.id === nodeId ? ({ ...prev, data: { ...prev.data, content } } as CanvasNode) : prev
    );
  }, [setNodes]);

  const parentNode: CanvasNode = {
    id: parentNodeId,
    type: "infra",
    position: { x: 0, y: 0 },
    data: { nodeTypeId: "server", label: parentLabel, iframeUrl } as InfraNodeData,
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <Sidebar viewMode="logical" onDragStart={handleDragStart} onDragEnd={() => {}} />
      <main
        className="flex-1 relative bg-slate-50 dark:bg-background-canvas"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionMode={ConnectionMode.Loose}
          onSelectionChange={handleSelectionChange}
          colorMode="dark"
          deleteKeyCode={["Backspace", "Delete"]}
          defaultEdgeOptions={{
            animated: true,
            style: { stroke: "var(--primary)" },
            selectable: true,
            interactionWidth: 24,
          }}
        >
          <Background gap={24} size={1} color="var(--node-border)" />
          <Panel position="bottom-left" className="!left-4 !bottom-4 m-0 nodrag nopan !z-[20] !bg-transparent">
            <div className="rounded-lg overflow-hidden border border-slate-700/80 bg-transparent" style={{ width: 160, height: 120 }}>
              <MiniMap style={{ width: 160, height: 120 }} nodeColor="var(--primary)" />
            </div>
          </Panel>
        </ReactFlow>
      </main>
      <PropertiesPanel
        selectedNode={selectedNode}
        forceNode={selectedNode ?? parentNode}
        onLabelChange={handleLabelChange}
        onColorChange={handleColorChange}
        onAutoScaleChange={handleAutoScaleChange}
        onTextContentChange={handleTextContentChange}
        onRemove={(id) => {
          setNodes((prev) => prev.filter((n) => n.id !== id));
          setEdges((prev) => prev.filter((e) => e.source !== id && e.target !== id));
          setSelectedNode(null);
        }}
        onIframeUrlChange={onIframeUrlChange}
        hideNodeSize
      />
    </div>
  );
}

function normalizeUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `http://${url}`;
}

/** Roteia a URL pelo proxy local para evitar bloqueio de X-Frame-Options / CSP */
function proxyUrl(url: string): string {
  const final = normalizeUrl(url);
  return `/api/iframe-proxy?url=${encodeURIComponent(final)}`;
}

export function LogicalViewModal({
  nodeId,
  nodeLabel,
  iframeUrl,
  initialInnerNodes,
  initialInnerEdges,
  onClose,
  onIframeUrlChange,
  onSaveInnerFlow,
}: LogicalViewModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>(iframeUrl ? "iframe" : "canvas");

  const handleOverlayClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm"
      onClick={handleOverlayClick}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div className="w-[90vw] h-[90vh] max-w-6xl bg-background-canvas rounded-xl shadow-2xl flex flex-col border border-slate-700">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="font-bold">Visão Interna - {nodeLabel}</h2>
            <div className="flex rounded-lg overflow-hidden border border-slate-700">
              <button
                type="button"
                onClick={() => setActiveTab("canvas")}
                className={`px-3 py-1 text-xs font-bold transition-colors ${
                  activeTab === "canvas"
                    ? "bg-primary text-white"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                Canvas Lógico
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("iframe")}
                className={`px-3 py-1 text-xs font-bold transition-colors ${
                  activeTab === "iframe"
                    ? "bg-primary text-white"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                Iframe
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800/80 hover:bg-rose-500/80 transition-colors"
            aria-label="Fechar modal"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="flex-1 relative overflow-hidden">
          {activeTab === "canvas" ? (
            <ReactFlowProvider key={nodeId}>
              <ModalLogicalCanvas
                parentNodeId={nodeId}
                parentLabel={nodeLabel}
                iframeUrl={iframeUrl}
                onIframeUrlChange={onIframeUrlChange}
                initialNodes={initialInnerNodes ?? []}
                initialEdges={initialInnerEdges ?? []}
                onSaveInnerFlow={onSaveInnerFlow}
              />
            </ReactFlowProvider>
          ) : (
            <div className="flex h-full">
              <div className="w-72 border-r border-slate-800 bg-background-dark flex flex-col">
                <div className="p-4 border-b border-slate-800">
                  <h3 className="font-bold text-sm mb-4">URL do Iframe</h3>
                  <input
                    type="text"
                    placeholder="https://example.com ou 10.0.1.52"
                    value={iframeUrl || ""}
                    onChange={(e) => onIframeUrlChange(nodeId, e.target.value)}
                    className="w-full bg-slate-800 border-none rounded-lg py-2 px-3 text-sm focus:ring-1 focus:ring-primary text-slate-100 placeholder:text-slate-500"
                  />
                </div>
                {!iframeUrl && (
                  <div className="flex-1 flex items-center justify-center p-6 text-center">
                    <p className="text-sm text-slate-500">
                      Insira uma URL acima para visualizar o conteúdo no iframe
                    </p>
                  </div>
                )}
              </div>
              <div className="flex-1 bg-slate-900">
                {iframeUrl ? (
                  <iframe
                    src={proxyUrl(iframeUrl)}
                    title={`Visão de ${nodeLabel}`}
                    className="w-full h-full border-0"
                    allowFullScreen
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <p className="text-lg">Nenhuma URL configurada</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
