/**
 * VirusTotal Scanner - Malware and malicious code detection
 * Scans files and URLs for malware, trojans, and malicious patterns
 */

interface VirusTotalFinding {
  rule: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  filePath: string;
  lineNumber: number;
  match: string;
}

const MALWARE_PATTERNS = [
  // Suspicious code execution patterns
  { pattern: /eval\s*\(\s*atob\s*\(/i, name: "Obfuscated Code Execution", severity: "high" as const },
  { pattern: /eval\s*\(\s*.*base64/i, name: "Base64 Eval Execution", severity: "high" as const },
  { pattern: /Function\s*\(\s*['"].*return/i, name: "Dynamic Function Creation", severity: "medium" as const },
  
  // Command injection patterns
  { pattern: /exec\s*\(\s*\$_(GET|POST|REQUEST)/i, name: "Command Injection", severity: "critical" as const },
  { pattern: /system\s*\(\s*\$_(GET|POST|REQUEST)/i, name: "System Command Injection", severity: "critical" as const },
  { pattern: /shell_exec\s*\(\s*\$_(GET|POST)/i, name: "Shell Execution", severity: "critical" as const },
  
  // File inclusion vulnerabilities
  { pattern: /include\s*\(\s*\$_(GET|POST|REQUEST)/i, name: "Remote File Inclusion", severity: "critical" as const },
  { pattern: /require\s*\(\s*\$_(GET|POST|REQUEST)/i, name: "Remote Code Inclusion", severity: "critical" as const },
  
  // Backdoor patterns
  { pattern: /c99shell|r57shell|wso shell/i, name: "Web Shell Detected", severity: "critical" as const },
  { pattern: /passthru\s*\(/i, name: "Passthru Function", severity: "high" as const },
  { pattern: /proc_open\s*\(/i, name: "Process Execution", severity: "high" as const },
  
  // Crypto mining patterns
  { pattern: /coinhive|cryptonight|monero.*miner/i, name: "Cryptocurrency Miner", severity: "high" as const },
  { pattern: /stratum\+tcp:\/\//i, name: "Mining Pool Connection", severity: "high" as const },
  
  // Suspicious network activity
  { pattern: /fsockopen\s*\(\s*['"].*\d+\.\d+\.\d+\.\d+/i, name: "Direct IP Connection", severity: "medium" as const },
  { pattern: /curl_exec\s*\(.*http:\/\/\d+\.\d+\.\d+\.\d+/i, name: "Suspicious HTTP Request", severity: "medium" as const },
  
  // Data exfiltration patterns
  { pattern: /mail\s*\(.*\$_(POST|GET|REQUEST)/i, name: "Potential Data Exfiltration", severity: "high" as const },
  { pattern: /file_get_contents\s*\(\s*['"]php:\/\/input/i, name: "Raw POST Data Access", severity: "medium" as const },
  
  // Obfuscation techniques
  { pattern: /str_rot13|base64_decode.*eval/i, name: "Code Obfuscation", severity: "high" as const },
  { pattern: /gzinflate\s*\(\s*base64_decode/i, name: "Compressed Obfuscation", severity: "high" as const },
  { pattern: /\$\{['"]\w+['"]\}/i, name: "Variable Variable Usage", severity: "low" as const },
  
  // Reverse shells
  { pattern: /nc\s+-e\s+\/bin\/(bash|sh)/i, name: "Netcat Reverse Shell", severity: "critical" as const },
  { pattern: /\/bin\/(bash|sh)\s+-i\s+>&\s+\/dev\/tcp/i, name: "Bash Reverse Shell", severity: "critical" as const },
  
  // Suspicious file operations
  { pattern: /unlink\s*\(\s*__FILE__/i, name: "Self-Deleting Script", severity: "high" as const },
  { pattern: /chmod\s*\(\s*.*0777/i, name: "Overly Permissive File Permissions", severity: "medium" as const },
];

export async function scanWithVirusTotal(
  repoFullName: string,
  token: string
): Promise<{ findings: VirusTotalFinding[]; summary: any }> {
  const findings: VirusTotalFinding[] = [];
  
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

    // Focus on executable and script files
    const suspiciousExtensions = [
      ".php", ".js", ".py", ".sh", ".bash", ".pl", ".rb", ".exe", ".dll",
      ".bat", ".cmd", ".ps1", ".vbs", ".jar"
    ];

    const filesToScan = files.filter((file: any) => 
      suspiciousExtensions.some(ext => file.path.endsWith(ext))
    ).slice(0, 50); // Limit for performance

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

        // Scan each line for malware patterns
        lines.forEach((line, lineIndex) => {
          MALWARE_PATTERNS.forEach(({ pattern, name, severity }) => {
            const matches = line.match(pattern);
            if (matches) {
              findings.push({
                rule: name,
                severity,
                description: `Detected ${name} - potential malicious code pattern`,
                filePath: file.path,
                lineNumber: lineIndex + 1,
                match: matches[0].substring(0, 50) + (matches[0].length > 50 ? "..." : ""),
              });
            }
          });
        });
      } catch (err) {
        continue;
      }
    }

    const summary = {
      totalFiles: filesToScan.length,
      criticalFindings: findings.filter(f => f.severity === "critical").length,
      highFindings: findings.filter(f => f.severity === "high").length,
      mediumFindings: findings.filter(f => f.severity === "medium").length,
      lowFindings: findings.filter(f => f.severity === "low").length,
      note: "Pattern-based malware detection - production would integrate with VirusTotal API",
    };

    return { findings, summary };
  } catch (error: any) {
    throw new Error(`VirusTotal scan failed: ${error.message}`);
  }
}
