# BOOSTR Labs Language System (i18n)

BOOSTR Labs features a static translation system to support both English (EN) and Spanish (ES) seamlessly across all command center dashboards (Mother OS, Manager OS, Client OS, Partner OS, Admin OS, Identity OS, Module Deck).

## File Architecture

- **Engine Script**:
  - [i18n.js](file:///c:/Users/juanq/Documents/GitHub/boostrlabs/public/assets/boostr-mother/i18n.js)
- **Dictionaries**:
  - [en.json](file:///c:/Users/juanq/Documents/GitHub/boostrlabs/public/assets/boostr-mother/i18n/en.json)
  - [es.json](file:///c:/Users/juanq/Documents/GitHub/boostrlabs/public/assets/boostr-mother/i18n/es.json)

## Rules and Guidelines

1. **System Names**:
   System names must never be translated. The following names remain in English on both dictionaries:
   - Mother OS
   - Identity OS
   - Manager OS
   - Signal Inbox
   - Module Deck
   - Workspace Core
   - Partner Grid
   - System Core
   - BOOSTR Intake
   - Proof Vault
   - 82NGEL OS
   - WESTDETRO OS

2. **Attribute Marking**:
   Use `data-i18n="dictionary_key"` to identify elements for translation.
   - Text node updates will replace `textContent`.
   - Form inputs (`<input>` and `<textarea>`) will translate the `placeholder` attribute.

3. **No Spanglish**:
   - English copy should feel global, sleek and SaaS-like.
   - Spanish copy should feel premium, neutral, clear, and professional.

4. **Toggle Switch Placement**:
   The `i18n.js` script dynamically auto-injects the EN / ES selector in a non-invasive way:
   - Within the `.topbar` (next to roles pill) if a header topbar is present.
   - Within the `.login-foot` if it's the login screen.
   - Within the `.compact-side` if it is a compact modules shell.

5. **Local Scheme Resiliency**:
   The engine implements an embedded fallback dictionary directly in `i18n.js`. This guarantees that translations load instantly with zero layout shift, even if the browser blocks the local `fetch()` requests due to file system (`file:///`) CORS limitations.
