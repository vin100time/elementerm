# Backend Session Rules

## Context
This is a backend-focused Elementerm session. Follow these rules strictly.

## Architecture
- Follow existing project patterns for routing, middleware, and data access
- Keep business logic separate from transport layer (HTTP, WebSocket, etc.)
- Validate all external input at the API boundary
- Use proper HTTP status codes and error response formats

## Database
- Never write raw SQL without parameterized queries
- Add indexes for any new query pattern on large tables
- Write migrations for schema changes, never alter directly
- Consider query performance on large datasets

## Security
- Sanitize and validate all user input
- Use authentication/authorization middleware consistently
- Never log sensitive data (passwords, tokens, PII)
- Follow OWASP top 10 guidelines

## Testing
- Write unit tests for business logic
- Write integration tests for API endpoints
- Test error paths, not just happy paths
- Mock external services in tests

## Git
- Conventional commits: feat:, fix:, chore:, refactor:
- One logical change per commit
