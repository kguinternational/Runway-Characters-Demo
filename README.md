# Northstar — Runway Characters demo

Northstar is a small analytics dashboard with Nova, a realtime Runway Character.
Nova can navigate the app, operate visible controls, read live Convex revenue, and
create real support tickets. This demo is configured to run locally only.

The implementation stays close to Runway’s official examples:

```tsx
<AvatarCall avatarId={NOVA_AVATAR_ID} credentials={credentials}>
  <AvatarVideo />
  <ControlBar showScreenShare />
  <PageActions />
</AvatarCall>
```

The single [Next.js Server Action](./actions/avatar.ts) creates and consumes a
fresh session for each call and attaches Runway’s `createRpcHandler`. There is
no separate RPC bridge or API route.

## Run locally

Requirements: Node 22.13+, pnpm, a Runway API key with Characters credits, and a
Convex account.

```bash
pnpm install
cp .env.example .env.local
```

Set the Runway key in `.env.local`:

```bash
RUNWAYML_API_SECRET=key_...
```

Then start Convex, seed the demo data, and run Next.js:

```bash
pnpm demo
```

Open [http://localhost:3000](http://localhost:3000).

## Routes

- `/` — Overview with clickable KPIs, alerts, activity, and quick links.
- `/revenue` — real range controls, revenue chart, refund detail, and CSV export.
- `/tickets` — filters, ticket details, and a real Convex-backed create form.
- `/settings` — theme, alerts, character detail, microphone test, and call guidance.

The shared dashboard layout keeps `AvatarCall` mounted while Next.js navigates
between pages.

## Runway tools

All agent actions have a normal clickable equivalent:

- Page Actions click the same links and buttons a user can click.
- `set_date_range` changes the same 7/30/90-day controls.
- `open_panel` opens the same detail panel used by cards and rows.
- `get_revenue` reads the values already visible on the Revenue page.
- `create_ticket` uses the same Convex mutation as the New ticket form.

Tool definitions live in [`lib/tools.ts`](./lib/tools.ts).
Session instructions live in [`lib/avatar.ts`](./lib/avatar.ts): Nova highlights
before every Page Action click, speaks before client actions and after server
results, and can explain the visible Overview, Revenue, Tickets, and Settings
pages.

## Voice behavior

Nova is an original custom Runway Character created for this demo. Her stored
opening is:

> Hi — how can I help?

Runway handles barge-in automatically when the microphone is live. The demo uses
the SDK’s standard `ControlBar` for microphone and screen-share controls. The
Share screen & call button uses the documented `getDisplayMedia({ video: true })`
and `initialScreenStream` flow.

## Project structure

```text
app/
  (dashboard)/             # one page per route
actions/
  avatar.ts                # session creation and backend RPC
components/
  agent/
  layout/
  overlays/
  overview/
  revenue/
  settings/
  tickets/
  ui/
```

Each feature component has its own file; page files do not hide nested component
definitions.

## Verification

Tests are fully mocked and never start a paid Runway session:

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

Use the Settings page’s microphone test before recording; it checks browser
permission without creating a Runway call.
