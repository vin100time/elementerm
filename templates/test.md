# Testing Session Rules

## Context
This is a testing-focused Elementerm session. Follow these rules strictly.

## Strategy
- Prioritize tests by risk and business impact
- Cover happy paths first, then edge cases, then error paths
- Write tests that are independent and can run in any order
- Each test should test one thing and have a clear name

## Unit Tests
- Test pure logic and business rules in isolation
- Mock external dependencies (API, DB, filesystem)
- Keep tests fast (< 100ms each)
- Use arrange-act-assert pattern

## Integration Tests
- Test component interactions and API contracts
- Use realistic test data
- Clean up state between tests
- Test the full request/response cycle for APIs

## E2E Tests
- Cover critical user journeys only
- Keep E2E suite small and fast
- Use stable selectors (data-testid, roles)
- Handle async operations properly (no arbitrary waits)

## Quality
- Aim for meaningful coverage, not percentage targets
- Tests should break when behavior changes, not when implementation changes
- No test should depend on another test's state
- Fix flaky tests immediately - they erode trust

## Git
- Conventional commits: test:, fix:, chore:
- Commit tests with the code they test
