# Northstar — Runway Characters demo

Northstar is a small analytics dashboard with Nova, a realtime Runway Character.
Nova can navigate the app, operate visible controls, read live Convex revenue, and
create real support tickets.

The implementation stays close to Runway’s official examples:

```tsx
<AvatarCall avatarId={NOVA_AVATAR_ID} connect={createAvatarSession}>
  <AvatarVideo />
  <ControlBar showScreenShare />
  <PageActions />
</AvatarCall>
```

Session creation is a [Next.js Server Action](./app/avatar-actions.ts). The only
API endpoint is [`/api/avatar/tools`](./app/api/avatar/tools/route.ts), because
Runway backend tools require one long-lived RPC connection per call.

## Run locally

Requirements: Node 20+, pnpm, a Runway API key with Characters credits, and a
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

Open [http://localhost:3000](http://localhost:3000). The root redirects to
`/overview`.

## Routes

- `/overview` — clickable KPIs, alerts, activity, and quick links.
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

## Voice behavior

Nova is an original custom Runway Character created for this demo. Her stored
opening is:

> Hi — how can I help?

`@runwayml/avatars-react` does not expose an interruption/VAD setting. Runway
handles barge-in automatically when the microphone track is live. The call card
therefore reports `Listening` from `isMicEnabled` (the published track), exposes
the SDK retry control on microphone errors, and displays incoming transcription
so it is obvious whether speech is reaching the session.

## Project structure

```text
app/
  (dashboard)/             # one page per route
  api/avatar/tools/        # backend RPC bridge
  avatar-actions.ts        # official Server Action session pattern
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

## Deploy

In Vercel, add `RUNWAYML_API_SECRET`, `CONVEX_URL`, and
`NEXT_PUBLIC_CONVEX_URL`. Deploy the linked project with:

```bash
pnpm exec vercel deploy --prod --yes
```

If you change the functions in `convex/`, deploy those separately with
`pnpm exec convex deploy`.

The backend-tool endpoint has a five-minute max duration to match a Characters
session.
