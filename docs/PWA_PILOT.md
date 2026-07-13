# BOOSTR Labs PWA Pilot

Status: pilot implementation on `pwa-pilot`.

## Purpose

The PWA pilot installs the existing BOOSTR Labs web system on an iPhone home screen without an Apple Developer account, Xcode, TestFlight, Capacitor, or a separate mobile codebase.

The installed experience continues to use the deployed Cloudflare frontend, Pages Functions, and remote database. Primary business records are not stored as an offline replica on the phone.

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

## Rollback

Revert the faulty commit or deployment in GitHub/Cloudflare. Because navigation is network-first, the repaired deployment becomes the source of truth without reinstalling the home-screen app. If the service worker itself changed, publish a new service-worker version so the installed app offers the controlled update.

## Pilot limitations

This is not an App Store binary and does not provide native-only capabilities such as unrestricted background execution, native widgets, App Store distribution, or every iOS system API. Capacitor/native architecture remains deferred until the first official pilot is complete and the production requirements are reviewed.
