import type { LucideIcon } from "lucide-react";
import {
  Server,
  Monitor,
  Laptop,
  Router,
  Network,
  Shield,
  Printer,
  Wifi,
  HardDrive,
  Box,
  Database,
  Cpu,
  Zap,
  Cloud,
  Boxes,
  GitBranch,
  Scale,
  Globe,
  Activity,
  Layers,
  Square,
  Diamond,
  Circle,
  ArrowLeftRight,
  FileText,
  SquareStack,
  type LucideProps,
} from "lucide-react";

export type ViewMode = "physical" | "logical";

export type NodeCategory = "physical" | "logical";

export type NodeGroup = "compute" | "networking" | "flowchart";

export interface NodeTypeDefinition {
  id: string;
  label: string;
  icon: LucideIcon;
  category: NodeCategory;
  group: NodeGroup;
  componentType?: "infra" | "flowchart";
  iconProps?: Partial<LucideProps>;
}

const physicalNodeTypes: NodeTypeDefinition[] = [
  { id: "server", label: "Servidor", icon: Server, category: "physical", group: "compute" },
  { id: "desktop", label: "Computador", icon: Monitor, category: "physical", group: "compute" },
  { id: "laptop", label: "Laptop", icon: Laptop, category: "physical", group: "compute" },
  { id: "storage", label: "Storage / NAS", icon: HardDrive, category: "physical", group: "compute" },
  { id: "rack", label: "Rack", icon: Box, category: "physical", group: "compute" },
  { id: "router", label: "Roteador", icon: Router, category: "physical", group: "networking" },
  { id: "switch", label: "Switch", icon: Network, category: "physical", group: "networking" },
  { id: "firewall", label: "Firewall", icon: Shield, category: "physical", group: "networking" },
  { id: "accesspoint", label: "Access Point", icon: Wifi, category: "physical", group: "networking" },
  { id: "printer", label: "Impressora", icon: Printer, category: "physical", group: "networking" },
];

const logicalNodeTypes: NodeTypeDefinition[] = [
  { id: "database", label: "Banco de Dados", icon: Database, category: "logical", group: "compute" },
  { id: "software", label: "Software / App", icon: Cpu, category: "logical", group: "compute" },
  { id: "api", label: "API / Serviço", icon: Zap, category: "logical", group: "compute" },
  { id: "cloud", label: "Cloud", icon: Cloud, category: "logical", group: "compute" },
  { id: "container", label: "Container", icon: Boxes, category: "logical", group: "compute" },
  { id: "vm", label: "Máquina Virtual", icon: Layers, category: "logical", group: "compute" },
  { id: "subnet", label: "Rede / Sub-rede", icon: GitBranch, category: "logical", group: "networking" },
  { id: "loadbalancer", label: "Load Balancer", icon: Scale, category: "logical", group: "networking" },
  { id: "dns", label: "DNS", icon: Globe, category: "logical", group: "networking" },
  { id: "monitoring", label: "Monitoring", icon: Activity, category: "logical", group: "networking" },
];

const flowchartNodeTypes: NodeTypeDefinition[] = [
  { id: "fc-process",    label: "Processo",             icon: Square,         category: "logical", group: "flowchart", componentType: "flowchart" },
  { id: "fc-decision",   label: "Decisão",              icon: Diamond,        category: "logical", group: "flowchart", componentType: "flowchart" },
  { id: "fc-terminal",   label: "Início / Fim",         icon: Circle,         category: "logical", group: "flowchart", componentType: "flowchart" },
  { id: "fc-io",         label: "Entrada / Saída",      icon: ArrowLeftRight, category: "logical", group: "flowchart", componentType: "flowchart" },
  { id: "fc-document",   label: "Documento",            icon: FileText,       category: "logical", group: "flowchart", componentType: "flowchart" },
  { id: "fc-predefined", label: "Processo Predefinido",  icon: SquareStack,    category: "logical", group: "flowchart", componentType: "flowchart" },
];

export const FLOWCHART_NODE_TYPES = flowchartNodeTypes;

export const NODE_TYPE_DEFINITIONS: Record<string, NodeTypeDefinition> = [
  ...physicalNodeTypes,
  ...logicalNodeTypes,
  ...flowchartNodeTypes,
].reduce((acc, def) => {
  acc[def.id] = def;
  return acc;
}, {} as Record<string, NodeTypeDefinition>);

export const PHYSICAL_NODE_TYPES = physicalNodeTypes;
export const LOGICAL_NODE_TYPES = logicalNodeTypes;

export function getNodeTypesByView(view: ViewMode): NodeTypeDefinition[] {
  return view === "physical"
    ? PHYSICAL_NODE_TYPES
    : [...LOGICAL_NODE_TYPES, ...FLOWCHART_NODE_TYPES];
}

const GROUP_LABELS: Record<NodeGroup, string> = {
  compute: "Compute & Storage",
  networking: "Networking",
  flowchart: "Fluxograma",
};

export function getNodeTypesByViewGrouped(view: ViewMode): { group: NodeGroup; label: string; nodes: NodeTypeDefinition[] }[] {
  const list = getNodeTypesByView(view);
  const byGroup = list.reduce(
    (acc, def) => {
      if (!acc[def.group]) acc[def.group] = [];
      acc[def.group].push(def);
      return acc;
    },
    {} as Record<NodeGroup, NodeTypeDefinition[]>
  );
  const groups: NodeGroup[] = view === "physical"
    ? ["compute", "networking"]
    : ["compute", "networking", "flowchart"];
  return groups.map((group) => ({
    group,
    label: GROUP_LABELS[group],
    nodes: byGroup[group] ?? [],
  }));
}
