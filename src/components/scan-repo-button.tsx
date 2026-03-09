"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Scan, Loader2, ChevronDown, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SCAN_TYPES = [
  { value: "secret-scan", label: "Secret Scan", desc: "Detect leaked secrets & API keys" },
  { value: "sast", label: "SAST", desc: "Static code analysis for vulnerabilities" },
  { value: "dependency", label: "Dependency Audit", desc: "Check packages against OSV.dev" },
  { value: "full", label: "Full Scan", desc: "Run all scan types" },
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
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="text-xs truncate">{repoName}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {SCAN_TYPES.map((type) => (
            <DropdownMenuItem
              key={type.value}
              onClick={() => triggerScan(type.value)}
              disabled={loading !== null}
            >
              <div>
                <div className="font-medium text-sm">{type.label}</div>
                <div className="text-xs text-muted-foreground">{type.desc}</div>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
