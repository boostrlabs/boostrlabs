# BOOSTR Labs PWA Pilot

Status: pilot implementation on `pwa-pilot`.

## Purpose

The PWA pilot installs the BOOSTR web experience on an iPhone home screen without an Apple Developer account, Xcode, TestFlight, Capacitor, or a separate mobile codebase.

The installed experience uses the deployed Cloudflare frontend, Pages Functions, and remote database. Private business records are not stored as an offline replica on the phone.

## Entry model

The installed app opens `/app/?source=pwa`, a public service gateway. It is not a private dashboard and it must not assume that the visitor already knows what BOOSTR is.

The first screen is organized by user intent:

- **Use a service now:** guests and customers of a partner can open a public service without signing in when that service allows guest access.
- **Enter a private panel:** owners, managers, staff, employees, operators and BOOSTR clients use login or an invitation.

An authenticated person is not automatically removed from the public gateway. The app keeps public services available and reveals a role-aware **Open my panel** action.

## Current public services

### SMART PARKING

SMART PARKING is live. It opens the OMNI JR flow, where a visitor can choose a vehicle, provide a plate and email, pay, and receive a QR receipt without creating an account.

### BOOSTR EATS, BOOSTR RIDES and BOOSTR EXOTIC

These are frontend-only future service positions. They are labeled **Próximamente**, do not open fake checkout flows, and do not require login.

## Private routing

After authentication, BOOSTR resolves the destination from the account and active workspace:

- Admin → `/admin/`
- Manager → `/manager/`
- Partner / business owner → `/partner-dashboard/`
- Staff / employee / operator / BOOSTR client → `/app/workspace/`
- Founder identities → founder-specific Custom OS routes

Exact `/app/` stays public. Nested `/app/*` routes remain protected unless a future route is explicitly declared public.

## Account rule

Guest access remains available for simple, low-risk purchases or actions that do not require future identity or history.

An account is required for private dashboards, staff operations, recurring access, rewards, Fan Passport, VIP access, licenses, downloads, warranties, transfers, private content, or other records that must remain attached to a person.

## Install on iPhone

1. Open the deployed PWA URL in Safari.
2. Wait for the page to finish loading.
3. Tap the Safari Share button.
4. Choose **Add to Home Screen**.
5. Confirm the name **BOOSTR** and tap **Add**.
6. Launch BOOSTR from the home-screen icon.

Safari must be used for installation. Opening the URL inside Instagram, Gmail, or another embedded browser is not sufficient.

## Update behavior

- Navigation is network-first, so a new Cloudflare deployment is used when online.
- Static visual assets may use a cache fallback when the network is unavailable.
- A service-worker upgrade displays **Update BOOSTR**.
- The guest-first correction uses cache version `boostr-pwa-v3`.
- No App Store update or device reinstall is required for normal frontend deployments.
- If the prior page remains visible, fully close the PWA, open the branch URL once in Safari, then reopen the home-screen app and accept **Update BOOSTR** when shown.

## Offline and privacy behavior

The offline page intentionally does not display cached leads, orders, payments, private dashboards, or other business records.

The service worker bypasses caching for:

- `/api/*`
- login and administration routes
- manager, partner, and application routes
- payments, checkout, orders, and leads
- URLs containing `pin` or `token`
- requests containing authorization or manager PIN headers
- all non-GET requests

## iPhone QA

Before pilot acceptance, verify from the installed PWA:

1. The first screen opens without login.
2. SMART PARKING opens the OMNI JR guest-capable flow.
3. EATS, RIDES and EXOTIC only show a future-service message.
4. Login and invitation are available but visually secondary.
5. A guest never sees workspace, manager, staff or ecosystem controls.
6. An authenticated manager opens `/manager/` from **Open my panel**.
7. An authenticated partner or owner opens `/partner-dashboard/`.
8. Staff, employees and BOOSTR clients open `/app/workspace/`.
9. Public services remain usable while a session is active.
10. The layout clears the notch, Dynamic Island, keyboard and home indicator.
11. A service-worker update replaces the previous login-walled shell.

## Rollback

Revert the faulty commit or deployment in GitHub/Cloudflare. Because navigation is network-first, the repaired deployment becomes the source of truth without reinstalling the home-screen app. If the service worker changed, publish a new cache version so the installed app offers a controlled update.

## Pilot limitations

This is not an App Store binary and does not provide native-only capabilities such as unrestricted background execution, native widgets, App Store distribution, or every iOS system API. Capacitor/native architecture remains deferred until the first official pilot is complete and the production requirements are reviewed.
