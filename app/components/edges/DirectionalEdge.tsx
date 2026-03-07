"use client";

import { memo } from "react";
import {
  BezierEdge,
  BaseEdge,
  getBezierPath,
  MarkerType,
  Position,
  useStore,
  type EdgeProps,
} from "@xyflow/react";

export type EdgeDirection = "send" | "receive" | "bidirectional";

const PARALLEL_OFFSET = 6;
const DEFAULT_EDGE_COLOR = "var(--primary)";

function getNodeColor(node: { data?: Record<string, unknown> } | undefined): string | undefined {
  const color = node?.data?.color;
  return typeof color === "string" ? color : undefined;
}

function DirectionalEdgeComponent(props: EdgeProps) {
  const direction: EdgeDirection =
    (props.data?.direction as EdgeDirection) ??
    (props.type === "bidirectional" ? "bidirectional" : "send");

  const nodes = useStore((s) => s.nodes);
  const sourceNode = nodes.find((n) => n.id === props.source);
  const targetNode = nodes.find((n) => n.id === props.target);
  const sourceColor = getNodeColor(sourceNode);
  const targetColor = getNodeColor(targetNode);

  const sendingColor =
    direction === "send"
      ? sourceColor
      : direction === "receive"
        ? targetColor
        : undefined;

  const baseStyle = {
    ...props.style,
    stroke: sendingColor ?? DEFAULT_EDGE_COLOR,
  };

  if (direction === "bidirectional") {
    const [path1] = getBezierPath({
      sourceX: props.sourceX,
      sourceY: props.sourceY,
      targetX: props.targetX,
      targetY: props.targetY,
      sourcePosition: props.sourcePosition ?? Position.Bottom,
      targetPosition: props.targetPosition ?? Position.Top,
    });
    const [path2] = getBezierPath({
      sourceX: props.targetX,
      sourceY: props.targetY,
      targetX: props.sourceX,
      targetY: props.sourceY,
      sourcePosition: props.targetPosition ?? Position.Top,
      targetPosition: props.sourcePosition ?? Position.Bottom,
    });
    const dx = props.targetX - props.sourceX;
    const dy = props.targetY - props.sourceY;
    const len = Math.hypot(dx, dy) || 1;
    const perpX = (-dy / len) * PARALLEL_OFFSET;
    const perpY = (dx / len) * PARALLEL_OFFSET;

    const style1 = {
      ...baseStyle,
      stroke: sourceColor ?? DEFAULT_EDGE_COLOR,
      strokeDasharray: "5 5",
      animation: "edge-dash 0.5s linear infinite",
    };
    const style2 = {
      ...baseStyle,
      stroke: targetColor ?? DEFAULT_EDGE_COLOR,
      strokeDasharray: "5 5",
      animation: "edge-dash 0.5s linear infinite",
    };

    return (
      <>
        <g transform={`translate(${perpX}, ${perpY})`}>
          <BaseEdge
            path={path1}
            markerEnd={MarkerType.ArrowClosed}
            style={style1}
            interactionWidth={props.interactionWidth}
          />
        </g>
        <g transform={`translate(${-perpX}, ${-perpY})`}>
          <BaseEdge
            path={path2}
            markerEnd={MarkerType.ArrowClosed}
            style={style2}
            interactionWidth={props.interactionWidth}
          />
        </g>
      </>
    );
  }

  if (direction === "receive") {
    const [path] = getBezierPath({
      sourceX: props.targetX,
      sourceY: props.targetY,
      targetX: props.sourceX,
      targetY: props.sourceY,
      sourcePosition: props.targetPosition ?? Position.Top,
      targetPosition: props.sourcePosition ?? Position.Bottom,
    });
    return (
      <BaseEdge
        path={path}
        markerEnd={MarkerType.ArrowClosed}
        style={baseStyle}
        interactionWidth={props.interactionWidth}
      />
    );
  }

  return (
    <BezierEdge
      {...props}
      style={baseStyle}
      markerEnd={MarkerType.ArrowClosed}
    />
  );
}

export const DirectionalEdge = memo(DirectionalEdgeComponent);
