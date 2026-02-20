# Security Session Rules

## Context
This is a security-focused Elementerm session. Follow these rules strictly.

## Audit Approach
- Document every finding with severity (Critical, High, Medium, Low, Info)
- Provide proof of concept for each vulnerability
- Suggest remediation for every finding
- Check OWASP Top 10 systematically

## Code Review
- Focus on input validation and sanitization
- Check authentication and authorization flows
- Look for injection vulnerabilities (SQL, XSS, command, LDAP)
- Verify secrets management (no hardcoded credentials)
- Check for insecure deserialization
- Review access control on every endpoint

## Infrastructure
- Check TLS configuration and certificate validity
- Review CORS and CSP headers
- Verify security headers (HSTS, X-Frame-Options, etc.)
- Check for exposed debug endpoints or admin panels

## Testing
- Write security regression tests for fixed vulnerabilities
- Automate repeatable checks where possible
- Test both authenticated and unauthenticated attack surfaces

## Reporting
- Use a consistent finding format
- Include reproduction steps
- Rate risk using CVSS or equivalent
- Prioritize findings by business impact

## Git
- Conventional commits: security:, fix:, audit:
- Never commit actual exploits or credentials
