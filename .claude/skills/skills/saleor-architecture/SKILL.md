---
name: saleor-architecture
description: Backend architecture rules for the Proton/Tawasi Plus Saleor platform (proton_platform repo) — Saleor 3.23.1 Docker build pattern, Python patches (Arabic search, email templates, login throttling), product/category/attribute data model, and local-env gotchas. ALWAYS consult this before touching saleor_platform/, writing/reviewing Saleor Python patches, changing Docker Compose services (api/worker/dashboard/db/redis), designing new attributes/product types, or debugging anything that looks like a Saleor backend or local-environment networking issue (port 8000 confusion, DB not matching between environments, PermissionDenied/500s hitting Saleor).
---

# Saleor Backend Architecture (Proton / Tawasi Plus)

## Build model — read this before touching the Dockerfile

- The backend image is built **FROM `ghcr.io/saleor/saleor:3.23.1`** (pre-built official image) plus `COPY` overlays only. **Never build Saleor from local/forked source** — this project hit real Python 3.12 dependency failures doing that.
- The forked Saleor repo on GitHub is a mirror only — it is **not** the build source. Dependabot PRs on it are irrelevant to production.
- `saleor-dashboard` runs as an **unmodified pre-built image** — no fork, no patches.
- API and worker containers **must always run the same Saleor version**. A mismatch silently breaks Celery-dependent features (catalogue promotions, email sending) with no obvious error. Always rebuild/recreate `api` and `worker` together.
- To upgrade Saleor: bump the `FROM` tag, then re-apply every existing patch as an explicit `COPY` line in the new Dockerfile — don't assume old patches still apply cleanly.
- New backend _features_ (not patches) have no established in-image pattern here and would couple the feature to Saleor's own upgrade cycle. The established alternative is an **independent microservice** talking to Saleor over GraphQL/webhooks — see `proton_analytics` (session 44) as the working example: separate repo, separate container, its own DB/aggregation cycle, storefront calls it through a same-origin Next.js Route Handler, never directly from the browser.

## Patch workflow (Python source patches)

All Saleor Python patches are baked in at **build time** via Dockerfile `COPY`, not applied to a running container:

```
custom_patches/<file>.py         → COPY'd over the matching path inside the image
custom_email_templates/          → COPY'd over saleor/plugins/user_email/default_email_templates/
```

- This replaced an old `docker cp` + `docker exec ... manage.py` workflow — that workflow doesn't survive a rebuild, so it's dead. Never resurrect it as "the fast way" to patch something.
- `saleor_platform/` is **not a git repo** — patches and the Dockerfile there aren't tracked by version control the way the storefront is. Be explicit with the user about what changed since there's no diff/history to fall back on.
- Known patches currently applied, for reference:
  - **Arabic search** — `saleor/graphql/product/filters/product_helpers.py`: adds an OR subquery against `ProductTranslation.name__icontains` because Saleor's default `filter:{search}` only searches the English name.
  - **Branded email templates** — `confirm_order`, `confirm_fulfillment`, `order_cancel`, `confirm`, `password_reset`, `send_invoice`.
  - **Login throttling ceiling** — `saleor/account/throttling.py`, `MAX_DELAY` lowered from Saleor's default 3600s to 1200s (20 min). `MIN_DELAY` and the exponential `2^(attempts-1)` backoff formula are untouched — only the ceiling for sustained failures changed. This is core Saleor logic (`authenticate_with_throttling()`), not django-axes or a plugin. No env var controls these constants — they're hardcoded module constants, patch-only.
- When writing a new patch: keep it a byte-for-byte copy of the original file with only the intended lines changed, so future diffs against upstream stay minimal and reviewable.

## Product / category / attribute data model

- 8 root categories × subcategories (59 categories total): Nuts, Dried Fruits, Seeds, Coffee, Snacks, Spices, Food Staples, Herbs.
- Two product types:
  - **Standard** (Nuts/Dried Fruits/Seeds/Coffee/Herbs) — one variant attribute, Weight (250g/500g/1000g).
  - **Spice** — two independent variant attributes, Weight × Type (Ground/Whole) → 6 variants per product, named `"250g / Ground"` style.
- Key attribute slugs: `spice-weight`, `spice-type` (variant-level, spice products only), `origin-of-country` (product-level, optional, up to 32 values).
- **`origin-of-country` must be a Dropdown attribute type, not Plain Text** — Dropdown gives stable, matchable slugs needed for `AttributeInput.values` filtering. This was a deliberate, load-bearing choice — don't "simplify" it to plain text.
- `AttributeInput.values` on `products(filter: {...})` already supports an array with **OR semantics** — multi-select country filtering needed zero schema changes, only storefront parsing changes.
- CMS pages (About, Contact, Wholesale copy pages, legal pages) use the `"Simple"` page type; content is an EditorJS JSON string (`{time, blocks, version}`). Only `header`, `paragraph`, `list`, `image`, `quote`, `code`, `delimiter`, `embed` (YouTube/Vimeo only) block types are supported by the bundled `editorjs-html` parser — anything else throws. Inline HTML inside paragraph/list text passes through and gets `xss()`-sanitized before render.
- `User.metadata` (public metadata) is writable by an authenticated customer on their **own** user object with no staff/app permission needed — used for the "recently viewed products" feature (session 35). `privateMetadata` is staff/app-only. `updateMetadata` is a full key-overwrite (no atomic append) with plain last-write-wins on concurrent writes — accepted risk, not a bug.

## Saleor outbound requests — SSRF filtering is asymmetric

Saleor's own outbound HTTP client (used for `install_app` and all synchronous webhook delivery — payment apps, etc.) rejects requests to private/RFC1918 IPs by default (`HTTP_IP_FILTER_ENABLED`), with no per-host allowlist — only a global on/off. Practical consequence: any service **Saleor itself calls out to** (payment apps, most app-manifest installs) must be reachable via a real public domain, even when it's hosted on the same server as Saleor — an internal Docker service name will **not** work for this direction of traffic. This is asymmetric: it only constrains Saleor-initiated outbound calls. Services the _storefront_ (or other non-Saleor Node code) calls have no such restriction and can use internal Docker service names freely.

**App manifest hostname constraint**: Saleor's manifest URL validator rejects underscores in hostnames — only `[a-z0-9-]` plus dots are allowed. Any service exposed via a Saleor App manifest URL needs a hyphenated hostname. If the actual docker-compose service/directory name needs an underscore for repo-naming consistency, add a Docker network `aliases:` entry to expose a hyphenated alias for manifest/`PUBLIC_URL` purposes only — don't rename the underlying service just to satisfy the validator.

## Local environment gotchas (check these before assuming a code bug)

- **Local and production Saleor databases are completely separate.** CMS content created in one Dashboard never appears in the other — it must be manually re-entered in both.
- **Port 8000 commonly has multiple listeners on this machine/session** (Docker's real `0.0.0.0` listener, plus incidental forwarders like VS Code Remote-SSH auto-forwarding or `wslrelay`). Which one `localhost:8000` resolves to can flip between sessions and between tools (`curl` vs Node `fetch` may resolve differently via IPv4 vs IPv6). Symptoms: a mutation "succeeds" via one tool but its effect isn't visible when the app queries the same URL; JWTs minted against one instance fail signature verification against the other; intermittent `PermissionDenied`/`ECONNREFUSED`/timeouts touching Saleor.
  - Check with `netstat -ano | grep :8000` before suspecting the app, the token, or Saleor itself.
  - Don't just switch to `127.0.0.1` — the compose `api` service's `ALLOWED_HOSTS` doesn't include it, so you'll hit Django's `DisallowedHost` instead.
  - Don't reach for `NODE_OPTIONS=--dns-result-order=ipv4first` as a fix — it just pins you to whichever forwarder happens to be broken that session; the real fix is disabling the redundant forwarder (e.g. VS Code's auto port-forward for 8000).
- Port 4000 (used by `proton_analytics`) has the same relay-shadow risk — check the same way if its data looks stale or unreachable.
- Never run a mix of `curl` and Node `fetch()` against the same `localhost` port in one script when testing a flow end-to-end — mint the token and run every subsequent call through the same fetch mechanism the app actually uses.
- Deleting Orders: delete legacy `payment.Transaction` rows before `Payment` (PROTECT FK). Saleor's cascade logic lives in the Django ORM, not the DB — **never** delete orders/payments via raw SQL; use Django shell/management commands so cascades resolve correctly. Take a `pg_dump` backup first.
