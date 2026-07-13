# BOOSTR Labs PWA Pilot

Status: pilot implementation on `pwa-pilot`.

## Purpose

The PWA pilot installs the existing BOOSTR Labs web system on an iPhone home screen without an Apple Developer account, Xcode, TestFlight, Capacitor, or a separate mobile codebase.

The installed experience continues to use the deployed Cloudflare frontend, Pages Functions, and remote database. Primary business records are not stored as an offline replica on the phone.

## Landing gateway

The root landing is the public decision layer for the installed PWA. It must not look like an internal dashboard or assume that every visitor already understands BOOSTR.

It presents two independent paths with equal visibility:

- **BOOSTR Audit** for a visitor who does not yet know what system, module, or solution the business needs.
- **BOOSTR Login** for a person who already has an account, workspace, private invitation, or direct access.

The landing does not force login visitors through the Audit. It also does not describe BOOSTR as “my system” to an unknown visitor.

When `/api/session` confirms an active session, the login path changes to **Continue in BOOSTR** and uses the safe same-origin destination returned by the session. Session detection is non-blocking and uses `cache: no-store`; a backend failure cannot prevent the Audit and Login links from working.

## Install on iPhone

1. Open the deployed BOOSTR Labs URL in Safari.
2. Wait for the page to finish loading.
3. Tap the Safari Share button.
4. Choose **Add to Home Screen**.
5. Confirm the name **BOOSTR Labs** and tap **Add**.
6. Launch BOOSTR from the new home-screen icon.

Safari must be used for installation. Opening the URL inside Instagram, Gmail, or another embedded browser is not sufficient.

## Update behavior

- Page navigation is network-first, so a new Cloudflare deployment is used on the next open or navigation when online.
- Static visual assets may use a cache fallback when the network is unavailable.
- A service-worker upgrade displays **Update BOOSTR**. Activating it switches to the new service worker and reloads once.
- No App Store update or device reinstall is required for normal frontend deployments.
- For a landing-only change, fully close and reopen the installed PWA. If the prior page remains visible, open the branch URL once in Safari and then reopen the home-screen app.

## Offline behavior

The offline page intentionally does not display cached leads, orders, payments, private dashboards, or other business records. It states that current data could not be loaded and asks the user to reconnect.

## Data and cache guardrails

The service worker bypasses caching for:

- `/api/*`
- login and administration routes
- manager, partner, and client application routes
- payments, checkout, orders, and leads
- URLs containing `pin` or `token`
- requests containing authorization or manager PIN headers
- all non-GET requests

## Landing QA

Before merge, verify from the installed iPhone PWA:

1. The first screen shows Audit and Login without exposing internal Manager/Client navigation.
2. Audit opens `/audit/`.
3. Login opens `/login/`.
4. Private invitation opens `/accept-invite/`.
5. Spanish/English switching survives reopen.
6. An authenticated account sees **Continue in BOOSTR**.
7. An unavailable `/api/session` request does not break either public path.
8. The layout clears the notch, Dynamic Island, keyboard, and home indicator.

## Rollback

Revert the faulty commit or deployment in GitHub/Cloudflare. Because navigation is network-first, the repaired deployment becomes the source of truth without reinstalling the home-screen app. If the service worker itself changed, publish a new service-worker version so the installed app offers the controlled update.

## Pilot limitations

This is not an App Store binary and does not provide native-only capabilities such as unrestricted background execution, native widgets, App Store distribution, or every iOS system API. Capacitor/native architecture remains deferred until the first official pilot is complete and the production requirements are reviewed.
