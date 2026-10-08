"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface PieSegment {
  label: string;
  value: number;
  color: string;
}

export interface BarChartProps {
  data: DataPoint[];
  barHeight?: number;
  gap?: number;
  showValues?: boolean;
  showGrid?: boolean;
  maxValue?: number;
  defaultColor?: string;
  height?: number;
  className?: string;
}

export function BarChart({
  data,
  barHeight = 120,
  gap = 12,
  showValues = true,
  showGrid = true,
  maxValue,
  defaultColor = "bg-primary",
  height = 200,
  className,
}: BarChartProps) {
  if (!data.length) {
    return (
      <div className={cn("flex items-center justify-center", className)} style={{ height }}>
        <span className="text-sm text-muted-foreground">No data</span>
      </div>
    );
  }

  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);
  const maxBarWidth = Math.min(barHeight, 120);

  return (
    <div className={cn("relative flex items-end gap-1 w-full", className)} style={{ height }}>
      {showGrid && (
        <div className="absolute left-0 top-0 bottom-0 w-10 flex flex-col justify-between text-xs text-muted-foreground pr-2">
          {[1, 0.75, 0.5, 0.25, 0].map((pct) => (
            <span key={pct} className="truncate">{Math.round(max * pct)}</span>
          ))}
        </div>
      )}
      <div className="flex-1 flex items-end gap-1">
        {data.map((d) => {
          const barWidth = (d.value / max) * maxBarWidth;
          const color = d.color || defaultColor;
          return (
            <div key={d.label} className="flex flex-col items-center flex-1 justify-end h-full">
              {showValues && (
                <span className="text-xs text-muted-foreground mb-1">{d.value}</span>
              )}
              <div
                className={cn("w-full rounded-t transition-all", color)}
                style={{ height: Math.max(barWidth, 2) }}
                title={`${d.label}: ${d.value}`}
              />
              <span className="text-xs text-muted-foreground mt-1 text-center truncate w-full">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export interface LineChartProps {
  data: DataPoint[];
  lineColor?: string;
  fillColor?: string;
  showDots?: boolean;
  showGrid?: boolean;
  maxValue?: number;
  showValues?: boolean;
  height?: number;
  className?: string;
}

export function LineChart({
  data,
  lineColor = "text-primary",
  fillColor,
  showDots = true,
  showGrid = true,
  maxValue,
  showValues = false,
  height = 200,
  className,
}: LineChartProps) {
  if (!data.length) {
    return (
      <div className={cn("flex items-center justify-center", className)} style={{ height }}>
        <span className="text-sm text-muted-foreground">No data</span>
      </div>
    );
  }

  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);
  const padding = 12;
  const chartW = 100;
  const chartH = height - padding * 2;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1 || 1)) * (chartW - padding * 2);
    const y = padding + (1 - d.value / max) * (chartH - padding * 2);
    return { x, y, value: d.value };
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(2)} ${(padding + chartH).toFixed(2)} L ${points[0].x.toFixed(2)} ${(padding + chartH).toFixed(2)} Z`;

  const strokeColor = React.useMemo(() => {
    if (typeof lineColor === "string" && lineColor.startsWith("#")) return lineColor;
    if (typeof lineColor === "string" && lineColor.startsWith("text-")) {
      return `hsl(var(${lineColor.replace("text-", "")})`;
    }
    return "#6366f1";
  }, [lineColor]);

  return (
    <div className={cn("relative w-full", className)} style={{ height }}>
      {showGrid && (
        <div className="absolute inset-0 pointer-events-none">
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
            <div key={pct} className="absolute left-0 right-0 border-t border-border/40" style={{ top: `${padding + (1 - pct) * chartH}px` }} />
          ))}
          <div className="absolute left-0 top-0 flex flex-col justify-between h-full pr-2">
            {[1, 0.75, 0.5, 0.25, 0].map((pct) => (
              <span key={pct} className="text-xs text-muted-foreground">{Math.round(max * pct)}</span>
            ))}
          </div>
        </div>
      )}
      {fillColor && (
        <svg viewBox={`0 0 ${chartW} ${height}`} className="absolute inset-0 w-full h-full overflow-visible">
          <path d={areaD} fill={fillColor} opacity={0.15} />
        </svg>
      )}
      <svg viewBox={`0 0 ${chartW} ${height}`} className="absolute inset-0 w-full h-full overflow-visible">
        <path d={pathD} fill="none" stroke={strokeColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {showDots && points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill={strokeColor} stroke="white" strokeWidth={2} />
        ))}
        {showValues && points.map((p, i) => (
          <text key={`v-${i}`} x={p.x} y={p.y - 8} className="text-xs fill-muted-foreground" textAnchor="middle">
            {p.value}
          </text>
        ))}
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex justify-between px-1">
        {data.map((d, i) => (
          <span key={i} className="text-xs text-muted-foreground truncate" style={{ flex: 1, textAlign: "center" }}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export interface PieChartProps {
  data: PieSegment[];
  size?: number;
  showLegend?: boolean;
  legendPosition?: "right" | "bottom";
  showValues?: boolean;
  className?: string;
}

export function PieChart({
  data,
  size = 180,
  showLegend = true,
  legendPosition = "right",
  showValues = true,
  className,
}: PieChartProps) {
  if (!data.length) {
    return (
      <div className={cn("flex items-center justify-center", className)} style={{ height: size }}>
        <span className="text-sm text-muted-foreground">No data</span>
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return (
      <div className={cn("flex items-center justify-center", className)} style={{ height: size }}>
        <span className="text-sm text-muted-foreground">No data</span>
      </div>
    );
  }

  const center = size / 2;
  const radius = size / 2;
  const strokeWidth = size > 100 ? 20 : 12;
  let cumulativeAngle = -Math.PI / 2;
  const segments = data.map((d) => {
    const angle = (d.value / total) * 2 * Math.PI;
    const startAngle = cumulativeAngle;
    cumulativeAngle += angle;
    return { ...d, startAngle, endAngle: cumulativeAngle };
  });

  const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => [
    cx + r * Math.cos(angle),
    cy + r * Math.sin(angle),
  ];

  const slices = segments.map((seg) => {
    const [x1, y1] = polarToCartesian(center, center, radius - strokeWidth / 2, seg.startAngle);
    const [x2, y2] = polarToCartesian(center, center, radius - strokeWidth / 2, seg.endAngle);
    const [x3, y3] = polarToCartesian(center, center, radius + strokeWidth / 2, seg.endAngle);
    const [x4, y4] = polarToCartesian(center, center, radius + strokeWidth / 2, seg.startAngle);
    const largeArc = seg.endAngle - seg.startAngle > Math.PI ? 1 : 0;
    return {
      pathD: [
        `M ${x1} ${y1}`,
        `A ${radius - strokeWidth / 2} ${radius - strokeWidth / 2} 0 ${largeArc} 1 ${x2} ${y2}`,
        `L ${x3} ${y3}`,
        `A ${radius + strokeWidth / 2} ${radius + strokeWidth / 2} 0 ${largeArc} 0 ${x4} ${y4}`,
        "Z",
      ].join(" "),
      color: seg.color,
    };
  });

  const legendItems = data.map((d, i) => (
    <div key={i} className="flex items-center gap-2">
      <span className="inline-block rounded-full" style={{ width: 10, height: 10, backgroundColor: d.color }} />
      <span className="text-xs text-foreground">{d.label}</span>
      {showValues && <span className="text-xs text-muted-foreground">({Math.round((d.value / total) * 100)}%)</span>}
    </div>
  ));

  return (
    <div className={cn("flex items-center", className)}>
      <svg width={size} height={size} className="flex-shrink-0">
        {slices.map((s, i) => (
          <path key={i} d={s.pathD} fill={s.color} stroke="white" strokeWidth={2} />
        ))}
      </svg>
      {showLegend && (
        <div className={cn("ml-3", legendPosition === "bottom" ? "mt-2 w-full flex flex-wrap justify-center gap-2" : "")}>
          {legendItems}
        </div>
      )}
    </div>
  );
}

export interface DoughnutChartProps {
  data: PieSegment[];
  size?: number;
  showLegend?: boolean;
  legendPosition?: "right" | "bottom";
  showValues?: boolean;
  innerRatio?: number;
  className?: string;
}

export function DoughnutChart({
  data,
  size = 180,
  showLegend = true,
  legendPosition = "right",
  showValues = true,
  innerRatio = 0.55,
  className,
}: DoughnutChartProps) {
  if (!data.length) {
    return (
      <div className={cn("flex items-center justify-center", className)} style={{ height: size }}>
        <span className="text-sm text-muted-foreground">No data</span>
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return (
      <div className={cn("flex items-center justify-center", className)} style={{ height: size }}>
        <span className="text-sm text-muted-foreground">No data</span>
      </div>
    );
  }

  const center = size / 2;
  const radius = size / 2;
  const outerRadius = radius;
  const innerRadius = radius * innerRatio;
  let cumulativeAngle = -Math.PI / 2;
  const segments = data.map((d) => {
    const angle = (d.value / total) * 2 * Math.PI;
    const startAngle = cumulativeAngle;
    cumulativeAngle += angle;
    return { ...d, startAngle, endAngle: cumulativeAngle };
  });

  const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => [
    cx + r * Math.cos(angle),
    cy + r * Math.sin(angle),
  ];

  const slices = segments.map((seg) => {
    const [x1, y1] = polarToCartesian(center, center, outerRadius, seg.startAngle);
    const [x2, y2] = polarToCartesian(center, center, outerRadius, seg.endAngle);
    const [x3, y3] = polarToCartesian(center, center, innerRadius, seg.endAngle);
    const [x4, y4] = polarToCartesian(center, center, innerRadius, seg.startAngle);
    const largeArc = seg.endAngle - seg.startAngle > Math.PI ? 1 : 0;
    return {
      pathD: [
        `M ${x1} ${y1}`,
        `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2}`,
        `L ${x3} ${y3}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}`,
        "Z",
      ].join(" "),
      color: seg.color,
    };
  });

  const legendItems = data.map((d, i) => (
    <div key={i} className="flex items-center gap-2">
      <span className="inline-block rounded-full" style={{ width: 10, height: 10, backgroundColor: d.color }} />
      <span className="text-xs text-foreground">{d.label}</span>
      {showValues && <span className="text-xs text-muted-foreground">({Math.round((d.value / total) * 100)}%)</span>}
    </div>
  ));

  return (
    <div className={cn("flex items-center", className)}>
      <svg width={size} height={size} className="flex-shrink-0">
        {slices.map((s, i) => (
          <path key={i} d={s.pathD} fill={s.color} stroke="white" strokeWidth={2} />
        ))}
        <text x={center} y={center - 4} textAnchor="middle" className="text-sm font-semibold fill-foreground">
          {total}
        </text>
        <text x={center} y={center + 12} textAnchor="middle" className="text-xs fill-muted-foreground">
          Total
        </text>
      </svg>
      {showLegend && (
        <div className={cn("ml-3", legendPosition === "bottom" ? "mt-2 w-full flex flex-wrap justify-center gap-2" : "")}>
          {legendItems}
        </div>
      )}
    </div>
  );
}

export interface SparklineProps {
  data: number[];
  color?: string;
  size?: number;
  className?: string;
}

export function Sparkline({ data, color = "text-primary", size = 40, className }: SparklineProps) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * size;
    const y = size - ((v - min) / range) * size;
    return `${x},${y}`;
  });
  const strokeColor = typeof color === "string" && color.startsWith("#") ? color : "#6366f1";
  return (
    <svg width={size} height={size} className={cn("inline-block", className)}>
      <polyline points={points.join(" ")} fill="none" stroke={strokeColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
