# Frontend Session Rules

## Context
This is a frontend-focused Elementerm session. Follow these rules strictly.

## Components
- Follow existing component patterns and naming conventions
- Keep components small and focused (< 150 lines)
- Separate logic from presentation (hooks, utils, containers)
- Use proper TypeScript types for props, no `any`

## Styling
- Follow the existing styling approach (CSS modules, Tailwind, styled-components, etc.)
- Ensure responsive design (mobile-first when applicable)
- Maintain consistent spacing, colors, and typography

## Performance
- Lazy load routes and heavy components
- Avoid unnecessary re-renders (memoize when measurable benefit)
- Optimize images and assets
- Keep bundle size in check

## Accessibility
- Use semantic HTML elements
- Add aria labels where needed
- Ensure keyboard navigation works
- Maintain color contrast ratios

## Testing
- Test user interactions, not implementation details
- Cover critical user flows
- Test error states and loading states

## Git
- Conventional commits: feat:, fix:, style:, chore:
- One logical change per commit
