# 03 — Auth, Workspaces, Personas, Identity

## Principle

One account. Multiple personas. Multiple workspaces. Modular dashboards. Custom presentation. Strict permissions.

## Definitions

### User
The real person logging in.

### Persona
The identity the user is currently using inside BOOSTR.

Examples:

- Janko Diorr;
- WESTDETRO Producer;
- BOOSTR Manager;
- 82NGEL Artist;
- BOOSTR Staff;
- GEMESE Artist;
- GEMESE Producer.

### Workspace
The operating space.

Examples:

- BOOSTR Internal;
- 82NGEL Artist OS;
- GEMESE Artist OS;
- GEMESE Producer OS;
- Janko Diorr Artist OS;
- WESTDETRO Producer OS;
- Rouvssen / RVZ;
- Frank Barber;
- Angel Colla Event;
- SOLVE.

### Role
What the user can do in that workspace.

Examples:

- Owner;
- Artist;
- Producer;
- Staff;
- Manager;
- Advisor;
- Viewer;
- Finance;
- Designer;
- Admin.

### Membership
The link between a user, workspace, role, and permissions.

## Examples

Janko can have:

- BOOSTR Founder/Admin;
- BOOSTR Manager;
- Janko Diorr Artist;
- WESTDETRO Producer.

Johanka can have:

- BOOSTR Staff;
- 82NGEL Artist.

GEMESE can have:

- GEMESE Artist;
- GEMESE Producer.

## UX rule

The app should not mix contexts.

If the current workspace is `82NGEL Artist OS`, internal BOOSTR staff data should not appear.

If the current workspace is `BOOSTR Founder/Admin`, internal tools can appear.

There should be a context switcher:

- “Usando BOOSTR como: 82NGEL”
- “Cambiar espacio”

## Data separation

Identity may be global, but data visibility is partner/workspace-specific.

A fan/customer can have one BOOSTR identity and relationships with multiple partners, but partners should not see each other’s private data unless explicitly allowed by an ecosystem rule.
