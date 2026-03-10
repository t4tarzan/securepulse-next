// Scan orchestrator — runs selected scanners and returns unified findings

import { scanRepoForSecrets, type SecretFinding } from "./secret-scanner";
import { scanRepoForDependencies, type DependencyFinding } from "./dependency-scanner";
import { scanRepoForSast, type SastFinding } from "./sast-scanner";
import { scanWithTruffleHog } from "./trufflehog-scanner";
import { scanWithGitleaks } from "./gitleaks-scanner";
import { scanWithTrivy } from "./trivy-scanner";
import { scanWithVirusTotal } from "./virustotal-scanner";

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
  token: string,
  isDockerImage: boolean = false
): Promise<ScanResult> {
  let allFindings: Finding[] = [];

  // Basic secret scan (regex-based)
  if (scanType === "secret-scan" || scanType === "full") {
    const secrets = await scanRepoForSecrets(repoFullName, token);
    allFindings.push(...secrets);
  }

  // TruffleHog - Advanced secret detection
  if (scanType === "trufflehog" || scanType === "full") {
    const result = await scanWithTruffleHog(repoFullName, token);
    allFindings.push(...result.findings);
  }

  // Gitleaks - Docker image secret scan
  if (scanType === "gitleaks" && isDockerImage) {
    const result = await scanWithGitleaks(repoFullName);
    allFindings.push(...result.findings);
  }

  // Trivy - CVE and vulnerability scanning
  if (scanType === "trivy" || scanType === "full") {
    const result = await scanWithTrivy(repoFullName, isDockerImage);
    allFindings.push(...result.findings);
  }

  // VirusTotal - Malware detection
  if (scanType === "malware" || scanType === "full") {
    const result = await scanWithVirusTotal(repoFullName, token);
    allFindings.push(...result.findings);
  }

  // Dependency audit (OSV.dev)
  if (scanType === "dependency" || scanType === "full") {
    const deps = await scanRepoForDependencies(repoFullName, token);
    allFindings.push(...deps);
  }

  // SAST - Static analysis
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
