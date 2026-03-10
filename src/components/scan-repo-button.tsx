"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Scan, Loader2, ChevronDown, Check, X, Key, Code2, Package, Bug, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const SCAN_TYPES = [
  { 
    value: "trufflehog", 
    label: "TruffleHog Scan", 
    desc: "Advanced secret detection with entropy analysis",
    icon: Key,
    color: "text-red-500",
    badge: "Secrets+"
  },
  { 
    value: "trivy", 
    label: "Trivy CVE Scan", 
    desc: "Detect known vulnerabilities (CVEs) in dependencies",
    icon: Shield,
    color: "text-amber-500",
    badge: "CVE"
  },
  { 
    value: "sast", 
    label: "SAST Analysis", 
    desc: "Static code analysis for security vulnerabilities",
    icon: Code2,
    color: "text-blue-500",
    badge: "SAST"
  },
  { 
    value: "malware", 
    label: "Malware Scan", 
    desc: "Detect malicious code patterns & threats",
    icon: Bug,
    color: "text-orange-500",
    badge: "Malware"
  },
  { 
    value: "dependency", 
    label: "Dependency Audit", 
    desc: "Check packages for known vulnerabilities (OSV.dev)",
    icon: Package,
    color: "text-purple-500",
    badge: "Dependencies"
  },
  { 
    value: "full", 
    label: "Full Security Scan", 
    desc: "Run all security scans (recommended)",
    icon: Shield,
    color: "text-emerald-500",
    badge: "Complete"
  },
];

export function ScanRepoButton({ repoId, repoName }: { repoId: string; repoName: string }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<{ status: string; alerts?: number } | null>(null);
  const router = useRouter();

  async function triggerScan(scanType: string) {
    setLoading(scanType);
    setResult(null);
    try {
      const res = await fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoId, scanType }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ status: "completed", alerts: data.alertsCreated || 0 });
        router.refresh();
      } else {
        setResult({ status: "failed" });
      }
    } catch {
      setResult({ status: "failed" });
    } finally {
      setLoading(null);
      // Clear result after 5s
      setTimeout(() => setResult(null), 5000);
    }
  }

  return (
    <div className="flex items-center gap-1">
      {result && (
        <span className="text-xs flex items-center gap-1">
          {result.status === "completed" ? (
            <>
              <Check className="h-3 w-3 text-green-500" />
              <span className="text-green-500">{result.alerts} findings</span>
            </>
          ) : (
            <>
              <X className="h-3 w-3 text-red-500" />
              <span className="text-red-500">failed</span>
            </>
          )}
        </span>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" disabled={loading !== null}>
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Scan className="h-3 w-3" />
            )}
            {loading ? "Scanning..." : "Scan"}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="text-xs truncate flex items-center gap-2">
            <Zap className="h-3 w-3" />
            {repoName}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {SCAN_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = loading === type.value;
            return (
              <DropdownMenuItem
                key={type.value}
                onClick={() => triggerScan(type.value)}
                disabled={!!loading}
                className="cursor-pointer py-3 hover:bg-green-500/10 hover:border-l-2 hover:border-green-500 transition-all duration-200"
              >
                <div className="flex items-start gap-3 w-full">
                  <Icon className={`h-4 w-4 mt-0.5 ${type.color} ${isSelected ? 'animate-pulse' : ''}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium text-sm ${isSelected ? 'text-green-500' : ''}`}>{type.label}</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${isSelected ? 'bg-green-500/20 border-green-500 text-green-500' : ''}`}
                      >
                        {type.badge}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{type.desc}</div>
                  </div>
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
