// Secret Scanner — fetches repo tree via GitHub API and scans file contents for secret patterns

const SECRET_PATTERNS: { name: string; severity: string; pattern: RegExp; description: string }[] = [
  { name: "AWS Access Key", severity: "critical", pattern: /AKIA[0-9A-Z]{16}/g, description: "AWS Access Key ID found in source code" },
  { name: "AWS Secret Key", severity: "critical", pattern: /(?:aws_secret_access_key|AWS_SECRET_ACCESS_KEY)\s*[=:]\s*['"]?([A-Za-z0-9/+=]{40})['"]?/g, description: "AWS Secret Access Key exposed" },
  { name: "GitHub Token", severity: "critical", pattern: /gh[pousr]_[A-Za-z0-9_]{36,255}/g, description: "GitHub personal access token or OAuth token found" },
  { name: "Generic API Key", severity: "high", pattern: /(?:api[_-]?key|apikey|api[_-]?secret)\s*[=:]\s*['"]([A-Za-z0-9_\-]{20,})['"]?/gi, description: "API key or secret found hardcoded" },
  { name: "Private Key", severity: "critical", pattern: /-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----/g, description: "Private key found in source code" },
  { name: "JWT Secret", severity: "high", pattern: /(?:jwt[_-]?secret|JWT_SECRET)\s*[=:]\s*['"]([^'"]{8,})['"]?/gi, description: "JWT signing secret hardcoded" },
  { name: "Database URL", severity: "high", pattern: /(?:postgres|mysql|mongodb|redis):\/\/[^\s'"]+:[^\s'"]+@[^\s'"]+/g, description: "Database connection string with credentials" },
  { name: "Slack Token", severity: "high", pattern: /xox[baprs]-[0-9A-Za-z\-]{10,}/g, description: "Slack API token found" },
  { name: "Stripe Key", severity: "critical", pattern: /(?:sk_live|pk_live|sk_test|pk_test)_[A-Za-z0-9]{20,}/g, description: "Stripe API key found" },
  { name: "SendGrid Key", severity: "high", pattern: /SG\.[A-Za-z0-9_\-]{22,}\.[A-Za-z0-9_\-]{43,}/g, description: "SendGrid API key found" },
  { name: "Twilio Key", severity: "high", pattern: /SK[a-f0-9]{32}/g, description: "Twilio API key found" },
  { name: "Google API Key", severity: "high", pattern: /AIza[0-9A-Za-z_\-]{35}/g, description: "Google API key found" },
  { name: "Hardcoded Password", severity: "medium", pattern: /(?:password|passwd|pwd)\s*[=:]\s*['"]([^'"]{6,})['"]?/gi, description: "Password appears to be hardcoded" },
  { name: "Bearer Token", severity: "high", pattern: /Bearer\s+[A-Za-z0-9\-._~+/]+=*/g, description: "Bearer token found hardcoded" },
];

// File extensions to scan
const SCANNABLE_EXTENSIONS = new Set([
  "ts", "tsx", "js", "jsx", "py", "rb", "go", "java", "rs", "php",
  "env", "yml", "yaml", "json", "toml", "ini", "cfg", "conf", "config",
  "sh", "bash", "zsh", "dockerfile", "tf", "hcl",
]);

// Files to skip
const SKIP_PATTERNS = [
  /node_modules/i, /vendor/i, /\.min\./i, /package-lock\.json/i,
  /yarn\.lock/i, /\.git\//i, /dist\//i, /build\//i, /\.next\//i,
];

export interface SecretFinding {
  rule: string;
  severity: string;
  description: string;
  filePath: string;
  lineNumber: number;
  match: string;
}

export async function scanRepoForSecrets(
  repoFullName: string,
  token: string,
  maxFiles: number = 50
): Promise<SecretFinding[]> {
  const findings: SecretFinding[] = [];

  // Get repo tree
  const treeRes = await fetch(
    `https://api.github.com/repos/${repoFullName}/git/trees/HEAD?recursive=1`,
    { headers: { Authorization: `token ${token}`, Accept: "application/vnd.github.v3+json" } }
  );

  if (!treeRes.ok) return findings;
  const tree = await treeRes.json();
  if (!tree.tree) return findings;

  // Filter scannable files
  const files = tree.tree
    .filter((f: any) => {
      if (f.type !== "blob") return false;
      const ext = f.path.split(".").pop()?.toLowerCase() || "";
      const basename = f.path.split("/").pop()?.toLowerCase() || "";
      if (basename === ".env" || basename === ".env.local" || basename === ".env.production") return true;
      if (!SCANNABLE_EXTENSIONS.has(ext)) return false;
      if (SKIP_PATTERNS.some((p) => p.test(f.path))) return false;
      if (f.size > 100000) return false; // skip large files
      return true;
    })
    .slice(0, maxFiles);

  // Fetch and scan each file
  for (const file of files) {
    try {
      const contentRes = await fetch(
        `https://api.github.com/repos/${repoFullName}/contents/${encodeURIComponent(file.path)}`,
        { headers: { Authorization: `token ${token}`, Accept: "application/vnd.github.v3+json" } }
      );
      if (!contentRes.ok) continue;
      const contentData = await contentRes.json();

      let content: string;
      if (contentData.encoding === "base64" && contentData.content) {
        content = Buffer.from(contentData.content, "base64").toString("utf-8");
      } else {
        continue;
      }

      const lines = content.split("\n");
      for (const rule of SECRET_PATTERNS) {
        // Reset regex lastIndex for each file
        rule.pattern.lastIndex = 0;
        for (let i = 0; i < lines.length; i++) {
          rule.pattern.lastIndex = 0;
          const match = rule.pattern.exec(lines[i]);
          if (match) {
            // Redact the actual secret
            const redacted = match[0].substring(0, 8) + "..." + match[0].substring(match[0].length - 4);
            findings.push({
              rule: rule.name,
              severity: rule.severity,
              description: rule.description,
              filePath: file.path,
              lineNumber: i + 1,
              match: redacted,
            });
          }
        }
      }
    } catch {
      // Skip files that fail to fetch
    }
  }

  return findings;
}
