# BOOSTR Labs v0.2.7 — Login + Mobile + Codex Front-End Patch

This patch replaces the old root Vite landing behavior with the BOOSTR Mother UI and prepares the front-end for backend/Codex.

## Main changes

- Root `/` redirects to `/home` so the old Vite landing no longer appears first.
- Mother UI pages are rebuilt with less text and more visual system cards.
- Login is now a role-access shell: Manager, Partner, Client, Artist.
- Mobile behavior is improved with compact sidebar and fixed bottom tabs.
- `FRONTEND_CONTRACT.md` defines routes, roles, future backend behavior and account requirements.
- Existing custom modules are not overwritten: `/audit`, `/82store`, `/82ngel`, `/jankodiorr`, `/app/82ngel`, `/app/gemese`, `/omgbeauty`.

## Commit

```bash
git add index.html public FRONTEND_CONTRACT.md README_BOOSTR_V027_LOGIN_MOBILE_CODEX_PATCH.md PATCH_V027_LOGIN_MOBILE_CODEX_MANIFEST.json
git commit -m "Prepare BOOSTR Mother UI for Codex backend"
git push origin main
```

## Test URLs

- /home
- /login
- /manager
- /app
- /partner-dashboard
- /admin
- /ecosystem
- /modules
- /portfolio
