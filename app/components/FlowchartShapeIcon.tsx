"use client";

/**
 * Ícone em miniatura da forma geométrica do fluxograma, para usar na Sidebar.
 * Cada tipo (fc-process, fc-decision, etc.) é desenhado como sua forma real.
 */
const SIZE = 32;
const M = 2;
const COLOR = "currentColor";

export function FlowchartShapeIcon({ nodeTypeId, className }: { nodeTypeId: string; className?: string }) {
  const w = SIZE;
  const h = SIZE;
  const strokeWidth = 1.5;

  switch (nodeTypeId) {
    case "fc-decision": {
      const cx = w / 2;
      const cy = h / 2;
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className={className} fill="none" stroke={COLOR} strokeWidth={strokeWidth} strokeLinejoin="round">
          <polygon points={`${cx},${M} ${w - M},${cy} ${cx},${h - M} ${M},${cy}`} />
        </svg>
      );
    }
    case "fc-terminal": {
      const rx = w / 2 - M;
      const ry = h / 2 - M;
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className={className} fill="none" stroke={COLOR} strokeWidth={strokeWidth}>
          <ellipse cx={w / 2} cy={h / 2} rx={rx} ry={ry} />
        </svg>
      );
    }
    case "fc-io": {
      const skew = 4;
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className={className} fill="none" stroke={COLOR} strokeWidth={strokeWidth} strokeLinejoin="round">
          <polygon points={`${skew + M},${M} ${w - M},${M} ${w - skew - M},${h - M} ${M},${h - M}`} />
        </svg>
      );
    }
    case "fc-document": {
      const cy = 5;
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className={className} fill="none" stroke={COLOR} strokeWidth={strokeWidth} strokeLinejoin="round">
          <path
            d={`M${M},${M + 3} Q${M},${M} ${M + 3},${M} L${w - M - 3},${M} Q${w - M},${M} ${w - M},${M + 3}
                L${w - M},${h - cy - M}
                C${w * 0.72},${h + cy * 0.5 - M} ${w * 0.28},${h - cy * 2 - M} ${M},${h - cy - M} Z`}
          />
        </svg>
      );
    }
    case "fc-predefined":
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className={className} fill="none" stroke={COLOR} strokeWidth={strokeWidth}>
          <rect x={M} y={M} width={w - M * 2} height={h - M * 2} rx={3} />
          <line x1={w * 0.22} y1={M} x2={w * 0.22} y2={h - M} strokeWidth={1.2} />
          <line x1={w * 0.78} y1={M} x2={w * 0.78} y2={h - M} strokeWidth={1.2} />
        </svg>
      );
    case "fc-process":
    default:
      return (
        <svg viewBox={`0 0 ${w} ${h}`} className={className} fill="none" stroke={COLOR} strokeWidth={strokeWidth}>
          <rect x={M} y={M} width={w - M * 2} height={h - M * 2} rx={6} />
        </svg>
      );
  }
}
