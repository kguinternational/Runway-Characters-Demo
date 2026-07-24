# Northstar — Runway Characters demo

Northstar is a small, local-only Next.js 16 analytics dashboard with Nova, a
realtime Runway Character. Nova can navigate the same pages as the user, operate
visible controls, explain live Convex data, and manage support tickets.

The integration deliberately stays close to Runway’s official examples:

```tsx
"use client";

import { useState } from "react";

import {
  AvatarCall,
  AvatarVideo,
  ControlBar,
  PageActions,
  ScreenShareVideo,
  type SessionCredentials,
  UserVideo,
} from "@runwayml/avatars-react";

import { createAvatarSession } from "@/actions/avatar";
import { NOVA_AVATAR_ID } from "@/lib/avatar";

function NovaCall() {
  const [session, setSession] = useState<SessionCredentials | null>(null);

  if (!session) {
    return (
      <button onClick={async () => setSession(await createAvatarSession())}>
        Start call
      </button>
    );
  }

  return (
    <AvatarCall
      key={session.sessionId}
      avatarId={NOVA_AVATAR_ID}
      credentials={session}
      video={false}
      onEnd={() => setSession(null)}
      className="h-full !aspect-auto"
    >
      <AvatarVideo />
      <UserVideo />
      <ScreenShareVideo />
      <ControlBar showCamera={true} showScreenShare />
      <PageActions highlightDuration={3000} scrollBlock="center" />
    </AvatarCall>
  );
}
```

The single [Next.js Server Action](./actions/avatar.ts) creates and consumes a
fresh session and attaches Runway’s `createRpcHandler`. There is no API route,
custom RPC bridge, or second session endpoint. Every Start click fetches fresh
one-use credentials, so hanging up and starting a second call does not reuse the
first session.

## Run locally

Requirements: Node 22.13+, pnpm, a Runway API key with Characters credits, and a
Convex account.

```bash
pnpm install
cp .env.example .env.local
```

Set the key only in `.env.local`:

```bash
RUNWAYML_API_SECRET=key_...
```

`RUNWAYML_API_SECRET` is read by the Server Action. Never rename it with a
`NEXT_PUBLIC_` prefix or use it in a client component.

Start Convex, seed the local demo data, and run Next.js:

```bash
pnpm demo
```

Open [http://localhost:3000](http://localhost:3000). This project is for local
demo use; it has no Vercel deployment step.

## Routes

- `/` — dashboard brief, clickable KPIs, recent activity, and every capability.
- `/revenue` — 7/30/90-day controls, live chart, average, peak, refund detail,
  and CSV export.
- `/tickets` — queue insight, filters, exact ticket detail, creation, and
  close/reopen controls.
- `/settings` — theme, alerts, character detail, microphone test, and call
  guidance.

The shared layout keeps `AvatarCall` mounted while Next.js navigates between
pages.

## Tool model

The implementation follows Runway’s documented split:

- [Client tools](https://docs.dev.runwayml.com/characters/tools/client-tools/)
  and Page Actions run in the browser. They are fire-and-forget and do not
  return a result to the conversation.
- [Server tools](https://docs.dev.runwayml.com/characters/tools/server-tools/)
  run through the one RPC handler. Their returned Convex data is available to
  Nova, so she can speak it.
- Tool descriptions and the personality use the narrow invocation guidance in
  Runway’s [tool best practices](https://docs.dev.runwayml.com/characters/tools/best-practices/).

Because client actions do not acknowledge completion, a cross-page demo uses
short voice turns: first say “Open Revenue,” wait for the page, then ask the
revenue question. Do not combine navigation, range changes, insight lookup, and
another navigation into one mega command.

## Complete tool inventory

Everything Nova can do also has a normal clickable path. Stable
`data-avatar-target` IDs are included because the visible labels may change.

| Type | Tool | What Nova can do | Manual clickable equivalent |
| --- | --- | --- | --- |
| Page Action | `click` | Click a visible target | Click that same link, card, row, or button. The Overview showcase is `overview-page-actions`. |
| Page Action | `scroll_to` | Bring a target into view | Click `overview-page-actions` to run the visible page-action preview, or use the target’s navigation link. |
| Page Action | `highlight` | Pulse a visible target before a click | Click `overview-page-actions` for the same visible preview; every highlighted target remains directly clickable. |
| Client | `set_date_range` | Change the visible Revenue chart range | Click `range-7d`, `range-30d`, or `range-90d`. |
| Client | `filter_tickets` | Change the visible ticket queue to All, Open, or Billing | Click `ticket-filter-all`, `ticket-filter-open`, or `ticket-filter-billing`. |
| Client | `open_panel` | Show a short on-screen information panel | Click `overview-open-panel`; KPI cards, anomalies, and ticket rows also open panels. |
| Server | `get_overview_insights` | Return the live dashboard morning brief | Click `overview-insight`. |
| Server | `get_revenue` | Return total, change, daily average, peak day, and refund insight for a range | Click `revenue-insight`; the range buttons and `revenue-anomaly` expose the same facts. |
| Server | `get_ticket_insights` | Return queue totals, status split, team workload, and latest ticket | Click `tickets-insight`. |
| Server | `get_ticket` | Look up one ticket by its numeric ID | Click `ticket-row-{ticketId}` in the Tickets table. |
| Server | `create_ticket` | Create a real Convex ticket and return its ID | Click `new-ticket`, complete the form, then click `submit-ticket`. |
| Server | `update_ticket_status` | Close or reopen a ticket and return its new status | Open `ticket-row-{ticketId}`, then click `ticket-status-{ticketId}`. |

Tool definitions live in [`lib/tools.ts`](./lib/tools.ts). Session creation and
all server handlers live in [`actions/avatar.ts`](./actions/avatar.ts).
Personality and the short opening live in [`lib/avatar.ts`](./lib/avatar.ts).

## Voice and screen sharing

Nova is an original support character. Her opening is intentionally short:

> Hi — how can I help?

The layout follows Runway’s
[camera and screen-sharing guide](https://docs.dev.runwayml.com/characters/screens/).
`video={false}` keeps the camera off when the call connects, while
`showCamera={true}` leaves the standard camera control available. `<UserVideo />`
and `<ScreenShareVideo />` display their respective feeds only while those
tracks are active.

Nova opens as a full-height right-side panel and can be minimized without
unmounting an active call. The page animates to use the remaining width while
the panel is open. The standard avatar video fills the tall panel and uses the
SDK’s built-in cover crop, so the character gets more vertical camera space.

The app relies on the hosted session and the SDK’s standard `ControlBar` for
microphone, camera, and screen sharing. It does not add custom media handling.
Share the current Northstar tab and wait for the control bar to show that
sharing is active before continuing.

## Project structure

```text
app/
  (dashboard)/             # one page per route
actions/
  avatar.ts                # one session action and all backend RPC handlers
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

Each feature component has its own file; page files do not contain nested
component definitions.

## Safe verification

Automated checks must never create or consume a Runway session:

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

The test suite mocks Runway and Convex. Do not call `createAvatarSession` from an
integration test or browser automation; starting a real call is a manual demo
step and consumes Characters credits. The Settings microphone test only checks
browser permission and does not start a Runway session.
