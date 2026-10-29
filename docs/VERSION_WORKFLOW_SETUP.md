# Release Workflow Setup

Releases are cut by [release-please](https://github.com/googleapis/release-please)
through a pull request. Nothing pushes directly to `main`.

**Workflow:** `.github/workflows/release.yml`
**Config:** `release-please-config.json`, `.release-please-manifest.json`

## How a release happens

1. A Conventional Commit (`feat:`, `fix:`, `perf:` …) lands on `main`.
2. The **Release** workflow runs release-please, which opens or updates a single
   PR titled `chore(release): x.y.z`. The PR bumps `package.json`,
   `package-lock.json` and `.release-please-manifest.json`, and adds the new
   section to `CHANGELOG.md`.
3. The release PR goes through the same required checks and code-owner review
   as any other PR. Leave it open to batch more changes into the release; it
   updates itself on every push to `main`.
4. When the release PR is merged, the next Release run creates the `vX.Y.Z` tag
   on that merge commit and publishes a GitHub Release. The `release: published`
   event then runs `sbom.yml`, which attaches the SBOM files to the release.

Version bumps follow Conventional Commits: `fix:` → patch, `feat:` → minor,
`feat!:` or a `BREAKING CHANGE:` footer → major. To force a version, add a
commit with `Release-As: x.y.z` in its body.

## Safeguards

- **The tag only exists after the commit is on `main`.** release-please creates
  the tag from the merged release PR, so a rejected push can no longer leave a
  tag behind (what happened to `v2.3.0`: the old workflow pushed the tag, then
  the ruleset rejected the release commit).
- **Verify latest tag is on main** (second job in `release.yml`) fails if the
  newest `v*` tag is not an ancestor of `main`, or does not equal
  `v<package.json version>`.

## One-time setup

### `GH_PAT` secret

A PR opened with the default `GITHUB_TOKEN` does not trigger other workflows, so
CI would never run on the release PR and its required checks would stay pending.
The workflow therefore uses `secrets.GH_PAT` when it is set.

Create a fine-grained personal access token:

- **Repository access:** only `xavisavvy/toa-website`
- **Permissions:** Contents: Read and write; Pull requests: Read and write
- Save it as the repository secret **`GH_PAT`**
  (Settings → Secrets and variables → Actions)

Without `GH_PAT`, the workflow falls back to `GITHUB_TOKEN`. That also needs
Settings → Actions → General → "Allow GitHub Actions to create and approve pull
requests" enabled, and the release PR's checks will not start on their own.

### Remove a tag that is not on `main`

If **Verify latest tag is on main** fails because a tag points outside `main`,
delete it so release-please can recreate it on the real release commit:

```bash
git push origin --delete v2.3.0
```

```bash
git tag -d v2.3.0
```
