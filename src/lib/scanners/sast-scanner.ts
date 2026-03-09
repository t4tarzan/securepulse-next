// SAST Scanner — pattern-based static analysis for common code vulnerabilities

export interface SastFinding {
  rule: string;
  severity: string;
  description: string;
  filePath: string;
  lineNumber: number;
  match: string;
}

const SAST_RULES: { name: string; severity: string; pattern: RegExp; description: string; fileExts: string[] }[] = [
  {
    name: "SQL Injection",
    severity: "critical",
    pattern: /(?:query|execute|raw)\s*\(\s*[`'"]\s*(?:SELECT|INSERT|UPDATE|DELETE|DROP).*\$\{/gi,
    description: "Potential SQL injection via string interpolation in query",
    fileExts: ["ts", "tsx", "js", "jsx"],
  },
  {
    name: "SQL Injection (concat)",
    severity: "critical",
    pattern: /(?:query|execute|raw)\s*\(\s*['"].*['"]\s*\+\s*(?:req\.|params\.|body\.|query\.)/gi,
    description: "Potential SQL injection via string concatenation",
    fileExts: ["ts", "tsx", "js", "jsx"],
  },
  {
    name: "XSS via innerHTML",
    severity: "high",
    pattern: /\.innerHTML\s*=\s*(?!['"]<)/g,
    description: "Setting innerHTML with dynamic content may lead to XSS",
    fileExts: ["ts", "tsx", "js", "jsx"],
  },
  {
    name: "dangerouslySetInnerHTML",
    severity: "high",
    pattern: /dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html\s*:/g,
    description: "Using dangerouslySetInnerHTML may lead to XSS if not sanitized",
    fileExts: ["tsx", "jsx"],
  },
  {
    name: "eval() usage",
    severity: "critical",
    pattern: /\beval\s*\(/g,
    description: "eval() executes arbitrary code and is a security risk",
    fileExts: ["ts", "tsx", "js", "jsx", "py"],
  },
  {
    name: "Command Injection",
    severity: "critical",
    pattern: /(?:exec|spawn|execSync|execFile)\s*\(\s*(?:req\.|params\.|`)/g,
    description: "Potential command injection via user-controlled input",
    fileExts: ["ts", "js"],
  },
  {
    name: "Insecure Random",
    severity: "medium",
    pattern: /Math\.random\s*\(\)/g,
    description: "Math.random() is not cryptographically secure, use crypto.randomBytes() instead",
    fileExts: ["ts", "tsx", "js", "jsx"],
  },
  {
    name: "Hardcoded IP",
    severity: "low",
    pattern: /(?:['"](?:\d{1,3}\.){3}\d{1,3}['"])/g,
    description: "Hardcoded IP address found",
    fileExts: ["ts", "tsx", "js", "jsx", "py", "go", "java"],
  },
  {
    name: "Console.log in production",
    severity: "low",
    pattern: /console\.log\s*\(/g,
    description: "console.log statements should be removed in production code",
    fileExts: ["ts", "tsx", "js", "jsx"],
  },
  {
    name: "No HTTPS",
    severity: "medium",
    pattern: /['"]http:\/\/(?!localhost|127\.0\.0\.1|0\.0\.0\.0)/g,
    description: "Non-HTTPS URL found — data transmitted in plaintext",
    fileExts: ["ts", "tsx", "js", "jsx", "py", "go", "java", "rb"],
  },
  {
    name: "Disabled SSL Verification",
    severity: "high",
    pattern: /(?:rejectUnauthorized\s*:\s*false|verify\s*=\s*False|InsecureSkipVerify\s*:\s*true)/g,
    description: "SSL/TLS certificate verification is disabled",
    fileExts: ["ts", "js", "py", "go"],
  },
  {
    name: "Path Traversal",
    severity: "high",
    pattern: /(?:readFile|readFileSync|createReadStream)\s*\(\s*(?:req\.|params\.|query\.)/g,
    description: "File read with user-controlled path may allow path traversal",
    fileExts: ["ts", "js"],
  },
  {
    name: "Weak Crypto",
    severity: "medium",
    pattern: /createHash\s*\(\s*['"](?:md5|sha1)['"]\)/g,
    description: "Weak hashing algorithm (MD5/SHA1) — use SHA-256 or better",
    fileExts: ["ts", "js"],
  },
  {
    name: "CORS Wildcard",
    severity: "medium",
    pattern: /(?:Access-Control-Allow-Origin|origin)\s*[=:]\s*['"][*]['"]/g,
    description: "CORS allows all origins — restrict to specific domains",
    fileExts: ["ts", "js", "py", "go"],
  },
];

const SKIP_PATTERNS = [
  /node_modules/i, /vendor/i, /\.min\./i, /package-lock/i,
  /yarn\.lock/i, /dist\//i, /build\//i, /\.next\//i, /\.test\./i, /__tests__/i,
];

export async function scanRepoForSast(
  repoFullName: string,
  token: string,
  maxFiles: number = 40
): Promise<SastFinding[]> {
  const findings: SastFinding[] = [];

  const treeRes = await fetch(
    `https://api.github.com/repos/${repoFullName}/git/trees/HEAD?recursive=1`,
    { headers: { Authorization: `token ${token}`, Accept: "application/vnd.github.v3+json" } }
  );

  if (!treeRes.ok) return findings;
  const tree = await treeRes.json();
  if (!tree.tree) return findings;

  const codeExts = new Set(["ts", "tsx", "js", "jsx", "py", "go", "java", "rb"]);

  const files = tree.tree
    .filter((f: any) => {
      if (f.type !== "blob") return false;
      const ext = f.path.split(".").pop()?.toLowerCase() || "";
      if (!codeExts.has(ext)) return false;
      if (SKIP_PATTERNS.some((p) => p.test(f.path))) return false;
      if (f.size > 100000) return false;
      return true;
    })
    .slice(0, maxFiles);

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

      const ext = file.path.split(".").pop()?.toLowerCase() || "";
      const lines = content.split("\n");

      for (const rule of SAST_RULES) {
        if (!rule.fileExts.includes(ext)) continue;
        for (let i = 0; i < lines.length; i++) {
          rule.pattern.lastIndex = 0;
          const match = rule.pattern.exec(lines[i]);
          if (match) {
            const snippet = lines[i].trim().substring(0, 80);
            findings.push({
              rule: rule.name,
              severity: rule.severity,
              description: rule.description,
              filePath: file.path,
              lineNumber: i + 1,
              match: snippet,
            });
          }
        }
      }
    } catch {
      // skip
    }
  }

  return findings;
}
