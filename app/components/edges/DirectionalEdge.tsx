"use client";

import { memo, type ReactNode } from "react";
import {
  BaseEdge,
  getBezierPath,
  Position,
  useStore,
  type EdgeProps,
} from "@xyflow/react";

export type EdgeDirection = "send" | "receive" | "bidirectional";

const PARALLEL_OFFSET = 6;
const DEFAULT_EDGE_COLOR = "var(--primary)";

/* Triângulo menor (ponta à direita); origem no centro da base para offset-path */
const TRIANGLE_PATH = "M 0 0 L 5 2.5 L 0 5 Z";
const TRIANGLE_TIP_X = 5;
const TRIANGLE_TIP_Y = 2.5;

const FLOW_ANIMATION = "edge-flow-marker 2s linear infinite";

function getNodeColor(node: { data?: Record<string, unknown> } | undefined): string | undefined {
  const color = node?.data?.color;
  return typeof color === "string" ? color : undefined;
}

function AnimatedTriangle({
  pathId,
  pathD,
  fill,
}: {
  pathId: string;
  pathD: string;
  fill: string;
}) {
  return (
    <>
      <path id={pathId} d={pathD} fill="none" stroke="none" />
      <g
        style={{
          offsetPath: `url(#${pathId})`,
          offsetRotate: "auto",
          offsetDistance: "0%",
          animation: FLOW_ANIMATION,
        } as React.CSSProperties}
      >
        <path
          d={TRIANGLE_PATH}
          fill={fill}
          transform={`translate(${-TRIANGLE_TIP_X}, ${-TRIANGLE_TIP_Y})`}
        />
      </g>
    </>
  );
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

  const strokeColor = sendingColor ?? DEFAULT_EDGE_COLOR;
  const glowFilterId = `edge-glow-${props.id}`;
  const GlowWrap = ({ children }: { children: ReactNode }) => (
    <>
      <defs>
        <filter id={glowFilterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter={`url(#${glowFilterId})`}>{children}</g>
    </>
  );

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
      <GlowWrap>
        <g transform={`translate(${perpX}, ${perpY})`}>
          <BaseEdge
            path={path1}
            style={style1}
            interactionWidth={props.interactionWidth}
          />
          <AnimatedTriangle
            pathId={`flow-path-${props.id}-1`}
            pathD={path1}
            fill={sourceColor ?? DEFAULT_EDGE_COLOR}
          />
        </g>
        <g transform={`translate(${-perpX}, ${-perpY})`}>
          <BaseEdge
            path={path2}
            style={style2}
            interactionWidth={props.interactionWidth}
          />
          <AnimatedTriangle
            pathId={`flow-path-${props.id}-2`}
            pathD={path2}
            fill={targetColor ?? DEFAULT_EDGE_COLOR}
          />
        </g>
      </GlowWrap>
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
      <GlowWrap>
        <BaseEdge
          path={path}
          style={baseStyle}
          interactionWidth={props.interactionWidth}
        />
        <AnimatedTriangle
          pathId={`flow-path-${props.id}`}
          pathD={path}
          fill={strokeColor}
        />
      </GlowWrap>
    );
  }

  const [path] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition ?? Position.Bottom,
    targetPosition: props.targetPosition ?? Position.Top,
  });
  return (
    <GlowWrap>
      <BaseEdge
        path={path}
        style={baseStyle}
        interactionWidth={props.interactionWidth}
      />
      <AnimatedTriangle
        pathId={`flow-path-${props.id}`}
        pathD={path}
        fill={strokeColor}
      />
    </GlowWrap>
  );
}

export const DirectionalEdge = memo(DirectionalEdgeComponent);
