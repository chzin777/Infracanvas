"use client";

import { memo, useRef, useCallback, useEffect } from "react";
import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";

export interface ImageNodeData extends Record<string, unknown> {
  /** base64 data-URL da imagem */
  src?: string;
  width?: number;
  height?: number;
}

function ImageNodeComponent(props: NodeProps) {
  const { id, data, selected } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);
  const { setNodes, getNodes } = useReactFlow();
  const src = (data?.src as string | undefined) ?? "";
  const width = typeof (data?.width as number | undefined) === "number" ? (data.width as number) : 200;
  const height = typeof (data?.height as number | undefined) === "number" ? (data.height as number) : 200;

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    const tid = setTimeout(() => {
      const wrapper = containerRef.current?.closest(".react-flow__node") as HTMLElement | null;
      if (!wrapper) return;
      const onPointerMove = (e: PointerEvent) => {
        if (isResizingRef.current) {
          e.stopImmediatePropagation();
          e.preventDefault();
        }
      };
      wrapper.addEventListener("pointermove", onPointerMove, true);
      cleanup = () => wrapper.removeEventListener("pointermove", onPointerMove, true);
    }, 0);
    return () => {
      clearTimeout(tid);
      cleanup?.();
    };
  }, []);

  const handleReplace = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setNodes((prev) =>
          prev.map((n) => (n.id === id ? { ...n, data: { ...n.data, src: dataUrl } } : n))
        );
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [id, setNodes]);

  const startResize = useCallback(
    (e: React.PointerEvent, edges: { right?: boolean; bottom?: boolean; left?: boolean; top?: boolean }) => {
      e.preventDefault();
      e.stopPropagation();
      isResizingRef.current = true;
      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture(e.pointerId);
      const startX = e.clientX;
      const startY = e.clientY;
      const startW = width;
      const startH = height;
      const currentNode = getNodes().find((n) => n.id === id);
      const startPos = currentNode?.position ?? { x: 0, y: 0 };

      const onMove = (ev: PointerEvent) => {
        ev.preventDefault();
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        let newW = startW;
        let newH = startH;

        if (edges.right) newW = Math.max(60, startW + dx);
        if (edges.left) newW = Math.max(60, startW - dx);
        if (edges.bottom) newH = Math.max(60, startH + dy);
        if (edges.top) newH = Math.max(60, startH - dy);

        setNodes((prev) =>
          prev.map((n) => {
            if (n.id !== id) return n;
            const pos = { x: n.position.x, y: n.position.y };
            if (edges.left) pos.x = startPos.x + (startW - newW);
            if (edges.top) pos.y = startPos.y + (startH - newH);
            return { ...n, data: { ...n.data, width: Math.round(newW), height: Math.round(newH) }, position: pos };
          })
        );
      };

      const onUp = () => {
        isResizingRef.current = false;
        target.releasePointerCapture(e.pointerId);
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
      };

      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    },
    [id, width, height, setNodes, getNodes]
  );

  return (
    <div
      ref={containerRef}
      className="relative rounded-lg border-2 overflow-hidden transition-all"
      style={{
        borderColor: selected ? "var(--primary)" : "rgba(100,116,139,0.4)",
        width: `${width}px`,
        height: `${height}px`,
        minWidth: "60px",
        minHeight: "60px",
        boxShadow: selected
          ? "0 0 20px rgba(0, 123, 255, 0.35), 0 0 30px rgba(0, 123, 255, 0.15)"
          : "none",
      }}
    >
      <Handle id="top" type="target" position={Position.Top} className="!border-2 !pointer-events-auto !z-0" />
      <Handle id="left" type="target" position={Position.Left} className="!border-2 !pointer-events-auto !z-0" />
      <Handle id="right" type="source" position={Position.Right} className="!border-2 !pointer-events-auto !z-0" />
      <Handle id="bottom" type="source" position={Position.Bottom} className="!border-2 !pointer-events-auto !z-0" />

      {src ? (
        <img
          src={src}
          alt=""
          className="w-full h-full object-contain pointer-events-none select-none"
          draggable={false}
          onDoubleClick={handleReplace}
          style={{ pointerEvents: "auto" }}
        />
      ) : (
        <div
          className="w-full h-full flex flex-col items-center justify-center bg-slate-800/80 text-slate-500 cursor-pointer gap-2"
          onClick={handleReplace}
        >
          <span className="material-symbols-outlined text-3xl">image</span>
          <span className="text-xs">Clique para adicionar</span>
        </div>
      )}

      {/* Resize handles */}
      <div data-imagenode-resize onPointerDown={(e) => startResize(e, { right: true })}   className="nodrag nopan absolute top-1 bottom-1 right-[-4px] w-[10px] cursor-ew-resize z-20" />
      <div data-imagenode-resize onPointerDown={(e) => startResize(e, { left: true })}    className="nodrag nopan absolute top-1 bottom-1 left-[-4px] w-[10px] cursor-ew-resize z-20" />
      <div data-imagenode-resize onPointerDown={(e) => startResize(e, { bottom: true })}  className="nodrag nopan absolute left-1 right-1 bottom-[-4px] h-[10px] cursor-ns-resize z-20" />
      <div data-imagenode-resize onPointerDown={(e) => startResize(e, { top: true })}     className="nodrag nopan absolute left-1 right-1 top-[-4px] h-[10px] cursor-ns-resize z-20" />
      <div data-imagenode-resize onPointerDown={(e) => startResize(e, { top: true, left: true })}     className="nodrag nopan absolute top-[-4px] left-[-4px] w-[12px] h-[12px] cursor-nwse-resize z-20" />
      <div data-imagenode-resize onPointerDown={(e) => startResize(e, { top: true, right: true })}    className="nodrag nopan absolute top-[-4px] right-[-4px] w-[12px] h-[12px] cursor-nesw-resize z-20" />
      <div data-imagenode-resize onPointerDown={(e) => startResize(e, { bottom: true, left: true })}  className="nodrag nopan absolute bottom-[-4px] left-[-4px] w-[12px] h-[12px] cursor-nesw-resize z-20" />
      <div data-imagenode-resize onPointerDown={(e) => startResize(e, { bottom: true, right: true })} className="nodrag nopan absolute bottom-[-4px] right-[-4px] w-[12px] h-[12px] cursor-nwse-resize z-20" />
    </div>
  );
}

export const ImageNode = memo(ImageNodeComponent);
