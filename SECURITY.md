# Security Policy

## 🔒 Reporting a Vulnerability

**Please DO NOT report security vulnerabilities through public GitHub issues.**

We take security seriously. If you discover a security vulnerability, please report it responsibly.

### Preferred Method: GitHub Security Advisories

1. Go to the [Security tab](https://github.com/xavisavvy/toa-website/security)
2. Click "Report a vulnerability"
3. Fill out the advisory form with as much detail as possible
4. Submit

### Alternative Method: Email

Send an email to: **security@talesofaneria.com**

**Please include:**
- Type of vulnerability (e.g., XSS, SQL injection, authentication bypass)
- Full paths of affected source file(s)
- Location of affected code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if available)
- Impact assessment
- Suggested fix (if you have one)

## 🕒 Response Timeline

| Phase | Timeline |
|-------|----------|
| **Initial Response** | Within 48 hours |
| **Triage & Assessment** | 5 business days |
| **Fix Development** | Varies by severity |
| **Patch Release** | Per severity SLA |
| **Public Disclosure** | 90 days or upon patch |

We will:
- ✅ Acknowledge receipt within **48 hours**
- ✅ Provide initial assessment within **5 business days**
- ✅ Send regular updates on progress
- ✅ Coordinate disclosure timing with you
- ✅ Credit you in the advisory (unless you prefer anonymity)

## 📊 Vulnerability Severity & SLA

We use [CVSS v3.1](https://www.first.org/cvss/calculator/3.1) to assess severity:

| Severity | CVSS Score | Response SLA | Example |
|----------|------------|--------------|---------|
| **Critical** | 9.0-10.0 | 24 hours | RCE, authentication bypass |
| **High** | 7.0-8.9 | 7 days | SQL injection, XSS with data theft |
| **Medium** | 4.0-6.9 | 30 days | CSRF, information disclosure |
| **Low** | 0.1-3.9 | 90 days | Minor information leak |

## 🛡️ Supported Versions

We actively support security updates for the following versions:

| Version | Supported | End of Life |
|---------|-----------|-------------|
| 1.x.x (Latest) | ✅ Yes | Current |
| < 1.0 | ❌ No | Deprecated |

## 🔐 Security Features

This project implements enterprise-grade security practices:

### Application Security (OWASP Top 10)
- ✅ **A01: Broken Access Control** - Role-based access control (RBAC)
- ✅ **A02: Cryptographic Failures** - bcrypt password hashing, secure session management
- ✅ **A03: Injection** - Drizzle ORM parameterized queries, Zod input validation
- ✅ **A04: Insecure Design** - Threat modeling, security tests
- ✅ **A05: Security Misconfiguration** - Helmet.js headers, secure defaults
- ✅ **A06: Vulnerable Components** - Automated dependency scanning (Snyk, npm audit)
- ✅ **A07: Authentication Failures** - Rate limiting, secure session cookies, brute-force protection
- ✅ **A08: Software Integrity** - SBOM generation, SLSA provenance
- ✅ **A09: Logging Failures** - Comprehensive audit logging, PII sanitization
- ✅ **A10: SSRF** - URL validation, allowlist for external requests

### Infrastructure Security
- ✅ **Container Security**: Non-root user, minimal Alpine base, Trivy scanning
- ✅ **Kubernetes Security**: Network policies, pod security standards, secrets management
- ✅ **TLS/HTTPS**: Enforced in production, HSTS headers
- ✅ **CORS**: Configured allowlist for cross-origin requests
- ✅ **CSP**: Content Security Policy headers

### Development Security
- ✅ **Secret Scanning**: Gitleaks pre-commit hooks
- ✅ **SAST**: ESLint security rules, SonarQube
- ✅ **Dependency Scanning**: Dependabot, Snyk, npm audit
- ✅ **Container Scanning**: Trivy in CI/CD
- ✅ **License Compliance**: Automated license checking
- ✅ **Code Reviews**: Required for all changes
- ✅ **Signed Commits**: Verified commits encouraged

### Runtime Security
- ✅ **Rate Limiting**: Express rate limiter (100 req/15min general, 5 req/15min auth)
- ✅ **Webhook Verification**: HMAC signatures for Stripe and Printful
- ✅ **Audit Logging**: All authentication and data access events logged
- ✅ **Health Checks**: Liveness and readiness probes
- ✅ **Monitoring**: Performance and security metrics

## 🧪 Security Testing

Our security testing includes:

### Automated Testing (CI/CD)
- **Unit Tests**: 816+ tests, 50%+ coverage
- **E2E Tests**: Playwright browser automation
- **Security Tests**: Dedicated security test suite
- **Mutation Testing**: Stryker for test quality
- **Contract Tests**: API contract verification
- **Chaos Tests**: Resilience testing

### Manual Testing
- **Penetration Testing**: Annual third-party assessment (recommended)
- **Code Review**: Mandatory for all PRs
- **Security Checklist**: Pre-deployment verification

### Continuous Monitoring
- **Dependency Scanning**: Daily Dependabot checks
- **Container Scanning**: Trivy on every build
- **Secret Scanning**: Gitleaks on every commit
- **SBOM**: Software Bill of Materials generated per release

## 👥 Security Best Practices for Contributors

### Before Committing
```bash
# Check for secrets in markdown files
npm run check:markdown-secrets

# Check for secrets in all files
npm run check:secrets  # or use gitleaks

# Run security tests
npm run test:security

# Audit dependencies
npm audit --production

# Check license compliance
npm run license:check
```

### Code Guidelines
- **Never commit secrets** - Use `.env.example` as a template
- **Validate all inputs** - Use Zod schemas
- **Sanitize outputs** - Prevent XSS with proper escaping
- **Use parameterized queries** - ORM prevents SQL injection
- **Follow least privilege** - Minimize permissions
- **Secure defaults** - Fail closed, not open
- **Defense in depth** - Multiple security layers
- **Use placeholders in docs** - Never use real keys in markdown files (see [Markdown Secret Prevention](./docs/security/MARKDOWN_SECRET_PREVENTION.md))

### Dependencies
- Keep dependencies up to date
- Review `npm audit` before merging
- Avoid packages with known CVEs
- Prefer well-maintained packages with active communities

## 📚 Security Resources

### Internal Documentation
- [Enterprise CI/CD Guide](./docs/security/ENTERPRISE_CICD_GUIDE.md)
- [Testing Documentation](./docs/TESTING.md)
- [Docker Security](./docs/DOCKER.md)

### External Resources
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [npm Security](https://docs.npmjs.com/security-best-practices)
- [Docker Security](https://docs.docker.com/engine/security/)
- [CWE Top 25](https://cwe.mitre.org/top25/)

## 🏆 Security Hall of Fame

We appreciate responsible disclosure. Security researchers who report valid vulnerabilities will be recognized here (with permission):

| Researcher | Vulnerability | Severity | Date | Status |
|------------|---------------|----------|------|--------|
| *No reports yet* | - | - | - | - |

## 📧 Security Contacts

- **Security Team**: security@talesofaneria.com
- **Security Advisories**: [GitHub Security Tab](https://github.com/xavisavvy/toa-website/security/advisories)
- **Emergency**: For critical vulnerabilities, email with subject: `[URGENT SECURITY]`

## 📜 Disclosure Policy

We follow **Coordinated Vulnerability Disclosure (CVD)**:

1. **Report** → Security researcher reports vulnerability privately
2. **Acknowledge** → We acknowledge within 48 hours
3. **Investigate** → We assess and develop fix
4. **Patch** → We release patched version
5. **Disclose** → Public disclosure after 90 days or upon patch release
6. **Credit** → We credit the researcher (with permission)

### Public Disclosure Timeline
- **Critical/High**: Patch released ASAP, disclosure within 7 days of patch
- **Medium**: Patch within 30 days, disclosure upon release
- **Low**: Patch within 90 days, disclosure upon release

We request researchers:
- ✅ Allow reasonable time to fix the issue
- ✅ Avoid privacy violations or data destruction
- ✅ Avoid degradation of services
- ✅ Do not exploit the vulnerability beyond proof-of-concept
- ✅ Coordinate public disclosure with us

## 🔄 Security Update Policy

### Automatic Updates (via Dependabot)
- Security patches applied automatically for low-risk updates
- Reviewed and merged within 7 days

### Manual Review Required
- Major version updates
- Breaking changes
- Security patches affecting core functionality

### Communication
- **Security Advisories**: Posted on GitHub Security tab
- **Changelog**: Security fixes documented in CHANGELOG.md
- **Release Notes**: Security updates highlighted

## 🛠️ Security Tools We Use

| Category | Tools |
|----------|-------|
| **SAST** | ESLint Security, SonarQube |
| **Dependency Scanning** | Snyk, npm audit, Dependabot |
| **Secret Scanning** | Gitleaks |
| **Container Scanning** | Trivy |
| **License Compliance** | license-checker |
| **Mutation Testing** | Stryker |
| **Fuzzing** | (Planned) |

## 🎯 Security Roadmap

### Current (2026 Q1)
- ✅ OWASP Top 10 protection
- ✅ Automated security scanning
- ✅ Audit logging

### Planned (2026 Q2-Q4)
- 🔄 Web Application Firewall (WAF)
- 🔄 Security Information and Event Management (SIEM)
- 🔄 Automated penetration testing
- 🔄 Bug bounty program

---

**Last Updated**: 2026-01-05  
**Next Review**: 2026-04-05  
**Policy Version**: 1.0.0

For questions about this security policy, contact: security@talesofaneria.com
