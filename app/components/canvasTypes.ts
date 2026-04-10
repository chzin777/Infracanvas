import type { Node } from "@xyflow/react";
import type { InfraNodeData } from "./nodes/InfraNode";
import type { TextNodeData } from "./nodes/TextNode";
import type { FlowchartNodeData } from "./nodes/FlowchartNode";
import type { ImageNodeData } from "./nodes/ImageNode";

export type CanvasNode =
  | Node<InfraNodeData, "infra">
  | Node<TextNodeData, "text">
  | Node<FlowchartNodeData, "flowchart">
  | Node<ImageNodeData, "image">;
