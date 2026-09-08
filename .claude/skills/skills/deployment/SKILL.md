---
name: deployment
description: Git branching, Docker Compose, and server-deployment rules for Tawasi Plus (proton_storefront + proton_platform repos). ALWAYS consult this before pushing code, touching docker-compose files or the Dockerfile, SSHing into or running commands on the production server, doing a hotfix, or rebuilding/restarting any production container.
---

# Deployment Workflow (Tawasi Plus)

## The golden rule

**All code changes happen on LOCAL only** → commit → push to GitHub → pull on the server. The server **never** pushes to GitHub and is never the source of truth for code — it only pulls and runs. This includes Dockerfile, `next.config.ts`, and `docker-compose.yml` changes, not just application code. Misconfiguring the server to be on a feature branch instead of `main` has already caused a cascade of merge conflicts across ~35 files once — **the server git branch must always be `main`.**

Exception: `saleor_platform` is a genuinely separate, **untracked (no git) local-only development clone** — it is not the source of production's backend and has no push/pull relationship with it. Production's real Saleor deployment is a different, separately-maintained setup living on the server, reachable only via SSH. Don't assume a local `saleor_platform` patch or Dockerfile change reaches production through any git flow — production backend changes are a distinct, server-side operation (see `saleor-architecture` skill for the patch/rebuild sequence on that side).

## Docker Compose structure

```
docker-compose.yml          — shared base (build args, service defs)
docker-compose.local.yml    — local override: open port 3000
docker-compose.server.yml   — production override: 127.0.0.1 binding, explicit env_file

# Local:
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d
# Server:
docker compose -f docker-compose.yml -f docker-compose.server.yml up -d
```

- `next.config.ts` needs `output: "standalone"` for the Docker build. The Dockerfile's runner stage needs an **explicit `COPY` of `public/` and `node_modules/nodemailer`** — Next's standalone output doesn't auto-trace either, and losing these two lines produces a build failure like `'/app/.next/standalone': not found` or a broken email-sending path at runtime, not an obvious build-time error.
- `.gitattributes` (`* text=auto eol=lf`) is required to prevent CRLF/LF drift between Windows local dev and the Linux server — this isn't cosmetic, it's what previously caused a large merge-conflict cascade.
- A rebuild after a code or patch change is `docker compose -f ... build --no-cache <service>` followed by `up -d --force-recreate <service>` — a plain `up -d` after a `git pull` on the server does **not** pick up new code if the image was already built; check whether the running container is actually serving the new image (container uptime is a useful signal) rather than assuming a `git pull` alone finished the deploy.
- **API and worker containers must be rebuilt/recreated together** — they must always run matching Saleor versions (see `saleor-architecture` skill).

## Docker network topology across compose projects

When a service in one docker-compose project needs to reach a service in another otherwise-isolated compose project, never attach the caller to the target's full network directly if that network hosts an unauthenticated data store (e.g. Redis with no password) — the network boundary is that store's only protection. Instead, create a narrow, purpose-built external bridge network containing only the two services that actually need to talk (e.g. `storefront_bridge`, `payment_bridge` in this project's history), and attach only those two containers to it.

**Next.js standalone bind gotcha (caused a real production outage)**: Docker sets a per-container `HOSTNAME` env var (the container id). Next.js standalone's `server.js` binds to whatever that resolves to, not `0.0.0.0`, unless told otherwise. With a single Docker network this coincidentally matches the container's only IP, so it "just works" — attaching a _second_ network breaks that coincidence silently: the app keeps logging "Ready" normally, but the host's published port starts refusing connections ("connection reset by peer"). **Always set `ENV HOSTNAME=0.0.0.0` explicitly in any Dockerfile running Next.js standalone in Docker** — treat this as a mandatory line for this stack, not an optional fix, especially before adding any additional network to the storefront container.

**Verification after any network topology change on a container with a published host port**: testing only the _new_ access path (e.g. confirming the new network can reach service X) is not sufficient — that was the exact gap that caused the outage above. Always _also_ re-verify the _existing_ access path still works, specifically via a host-side `curl` against the published port (not `docker exec` into the container) — that's what real traffic (Nginx, users) actually uses. "Works via `docker exec`" and "works from the host's published port" are different, independently disprovable claims; check both explicitly, every time you touch network topology.

## Hotfix convention

Production-breaking bugs get their own `hotfix/<short-name>` branch merged **directly to main** — not bundled into a long-running feature/session branch. This keeps an urgent one-line fix from waiting on unrelated in-progress work to be ready for review.

## Backend patch deployment sequence

1. Write/update the patch file under `custom_patches/` (or `custom_email_templates/`).
2. Add/update the Dockerfile `COPY` line for it.
3. **Diff review before building** — this is a required human sign-off point, not optional (see `production-review` skill).
4. `docker compose build <service>` (rebuild the image with the patch baked in).
5. `up -d --force-recreate api worker` together (version parity).
6. Confirm the patch is live via a real behavioral check (e.g. Redis TTL inspection for the throttling patch), not just "the build succeeded."

## Before creating any CMS/database object that depends on undeployed code

Check what commit is actually deployed and running (`git log` on the server + confirm the running container's build, not just the pulled commit) **before** creating a CMS menu item, page, or other data object whose correct rendering depends on a code change. Creating the data first produces a broken or duplicated result once the code does land — verify the code path is live first, in that order.

## Environment/networking gotchas specific to deployment

- VS Code Remote-SSH can silently port-forward the **production** server's port 8000 to local `127.0.0.1:8000` while a Remote-SSH window to Hetzner is open — never assume a bare `localhost:8000` call during local testing is actually hitting local Saleor; check for an open Remote-SSH session first.
- Local and production Saleor databases are completely separate — a CMS/data fix applied locally must be **manually repeated** against production; there's no sync step to rely on.
- Rebuilding a container is sometimes blocked by an auto-mode permission classifier as a production-affecting action — this is expected and requires explicit human approval before re-running, not a bug to route around.
