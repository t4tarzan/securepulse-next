// Dependency Scanner — fetches package manifests via GitHub API, checks OSV.dev for vulnerabilities

export interface DependencyFinding {
  rule: string;
  severity: string;
  description: string;
  filePath: string;
  lineNumber: number;
  match: string;
}

interface OsvVulnerability {
  id: string;
  summary: string;
  details: string;
  severity: { type: string; score: string }[];
  affected: { package: { name: string; ecosystem: string }; ranges: any[] }[];
}

const MANIFEST_FILES = [
  { path: "package.json", ecosystem: "npm" },
  { path: "requirements.txt", ecosystem: "PyPI" },
  { path: "Gemfile.lock", ecosystem: "RubyGems" },
  { path: "go.mod", ecosystem: "Go" },
  { path: "pom.xml", ecosystem: "Maven" },
  { path: "Cargo.toml", ecosystem: "crates.io" },
];

export async function scanRepoForDependencies(
  repoFullName: string,
  token: string
): Promise<DependencyFinding[]> {
  const findings: DependencyFinding[] = [];

  for (const manifest of MANIFEST_FILES) {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${repoFullName}/contents/${manifest.path}`,
        { headers: { Authorization: `token ${token}`, Accept: "application/vnd.github.v3+json" } }
      );
      if (!res.ok) continue;
      const data = await res.json();

      let content: string;
      if (data.encoding === "base64" && data.content) {
        content = Buffer.from(data.content, "base64").toString("utf-8");
      } else {
        continue;
      }

      if (manifest.ecosystem === "npm") {
        const npmFindings = await scanNpmDeps(content, manifest.path);
        findings.push(...npmFindings);
      } else if (manifest.ecosystem === "PyPI") {
        const pyFindings = await scanPypiDeps(content, manifest.path);
        findings.push(...pyFindings);
      }
    } catch {
      // Skip manifests that fail
    }
  }

  return findings;
}

async function scanNpmDeps(content: string, filePath: string): Promise<DependencyFinding[]> {
  const findings: DependencyFinding[] = [];
  try {
    const pkg = JSON.parse(content);
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    // Batch query OSV.dev
    const packages = Object.entries(allDeps).map(([name, version]) => ({
      package: { name, ecosystem: "npm" },
      version: String(version).replace(/^[\^~>=<]/, "").split(" ")[0],
    }));

    // Query in batches of 20
    for (let i = 0; i < packages.length; i += 20) {
      const batch = packages.slice(i, i + 20);
      try {
        const osvRes = await fetch("https://api.osv.dev/v1/querybatch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ queries: batch }),
        });

        if (!osvRes.ok) continue;
        const osvData = await osvRes.json();

        if (osvData.results) {
          for (let j = 0; j < osvData.results.length; j++) {
            const result = osvData.results[j];
            if (result.vulns && result.vulns.length > 0) {
              const pkg = batch[j];
              for (const vuln of result.vulns.slice(0, 3)) {
                // Limit to 3 vulns per package
                findings.push({
                  rule: "Vulnerable Dependency",
                  severity: mapOsvSeverity(vuln),
                  description: `${pkg.package.name}@${pkg.version}: ${vuln.summary || vuln.id}`,
                  filePath,
                  lineNumber: findDepLine(content, pkg.package.name),
                  match: vuln.id,
                });
              }
            }
          }
        }
      } catch {
        // OSV.dev query failed, skip batch
      }
    }
  } catch {
    // Invalid JSON
  }
  return findings;
}

async function scanPypiDeps(content: string, filePath: string): Promise<DependencyFinding[]> {
  const findings: DependencyFinding[] = [];
  const lines = content.split("\n");

  const packages = lines
    .map((line) => {
      const match = line.match(/^([a-zA-Z0-9_-]+)==([0-9.]+)/);
      if (match) return { package: { name: match[1], ecosystem: "PyPI" }, version: match[2] };
      return null;
    })
    .filter(Boolean) as { package: { name: string; ecosystem: string }; version: string }[];

  // Query in batches of 20
  for (let i = 0; i < packages.length; i += 20) {
    const batch = packages.slice(i, i + 20);
    try {
      const osvRes = await fetch("https://api.osv.dev/v1/querybatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queries: batch }),
      });

      if (!osvRes.ok) continue;
      const osvData = await osvRes.json();

      if (osvData.results) {
        for (let j = 0; j < osvData.results.length; j++) {
          const result = osvData.results[j];
          if (result.vulns && result.vulns.length > 0) {
            const pkg = batch[j];
            for (const vuln of result.vulns.slice(0, 3)) {
              findings.push({
                rule: "Vulnerable Dependency",
                severity: mapOsvSeverity(vuln),
                description: `${pkg.package.name}==${pkg.version}: ${vuln.summary || vuln.id}`,
                filePath,
                lineNumber: lines.findIndex((l) => l.startsWith(pkg.package.name)) + 1 || 1,
                match: vuln.id,
              });
            }
          }
        }
      }
    } catch {
      // OSV.dev query failed
    }
  }

  return findings;
}

function mapOsvSeverity(vuln: any): string {
  if (vuln.database_specific?.severity) {
    const s = vuln.database_specific.severity.toLowerCase();
    if (s === "critical") return "critical";
    if (s === "high") return "high";
    if (s === "moderate" || s === "medium") return "medium";
    return "low";
  }
  // Check CVSS
  if (vuln.severity && vuln.severity.length > 0) {
    const score = parseFloat(vuln.severity[0].score || "0");
    if (score >= 9) return "critical";
    if (score >= 7) return "high";
    if (score >= 4) return "medium";
    return "low";
  }
  return "medium";
}

function findDepLine(content: string, depName: string): number {
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(`"${depName}"`)) return i + 1;
  }
  return 1;
}
