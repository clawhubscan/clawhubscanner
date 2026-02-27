// Vercel Serverless Function for security scanning

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Security patterns to detect
const SECURITY_PATTERNS = [
  {
    pattern: /eval\s*\(/gi,
    title: "Unsafe eval() usage",
    severity: "high",
    description: "Using eval() can execute arbitrary code and is a security risk",
    recommendation: "Use safer alternatives like JSON.parse() or Function constructor",
  },
  {
    pattern: /innerHTML\s*=/gi,
    title: "Potential XSS via innerHTML",
    severity: "medium",
    description: "Setting innerHTML directly can lead to Cross-Site Scripting (XSS) attacks",
    recommendation: "Use textContent or sanitize HTML before insertion",
  },
  {
    pattern: /dangerouslySetInnerHTML/gi,
    title: "Dangerous React HTML injection",
    severity: "medium",
    description: "dangerouslySetInnerHTML can lead to XSS if input is not sanitized",
    recommendation: "Ensure all data is properly sanitized before using",
  },
  {
    pattern: /(password|secret|api[_-]?key|token)\s*[:=]\s*['"][^'"]{8,}['"]/gi,
    title: "Potential hardcoded secret",
    severity: "critical",
    description: "Hardcoded credentials or API keys detected in source code",
    recommendation: "Use environment variables or secret management services",
  },
  {
    pattern: /exec\s*\(|spawn\s*\(|execSync/gi,
    title: "Command execution",
    severity: "high",
    description: "Direct command execution can lead to command injection attacks",
    recommendation: "Validate and sanitize all inputs, use parameterized commands",
  },
  {
    pattern: /SQL.*\+.*\$|`.*SELECT.*\$|\$\{.*\}.*WHERE/gi,
    title: "Potential SQL injection",
    severity: "critical",
    description: "String concatenation in SQL queries can lead to SQL injection",
    recommendation: "Use parameterized queries or an ORM",
  },
  {
    pattern: /md5|sha1\s*\(/gi,
    title: "Weak cryptographic algorithm",
    severity: "medium",
    description: "MD5 and SHA1 are considered weak for security purposes",
    recommendation: "Use SHA-256 or bcrypt for password hashing",
  },
  {
    pattern: /cors\s*:\s*\*|Access-Control-Allow-Origin.*\*/gi,
    title: "Permissive CORS configuration",
    severity: "medium",
    description: "Allowing all origins can expose the API to cross-origin attacks",
    recommendation: "Restrict CORS to specific trusted domains",
  },
  {
    pattern: /http:\/\/(?!localhost|127\.0\.0\.1)/gi,
    title: "Non-HTTPS URL",
    severity: "low",
    description: "Using HTTP instead of HTTPS can expose data in transit",
    recommendation: "Use HTTPS for all external communications",
  },
  {
    pattern: /\.env|process\.env\.[A-Z_]+/gi,
    title: "Environment variable usage",
    severity: "info",
    description: "Environment variables detected - ensure .env files are gitignored",
    recommendation: "Verify .gitignore includes .env files",
  },
];

export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { owner, repo, files = [] } = req.body;

  if (!owner || !repo) {
    return res.status(400).json({ error: "Missing owner or repo" });
  }

  const headers = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "DYOR-Code-Analyzer",
  };

  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  }

  try {
    // Filter to code files only
    const codeExtensions = /\.(js|jsx|ts|tsx|py|java|php|rb|go|rs)$/i;
    const codeFiles = files.filter(
      (f) => codeExtensions.test(f.path) || f.path === "package.json"
    );

    // Limit to 20 files
    const filesToScan = codeFiles.slice(0, 20);
    const findings = [];
    let filesScanned = 0;

    // Fetch and scan each file
    for (const file of filesToScan) {
      try {
        const response = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(file.path)}`,
          { headers }
        );

        if (!response.ok) continue;

        const data = await response.json();
        if (!data.content) continue;

        const content = Buffer.from(data.content, "base64").toString("utf-8");
        filesScanned++;

        // Run pattern matching
        const lines = content.split("\n");

        for (const pattern of SECURITY_PATTERNS) {
          // Skip info-level for cleaner results
          if (pattern.severity === "info") continue;

          let match;
          const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);

          while ((match = regex.exec(content)) !== null) {
            // Find line number
            const beforeMatch = content.substring(0, match.index);
            const lineNumber = beforeMatch.split("\n").length;

            // Avoid duplicates
            const isDuplicate = findings.some(
              (f) =>
                f.file === file.path &&
                f.title === pattern.title &&
                Math.abs(f.line - lineNumber) < 5
            );

            if (!isDuplicate) {
              findings.push({
                title: pattern.title,
                severity: pattern.severity,
                description: pattern.description,
                recommendation: pattern.recommendation,
                file: file.path,
                line: lineNumber,
              });
            }

            // Prevent infinite loop
            if (regex.lastIndex === match.index) {
              regex.lastIndex++;
            }
          }
        }
      } catch (e) {
        console.error(`Error scanning ${file.path}:`, e);
      }
    }

    // Sort by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    // Build summary
    const summary = {
      total: findings.length,
      critical: findings.filter((f) => f.severity === "critical").length,
      high: findings.filter((f) => f.severity === "high").length,
      medium: findings.filter((f) => f.severity === "medium").length,
      low: findings.filter((f) => f.severity === "low").length,
      debug: {
        totalFilesProvided: files.length,
        codeFilesFound: codeFiles.length,
        filesSuccessfullyFetched: filesScanned,
      },
    };

    return res.status(200).json({ findings, summary });
  } catch (error) {
    console.error("Scan error:", error);
    return res.status(500).json({ error: error.message });
  }
}
