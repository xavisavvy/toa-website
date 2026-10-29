# CI/CD Database Strategy

The **Tests & Coverage** job in `.github/workflows/ci.yml` runs against a real
PostgreSQL and Redis, started with Docker Compose from `docker-compose.test.yml`.
The same file is used for local E2E testing.

## How it works in CI

The CI runners are self-hosted (`[self-hosted, Linux, X64]`) and share one
Docker host, so several test jobs can be running at once. Each run gets its own
isolated stack:

1. **Pick test service ports.** A step asks the OS for two free ports and
   writes them to `GITHUB_ENV` with a run-specific compose project name:

   | Variable | Example |
   |---|---|
   | `TEST_COMPOSE_PROJECT` | `toa-website-test-<run_id>-<run_attempt>` |
   | `TEST_POSTGRES_PORT` / `TEST_REDIS_PORT` | free host ports, e.g. `34671` / `42833` |
   | `TEST_DATABASE_URL` | `postgresql://test_user:test_password@localhost:<pg port>/toa_test` |
   | `TEST_REDIS_URL` | `redis://localhost:<redis port>` |

2. **Start services.** `docker compose -p "$TEST_COMPOSE_PROJECT" -f docker-compose.test.yml up -d`,
   then wait for `pg_isready` and `redis-cli ping`.
3. **Prepare the database.** `npm run db:push` then `npm run db:seed:e2e`, with
   `DATABASE_URL: ${{ env.TEST_DATABASE_URL }}`.
4. **Run tests.** Type check, build, `npm run test:coverage`, then E2E and visual
   tests with `DATABASE_URL`/`REDIS_URL` set from the `TEST_*` variables.
   Unit tests do not get `DATABASE_URL`; only the steps that need the database do.
5. **Clean up.** `docker compose -p "$TEST_COMPOSE_PROJECT" ... down -v` runs with
   `if: always()`, including on cancellation and timeout.

Postgres keeps its data on `tmpfs`, so every run starts from an empty database.

### Why per-run stacks instead of a shared one

The test stack used to bind fixed ports (55432/56379) and fixed container names,
so test jobs were serialised with a repo-wide concurrency group. GitHub keeps
only one *pending* job per concurrency group and cancels the rest, so most
queued CI runs ended up cancelled. Unique project names and ports let jobs
overlap safely, and that group is gone.

### Caveats

- **Port race:** the port picker releases the ports before Docker binds them, so
  another process could take one in between. That fails fast with "address
  already in use"; re-run the job.
- **Leftover stacks:** if a runner dies mid-job, its stack may be left running.
  List them with `docker compose ls` and remove one with
  `docker compose -p <name> down -v`.
- **Memory:** up to one stack per runner can run at once. Watch memory on the
  Docker host if more runners are added.

## Local usage

`docker-compose.test.yml` defaults to host ports **55432** (Postgres) and
**56379** (Redis), so it can run alongside the dev stack from
`docker-compose.yml` (5432/6379).

Export `DATABASE_URL` first: `test:e2e:setup` runs `db:push`, and
`drizzle.config.ts` throws if `DATABASE_URL` is unset. Pointing it at port
55432 also keeps the schema push off the dev database on 5432.

```bash
export DATABASE_URL=postgresql://test_user:test_password@localhost:55432/toa_test
```

```bash
npm run test:e2e:setup       # docker-compose up + db:push
```

```bash
npm run test:e2e
```

```bash
npm run test:e2e:teardown    # docker-compose down -v
```

To use different ports locally, set `TEST_POSTGRES_PORT` / `TEST_REDIS_PORT`
before starting the stack, and point `DATABASE_URL`/`REDIS_URL` at them.

## Alternatives considered

- **GitHub service containers** (`services:` in the job): simplest on hosted
  runners, but can't be reproduced locally with the same file, and fixed host
  ports would collide on our shared self-hosted Docker host.
- **Kubernetes:** unnecessary for two backing services; slower to start and
  needs a dedicated cluster.
