"use client";

import { memo, useState, useEffect, useRef, useCallback } from "react";
import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";

export interface TextNodeData extends Record<string, unknown> {
  content?: string;
  width?: number;
  height?: number;
}

function TextNodeComponent(props: NodeProps) {
  const { id, data, selected } = props;
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { setNodes } = useReactFlow();
  const content = (data?.content as string | undefined) ?? "";
  const width = typeof (data?.width as number | undefined) === "number" ? (data.width as number) : 200;
  const height = typeof (data?.height as number | undefined) === "number" ? (data.height as number) : 80;

  useEffect(() => {
    if (!selected) setEditing(false);
  }, [selected]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  const handleChange = (value: string) => {
    setNodes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, content: value } } : n
      )
    );
  };

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(true);
  }, []);

  const startResize = useCallback(
    (e: React.PointerEvent, edges: { right?: boolean; bottom?: boolean; left?: boolean; top?: boolean }) => {
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startY = e.clientY;
      const startW = width;
      const startH = height;
      const node = containerRef.current?.closest<HTMLElement>(".react-flow__node");
      const startLeft = node ? parseFloat(node.style.left || "0") || 0 : 0;
      const startTop = node ? parseFloat(node.style.top || "0") || 0 : 0;

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        let newW = startW;
        let newH = startH;

        if (edges.right) newW = Math.max(120, startW + dx);
        if (edges.left) newW = Math.max(120, startW - dx);
        if (edges.bottom) newH = Math.max(40, startH + dy);
        if (edges.top) newH = Math.max(40, startH - dy);

        setNodes((prev) =>
          prev.map((n) => {
            if (n.id !== id) return n;
            const updates: Record<string, unknown> = {
              ...n.data,
              width: Math.round(newW),
              height: Math.round(newH),
            };
            const pos = { ...n.position };
            if (edges.left) pos.x = startLeft + (startW - newW);
            if (edges.top) pos.y = startTop + (startH - newH);
            return { ...n, data: updates, position: pos };
          })
        );
      };

      const onUp = () => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
      };

      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    },
    [id, width, height, setNodes]
  );

  return (
    <div
      ref={containerRef}
      className="relative rounded-lg border-2 border-dashed border-slate-500 bg-slate-800/80 px-3 py-2 transition-all hover:border-primary/50"
      style={{
        borderColor: selected ? "var(--primary)" : undefined,
        width: `${width}px`,
        minWidth: "120px",
        height: `${height}px`,
        minHeight: "40px",
      }}
      onDoubleClick={handleDoubleClick}
    >
      <Handle id="top" type="target" position={Position.Top} className="!border-2 !pointer-events-auto" />
      <Handle id="left" type="target" position={Position.Left} className="!border-2 !pointer-events-auto" />
      <Handle id="right" type="source" position={Position.Right} className="!border-2 !pointer-events-auto" />
      <Handle id="bottom" type="source" position={Position.Bottom} className="!border-2 !pointer-events-auto" />

      {editing ? (
        <textarea
          ref={inputRef}
          className="nodrag nopan w-full h-full resize-none border-none bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-0"
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={() => setEditing(false)}
          placeholder="Digite o texto..."
        />
      ) : (
        <div className="w-full h-full text-sm text-slate-100 whitespace-pre-wrap overflow-hidden pointer-events-none select-none">
          {content || <span className="text-slate-500">Duplo clique para editar</span>}
        </div>
      )}

      {/* Bordas redimensionáveis */}
      <div onPointerDown={(e) => startResize(e, { right: true })}   className="nodrag nopan absolute top-1 bottom-1 right-[-4px] w-[8px] cursor-ew-resize z-10" />
      <div onPointerDown={(e) => startResize(e, { left: true })}    className="nodrag nopan absolute top-1 bottom-1 left-[-4px] w-[8px] cursor-ew-resize z-10" />
      <div onPointerDown={(e) => startResize(e, { bottom: true })}  className="nodrag nopan absolute left-1 right-1 bottom-[-4px] h-[8px] cursor-ns-resize z-10" />
      <div onPointerDown={(e) => startResize(e, { top: true })}     className="nodrag nopan absolute left-1 right-1 top-[-4px] h-[8px] cursor-ns-resize z-10" />
      {/* Cantos redimensionáveis */}
      <div onPointerDown={(e) => startResize(e, { top: true, left: true })}     className="nodrag nopan absolute top-[-4px] left-[-4px] w-[10px] h-[10px] cursor-nwse-resize z-20" />
      <div onPointerDown={(e) => startResize(e, { top: true, right: true })}    className="nodrag nopan absolute top-[-4px] right-[-4px] w-[10px] h-[10px] cursor-nesw-resize z-20" />
      <div onPointerDown={(e) => startResize(e, { bottom: true, left: true })}  className="nodrag nopan absolute bottom-[-4px] left-[-4px] w-[10px] h-[10px] cursor-nesw-resize z-20" />
      <div onPointerDown={(e) => startResize(e, { bottom: true, right: true })} className="nodrag nopan absolute bottom-[-4px] right-[-4px] w-[10px] h-[10px] cursor-nwse-resize z-20" />
    </div>
  );
}

export const TextNode = memo(TextNodeComponent);
