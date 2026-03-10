"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SecurityScoreProps {
  score: number;
  label: string;
}

export function SecurityScoreWidget({ score, label }: SecurityScoreProps) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  // Color coding based on score
  const getColor = (score: number) => {
    if (score >= 90) return { stroke: "#22c55e", text: "text-green-500", label: "Excellent" };
    if (score >= 70) return { stroke: "#eab308", text: "text-yellow-500", label: "Good" };
    if (score >= 50) return { stroke: "#f97316", text: "text-orange-500", label: "Fair" };
    if (score >= 25) return { stroke: "#ef4444", text: "text-red-500", label: "Poor" };
    return { stroke: "#dc2626", text: "text-red-600", label: "Critical" };
  };

  const color = getColor(score);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Security Score</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-6">
        <div className="relative">
          <svg width="180" height="180" className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-muted/20"
            />
            {/* Progress circle */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              stroke={color.stroke}
              strokeWidth="12"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-4xl font-bold ${color.text}`}>{Math.round(score)}</div>
            <div className="text-xs text-muted-foreground mt-1">out of 100</div>
          </div>
        </div>
        <div className="mt-4 text-center">
          <div className={`text-sm font-medium ${color.text}`}>{color.label}</div>
          <div className="text-xs text-muted-foreground mt-1">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}
