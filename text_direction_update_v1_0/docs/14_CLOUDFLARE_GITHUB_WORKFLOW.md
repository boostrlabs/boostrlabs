# 14 — Cloudflare / GitHub Workflow

## Target workflow

GitHub becomes the source of truth.

Cloudflare Pages deploys from GitHub.

ChatGPT connected to GitHub reads, audits, and reviews the repo.

Codex handles scoped implementation tasks from the repo, not vague global prompts.

## Initial Cloudflare Pages settings for static frontend/docs

If the repo has `index.html` in root and is currently static:

- Framework preset: None
- Build command: `exit 0`
- Build output directory: `/`
- Root directory: `/`
- Production branch: `main`

## Future when app becomes Next.js

When Codex converts the project into a real Next.js app, Cloudflare build settings must be updated based on the final framework/config.

Do not assume the current static settings remain permanent.

## Branch concept

Use branches for experiments so main remains stable.

Examples:

- `main`: stable production/base.
- `feature/82ngel-dashboard`: 82NGEL dashboard work.
- `feature/gemese-dashboard`: GEMESE dashboard work.
- `feature/rouvssen-checkout`: urgent purchase flow.
- `feature/barber-os`: barber module.

## Rule

Do not develop major changes directly on `main` once GitHub workflow starts.

## Recommended loop

1. Codex creates scoped branch/task.
2. Cloudflare creates preview.
3. User tests on iPhone and desktop.
4. Screenshot feedback goes to ChatGPT.
5. ChatGPT creates precise Codex fix prompt.
6. Codex applies fix.
7. User approves.
8. Merge to main.
