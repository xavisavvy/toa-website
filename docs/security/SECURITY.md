# Security Policy

## Supported Versions

We release patches for security vulnerabilities. The following versions are currently being supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Security Features

This project implements the following security measures:

### Application Security
- ✅ OWASP Top 10 protection
- ✅ Helmet.js security headers
- ✅ Rate limiting
- ✅ Input validation with Zod
- ✅ SQL injection prevention (Drizzle ORM)
- ✅ XSS protection
- ✅ CSRF protection
- ✅ Secure session management

### Container Security
- ✅ Non-root user execution
- ✅ Minimal Alpine base image
- ✅ Multi-stage builds
- ✅ Regular security updates
- ✅ Vulnerability scanning (Trivy)
- ✅ SBOM generation

### CI/CD Security
- ✅ Automated dependency scanning
- ✅ SAST with CodeQL
- ✅ Container image scanning
- ✅ Secret scanning with Gitleaks
- ✅ Security test suite
- ✅ Automated security updates (Dependabot)

## Reporting a Vulnerability

**Please DO NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them responsibly through one of the following methods:

### Option 1: GitHub Security Advisories (Preferred)
1. Go to the repository's [Security tab](../../security)
2. Click "Report a vulnerability"
3. Fill out the advisory form
4. Submit

### Option 2: Email
Send an email to: **security@talesofaneria.com** (or your actual security contact)

Include the following information:
- Type of vulnerability
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the vulnerability
- Any suggested fixes

### What to Expect

- **Acknowledgment**: We will acknowledge receipt within 48 hours
- **Initial Assessment**: We will provide an initial assessment within 5 business days
- **Updates**: You will receive regular updates on our progress
- **Disclosure**: We will coordinate disclosure timing with you
- **Credit**: We will credit you in the security advisory (unless you prefer to remain anonymous)

### Response Timeline

| Phase | Timeline |
|-------|----------|
| Initial Response | Within 48 hours |
| Investigation | 5-10 business days |
| Fix Development | Varies by severity |
| Patch Release | ASAP for critical issues |
| Public Disclosure | 90 days or upon patch release |

## Vulnerability Severity Levels

We use the CVSS (Common Vulnerability Scoring System) to assess severity:

| Severity | CVSS Score | Response Time |
|----------|------------|---------------|
| Critical | 9.0-10.0 | 24 hours |
| High | 7.0-8.9 | 7 days |
| Medium | 4.0-6.9 | 30 days |
| Low | 0.1-3.9 | 90 days |

## Security Update Policy

### Automatic Updates
- **Dependabot**: Automatically creates PRs for dependency updates
- **GitHub Advanced Security**: Alerts for vulnerable dependencies
- **Container Scanning**: Daily scans of Docker images

### Manual Review Required
- Major version updates
- Breaking changes
- Security patches that may affect functionality

## Security Best Practices for Contributors

If you're contributing to this project, please follow these security guidelines:

### Code Security
- Never commit secrets, API keys, or credentials
- Use environment variables for sensitive configuration
- Validate all user inputs
- Use parameterized queries (our ORM handles this)
- Sanitize output to prevent XSS
- Follow the principle of least privilege

### Dependency Management
- Keep dependencies up to date
- Review dependency security advisories
- Use `npm audit` before committing
- Avoid dependencies with known vulnerabilities

### Testing
- Write security tests for sensitive operations
- Test authentication and authorization
- Test input validation
- Test rate limiting

### Pre-commit Checks
Run these commands before committing:
```bash
# Install dependencies
npm ci

# Run security tests
npm run test:security

# Check for secrets
docker run -v $(pwd):/path ghcr.io/gitleaks/gitleaks:latest detect --source=/path -v

# Audit dependencies
npm audit --production
```

## Security Resources

### Internal Documentation
- [Enterprise CI/CD Guide](./ENTERPRISE_CICD_GUIDE.md)
- [Testing Documentation](./TESTING.md)
- [Docker Documentation](./DOCKER.md)

### External Resources
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [npm Security Best Practices](https://docs.npmjs.com/security-best-practices)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)

## Security Contacts

- **Security Team**: security@talesofaneria.com
- **Project Lead**: [GitHub @username]
- **Security Advisories**: [GitHub Security Tab](../../security/advisories)

## Hall of Fame

We appreciate responsible disclosure. Security researchers who report valid vulnerabilities will be listed here (with permission):

*No reports yet*

---

**Last Updated**: 2026-01-01  
**Next Review**: 2026-03-01
