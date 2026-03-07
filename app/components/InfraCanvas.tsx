"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  useStore,
  Background,
  Panel,
  MiniMap,
  type Connection,
  type Edge,
  type Node,
  type OnNodesChange,
  type OnEdgesChange,
  type Viewport,
  applyNodeChanges,
  applyEdgeChanges,
  ConnectionMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { ViewMode } from "./nodes/nodeTypes";
import type { InfraNodeData } from "./nodes/InfraNode";
import { InfraNode } from "./nodes/InfraNode";
import type { TextNodeData } from "./nodes/TextNode";
import { TextNode } from "./nodes/TextNode";
import type { CanvasNode } from "./canvasTypes";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { CanvasToolbar, type CanvasTool } from "./CanvasToolbar";
import { PropertiesPanel } from "./PropertiesPanel";
import { ConnectionPanel } from "./ConnectionPanel";
import { ViewModeToggle } from "./ViewModeToggle";
import { getNodeTypesByView, NODE_TYPE_DEFINITIONS } from "./nodes/nodeTypes";
import { FlowchartNode } from "./nodes/FlowchartNode";
import { DirectionalEdge } from "./edges/DirectionalEdge";
import type { EdgeDirection } from "./edges/DirectionalEdge";
import { LogicalViewModal } from "./LogicalViewModal";
import { useProjectStorage, type ProjectData, type ProjectMeta } from "./useProjectStorage";
import { AIPanel, type DiagramData } from "./AIPanel";
import { ShortcutTips } from "./ShortcutTips";

const nodeTypes = { infra: InfraNode, text: TextNode, flowchart: FlowchartNode };
const edgeTypes = { default: DirectionalEdge, bidirectional: DirectionalEdge };

function FlowWithDrop({
  initialNodes,
  initialEdges,
  viewMode,
  onViewModeChange,
  viewport,
  onViewportChange,
  onNodesChange,
  onEdgesChange,
  onSelectionChange,
  setNodes,
  setEdges,
  pushToHistory,
  snapToAlign,
  onSnapToAlignChange,
  onNodeDoubleClick,
}: {
  initialNodes: CanvasNode[];
  initialEdges: Edge[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  viewport: Viewport;
  onViewportChange: (viewport: Viewport) => void;
  onNodesChange: OnNodesChange<CanvasNode>;
  onEdgesChange: OnEdgesChange<Edge>;
  onSelectionChange: (nodes: CanvasNode[], edges: Edge[]) => void;
  setNodes: React.Dispatch<React.SetStateAction<CanvasNode[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  pushToHistory: (nodes: CanvasNode[], edges: Edge[]) => void;
  snapToAlign: boolean;
  onSnapToAlignChange: (value: boolean) => void;
  onNodeDoubleClick?: (event: React.MouseEvent, node: Node) => void;
}) {
  const [tool, setTool] = useState<CanvasTool>("selection");
  const [connectionBidirectional, setConnectionBidirectional] = useState(false);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, getViewport, fitView } = useReactFlow();

  const effectiveTool = spaceHeld ? "pan" : tool;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if (isInput) return;
      e.preventDefault();
      setSpaceHeld(true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      e.preventDefault();
      setSpaceHeld(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useEffect(() => {
    document.body.setAttribute("data-canvas-tool", effectiveTool);
    return () => document.body.removeAttribute("data-canvas-tool");
  }, [effectiveTool]);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.shiftKey) return;
      e.preventDefault();
      const vp = getViewport();
      onViewportChange({ ...vp, x: vp.x + e.deltaY });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [getViewport, onViewportChange]);

  const width = useStore((s) => s.width) ?? 800;
  const height = useStore((s) => s.height) ?? 600;
  const nodeTypesForView = getNodeTypesByView(viewMode);
  const defaultNodeType = nodeTypesForView[0];

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData("application/reactflow-node");
      if (!raw) return;
      try {
        const { nodeTypeId, label, componentType } = JSON.parse(raw) as {
          nodeTypeId: string; label: string; componentType?: string;
        };
        const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
        const type = (componentType || "infra") as "infra" | "flowchart";
        const newNode: CanvasNode = {
          id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          type,
          position,
          data: { nodeTypeId, label },
        } as CanvasNode;
        const newNodes = [...initialNodes, newNode];
        setNodes(newNodes);
        pushToHistory(newNodes, initialEdges);
      } catch {
        // ignore invalid drop data
      }
    },
    [screenToFlowPosition, setNodes, initialNodes, initialEdges, pushToHistory]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((prev) => {
        const newEdges = addEdge(params, prev);
        if (newEdges.length > 0) {
          const last = newEdges[newEdges.length - 1]!;
          const direction: EdgeDirection = connectionBidirectional ? "bidirectional" : "send";
          newEdges[newEdges.length - 1] = {
            ...last,
            type: "default",
            data: { ...last.data, direction },
          };
        }
        pushToHistory(initialNodes, newEdges);
        return newEdges;
      });
    },
    [setEdges, initialNodes, pushToHistory, connectionBidirectional]
  );

  const handleAddNode = useCallback(() => {
    const vp = getViewport();
    const position = {
      x: (-vp.x + width / 2) / vp.zoom - 70,
      y: (-vp.y + height / 2) / vp.zoom - 40,
    };
    const nodeTypeId = defaultNodeType?.id ?? "server";
    const label = defaultNodeType?.label ?? "Nó";
    const newNode: Node<InfraNodeData, "infra"> = {
      id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type: "infra",
      position,
      data: { nodeTypeId, label },
    };
    const newNodes = [...initialNodes, newNode];
    setNodes(newNodes);
    pushToHistory(newNodes, initialEdges);
  }, [getViewport, width, height, defaultNodeType, setNodes, initialNodes, initialEdges, pushToHistory]);

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2, duration: 200 });
  }, [fitView]);

  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      if (effectiveTool !== "text") return;
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const newNode: CanvasNode = {
        id: `text-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        type: "text",
        position,
        data: { content: "" },
      };
      setNodes((prev) => {
        const next = [...prev, newNode];
        pushToHistory(next, initialEdges);
        return next;
      });
    },
    [effectiveTool, screenToFlowPosition, setNodes, initialEdges, pushToHistory]
  );

  return (
    <div
      ref={canvasRef}
      className="h-full w-full grid-canvas"
      data-tool={effectiveTool}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
        viewport={viewport}
        onViewportChange={onViewportChange}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onSelectionChange={({ nodes, edges: selEdges }) => onSelectionChange(nodes as CanvasNode[], selEdges)}
        onPaneClick={onPaneClick}
        onConnect={onConnect}
        onNodeDoubleClick={onNodeDoubleClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesConnectable
        connectionMode={ConnectionMode.Loose}
        nodesDraggable={effectiveTool === "selection"}
        panOnDrag={effectiveTool !== "selection"}
        panOnScroll={effectiveTool !== "selection"}
        selectionOnDrag={effectiveTool === "selection"}
        connectOnClick
        connectionRadius={40}
        minZoom={0.2}
        maxZoom={2}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: "var(--primary)" },
          selectable: true,
          interactionWidth: 24,
        }}
        colorMode="dark"
        deleteKeyCode={["Backspace", "Delete"]}
      >
        <Background gap={24} size={1} color="var(--node-border)" />
        <Panel position="top-left" className="m-4 nodrag nopan">
          <ViewModeToggle value={viewMode} onChange={onViewModeChange} />
        </Panel>
        <Panel position="bottom-left" className="!left-4 !bottom-4 m-0 nodrag nopan !z-[20] !bg-transparent">
          <div className="rounded-lg overflow-hidden border border-slate-700/80 bg-transparent" style={{ width: 160, height: 120 }}>
            <MiniMap
              className="nodrag nopan"
              style={{ width: 160, height: 120 }}
              nodeColor="var(--primary)"
              nodeStrokeColor="var(--primary)"
              maskColor="rgba(11, 18, 25, 0.85)"
            />
          </div>
        </Panel>
        <Panel position="bottom-center" className="!left-1/2 !-translate-x-1/2 !bottom-6 nodrag nopan">
          <CanvasToolbar
            tool={tool}
            onToolChange={setTool}
            onAddNode={handleAddNode}
            onFitView={handleFitView}
            connectionBidirectional={connectionBidirectional}
            onConnectionBidirectionalChange={setConnectionBidirectional}
            snapToAlign={snapToAlign}
            onSnapToAlignChange={onSnapToAlignChange}
          />
        </Panel>
      </ReactFlow>
    </div>
  );
}

const defaultViewport: Viewport = { x: 0, y: 0, zoom: 1 };

const SNAP_ALIGN_THRESHOLD = 25;

function getSnappedPosition(
  movedPos: { x: number; y: number },
  otherNodes: { position: { x: number; y: number } }[],
  threshold: number = SNAP_ALIGN_THRESHOLD
): { x: number; y: number } {
  let bestDx = threshold + 1;
  let bestDy = threshold + 1;
  let snapX = movedPos.x;
  let snapY = movedPos.y;
  for (const other of otherNodes) {
    const dx = Math.abs(movedPos.x - other.position.x);
    const dy = Math.abs(movedPos.y - other.position.y);
    if (dx < bestDx) {
      bestDx = dx;
      snapX = other.position.x;
    }
    if (dy < bestDy) {
      bestDy = dy;
      snapY = other.position.y;
    }
  }
  return {
    x: bestDx <= threshold ? snapX : movedPos.x,
    y: bestDy <= threshold ? snapY : movedPos.y,
  };
}

type HistoryEntry = {
  nodes: CanvasNode[];
  edges: Edge[];
};

export function InfraCanvas() {
  const [viewMode, setViewMode] = useState<ViewMode>("physical");
  const [viewport, setViewport] = useState<Viewport>(defaultViewport);
  const [selectedNode, setSelectedNode] = useState<CanvasNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [physicalNodes, setPhysicalNodes] = useNodesState<CanvasNode>([]);
  const [physicalEdges, setPhysicalEdges] = useEdgesState<Edge>([]);
  const [logicalNodes, setLogicalNodes] = useNodesState<CanvasNode>([]);
  const [logicalEdges, setLogicalEdges] = useEdgesState<Edge>([]);

  const [physicalHistory, setPhysicalHistory] = useState<HistoryEntry[]>([{ nodes: [], edges: [] }]);
  const [physicalHistoryIndex, setPhysicalHistoryIndex] = useState(0);
  const [logicalHistory, setLogicalHistory] = useState<HistoryEntry[]>([{ nodes: [], edges: [] }]);
  const [logicalHistoryIndex, setLogicalHistoryIndex] = useState(0);
  const [snapToAlign, setSnapToAlign] = useState(true);
  const [modalNodeId, setModalNodeId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("Novo Projeto");
  const [logicalContentByNodeId, setLogicalContentByNodeId] = useState<Record<string, { nodes: CanvasNode[]; edges: Edge[] }>>({});

  const handleLoadProject = useCallback((data: ProjectData) => {
    setProjectName(data.name);
    setViewMode(data.viewMode);
    setViewport(data.viewport);
    setPhysicalNodes(data.physicalNodes);
    setPhysicalEdges(data.physicalEdges);
    setLogicalNodes(data.logicalNodes);
    setLogicalEdges(data.logicalEdges);
    setLogicalContentByNodeId(data.logicalContentByNodeId ?? {});
    setPhysicalHistory([{ nodes: data.physicalNodes, edges: data.physicalEdges }]);
    setPhysicalHistoryIndex(0);
    setLogicalHistory([{ nodes: data.logicalNodes, edges: data.logicalEdges }]);
    setLogicalHistoryIndex(0);
    setSelectedNode(null);
    setSelectedEdge(null);
  }, [setPhysicalNodes, setPhysicalEdges, setLogicalNodes, setLogicalEdges]);

  const handleSaveInnerFlow = useCallback((nodeId: string, nodes: CanvasNode[], edges: Edge[]) => {
    setLogicalContentByNodeId((prev) => ({
      ...prev,
      [nodeId]: { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) },
    }));
  }, []);

  const storage = useProjectStorage(
    {
      projectName,
      viewMode,
      viewport,
      physicalNodes,
      physicalEdges,
      logicalNodes,
      logicalEdges,
      logicalContentByNodeId,
    },
    handleLoadProject
  );

  const history = viewMode === "physical" ? physicalHistory : logicalHistory;
  const setHistory = viewMode === "physical" ? setPhysicalHistory : setLogicalHistory;
  const historyIndex = viewMode === "physical" ? physicalHistoryIndex : logicalHistoryIndex;
  const setHistoryIndex = viewMode === "physical" ? setPhysicalHistoryIndex : setLogicalHistoryIndex;

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const pushToHistory = useCallback(
    (nodes: CanvasNode[], edges: Edge[]) => {
      const newEntry: HistoryEntry = {
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
      };
      setHistory((prev) => [...prev.slice(0, historyIndex + 1), newEntry]);
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex]
  );

  const handleUndo = useCallback(() => {
    if (canUndo) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const entry = history[newIndex];
      if (viewMode === "physical") {
        setPhysicalNodes(entry.nodes);
        setPhysicalEdges(entry.edges);
      } else {
        setLogicalNodes(entry.nodes);
        setLogicalEdges(entry.edges);
      }
    }
  }, [canUndo, historyIndex, history, viewMode, setHistoryIndex, setPhysicalNodes, setPhysicalEdges, setLogicalNodes, setLogicalEdges]);

  const handleRedo = useCallback(() => {
    if (canRedo) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const entry = history[newIndex];
      if (viewMode === "physical") {
        setPhysicalNodes(entry.nodes);
        setPhysicalEdges(entry.edges);
      } else {
        setLogicalNodes(entry.nodes);
        setLogicalEdges(entry.edges);
      }
    }
  }, [canRedo, historyIndex, history, viewMode, setHistoryIndex, setPhysicalNodes, setPhysicalEdges, setLogicalNodes, setLogicalEdges]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        storage.save();
        return;
      }

      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if (isInput) return;

      if (e.key === "z" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
      if (e.key === "y" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleUndo, handleRedo, storage]);

  const nodes = viewMode === "physical" ? physicalNodes : logicalNodes;
  const edges = viewMode === "physical" ? physicalEdges : logicalEdges;
  const setNodes = viewMode === "physical" ? setPhysicalNodes : setLogicalNodes;
  const setEdges = viewMode === "physical" ? setPhysicalEdges : setLogicalEdges;

  // Wrapper for nodes change that saves to history
  const handleNodesChange: OnNodesChange<CanvasNode> = useCallback(
    (changes) => {
      let newNodes = applyNodeChanges(changes, nodes);
      const positionChange = changes.find(
        (c) => c.type === "position" && "dragging" in c && c.dragging === false
      );
      if (snapToAlign && positionChange && positionChange.type === "position") {
        const movedNode = newNodes.find((n) => n.id === positionChange.id);
        if (movedNode) {
          const others = newNodes.filter((n) => n.id !== movedNode.id);
          const snapped = getSnappedPosition(movedNode.position, others);
          if (
            snapped.x !== movedNode.position.x ||
            snapped.y !== movedNode.position.y
          ) {
            newNodes = newNodes.map((n) =>
              n.id === movedNode.id ? { ...n, position: snapped } : n
            );
          }
        }
      }
      if (viewMode === "physical") {
        setPhysicalNodes(newNodes);
      } else {
        setLogicalNodes(newNodes);
      }
      const hasPositionChange = changes.some(
        (c) => c.type === "position" && c.dragging === false
      );
      const hasRemoveChange = changes.some((c) => c.type === "remove");
      const hasAddChange = changes.some((c) => c.type === "add");
      if (hasPositionChange || hasRemoveChange || hasAddChange) {
        pushToHistory(newNodes, edges);
      }
    },
    [
      nodes,
      edges,
      viewMode,
      snapToAlign,
      pushToHistory,
      setPhysicalNodes,
      setLogicalNodes,
    ]
  );

  // Wrapper for edges change that saves to history
  const handleEdgesChange: OnEdgesChange<Edge> = useCallback(
    (changes) => {
      const newEdges = applyEdgeChanges(changes, edges);
      if (viewMode === "physical") {
        setPhysicalEdges(newEdges);
      } else {
        setLogicalEdges(newEdges);
      }
      const selected = newEdges.find((e) => e.selected) ?? null;
      setSelectedEdge(selected);
      if (selected) setSelectedNode(null);
      // Only save to history for meaningful changes
      const hasRemoveChange = changes.some(c => c.type === 'remove');
      const hasAddChange = changes.some(c => c.type === 'add');
      if (hasRemoveChange || hasAddChange) {
        pushToHistory(nodes, newEdges);
      }
    },
    [nodes, edges, viewMode, pushToHistory, setPhysicalEdges, setLogicalEdges]
  );

  const handleSelectionChange = useCallback(
    (selectedNodes: CanvasNode[], selectedEdges: Edge[]) => {
      setSelectedNode(selectedNodes.length > 0 ? selectedNodes[0] : null);
      if (selectedEdges.length > 0) {
        setSelectedEdge(selectedEdges[0]);
        setSelectedNode(null);
      } else if (selectedNodes.length > 0) {
        setSelectedEdge(null);
      }
    },
    []
  );

  const handleEdgeDirectionChange = useCallback(
    (edgeId: string, direction: EdgeDirection) => {
      setEdges((prev) => {
        const newEdges = prev.map((e) =>
          e.id === edgeId
            ? { ...e, type: "default" as const, data: { ...e.data, direction } }
            : e
        );
        pushToHistory(nodes, newEdges);
        return newEdges;
      });
      setSelectedEdge((prev) =>
        prev && prev.id === edgeId
          ? { ...prev, type: "default", data: { ...prev.data, direction } }
          : prev
      );
    },
    [nodes, setEdges, pushToHistory]
  );

  const handleLabelChange = useCallback(
    (nodeId: string, label: string) => {
      const newNodes = nodes.map((n) =>
        n.id === nodeId && (n.type === "infra" || n.type === "flowchart")
          ? { ...n, data: { ...n.data, label } }
          : n
      ) as CanvasNode[];
      setNodes(newNodes);
      setSelectedNode((prev) =>
        prev && prev.id === nodeId && (prev.type === "infra" || prev.type === "flowchart")
          ? { ...prev, data: { ...prev.data, label } }
          : prev
      );
      pushToHistory(newNodes, edges);
    },
    [nodes, edges, setNodes, pushToHistory]
  );

  const handleRemoveEdge = useCallback(
    (edgeId: string) => {
      const newEdges = edges.filter((e) => e.id !== edgeId);
      setEdges(newEdges);
      setSelectedEdge(null);
      pushToHistory(nodes, newEdges);
    },
    [edges, setEdges, pushToHistory]
  );

  const handleRemoveNode = useCallback(
    (nodeId: string) => {
      const newNodes = nodes.filter((n) => n.id !== nodeId);
      const newEdges = edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
      setNodes(newNodes);
      setEdges(newEdges);
      setSelectedNode(null);
      pushToHistory(newNodes, newEdges);
    },
    [nodes, edges, setNodes, setEdges, pushToHistory]
  );

  const handleTextContentChange = useCallback(
    (nodeId: string, content: string) => {
      setNodes((prev) => {
        const next = prev.map((n) =>
          n.id === nodeId && n.type === "text"
            ? { ...n, data: { ...n.data, content } }
            : n
        );
        pushToHistory(next, edges);
        return next;
      });
      setSelectedNode((prev) =>
        prev && prev.id === nodeId && prev.type === "text"
          ? { ...prev, data: { ...prev.data, content } }
          : prev
      );
    },
    [edges, setNodes, pushToHistory]
  );

  const handleColorChange = useCallback(
    (nodeId: string, color: string) => {
      const newNodes = nodes.map((n) =>
        n.id === nodeId && (n.type === "infra" || n.type === "flowchart")
          ? { ...n, data: { ...n.data, color } }
          : n
      ) as CanvasNode[];
      setNodes(newNodes);
      setSelectedNode((prev) =>
        prev && prev.id === nodeId && (prev.type === "infra" || prev.type === "flowchart")
          ? { ...prev, data: { ...prev.data, color } }
          : prev
      );
      pushToHistory(newNodes, edges);
    },
    [nodes, edges, setNodes, pushToHistory]
  );


  const handleAutoScaleChange = useCallback(
    (nodeId: string, autoScale: boolean) => {
      setNodes((prevNodes) => {
        const newNodes = prevNodes.map((n) =>
          n.id === nodeId && n.type === "infra" ? { ...n, data: { ...n.data, autoScale } } : n
        ) as CanvasNode[];
        pushToHistory(newNodes, edges);
        return newNodes;
      });
      setSelectedNode((prev) =>
        prev && prev.id === nodeId && prev.type === "infra"
          ? { ...prev, data: { ...prev.data, autoScale } }
          : prev
      );
    },
    [edges, pushToHistory]
  );

  const handleIframeUrlChange = useCallback(
    (nodeId: string, url: string) => {
      setNodes((prevNodes) => {
        const newNodes = prevNodes.map((n) =>
          n.id === nodeId && n.type === "infra" ? { ...n, data: { ...n.data, iframeUrl: url } } : n
        ) as CanvasNode[];
        pushToHistory(newNodes, edges);
        return newNodes;
      });
      setSelectedNode((prev) =>
        prev && prev.id === nodeId && prev.type === "infra"
          ? { ...prev, data: { ...prev.data, iframeUrl: url } }
          : prev
      );
    },
    [edges, pushToHistory]
  );

  const handleNodeSizeChange = useCallback(
    (nodeId: string, size: { width?: number; height?: number }) => {
      setNodes((prevNodes) => {
        const newNodes = prevNodes.map((n) => {
          if (n.id !== nodeId) return n;
          const nextData = { ...n.data };
          if (size.width !== undefined) nextData.width = size.width;
          if (size.height !== undefined) nextData.height = size.height;
          return { ...n, data: nextData };
        }) as CanvasNode[];
        pushToHistory(newNodes, edges);
        return newNodes;
      });
      setSelectedNode((prev) =>
        prev && prev.id === nodeId ? { ...prev, data: { ...prev.data, ...size } } : prev
      );
    },
    [edges, pushToHistory]
  );

  const handleNodeDoubleClick = useCallback((_event: React.MouseEvent, node: Node) => {
    if (viewMode === 'physical') {
      setModalNodeId(node.id);
    }
  }, [viewMode]);

  const handleApplyDiagram = useCallback(
    (data: DiagramData, mode: "replace" | "append") => {
      const targetMode = data.viewMode || viewMode;
      if (targetMode !== viewMode) {
        setViewMode(targetMode);
      }

      const targetSetNodes = targetMode === "physical" ? setPhysicalNodes : setLogicalNodes;
      const targetSetEdges = targetMode === "physical" ? setPhysicalEdges : setLogicalEdges;
      const currentNodes = targetMode === viewMode ? nodes : (targetMode === "physical" ? physicalNodes : logicalNodes);
      const currentEdges = targetMode === viewMode ? edges : (targetMode === "physical" ? physicalEdges : logicalEdges);

      const ts = Date.now();
      const diagramNodes: CanvasNode[] = data.nodes.map((n, i) => {
        const def = NODE_TYPE_DEFINITIONS[n.nodeTypeId];
        const type = (def?.componentType || "infra") as "infra" | "flowchart";
        return {
          id: `ai-${ts}-${n.id || i}`,
          type,
          position: n.position,
          data: { nodeTypeId: n.nodeTypeId, label: n.label, ...(n.color ? { color: n.color } : {}) },
        } as CanvasNode;
      });

      const textNodes: CanvasNode[] = (data.texts || []).map((t, i) => ({
        id: `ai-${ts}-${t.id || `text-${i}`}`,
        type: "text" as const,
        position: t.position,
        data: {
          content: t.content,
          ...(t.width ? { width: t.width } : {}),
          ...(t.height ? { height: t.height } : {}),
        },
      }));

      const newNodes = [...diagramNodes, ...textNodes];

      const idMap = new Map<string, string>();
      data.nodes.forEach((n, i) => idMap.set(n.id, `ai-${ts}-${n.id || i}`));
      (data.texts || []).forEach((t, i) => idMap.set(t.id, `ai-${ts}-${t.id || `text-${i}`}`));

      const newEdges: Edge[] = data.edges.map((e, i) => ({
        id: `ai-edge-${ts}-${e.id || i}`,
        source: idMap.get(e.source) || e.source,
        target: idMap.get(e.target) || e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        type: "default",
        data: { direction: e.direction || "send" },
      }));

      if (mode === "replace") {
        targetSetNodes(newNodes);
        targetSetEdges(newEdges);
        pushToHistory(newNodes, newEdges);
      } else {
        const mergedNodes = [...currentNodes, ...newNodes];
        const mergedEdges = [...currentEdges, ...newEdges];
        targetSetNodes(mergedNodes);
        targetSetEdges(mergedEdges);
        pushToHistory(mergedNodes, mergedEdges);
      }

      if (targetMode === "physical" && data.innerFlows?.length) {
        setLogicalContentByNodeId((prev) => {
          const next = { ...prev };
          for (const flow of data.innerFlows!) {
            const physicalNodeId = idMap.get(flow.forNodeId);
            if (!physicalNodeId) continue;
            const innerTs = `${ts}-inner-${flow.forNodeId}`;
            const innerIdMap = new Map<string, string>();
            const innerNodes: CanvasNode[] = flow.nodes.map((n, i) => {
              const id = `ai-${innerTs}-${n.id || i}`;
              innerIdMap.set(n.id, id);
              const def = NODE_TYPE_DEFINITIONS[n.nodeTypeId];
              const type = (def?.componentType || "infra") as "infra" | "flowchart";
              return {
                id,
                type,
                position: n.position,
                data: { nodeTypeId: n.nodeTypeId, label: n.label, ...(n.color ? { color: n.color } : {}) },
              } as CanvasNode;
            });
            const innerEdges: Edge[] = flow.edges.map((e, i) => ({
              id: `ai-edge-${innerTs}-${e.id || i}`,
              source: innerIdMap.get(e.source) ?? e.source,
              target: innerIdMap.get(e.target) ?? e.target,
              sourceHandle: e.sourceHandle,
              targetHandle: e.targetHandle,
              type: "default",
              data: { direction: e.direction || "send" },
            }));
            next[physicalNodeId] = { nodes: innerNodes, edges: innerEdges };
          }
          return next;
        });
      }
    },
    [viewMode, nodes, edges, physicalNodes, physicalEdges, logicalNodes, logicalEdges,
     setViewMode, setPhysicalNodes, setPhysicalEdges, setLogicalNodes, setLogicalEdges, pushToHistory, setLogicalContentByNodeId]
  );

  const handleZoomIn = useCallback(() => {
    setViewport((v) => ({ ...v, zoom: Math.min(2, v.zoom * 1.15) }));
  }, []);
  const handleZoomOut = useCallback(() => {
    setViewport((v) => ({ ...v, zoom: Math.max(0.2, v.zoom / 1.15) }));
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background-dark text-slate-100">
      <Header
        zoom={Math.round(viewport.zoom * 100)}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        projectName={projectName}
        onProjectNameChange={setProjectName}
        onExport={storage.exportToFile}
        onImport={storage.importFromFile}
        onSave={storage.save}
        projectList={storage.projectList}
        onSwitchProject={storage.switchProject}
        onNewProject={storage.createNewProject}
        onDeleteProject={storage.deleteCurrentProject}
        refreshProjectList={storage.refreshList}
      />
      {modalNodeId && (() => {
        const modalNode = nodes.find((n) => n.id === modalNodeId);
        if (!modalNode) return null;
        const data = modalNode.data as InfraNodeData;
        const inner = logicalContentByNodeId[modalNode.id];
        return (
          <LogicalViewModal
            nodeId={modalNode.id}
            nodeLabel={data.label || "Nó"}
            iframeUrl={data.iframeUrl}
            initialInnerNodes={inner?.nodes}
            initialInnerEdges={inner?.edges}
            onClose={() => setModalNodeId(null)}
            onIframeUrlChange={handleIframeUrlChange}
            onSaveInnerFlow={handleSaveInnerFlow}
          />
        );
      })()}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          viewMode={viewMode}
        />
        <main className="flex-1 relative bg-slate-50 dark:bg-background-canvas overflow-hidden">
          <ReactFlowProvider>
            <FlowWithDrop
              initialNodes={nodes}
              initialEdges={edges}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              viewport={viewport}
              onViewportChange={setViewport}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onSelectionChange={handleSelectionChange}
              setNodes={setNodes}
              setEdges={setEdges}
              pushToHistory={pushToHistory}
              snapToAlign={snapToAlign}
              onSnapToAlignChange={setSnapToAlign}
              onNodeDoubleClick={handleNodeDoubleClick}
            />
          </ReactFlowProvider>
          <AIPanel viewMode={viewMode} onApplyDiagram={handleApplyDiagram} />
          <ShortcutTips />
        </main>
        {selectedEdge ? (
          <ConnectionPanel
            selectedEdge={selectedEdge}
            nodes={nodes}
            onDirectionChange={handleEdgeDirectionChange}
            onRemove={handleRemoveEdge}
          />
        ) : (
          <PropertiesPanel
            selectedNode={selectedNode}
            onLabelChange={handleLabelChange}
            onColorChange={handleColorChange}
            onRemove={handleRemoveNode}
            onAutoScaleChange={handleAutoScaleChange}
            onNodeSizeChange={handleNodeSizeChange}
            onTextContentChange={handleTextContentChange}
            onIframeUrlChange={handleIframeUrlChange}
          />
        )}
      </div>
    </div>
  );
}
