/**
 * Trivy Scanner - CVE and vulnerability detection
 * Scans container images and dependencies for known vulnerabilities
 */

interface TrivyFinding {
  rule: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  filePath: string;
  lineNumber: number;
  match: string;
}

interface CVEData {
  id: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  packageName: string;
  installedVersion: string;
  fixedVersion?: string;
}

// Common vulnerable packages for demonstration
const KNOWN_VULNERABILITIES: CVEData[] = [
  {
    id: "CVE-2024-1234",
    severity: "CRITICAL",
    title: "Remote Code Execution in lodash",
    description: "Prototype pollution vulnerability allows remote code execution",
    packageName: "lodash",
    installedVersion: "4.17.15",
    fixedVersion: "4.17.21",
  },
  {
    id: "CVE-2023-5678",
    severity: "HIGH",
    title: "SQL Injection in sequelize",
    description: "Improper input validation leads to SQL injection",
    packageName: "sequelize",
    installedVersion: "5.21.0",
    fixedVersion: "6.28.0",
  },
  {
    id: "CVE-2023-9012",
    severity: "HIGH",
    title: "Cross-Site Scripting in express",
    description: "XSS vulnerability in template rendering",
    packageName: "express",
    installedVersion: "4.17.1",
    fixedVersion: "4.18.2",
  },
  {
    id: "CVE-2023-3456",
    severity: "MEDIUM",
    title: "Denial of Service in axios",
    description: "Uncontrolled resource consumption",
    packageName: "axios",
    installedVersion: "0.21.0",
    fixedVersion: "0.27.2",
  },
];

export async function scanWithTrivy(
  target: string,
  isDockerImage: boolean = false
): Promise<{ findings: TrivyFinding[]; summary: any }> {
  const findings: TrivyFinding[] = [];
  
  try {
    // In production, this would:
    // 1. For Docker images: Pull image and scan layers with Trivy CLI
    // 2. For repos: Scan package.json, requirements.txt, go.mod, etc.
    // 3. Query vulnerability databases (NVD, GitHub Advisory, etc.)
    
    // For demonstration, we'll simulate CVE detection
    const vulnerabilitiesToReport = KNOWN_VULNERABILITIES.slice(0, Math.floor(Math.random() * 3) + 1);
    
    vulnerabilitiesToReport.forEach((cve) => {
      const severity = cve.severity.toLowerCase() as "critical" | "high" | "medium" | "low";
      
      findings.push({
        rule: cve.id,
        severity,
        description: `${cve.title} - ${cve.description}`,
        filePath: isDockerImage ? "Docker Image Layers" : "package.json",
        lineNumber: 0,
        match: `${cve.packageName}@${cve.installedVersion} (fix: ${cve.fixedVersion || "N/A"})`,
      });
    });

    // Add OS-level vulnerabilities for Docker images
    if (isDockerImage) {
      const osVulns = [
        {
          id: "CVE-2024-OS-001",
          severity: "high" as const,
          description: "Kernel vulnerability in base image",
          package: "linux-kernel",
          version: "5.10.0",
        },
        {
          id: "CVE-2024-OS-002",
          severity: "medium" as const,
          description: "OpenSSL vulnerability",
          package: "openssl",
          version: "1.1.1",
        },
      ];

      if (Math.random() > 0.5) {
        osVulns.forEach((vuln) => {
          findings.push({
            rule: vuln.id,
            severity: vuln.severity,
            description: vuln.description,
            filePath: "OS Packages",
            lineNumber: 0,
            match: `${vuln.package}@${vuln.version}`,
          });
        });
      }
    }

    const summary = {
      target,
      scanType: isDockerImage ? "container" : "filesystem",
      totalVulnerabilities: findings.length,
      criticalFindings: findings.filter(f => f.severity === "critical").length,
      highFindings: findings.filter(f => f.severity === "high").length,
      mediumFindings: findings.filter(f => f.severity === "medium").length,
      lowFindings: findings.filter(f => f.severity === "low").length,
      note: "Simulated CVE scan - production would use Trivy CLI or API",
    };

    return { findings, summary };
  } catch (error: any) {
    throw new Error(`Trivy scan failed: ${error.message}`);
  }
}
