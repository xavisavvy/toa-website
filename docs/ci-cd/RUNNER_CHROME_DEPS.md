# Self-Hosted Runner: Chrome / Playwright System Dependencies

## Why this file exists

Two jobs need a Chromium that actually launches on the runner host:

- **CI Pipeline → Tests & Coverage** (`.github/workflows/ci.yml`) — Playwright
  E2E, contract, and visual-regression suites.
- **Lighthouse CI** (`.github/workflows/lighthouse.yml`) — `lhci autorun`.

Both run directly on a self-hosted `[self-hosted, Linux, X64]` runner, not in a
container, and the runner user has **no passwordless sudo**. That breaks the two
things CI would normally do:

| Normal approach | Why it fails here |
| --- | --- |
| `npx playwright install --with-deps chromium` | `--with-deps` shells out to `sudo apt-get install` → `sudo: a password is required` |
| Let Lighthouse's `chrome-launcher` find Chrome | There is no system Chrome on these hosts to find |

Both jobs now go through the **`.github/actions/setup-chromium`** composite
action, which handles each case without ever needing root.

## What the composite action does

1. Restores the `~/.cache/ms-playwright` and `~/.local/chrome-deps` caches.
2. `npx playwright install chromium` — download only, no `--with-deps`. If
   Playwright has no build for the host's distro, retries pinned to the newest
   LTS build (see [Distro skew](#distro-skew-across-runner-hosts) below).
3. Tries to actually launch the browser (`chrome --version`):
   - **Starts** → the host is properly provisioned. Does nothing;
     `LD_LIBRARY_PATH` is left untouched.
   - **Does not start** → fetches the libraries into `$HOME` and prepends the
     directory to `LD_LIBRARY_PATH` for the rest of the job.
4. Re-tries the launch and fails loudly (`::error::` + non-zero exit) if it
   still will not start.
5. Exports `CHROME_PATH`, resolved at runtime via
   `require('playwright').chromium.executablePath()`.

> **The predicate is "does it launch", not "does `ldd` print `not found`".**
> This matters: when a library on the search path is itself malformed, `ldd`
> exits with an error and prints *no* `not found` lines at all, so grepping its
> output hands a broken install a clean bill of health. An earlier draft of this
> action did exactly that and let a poisoned cache through to a bare
> `exit 127` from the linker. `ldd` is still run, but only to *explain* a
> failure — never to decide whether there is one.
>
> The same launch check doubles as the cache-validity probe, so a partially
> restored or corrupted `~/.local/chrome-deps` re-downloads itself rather than
> poisoning the run.

Resolving `CHROME_PATH` dynamically rather than hardcoding
`~/.cache/ms-playwright/chromium-<rev>/...` means a Playwright version bump —
which changes the `<rev>` directory — cannot silently stale it out.

### The unprivileged fallback

`apt-get install` needs root. `apt-get download` and `dpkg -x` do not — they
never write outside the current directory:

```bash
apt-get download libnspr4 libnss3 libasound2t64 libasound2-data
for f in *.deb; do dpkg -x "$f" "$HOME/.local/chrome-deps/root"; done
export LD_LIBRARY_PATH="$HOME/.local/chrome-deps/root/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH"
```

About 2 MB, and cached between runs. This exists so that **a new runner host
works on day one with zero manual setup** — no job is ever blocked waiting for
someone to type a sudo password.

## Recommended host provisioning (optional but preferred)

The fallback works, but installing the libraries system-wide is tidier: the
`ldd` guard then short-circuits, no `LD_LIBRARY_PATH` is set, and there is no
per-host `~/.local/chrome-deps` tree to think about.

On a stock Ubuntu 24.04 (noble) WSL distro, Chromium's only unmet link-time
dependencies are:

```
libnspr4.so  libnss3.so  libnssutil3.so  libsmime3.so  libasound.so.2
```

Three packages cover all five:

```bash
sudo apt-get update
sudo apt-get install -y libnspr4 libnss3 libasound2t64
```

> On Ubuntu 22.04 and earlier the last package is `libasound2`, not
> `libasound2t64` — the `t64` suffix is noble's 64-bit-`time_t` transition.
>
> `libnssutil3` and `libsmime3` are **not** package names; `libnss3` provides
> all three of those shared objects.

### Verifying

```bash
# should print nothing
ldd "$(node -e "console.log(require('playwright').chromium.executablePath())")" \
  | grep 'not found'

# should print a version banner
"$(node -e "console.log(require('playwright').chromium.executablePath())")" --version
```

## Distro skew across runner hosts

The runner hosts do **not** track the same Ubuntu release, and Playwright ships
a separate browser build per host platform. On a release it has no build for it
refuses outright, before system libraries ever enter the picture:

```
Error: ERROR: Playwright does not support chromium on ubuntu26.04-x64
```

The composite action retries with `PLAYWRIGHT_HOST_PLATFORM_OVERRIDE` pinned to
the newest LTS build (`ubuntu24.04-x64`, or `-arm64` by `uname -m`), which
downloads a build that runs correctly on the newer distro once its system
libraries are present. Playwright prints its own warning when this happens:

```
BEWARE: your OS is not officially supported by Playwright;
downloading fallback build for ubuntu24.04-x64.
```

The override is written to `$GITHUB_ENV` so the rest of the job — `playwright
test` in particular — resolves the same build rather than re-deciding from the
real host platform.

Verified on Alienwarerig (Ubuntu 26.04): plain install refuses, the override
installs, and the resulting binary launches and renders once `LD_LIBRARY_PATH`
carries the user-level libraries.

## Runner hosts

| Host | Distro | Runner names | Path taken |
| --- | --- | --- | --- |
| Shadowsong | WSL2 Ubuntu 24.04 (noble) | `shadowsong-wsl-local`, `-2`, `-3` | native build; user-level libs |
| Alienwarerig | WSL2 Ubuntu 26.04 (resolute) | `Alienwarerig` | LTS fallback build; user-level libs |

Neither host currently has the libraries installed system-wide, so both
exercise the unprivileged fallback. Installing them (above) is still the tidier
end state.

## Known limitation

Dropping `--with-deps` means a future Playwright release that needs a library
outside the set above will not install it automatically. The failure is loud and
self-describing — the composite action's re-check emits a `::error::` with the
launch failure and the exact missing sonames — and the fix is to add the providing
package to the `apt-get download` list in
`.github/actions/setup-chromium/action.yml` (and to the `apt-get install` line
above).

Alternatives considered and rejected:

- **A `NOPASSWD` sudoers rule for `apt-get install`.** Would keep `--with-deps`
  working and self-heal on Playwright bumps, but `NOPASSWD` on
  `apt-get install` is a full root escalation for the runner user in practice —
  it can install any package, including one with a postinst script.
- **Running the jobs in a `mcr.microsoft.com/playwright` container.** Removes
  the host dependency entirely, but reintroduces the root-in-container workspace
  ownership dance (pre-job chmod hook, chown-back step) and would require
  network rework so the job can reach the `docker-compose.test.yml`
  Postgres/Redis services.
