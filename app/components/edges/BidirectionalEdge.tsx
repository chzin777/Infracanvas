"use client";

import { memo } from "react";
import { BezierEdge, MarkerType, type EdgeProps } from "@xyflow/react";

function BidirectionalEdgeComponent(props: EdgeProps) {
  return (
    <BezierEdge
      {...props}
      style={{
        ...props.style,
        stroke: "var(--primary)",
        strokeDasharray: "8 4",
        animation: "none",
      }}
      markerStart={MarkerType.ArrowClosed}
      markerEnd={MarkerType.ArrowClosed}
    />
  );
}

export const BidirectionalEdge = memo(BidirectionalEdgeComponent);
