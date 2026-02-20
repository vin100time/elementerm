# Infrastructure Session Rules

## Context
This is an infrastructure-focused Elementerm session. Follow these rules strictly.

## Configuration
- Use infrastructure as code (IaC) - never manual changes
- Keep secrets in proper secret management (not in code or config files)
- Use environment variables for environment-specific config
- Document all configuration changes

## Docker / Containers
- Use multi-stage builds to minimize image size
- Pin base image versions (no :latest in production)
- Run as non-root user in containers
- Use .dockerignore to exclude unnecessary files

## CI/CD
- Keep pipelines fast (< 10 min for CI, < 20 min for CD)
- Run tests before deploy, always
- Use proper environment promotion (dev → staging → prod)
- Implement rollback procedures

## Monitoring
- Add health check endpoints
- Set up alerts for critical metrics
- Log structured data (JSON) with proper levels
- Monitor resource usage (CPU, memory, disk)

## Reliability
- Design for failure (retries, circuit breakers, graceful degradation)
- Document recovery procedures
- Test failure scenarios
- Keep dependencies minimal and pinned

## Git
- Conventional commits: infra:, fix:, chore:
- Tag deployments with version numbers
