"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ScanTrendData {
  date: string;
  completed: number;
  failed: number;
}

interface ScanTrendChartProps {
  data: ScanTrendData[];
}

export function ScanTrendChart({ data }: ScanTrendChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">30-Day Scan Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No scan data available for the last 30 days.
          </p>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...data.map(d => d.completed + d.failed), 1);
  const chartHeight = 200;
  const chartWidth = 800;
  const barWidth = chartWidth / data.length - 4;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">30-Day Scan Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <svg width={chartWidth} height={chartHeight + 40} className="mx-auto">
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
              <line
                key={i}
                x1="0"
                y1={chartHeight * (1 - ratio)}
                x2={chartWidth}
                y2={chartHeight * (1 - ratio)}
                stroke="currentColor"
                strokeWidth="1"
                className="text-muted/20"
                strokeDasharray="4 4"
              />
            ))}

            {/* Bars */}
            {data.map((item, index) => {
              const x = index * (barWidth + 4);
              const completedHeight = (item.completed / maxValue) * chartHeight;
              const failedHeight = (item.failed / maxValue) * chartHeight;
              const totalHeight = completedHeight + failedHeight;

              return (
                <g key={index}>
                  {/* Failed (bottom) */}
                  <rect
                    x={x}
                    y={chartHeight - totalHeight}
                    width={barWidth}
                    height={failedHeight}
                    fill="#ef4444"
                    rx="2"
                  />
                  {/* Completed (top) */}
                  <rect
                    x={x}
                    y={chartHeight - totalHeight + failedHeight}
                    width={barWidth}
                    height={completedHeight}
                    fill="#22c55e"
                    rx="2"
                  />
                  {/* Date label (show every 5th) */}
                  {index % 5 === 0 && (
                    <text
                      x={x + barWidth / 2}
                      y={chartHeight + 20}
                      textAnchor="middle"
                      className="text-xs fill-muted-foreground"
                    >
                      {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span className="text-muted-foreground">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-muted-foreground">Failed</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
