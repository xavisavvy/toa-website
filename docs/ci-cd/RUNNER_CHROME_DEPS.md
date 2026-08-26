# Self-Hosted Runner: Chrome / Playwright System Dependencies

## Why this file exists

Two jobs need a working Chromium on the runner host:

- **CI Pipeline → Tests & Coverage** (`.github/workflows/ci.yml`) — Playwright E2E,
  contract, and visual-regression suites.
- **Lighthouse CI** (`.github/workflows/lighthouse.yml`) — `lhci autorun`.

Both run directly on a self-hosted `[self-hosted, Linux, X64]` runner, not in a
container. The runner user has **no passwordless sudo**, so the usual
`npx playwright install --with-deps chromium` cannot work — the `--with-deps`
flag shells out to `sudo apt-get install` and dies with:

```
sudo: a password is required
```

The workflows therefore run `npx playwright install chromium` (download only),
and the handful of system shared libraries Chromium links against are installed
**once, by hand, on each runner host**.

## Host prerequisite (one-time, per runner host)

Chromium's only unmet link-time dependencies on a stock Ubuntu 24.04 (noble) WSL
distro are:

```
libnspr4.so  libnss3.so  libnssutil3.so  libsmime3.so  libasound.so.2
```

Three packages cover all five:

```bash
sudo apt-get update
sudo apt-get install -y libnspr4 libnss3 libasound2t64
```

> On Ubuntu 22.04 and earlier the last package is `libasound2`, not
> `libasound2t64` — the `t64` suffix is noble's 64-bit-time_t transition.

### Verifying

```bash
# should print nothing
ldd "$(node -e "console.log(require('playwright').chromium.executablePath())")" \
  | grep 'not found'

# should print a version banner
"$(node -e "console.log(require('playwright').chromium.executablePath())")" --version
```

## Hosts currently covered

| Host | Distro | Runner names |
| --- | --- | --- |
| Shadowsong | WSL2 Ubuntu 24.04 | `shadowsong-wsl-local`, `-2`, `-3` |
| Alienwarerig | WSL2 Ubuntu 24.04 | `Alienwarerig` |

Any **new** runner host added to this repo needs the same one-time install
before the Tests & Coverage or Lighthouse jobs will pass on it.

## How Lighthouse finds Chrome

There is no system Chrome on these hosts, so `chrome-launcher` — which
Lighthouse uses to spawn the browser — has nothing to auto-detect. The
Lighthouse workflow installs the same Playwright Chromium and resolves its path
at runtime:

```bash
CHROME_PATH="$(node -e "console.log(require('playwright').chromium.executablePath())")"
```

Resolving it dynamically rather than hardcoding
`~/.cache/ms-playwright/chromium-<rev>/...` means a Playwright version bump —
which changes the `<rev>` directory — cannot silently stale the path out.

## Known limitation

Dropping `--with-deps` means a future Playwright release that introduces a *new*
system library requirement will fail at browser launch rather than installing
the library itself. The failure is loud and self-describing (`error while
loading shared libraries: <lib>: cannot open shared object file`); the fix is to
`apt-get install` the providing package on each host and add it to the list
above.

The alternatives considered and rejected:

- **A `NOPASSWD` sudoers rule for `apt-get install`.** Keeps `--with-deps`
  working and self-heals on Playwright bumps, but `NOPASSWD` on
  `apt-get install` is a full root escalation for the runner user in practice —
  it can install any package, including one with a postinst script.
- **Running the jobs in a `mcr.microsoft.com/playwright` container.** Removes
  the host dependency entirely, but reintroduces the root-in-container workspace
  ownership dance (pre-job chmod hook, chown-back step) and would require
  network rework so the job can reach the `docker-compose.test.yml`
  Postgres/Redis services.
