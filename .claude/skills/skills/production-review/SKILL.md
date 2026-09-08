---
name: production-review
description: Session workflow, quality gates, and pre-merge/pre-close review discipline for the Tawasi Plus project. ALWAYS consult this before closing out a work session, proposing a fix as "done," committing code, or claiming something is verified — it defines the diagnostic-first process, the required TypeScript/lint gates, what counts as real verification (vs. an assumption), and the human sign-off boundaries Claude must respect (branch creation, PRs, merges, pushes, production changes).
---

# Session Workflow & Review Discipline (Tawasi Plus)

## Diagnostic-first — always, no exceptions for "obvious" bugs

Before implementing any fix, run a **read-only diagnostic pass** first: confirm the actual root cause with evidence (read the real code, introspect the real schema, reproduce the real failure) rather than fixing the symptom as initially described. This project has a documented history of the initial bug report being wrong or incomplete — e.g. a "1.9 hour lockout" turned out to be reading the wrong Redis key, a "legal pages need removing from code" turned out to be "the pages never existed in Saleor at all," a "SALEOR_APP_TOKEN is dead" turned out to be a port-forwarding conflict, not an auth problem. Label diagnostic work with an effort size (S/M/L/XL) same as implementation work, and state the confirmed root cause explicitly before writing the fix.

## Quality gates — required after every session, no partial passes

```bash
pnpm tsc --noEmit   # MUST show 0 errors — not "close to 0," zero
pnpm lint           # MUST be ≤ 7 warnings (baseline: 6 in src/checkout/, 1 in Logo.tsx)
```

- If a change reduces warnings below baseline, treat the **new** count as the number to report — don't just say "under baseline," say the actual number and confirm no _new_ warning categories were introduced (a file having zero warnings when it previously had none is a stronger claim than "still under 7").
- `src/checkout/`'s 6 warnings are an accepted, permanent baseline (not a TODO) — don't attempt to "fix" them as a drive-by unless specifically asked, since files there are otherwise off-limits.
- After the session: update `CLAUDE.md` (or whichever memory doc this project uses) and `.beads/issues.jsonl` via the `bd` CLI. A session isn't complete until both are current.

## What counts as "verified" — don't claim more than you actually checked

- **"Verified live"** means an actual browser pass (or, at minimum, a real HTTP round-trip against the running app) in **both locales** (`en` and `ar`), with an explicit RTL check — screenshot or DOM inspection — not just "the code looks RTL-safe." This project treats "verify visually, don't assume" as a hard-won rule after multiple RTL bugs that were invisible from reading the HTML/JSX alone.
- If a verification tool is behaving unreliably (e.g. a console-log reader returning stale cached output across reloads, or a screenshot tool going blank past a certain scroll depth), **cross-check with an independent method** (raw `curl` of the SSR'd HTML, `getComputedStyle`, a fresh tab) before either trusting the flaky tool or wrongly blaming the app. Don't burn time re-diagnosing a known-flaky tool — note it and move to the fallback.
- Distinguish clearly between "confirmed by reproducing the failure on stock/untouched code" (strong — rules out your own change) and "assumed based on the error message" (weak) when reporting a root cause.
- A `git diff --name-only` check to confirm off-limits paths (`src/checkout/hooks/`, `state/`, `graphql/`, payment adapters) were genuinely untouched is worth doing explicitly and reporting, not just asserting from memory of what you intended to change.

## Human sign-off boundaries — do not cross these autonomously

- **Claude commits locally only.** Branch creation, PRs, and merges are done by the human (Ibrahim) via GitHub — never push autonomously, even after a clean quality-gate pass.
- **Production changes require explicit sign-off at each phase**, not just at the start. A backend source patch specifically requires a **diff review before building** the image — don't build-and-deploy in one uninterrupted flow even if the patch seems trivial.
- Session numbering is human-managed (numeric for web, `M`-prefixed for mobile) because parallel sessions can happen outside a single conversation's visibility — don't assume you know the "next" session number; ask or check the log if it matters for documentation.
- If a task would require creating CMS content (menu items, pages) that depends on code not yet deployed to the target environment, **stop and flag it** rather than creating it — creating it early produces a broken/duplicated result once the code does deploy (this happened once with a Footer menu item that assumed an undeployed `toInternalHref()` fix).

## Prompt-language convention

Planning and architecture discussion happens in whatever language the human is using (often Arabic/dialect). **Implementation prompts sent to Claude Code must be written exclusively in English**, regardless of the conversation's language — translate intent into precise English instructions rather than passing dialect straight through.
