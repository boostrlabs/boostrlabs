# BOOSTR App Entry Logic

## Purpose

`/app/` is the public service gateway. It is not a dashboard and it must never require login just to open.

A visitor may know the partner business but not know BOOSTR. The page therefore explains the action first and the platform second.

## Routing contract

| Visitor | What they see first | Login required | Destination |
|---|---|---:|---|
| Unknown guest | Live public services | No | Partner/module checkout |
| Customer of a partner | The service or product they came to use | Only when the service requires identity/history | Partner-branded flow |
| Returning consumer account | Public services plus account access | Optional | Account/private workspace when selected |
| Partner staff / employee / operator / cashier | Public gateway plus private-access button | Yes | `/app/workspace/` or assigned private route |
| BOOSTR client / artist / creator / seller | Public gateway plus private-access button | Yes | `/app/workspace/` |
| Manager | Public gateway plus private-access button | Yes | `/manager/` |
| Partner / business owner | Public gateway plus private-access button | Yes | `/partner-dashboard/` |
| Admin | Public gateway plus private-access button | Yes | `/admin/` |
| Founder identities | Public gateway plus private-access button | Yes | Founder-specific Custom OS |

Authenticated users are not automatically removed from the public gateway. They may still need a public service such as parking. Instead, the gateway reveals a role-aware **Open my panel** action.

## Why each public button exists

### SMART PARKING

- Status: live.
- Purpose: complete an immediate parking transaction.
- Destination: `/parking/omni-jr/`.
- Account rule: guest checkout is allowed because the transaction can be completed with plate, email and payment.

### BOOSTR EATS

- Status: frontend placeholder only.
- Purpose: reserve the future location for restaurant discovery, ordering, payment and order tracking.
- Current behavior: informational `Próximamente` state; no fake checkout or account requirement.

### BOOSTR RIDES

- Status: frontend placeholder only.
- Purpose: reserve the future location for transportation requests and trip tracking.
- Current behavior: informational `Próximamente` state.

### BOOSTR EXOTIC

- Status: frontend placeholder only.
- Purpose: reserve the future location for partner-owned exotic vehicle inventory and reservations.
- Current behavior: informational `Próximamente` state.

### Entrar a mi panel

- Audience: owners, managers, staff, employees and BOOSTR clients.
- Destination after authentication: selected by role and active workspace.
- It is visually secondary to live consumer services because most guests should not need an account.

### Tengo una invitación

- Audience: a person invited into a partner or BOOSTR workspace.
- Destination: `/accept-invite/`.
- It remains separate from normal login because an invitation establishes the relationship and role.

## Account rule

Guest access remains available for simple, low-risk purchases or actions that do not require future access.

An account is required for identity/history-dependent experiences such as private dashboards, staff operations, recurring access, rewards, Fan Passport, VIP access, licenses, downloads, warranties, transfers, private content or other records that must remain attached to a person.

## Surface separation

- `/app/`: public service gateway.
- `/app/workspace/`: authenticated generic workspace for clients, staff and employees.
- `/app/*` other nested paths: authenticated private surfaces unless explicitly documented as public.
- `/parking/*`, `/pay/*` and partner-branded public routes: public or guest-capable according to each module's rules.

The middleware and production shell must preserve this distinction. Exact `/app` is public; nested `/app/…` routes are private.
