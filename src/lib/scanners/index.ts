// Scan orchestrator — runs selected scanners and returns unified findings

import { scanRepoForSecrets, type SecretFinding } from "./secret-scanner";
import { scanRepoForDependencies, type DependencyFinding } from "./dependency-scanner";
import { scanRepoForSast, type SastFinding } from "./sast-scanner";

export type Finding = {
  rule: string;
  severity: string;
  description: string;
  filePath: string;
  lineNumber: number;
  match: string;
};

export type ScanResult = {
  scanType: string;
  findings: Finding[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    filesScanned: number;
  };
};

export async function runScan(
  scanType: string,
  repoFullName: string,
  token: string
): Promise<ScanResult> {
  let allFindings: Finding[] = [];

  if (scanType === "secret-scan" || scanType === "full") {
    const secrets = await scanRepoForSecrets(repoFullName, token);
    allFindings.push(...secrets);
  }

  if (scanType === "dependency" || scanType === "full") {
    const deps = await scanRepoForDependencies(repoFullName, token);
    allFindings.push(...deps);
  }

  if (scanType === "sast" || scanType === "full") {
    const sast = await scanRepoForSast(repoFullName, token);
    allFindings.push(...sast);
  }

  // Deduplicate by rule+file+line
  const seen = new Set<string>();
  allFindings = allFindings.filter((f) => {
    const key = `${f.rule}:${f.filePath}:${f.lineNumber}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const summary = {
    total: allFindings.length,
    critical: allFindings.filter((f) => f.severity === "critical").length,
    high: allFindings.filter((f) => f.severity === "high").length,
    medium: allFindings.filter((f) => f.severity === "medium").length,
    low: allFindings.filter((f) => f.severity === "low").length,
    filesScanned: new Set(allFindings.map((f) => f.filePath)).size,
  };

  return {
    scanType: scanType === "full" ? "full" : scanType,
    findings: allFindings,
    summary,
  };
}
