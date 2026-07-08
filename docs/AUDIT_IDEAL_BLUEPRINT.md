# BOOSTR Labs Audit Ideal Blueprint

Status: FUTURE PRODUCT BLUEPRINT
Last updated: 2026-07-08

## Purpose

BOOSTR Intake should be the premium interactive front door for BOOSTR Labs.

It is not a generic contact form.
It is not a long questionnaire.
It is not a simple lead magnet.

It should feel like a fast diagnosis system that captures enough signal to route a business, artist, partner or brand into the right BOOSTR OS path.

## Product name

Public/system name:

- BOOSTR Intake

Internal/legacy name:

- Audit

Route:

- `/audit`

## Core rule

Less text. More signal.

The Audit should ask one clear thing at a time, move quickly, and make the user feel like BOOSTR is diagnosing their operating system.

## EN/ES behavior

The Audit must support EN/ES cleanly.

Default behavior:

1. detect browser/system language
2. use Spanish if browser starts with `es`
3. use English if browser starts with `en`
4. fall back to English
5. allow small `EN / ES` toggle
6. persist preference in localStorage

Rules:

- no spanglish
- placeholders translate
- validation errors translate
- final screen translates
- system names remain fixed
- user-entered answers are not translated

## Visual direction

BOOSTR Intake should feel like:

- futuristic diagnosis flow
- dark glass UI
- animated step cards
- premium app onboarding
- modular signal collector
- not a standard form

Visual elements:

- single active question card
- progress ring or step rail
- subtle glow per step
- animated transitions between questions
- minimal text
- large options
- smart chips
- optional text fields only when useful
- final diagnosis screen

## Motion/interaction style

Use:

- smooth step transitions
- card slide/fade
- progress pulse
- selected option glow
- keyboard-friendly navigation
- tap-friendly mobile layout
- saved-progress feeling

Avoid:

- aggressive animation
- long scrolling form
- tiny radio buttons
- dense paragraphs
- form fatigue
- generic survey look

## Multi-step structure

### Step 0 — Entry

Goal: establish what the user is trying to build or fix.

Fields:

- name
- email or phone
- business/project name
- language preference optional if toggle exists

Short copy examples:

EN:

- Start Intake
- Tell BOOSTR what you are building.

ES:

- Iniciar Intake
- Dile a BOOSTR qué estás construyendo.

### Step 1 — Identity

Goal: identify what kind of workspace this may become.

Question:

EN: What are we looking at?
ES: ¿Qué vamos a revisar?

Options:

- Business
- Artist
- Store
- Brand
- Partner
- Event
- Other

Data:

- `workspace_type`

### Step 2 — Stage

Goal: understand maturity.

Question:

EN: Where is it now?
ES: ¿En qué etapa está?

Options:

- Idea
- Live but messy
- Selling already
- Needs automation
- Needs better conversion
- Scaling

Data:

- `stage`

### Step 3 — Main friction

Goal: identify the pain.

Question:

EN: What is blocking growth?
ES: ¿Qué está frenando el crecimiento?

Options:

- No clear website/app
- Manual follow-up
- Weak conversion
- Scattered tools
- No client portal
- No partner system
- No store/checkout
- No data visibility
- Other

Data:

- `friction[]`

### Step 4 — Current assets

Goal: understand what already exists.

Question:

EN: What already exists?
ES: ¿Qué ya existe?

Options:

- Website
- Instagram/TikTok
- Store
- Booking link
- CRM/sheets
- Payment link
- Email list
- WhatsApp
- None

Data:

- `assets[]`

### Step 5 — Desired OS

Goal: map likely module needs.

Question:

EN: What should BOOSTR build around it?
ES: ¿Qué debería construir BOOSTR alrededor?

Options:

- Intake system
- Client workspace
- Storefront
- Partner route
- Artist dashboard
- Automation
- Lead inbox
- Files/invoices
- Analytics
- Full Custom OS

Data:

- `requested_modules[]`

### Step 6 — Urgency

Goal: prioritize.

Question:

EN: How urgent is this?
ES: ¿Qué tan urgente es?

Options:

- This week
- This month
- This quarter
- Exploring

Data:

- `timeline`

### Step 7 — Budget/fit

Goal: qualify without feeling cheap.

Question:

EN: What level are you considering?
ES: ¿Qué nivel estás considerando?

Options:

- Starter
- Growth
- Premium
- Custom
- Not sure

Data:

- `budget_range` or `fit_level`

Do not force exact price too early unless the sales strategy requires it.

### Step 8 — Open signal

Goal: capture human context.

Question:

EN: What should we know?
ES: ¿Qué deberíamos saber?

Field:

- optional short message

Data:

- `extra_message`

### Step 9 — Final screen

Goal: confirm submission and show premium diagnosis state.

Final state should show:

- received
- signal score
- likely OS path
- next step
- optional reference code

EN examples:

- Intake received.
- BOOSTR is mapping your OS path.
- Next: review and route.

ES examples:

- Intake recibido.
- BOOSTR está mapeando tu ruta OS.
- Siguiente: revisión y ruta.

Do not show:

- backend text
- raw JSON
- internal pipeline language
- fake certainty

## Data fields

Minimum payload:

```json
{
  "source": "boostr-intake",
  "language": "en|es",
  "name": "",
  "contact": "",
  "business": "",
  "workspace_type": "",
  "stage": "",
  "friction": [],
  "assets": [],
  "requested_modules": [],
  "timeline": "",
  "fit_level": "",
  "extra_message": "",
  "page_url": "",
  "submitted_at": ""
}
```

Optional computed fields:

```json
{
  "signal_score": 0,
  "recommended_path": "",
  "recommended_modules": [],
  "priority": "low|medium|high",
  "workspace_seed": {}
}
```

## Manager / Signal Inbox output

The submission should create or feed:

- audit submission record
- lead record when qualified/converted
- lead event
- recommended modules
- contact channel
- workspace type
- priority/signal score

Signal Inbox should show:

- contact
- business/project
- type
- stage
- friction
- requested modules
- signal score
- status
- recommended action

## Recommended module mapping

| User signal | Suggested module/path |
|---|---|
| manual follow-up | Signal Inbox / Action Queue |
| scattered tools | Workspace Core |
| no client portal | Workspace Core |
| no store/checkout | Storefront / Orders |
| artist/fan data | 82NGEL OS / Artist OS / Fan Radar |
| partner referrals | Partner Grid / Route Map |
| no analytics | Signal Engine / Revenue Pulse |
| high urgency + premium | Manager review priority |

## Validation

Required:

- name
- contact email or phone
- business/project name
- workspace type
- stage
- at least one friction or open message

Validation language must be short.

EN:

- Add a contact.
- Choose one option.
- Name is required.

ES:

- Agrega un contacto.
- Elige una opción.
- El nombre es obligatorio.

## Accessibility

Audit must support:

- keyboard navigation
- visible focus states
- readable contrast
- mobile tap targets
- reduced-motion preference
- semantic form fields

## What not to do

Do not:

- turn it into a generic contact form
- show all questions at once
- use long paragraphs
- use spanglish
- ask irrelevant questions
- ask for too many details before value is clear
- show internal labels like `ready for leads`
- show fake results as if they are guaranteed
- make it feel like a Typeform clone with BOOSTR colors only
- break public guest access
- require login to submit

## Success criteria

BOOSTR Intake succeeds if:

- user can finish in under 2 minutes
- submission captures enough data for Signal Inbox
- UI feels premium and interactive
- EN/ES works cleanly
- final screen feels like a diagnosis, not a thank-you page
- manager can route the submission into the correct OS path

## Future phases

### Phase 1

Rebuild premium interactive Audit UI with current API compatibility.

### Phase 2

Add EN/ES i18n layer.

### Phase 3

Add computed signal score and recommended module path.

### Phase 4

Convert qualified Audit into workspace seed.

### Phase 5

Connect with real auth/workspace history once backend is ready.
