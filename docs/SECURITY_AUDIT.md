# Security Audit Status

## Known Moderate Severity Issues

### esbuild <=0.24.2 (GHSA-67mh-4wv8-2f99)

**Status:** Accepted Risk  
**Severity:** Moderate  
**Affected Package:** `@esbuild-kit/esm-loader` (transitive dependency via `drizzle-kit`)

#### Description
The vulnerability allows any website to send requests to the esbuild development server and read the response.

#### Why This Is Acceptable

1. **Development-Only Vulnerability**
   - This vulnerability **only affects development servers**
   - Our production build does not use esbuild as a dev server
   - Production uses pre-built static assets

2. **Isolated Usage**
   - `drizzle-kit` is a **devDependency** used only for database migrations
   - It's not included in the production bundle
   - The vulnerable esbuild version is nested within `@esbuild-kit/esm-loader`

3. **Direct Dependency is Secure**
   - Our direct esbuild dependency is `^0.25.12` (secure version)
   - The vulnerable version is a transitive dependency we can't easily override

4. **Mitigation in Place**
   - Development servers should never be exposed to untrusted networks
   - Our CI/CD environments are isolated
   - Local development is on `localhost` only

#### Resolution Strategy

- Monitor for `drizzle-kit` updates that resolve the transitive dependency
- npm overrides attempted but conflict with package structure
- Set audit level to `high` to prevent CI failures on this moderate issue
- Continue to audit for high/critical vulnerabilities that pose real production risks

#### References

- GitHub Advisory: https://github.com/advisories/GHSA-67mh-4wv8-2f99
- Affects: esbuild <=0.24.2
- Fix Available: Requires breaking change to drizzle-kit@0.18.1
- Decision: Wait for non-breaking drizzle-kit update

---

Last Updated: 2026-01-05  
Next Review: 2026-02-01 (or when drizzle-kit updates)
