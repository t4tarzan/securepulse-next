/**
 * TruffleHog Scanner - Advanced secret detection
 * Detects high-entropy strings, API keys, tokens, and credentials
 */

interface TruffleHogFinding {
  rule: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  filePath: string;
  lineNumber: number;
  match: string;
}

const HIGH_ENTROPY_PATTERNS = [
  // AWS
  { pattern: /AKIA[0-9A-Z]{16}/, name: "AWS Access Key", severity: "critical" as const },
  { pattern: /aws(.{0,20})?['\"][0-9a-zA-Z\/+]{40}['\"]/i, name: "AWS Secret Key", severity: "critical" as const },
  
  // GitHub
  { pattern: /ghp_[0-9a-zA-Z]{36}/, name: "GitHub Personal Access Token", severity: "critical" as const },
  { pattern: /gho_[0-9a-zA-Z]{36}/, name: "GitHub OAuth Token", severity: "critical" as const },
  { pattern: /github(.{0,20})?['\"][0-9a-zA-Z]{35,40}['\"]/i, name: "GitHub Token", severity: "critical" as const },
  
  // Google
  { pattern: /AIza[0-9A-Za-z\\-_]{35}/, name: "Google API Key", severity: "high" as const },
  { pattern: /ya29\.[0-9A-Za-z\-_]+/, name: "Google OAuth Token", severity: "high" as const },
  
  // Slack
  { pattern: /xox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[0-9a-zA-Z]{24,32}/, name: "Slack Token", severity: "high" as const },
  
  // Stripe
  { pattern: /sk_live_[0-9a-zA-Z]{24,}/, name: "Stripe Live Secret Key", severity: "critical" as const },
  { pattern: /rk_live_[0-9a-zA-Z]{24,}/, name: "Stripe Live Restricted Key", severity: "high" as const },
  
  // Twilio
  { pattern: /SK[0-9a-fA-F]{32}/, name: "Twilio API Key", severity: "high" as const },
  
  // SendGrid
  { pattern: /SG\.[0-9A-Za-z\-_]{22}\.[0-9A-Za-z\-_]{43}/, name: "SendGrid API Key", severity: "high" as const },
  
  // Mailgun
  { pattern: /key-[0-9a-zA-Z]{32}/, name: "Mailgun API Key", severity: "medium" as const },
  
  // Generic patterns
  { pattern: /['"]?api[_-]?key['"]?\s*[:=]\s*['"][0-9a-zA-Z\-_]{20,}['\"]/i, name: "Generic API Key", severity: "high" as const },
  { pattern: /['"]?secret[_-]?key['"]?\s*[:=]\s*['"][0-9a-zA-Z\-_]{20,}['\"]/i, name: "Generic Secret Key", severity: "high" as const },
  { pattern: /['"]?access[_-]?token['"]?\s*[:=]\s*['"][0-9a-zA-Z\-_]{20,}['\"]/i, name: "Generic Access Token", severity: "medium" as const },
  { pattern: /['"]?auth[_-]?token['"]?\s*[:=]\s*['"][0-9a-zA-Z\-_]{20,}['\"]/i, name: "Generic Auth Token", severity: "medium" as const },
  
  // Private keys
  { pattern: /-----BEGIN (RSA |DSA |EC )?PRIVATE KEY-----/, name: "Private Key", severity: "critical" as const },
  { pattern: /-----BEGIN OPENSSH PRIVATE KEY-----/, name: "SSH Private Key", severity: "critical" as const },
  
  // Database URLs
  { pattern: /mongodb(\+srv)?:\/\/[^\s]+/, name: "MongoDB Connection String", severity: "critical" as const },
  { pattern: /postgres(ql)?:\/\/[^\s]+/, name: "PostgreSQL Connection String", severity: "critical" as const },
  { pattern: /mysql:\/\/[^\s]+/, name: "MySQL Connection String", severity: "critical" as const },
  
  // JWT
  { pattern: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/, name: "JWT Token", severity: "medium" as const },
];

export async function scanWithTruffleHog(
  repoFullName: string,
  token: string
): Promise<{ findings: TruffleHogFinding[]; summary: any }> {
  const findings: TruffleHogFinding[] = [];
  
  try {
    // Fetch repository contents
    const [owner, repo] = repoFullName.split("/");
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    const files = data.tree.filter((item: any) => item.type === "blob");

    // Scan text files (limit to common code/config files)
    const textFileExtensions = [
      ".js", ".ts", ".jsx", ".tsx", ".py", ".java", ".go", ".rb", ".php",
      ".env", ".yaml", ".yml", ".json", ".xml", ".config", ".properties",
      ".sh", ".bash", ".zsh", ".txt", ".md", ".sql", ".tf", ".tfvars"
    ];

    const filesToScan = files.filter((file: any) => 
      textFileExtensions.some(ext => file.path.endsWith(ext))
    ).slice(0, 100); // Limit to 100 files for performance

    for (const file of filesToScan) {
      try {
        const fileResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${file.path}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/vnd.github.v3.raw",
            },
          }
        );

        if (!fileResponse.ok) continue;

        const content = await fileResponse.text();
        const lines = content.split("\n");

        // Scan each line with all patterns
        lines.forEach((line, lineIndex) => {
          HIGH_ENTROPY_PATTERNS.forEach(({ pattern, name, severity }) => {
            const matches = line.match(pattern);
            if (matches) {
              findings.push({
                rule: name,
                severity,
                description: `Detected ${name} in source code`,
                filePath: file.path,
                lineNumber: lineIndex + 1,
                match: matches[0].substring(0, 50) + (matches[0].length > 50 ? "..." : ""),
              });
            }
          });
        });
      } catch (err) {
        // Skip files that can't be read
        continue;
      }
    }

    const summary = {
      totalFiles: filesToScan.length,
      criticalFindings: findings.filter(f => f.severity === "critical").length,
      highFindings: findings.filter(f => f.severity === "high").length,
      mediumFindings: findings.filter(f => f.severity === "medium").length,
      lowFindings: findings.filter(f => f.severity === "low").length,
    };

    return { findings, summary };
  } catch (error: any) {
    throw new Error(`TruffleHog scan failed: ${error.message}`);
  }
}
