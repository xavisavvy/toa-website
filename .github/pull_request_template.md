## Summary
<!-- What does this PR do? Provide a brief description of the changes -->


## Type of Change
<!-- Check all that apply -->
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Refactoring (no functional changes)
- [ ] Documentation update
- [ ] CI/CD changes
- [ ] Security fix

## Testing
<!-- Describe the tests you ran -->
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated (if applicable)
- [ ] All existing tests pass (`npm run test`)
- [ ] Manual testing completed

## Security Checklist
<!-- Required for code changes -->
- [ ] No secrets, API keys, or credentials in code
- [ ] Input validation added for user inputs (Zod schemas)
- [ ] Rate limiting applied to new endpoints
- [ ] SQL injection prevented (using Drizzle ORM, no raw queries)
- [ ] XSS prevented (React auto-escapes, no dangerouslySetInnerHTML)
- [ ] CSRF protection maintained (existing middleware)
- [ ] Security logging added for sensitive operations

## Database Changes
<!-- If applicable -->
- [ ] N/A - No database changes
- [ ] Migration file generated (`npm run db:generate`)
- [ ] Migration tested locally
- [ ] Rollback plan documented
- [ ] Backward compatible with previous version

## Script Parity
<!-- If applicable -->
- [ ] N/A - No script changes
- [ ] PowerShell and Shell scripts both updated (`.ps1` ↔ `.sh`)

## Documentation
<!-- If applicable -->
- [ ] README updated
- [ ] API documentation updated
- [ ] CLAUDE.md updated (if new patterns introduced)
- [ ] Inline code comments added for complex logic

## Accessibility
<!-- For UI changes -->
- [ ] N/A - No UI changes
- [ ] WCAG 2.1 AA compliance verified
- [ ] Keyboard navigation tested
- [ ] Screen reader tested (or sr-only labels added)
- [ ] Touch targets meet minimum size (24x24px)

## Screenshots/Recordings
<!-- For UI changes, add before/after screenshots -->


## Related Issues
<!-- Link related issues: Fixes #123, Relates to #456 -->


## Deployment Notes
<!-- Any special considerations for deployment -->
- [ ] No special deployment steps required
- [ ] Environment variables added (documented in `.env.example`)
- [ ] Feature flag required for gradual rollout
- [ ] Database migration required before deployment

---

### Reviewer Notes
<!-- Optional: Specific areas you'd like reviewers to focus on -->

