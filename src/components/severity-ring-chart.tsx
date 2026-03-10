"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SeverityRingChartProps {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export function SeverityRingChart({ critical, high, medium, low }: SeverityRingChartProps) {
  const total = critical + high + medium + low;
  
  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alert Severity Distribution</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-muted-foreground">
            <p className="text-4xl font-bold text-green-500">0</p>
            <p className="text-sm mt-2">No alerts</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate percentages
  const criticalPct = (critical / total) * 100;
  const highPct = (high / total) * 100;
  const mediumPct = (medium / total) * 100;
  const lowPct = (low / total) * 100;

  // SVG donut chart
  const radius = 80;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate stroke dash offsets for each segment
  let currentOffset = 0;
  const criticalDash = (criticalPct / 100) * circumference;
  const highDash = (highPct / 100) * circumference;
  const mediumDash = (mediumPct / 100) * circumference;
  const lowDash = (lowPct / 100) * circumference;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Alert Severity Distribution</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center py-6">
        <div className="relative">
          <svg width="200" height="200" className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-muted/10"
            />
            
            {/* Critical segment */}
            {critical > 0 && (
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="#ef4444"
                strokeWidth={strokeWidth}
                strokeDasharray={`${criticalDash} ${circumference - criticalDash}`}
                strokeDashoffset={-currentOffset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            )}
            
            {/* High segment */}
            {high > 0 && (
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="#f97316"
                strokeWidth={strokeWidth}
                strokeDasharray={`${highDash} ${circumference - highDash}`}
                strokeDashoffset={-(currentOffset + criticalDash)}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            )}
            
            {/* Medium segment */}
            {medium > 0 && (
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="#eab308"
                strokeWidth={strokeWidth}
                strokeDasharray={`${mediumDash} ${circumference - mediumDash}`}
                strokeDashoffset={-(currentOffset + criticalDash + highDash)}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            )}
            
            {/* Low segment */}
            {low > 0 && (
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="#3b82f6"
                strokeWidth={strokeWidth}
                strokeDasharray={`${lowDash} ${circumference - lowDash}`}
                strokeDashoffset={-(currentOffset + criticalDash + highDash + mediumDash)}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            )}
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-4xl font-bold">{total}</div>
            <div className="text-xs text-muted-foreground mt-1">Total Alerts</div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="grid grid-cols-2 gap-3 mt-6 w-full">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="text-sm">
              <span className="font-medium">{critical}</span>
              <span className="text-muted-foreground ml-1">Critical</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <div className="text-sm">
              <span className="font-medium">{high}</span>
              <span className="text-muted-foreground ml-1">High</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="text-sm">
              <span className="font-medium">{medium}</span>
              <span className="text-muted-foreground ml-1">Medium</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <div className="text-sm">
              <span className="font-medium">{low}</span>
              <span className="text-muted-foreground ml-1">Low</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
