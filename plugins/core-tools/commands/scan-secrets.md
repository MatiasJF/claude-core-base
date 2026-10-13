# Scan for Hardcoded Secrets

Scan the current directory for hardcoded API keys, passwords, RSA keys, credentials, and other secrets.

## Instructions

You are a security scanner. Thoroughly scan the specified directory for any hardcoded secrets, credentials, or sensitive data.

### Patterns to Search For

**1. API Keys & Tokens**
```
- AWS: AKIA[0-9A-Z]{16}
- AWS Secret: [0-9a-zA-Z/+]{40}
- GitHub: ghp_[0-9a-zA-Z]{36}, github_pat_[0-9a-zA-Z_]{22,}
- GitLab: glpat-[0-9a-zA-Z\-]{20}
- Stripe: sk_live_[0-9a-zA-Z]{24}, sk_test_[0-9a-zA-Z]{24}
- Stripe Publishable: pk_live_[0-9a-zA-Z]{24}, pk_test_[0-9a-zA-Z]{24}
- Slack: xox[baprs]-[0-9a-zA-Z-]{10,}
- Discord: [MN][A-Za-z\d]{23,}\.[\w-]{6}\.[\w-]{27}
- Twilio: SK[0-9a-fA-F]{32}
- SendGrid: SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}
- Mailgun: key-[0-9a-zA-Z]{32}
- Google API: AIza[0-9A-Za-z\-_]{35}
- Firebase: AAAA[A-Za-z0-9_-]{7}:[A-Za-z0-9_-]{140}
- Heroku: [0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}
- npm: npm_[0-9a-zA-Z]{36}
- NuGet: oy2[0-9a-z]{43}
- PyPI: pypi-[0-9a-zA-Z_-]{32,}
- Generic API Key: api[_-]?key.*[=:]["'][0-9a-zA-Z]{16,}
```

**2. Private Keys & Certificates**
```
- RSA Private: -----BEGIN RSA PRIVATE KEY-----
- OpenSSH Private: -----BEGIN OPENSSH PRIVATE KEY-----
- EC Private: -----BEGIN EC PRIVATE KEY-----
- PGP Private: -----BEGIN PGP PRIVATE KEY BLOCK-----
- Generic Private: -----BEGIN PRIVATE KEY-----
- Encrypted Private: -----BEGIN ENCRYPTED PRIVATE KEY-----
- DSA Private: -----BEGIN DSA PRIVATE KEY-----
```

**3. Passwords & Secrets**
```
- password.*[=:].*["'][^"']{4,}
- passwd.*[=:].*["'][^"']{4,}
- pwd.*[=:].*["'][^"']{4,}
- secret.*[=:].*["'][^"']{4,}
- credential.*[=:].*["'][^"']{4,}
- auth.*token.*[=:].*["'][^"']{8,}
```

**4. Database Connection Strings**
```
- mongodb(\+srv)?://[^:]+:[^@]+@
- postgres(ql)?://[^:]+:[^@]+@
- mysql://[^:]+:[^@]+@
- redis://:[^@]+@
- jdbc:[a-z]+://.*password=
```

**5. Blockchain/Crypto**
```
- Ethereum Private Key: 0x[a-fA-F0-9]{64}
- Mnemonic Phrases: (abandon|abstract|absurd)(\s+\w+){11,23}
- Bitcoin WIF: [5KL][1-9A-HJ-NP-Za-km-z]{50,51}
```

**6. OAuth & JWT**
```
- Bearer tokens: bearer\s+[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+
- OAuth secrets: client[_-]?secret.*[=:].*["'][0-9a-zA-Z]{16,}
- JWT: eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*
```

**7. Cloud Provider Credentials**
```
- Azure: [a-zA-Z0-9+/]{86}==
- GCP Service Account: "type"\s*:\s*"service_account"
- DigitalOcean: dop_v1_[a-f0-9]{64}
- Cloudflare: [a-z0-9]{37}
```

### Files to Check

- Source code: `*.py`, `*.js`, `*.ts`, `*.java`, `*.cs`, `*.go`, `*.rb`, `*.php`, `*.rs`, `*.sol`
- Config files: `*.json`, `*.yaml`, `*.yml`, `*.xml`, `*.toml`, `*.ini`, `*.cfg`, `*.conf`
- Environment files: `.env*`, `*.env`, `.envrc`
- Shell scripts: `*.sh`, `*.bash`, `*.zsh`
- Docker: `Dockerfile*`, `docker-compose*`
- CI/CD: `.github/workflows/*`, `.gitlab-ci.yml`, `Jenkinsfile`, `.travis.yml`

### Exclusions (Skip These)

- `node_modules/`, `.venv/`, `venv/`, `__pycache__/`
- `.git/` directory
- Binary files
- Lock files (`package-lock.json`, `yarn.lock`, `Cargo.lock`)
- Test fixtures with known test vectors (e.g., BIP-39 "abandon" mnemonic)
- Documentation examples with clear placeholders

### Output Format

Generate a report with:

```
## Secrets Scan Report

**Directory:** /path/to/scanned
**Date:** YYYY-MM-DD HH:MM
**Files Scanned:** XXX
**Issues Found:** XXX

### 🔴 Critical (Confirmed Secrets)
| File | Line | Type | Preview |
|------|------|------|---------|
| path/to/file.py | 42 | AWS Key | AKIA...XXXX |

### 🟡 Warning (Potential Secrets)
| File | Line | Type | Preview |
|------|------|------|---------|
| path/to/config.json | 15 | Password Pattern | password = "****" |

### 🟢 Safe (Known Test Data)
- BIP-39 test vectors in test files
- Placeholder values (YOUR_API_KEY, etc.)

### Recommendations
1. Move secrets to environment variables
2. Use a secrets manager (Vault, AWS Secrets Manager)
3. Add patterns to .gitignore
4. Consider using git-secrets or gitleaks
```

### Execution

Run comprehensive grep searches for all patterns, then compile results into a clear report showing:
1. File path
2. Line number
3. Type of secret
4. Masked preview (show first/last 4 chars only)
5. Severity assessment
