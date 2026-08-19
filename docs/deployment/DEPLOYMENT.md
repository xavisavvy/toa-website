# Deployment Guide

**Platform:** AWS Lightsail VPS (shared, multi-tenant)
**Production URL:** https://talesofaneria.com
**Last Updated:** 2026-08-18

This guide describes how Tales of Aneria is actually deployed. It replaced an
earlier Replit setup; see [Migration from Replit](#migration-from-replit) at the
bottom for what changed and what to clean up on the Replit side.

---

## Where it runs

Tales of Aneria is one of four sites sharing a single 1GB / 1vCPU AWS Lightsail
instance:

| Site                  | Directory              | Container          | Internal port |
| --------------------- | ---------------------- | ------------------ | ------------- |
| scrummonsters.com     | `/opt/scrummonsters`   | `app-blue/green`   | 5000          |
| familytokens.app      | `/opt/familytokens`    | `familytokens-app` | 5001          |
| **talesofaneria.com** | **`/opt/toa-website`** | **`toa-app`**      | **5002**      |
| prestonfarr.com       | `~/prestonfarr`        | `prestonfarr`      | 3000          |

```
                    Internet
                       |  :80 / :443
                       v
        +------------------------------+
        |  Nginx Proxy Manager         |  TLS termination, Let's Encrypt
        |  (scrummonsters-nginx-...)   |  routes by Host header
        +--------------+---------------+
                       |  docker network: scrummonsters_default
       +---------------+----------------+------------------+
       v               v                v                  v
   toa-app:5002   app-blue:5000   familytokens-app   prestonfarr:3000
       |
       +----------> scrummonsters-postgres-1:5432
                    (PostgreSQL 17, one database per tenant)
```

Nothing publishes ports to the host except Nginx Proxy Manager. Containers reach
each other by container name over the shared `scrummonsters_default` network.

### Constraints worth knowing

The box has **914MB RAM and one vCPU**, with roughly 250MB free at idle.

- **Never build on the VPS.** `npm run build` peaks near 768MB and pins load
  average above 10 for 15-30 minutes; SSH becomes unusable. Images are built in
  GitHub Actions and pulled.
- `toa-app` is capped at `mem_limit: 256m`, in line with the other tenants.
- There is no dedicated Redis. `server/rate-limiter.ts` falls back to an
  in-memory store when `REDIS_URL` is unset, which is the right trade at this
  size.

---

## Database

toa-website does **not** run its own PostgreSQL container. It uses the
PostgreSQL 17 instance already on the box (`scrummonsters-postgres-1`), with its
own role and database so tenant data stays separated:

- Database `toa_website`, owned by role `toa`
- `CONNECT` on the neighbouring `scrummonsters` database is revoked from
  `PUBLIC`, so the `toa` role cannot reach it
- `DATABASE_URL` points at `scrummonsters-postgres-1:5432` over the docker
  network - the port is not exposed to the host or the internet

Verify the isolation at any time (run on the VPS; expect success on the first
command and "permission denied" on the second):

```bash
PW=$(grep '^DATABASE_URL=' /opt/toa-website/.env.production | sed -E 's#.*://toa:([^@]+)@.*#\1#')
docker exec -e PGPASSWORD="$PW" scrummonsters-postgres-1 \
  psql -h 127.0.0.1 -U toa -d toa_website -tAc "select current_database();"
docker exec -e PGPASSWORD="$PW" scrummonsters-postgres-1 \
  psql -h 127.0.0.1 -U toa -d scrummonsters -tAc "select 1;"
```

### Migrations

Migrations are versioned in `migrations/` and applied with `drizzle-kit migrate`.
`drizzle-kit` is a **runtime** dependency precisely so it can run from the
production image, and `migrations/` plus `shared/` are baked into that image.

The deploy workflow applies them in a throwaway container off the *new* image
**before** the live container is replaced, so a failed migration aborts the
deploy with the old container still serving traffic:

```bash
docker compose -f docker-compose.prod.yml run --rm --no-deps \
  --entrypoint ./node_modules/.bin/drizzle-kit app migrate
```

To add a migration, change `shared/schema.ts`, run `npm run db:generate`
locally, then commit the generated SQL and journal. Do not use `npm run db:push`
against production - it applies schema diffs without a journal.

---

## Deploy pipeline

```
push to main
    |
    v
docker-build.yml --> builds image, pushes ghcr.io/xavisavvy/toa-website
    |                tags: latest + sha-<commit>
    v  (workflow_run: completed & success)
deploy.yml
    |- git reset --hard origin/main      (refresh compose file on the VPS)
    |- docker compose pull app
    |- drizzle-kit migrate               (aborts deploy on failure)
    |- docker compose up -d --force-recreate app
    |- health check from inside the container
    +- smoke test against https://talesofaneria.com
```

### Required GitHub configuration

**Secrets** (Settings -> Secrets and variables -> Actions -> Secrets):

| Secret            | Purpose                                |
| ----------------- | -------------------------------------- |
| `SSH_PRIVATE_KEY` | Deploy key for `ubuntu@34.199.135.244` |

**Variables** (same page -> Variables). These are `VITE_*` values that Vite
inlines into the client bundle **at image build time**. Setting them in
`.env.production` on the VPS has no effect - the bundle is already compiled.
They are all public values, which is why they are variables and not secrets:

| Variable                         |
| -------------------------------- |
| `VITE_YOUTUBE_PLAYLIST_IDS`      |
| `VITE_YOUTUBE_CHANNEL_ID`        |
| `VITE_PODCAST_FEED_URL`          |
| `VITE_PODCAST_SPOTIFY_URL`       |
| `VITE_PODCAST_APPLE_URL`         |
| `VITE_PODCAST_YOUTUBE_MUSIC_URL` |
| `VITE_STRIPE_DONATION_URL`       |
| `VITE_GA_MEASUREMENT_ID`         |

### Manual deploy and rollback

Every commit gets an immutable `sha-<full-sha>` image tag. To redeploy or roll
back, dispatch the Deploy workflow with that tag:

```bash
gh workflow run deploy.yml -f image_tag=sha-<full-sha>
# or, for the current latest:
gh workflow run deploy.yml
```

The tag flows into `docker-compose.prod.yml` through `TOA_IMAGE_TAG`. Note that
compose reads it from the **shell environment** - `env_file:` does not feed
compose's `${...}` interpolation.

Straight from the VPS:

```bash
cd /opt/toa-website
TOA_IMAGE_TAG=sha-<full-sha> docker compose -f docker-compose.prod.yml up -d --force-recreate app
```

Rolling back a schema change needs a forward migration; there is no
down-migration path.

---

## Server-side environment

Runtime configuration lives in `/opt/toa-website/.env.production` (mode 600,
never committed). `docker-compose.prod.yml` loads it via `env_file:`.

```bash
NODE_ENV=production
PORT=5002
DATABASE_URL=postgresql://toa:...@scrummonsters-postgres-1:5432/toa_website
SESSION_SECRET=...
ALLOWED_ORIGINS=https://talesofaneria.com,https://www.talesofaneria.com
BASE_URL=https://talesofaneria.com

YOUTUBE_API_KEY=...
PRINTFUL_API_KEY=...
PRINTFUL_WEBHOOK_SECRET=...

# server/env-validator.ts requires these three together, or all three empty
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_SUCCESS_URL=/checkout/success
STRIPE_CANCEL_URL=/checkout/cancel

AWS_SES_REGION=us-east-1
AWS_SES_ACCESS_KEY_ID=...
AWS_SES_SECRET_ACCESS_KEY=...
AWS_SES_FROM_EMAIL=noreply@talesofaneria.com

BUSINESS_NAME=Tales of Aneria
SUPPORT_EMAIL=TalesOfAneria@gmail.com
ADMIN_EMAIL=TalesOfAneria@gmail.com
```

After editing it, restart the container - env vars are read at process start:

```bash
cd /opt/toa-website && docker compose -f docker-compose.prod.yml up -d --force-recreate app
```

See `.env.example` for the full annotated list.

---

## TLS and routing

Nginx Proxy Manager owns 80/443 and holds the Let's Encrypt certificates for all
tenants. The proxy host for this site forwards `talesofaneria.com` and
`www.talesofaneria.com` to `toa-app:5002`, with Force SSL, HTTP/2 and HSTS on.

Certificates renew automatically inside NPM. To inspect or change routing,
tunnel to the admin UI rather than exposing port 81:

```bash
ssh -i ~/.ssh/lightsail_scrummonsters -L 8181:localhost:81 -N ubuntu@34.199.135.244
# then open http://localhost:8181
```

**Do not edit the other tenants' proxy hosts.** They share this NPM instance.

### Webhook endpoints

Both providers must point at the production domain:

| Provider | Endpoint                                        |
| -------- | ----------------------------------------------- |
| Stripe   | `https://talesofaneria.com/api/stripe/webhook`   |
| Printful | `https://talesofaneria.com/api/webhooks/printful` |

Stripe events to subscribe: `checkout.session.completed`,
`checkout.session.async_payment_succeeded`,
`checkout.session.async_payment_failed`. The signing secret from the Stripe
dashboard goes into `STRIPE_WEBHOOK_SECRET`.

---

## Operations

```bash
ssh -i ~/.ssh/lightsail_scrummonsters ubuntu@34.199.135.244
cd /opt/toa-website

docker compose -f docker-compose.prod.yml ps           # status
docker compose -f docker-compose.prod.yml logs -f app  # tail logs
docker exec toa-app curl -sf localhost:5002/api/health # health from inside
docker stats --no-stream                               # memory across tenants
free -m                                                # host headroom
```

Health from outside, which also proves NPM is routing correctly:

```bash
curl -fsS https://talesofaneria.com/api/health
```

### Troubleshooting

**502 from NPM.** The container is down or not on the shared network. Check
`docker compose ps`, then confirm `docker inspect toa-app` lists
`scrummonsters_default`.

**Container restart loop.** Usually a bad `DATABASE_URL` or a missing required
env var. `docker compose logs app` shows the validation output from
`server/env-validator.ts`.

**`WARN: variable is not set` during compose commands.** Compose interpolation
reads the shell environment, not `env_file:`. Export `TOA_IMAGE_TAG` or accept
the `latest` default.

**Deploy times out pulling the image.** The box swaps under memory pressure and
a large pull can take several minutes; `command_timeout` in `deploy.yml` is set
to 25m for this reason. Check `free -m` and `df -h /`.

**Host is out of memory.** `docker image prune -f` first - old image layers are
the usual culprit. The deploy workflow prunes on success.

---

## Pre-deployment checklist

- [ ] `npm test` passes
- [ ] `npm run check` passes (TypeScript)
- [ ] `npm run build` succeeds
- [ ] New schema changes have a generated migration committed in `migrations/`
- [ ] Any new `VITE_*` var added as a GitHub repo *variable* and to
      `docker-build.yml` build args - it will not work from `.env.production`
- [ ] Any new server env var added to `.env.example` and to
      `/opt/toa-website/.env.production`
- [ ] `CHANGELOG.md` updated

---

## Migration from Replit

The site previously ran on Replit autoscale deployments, triggered by a webhook
from `deploy.yml`. That path is gone:

- `.replit` removed
- `REPLIT_DEPLOYMENT.md` and `REPLIT_DEPLOY_CHECKLIST.md` are retained for
  historical reference only and marked deprecated
- The `REPLIT_DEPLOY_WEBHOOK` / `STAGING_DEPLOY_WEBHOOK` steps and the
  staging/production split in `deploy.yml` were replaced by the single Lightsail
  environment described above

Once traffic is confirmed on the VPS, the `REPLIT_DEPLOY_WEBHOOK`,
`STAGING_DEPLOY_WEBHOOK`, `STAGING_URL` and `PRODUCTION_URL` GitHub secrets can
be deleted, and the Replit deployment itself shut down.

---

## Related documentation

- [DOCKER.md](./DOCKER.md) - image internals and local Docker workflow
- [HEALTH_CHECK_GUIDE.md](./HEALTH_CHECK_GUIDE.md) - what `/api/health` reports
- `~/.claude/infrastructure.md` - VPS inventory (not in this repo)
