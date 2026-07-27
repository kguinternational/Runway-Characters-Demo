Sign up to Runway here: https://runwayml.com/sonnysangha

**Promo:** 50% off one month of any paid plan with code **`SKILLS50`**.

# Northstar — Runway Characters demo

Northstar is a small, local-only Next.js 16 dashboard with Nova, a realtime
Runway Character. Nova can navigate the same pages as the user, operate visible
controls, explain the bundled demo data, and manage an in-memory support queue.

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
      <AvatarVideo className="!absolute inset-0" />
      <ScreenShareVideo className="!absolute bottom-32 left-4 aspect-video !h-auto !w-[55%] overflow-hidden rounded-lg" />
      <UserVideo className="!bottom-32" />
      <ControlBar showCamera={true} showScreenShare />
      <PageActions highlightDuration={3000} scrollBlock="center" />
    </AvatarCall>
  );
}
```

[`actions/avatar.ts`](./actions/avatar.ts) is the single Runway Server Action
file. It creates and consumes a fresh session and attaches Runway’s
`createRpcHandler`. There is no API route or custom RPC bridge. Every Start
click requests fresh one-use credentials, so a second call does not reuse the
first session.

## Run locally

Requirements: Node 22.13+, pnpm, and a Runway API key with Characters credits.

```bash
pnpm install
cp .env.example .env.local
```

Set the key in `.env.local`:

```bash
RUNWAYML_API_SECRET=key_...
```

The key is read only by the Server Action. Do not give it a `NEXT_PUBLIC_`
prefix or import it into a client component.

Start the app:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The demo workflow ends on
localhost.

## Demo data

- Revenue is a deterministic set of bundled daily rows, so totals, ranges,
  peaks, and the refund dip remain consistent between recordings.
- Tickets begin from a bundled seed and live in server memory while the app is
  running.
- Creating or updating a ticket changes that in-memory queue.
- Restarting the Next.js server restores the original ticket seed.
- `refresh_tickets` reloads the visible queue after Nova creates or updates a
  ticket. The **Refresh** button provides the same manual action.

[`lib/demo-data.ts`](./lib/demo-data.ts) contains the readable fixtures and
calculations. [`lib/demo-store.ts`](./lib/demo-store.ts) owns the shared
in-memory ticket state. [`actions/demo.ts`](./actions/demo.ts) contains the
small set of Server Actions used by the clickable ticket UI. Both the manual
controls and Nova’s RPC tools operate on the same ticket state.

## Routes

- `/` — overview brief, clickable KPIs, recent activity, and the capability map.
- `/revenue` — 7/30/90-day controls, chart, average, peak, refund detail, and
  CSV export.
- `/tickets` — queue insight, filters, exact ticket detail, Refresh, creation,
  and close/reopen controls.
- `/settings` — theme, alerts, character detail, microphone test, and call
  guidance.

The shared layout keeps `AvatarCall` mounted while Next.js navigates between
pages.

## All 13 session tools

Everything Nova can do also has a normal clickable path.

| Type | Tool | Nova action | Manual equivalent |
| --- | --- | --- | --- |
| Page Action | `click` | Click a visible target | Click the same link, card, row, or button. |
| Page Action | `scroll_to` | Bring a target into view | Scroll normally or click the Overview Page Actions preview. |
| Page Action | `highlight` | Pulse a visible target before acting | Click the Overview Page Actions preview. |
| Client | `set_date_range` | Show 7, 30, or 90 days | Click the range control on Revenue. |
| Client | `filter_tickets` | Show All, Open, or Billing tickets | Click the queue filter on Tickets. |
| Client | `open_panel` | Open a short information modal | Click an insight, KPI, anomaly, or ticket row. |
| Client | `refresh_tickets` | Reload the visible queue after a ticket change | Click **Refresh** on Tickets. |
| Server | `get_overview_insights` | Return the overview brief for Nova to speak | Click **Overview insight**. |
| Server | `get_revenue` | Return totals, change, average, peak, and refund facts | Click **Revenue insight**. |
| Server | `get_ticket_insights` | Return queue totals and team workload | Click **Queue insight**. |
| Server | `get_ticket` | Return one ticket by numeric ID | Click its ticket row. |
| Server | `create_ticket` | Add a ticket and return the new record | Click **New ticket**, complete the form, and submit. |
| Server | `update_ticket_status` | Close or reopen a ticket and return the update | Open a ticket and click its status control. |

Client tools and Page Actions run in the browser and do not return results to
the conversation. Server tools return data Nova can use in speech. After a
server-side ticket change, `refresh_tickets` only refreshes the visible queue;
Nova confirms the result returned by the server tool.

Tool definitions live in [`lib/tools.ts`](./lib/tools.ts). Personality and the
short opening live in [`lib/avatar.ts`](./lib/avatar.ts). The descriptions
follow Runway’s guidance by saying when each tool should run and what it returns
or changes:

- [Client tools](https://docs.dev.runwayml.com/characters/tools/client-tools/)
- [Server tools](https://docs.dev.runwayml.com/characters/tools/server-tools/)
- [Tool best practices](https://docs.dev.runwayml.com/characters/tools/best-practices/)

## Voice and screen sharing

Nova begins with a quick introduction:

> Hi, I’m Nova. I can explore the dashboard, explain insights, and help with
> tickets. Share your screen if you want help diagnosing what you see.

The layout follows Runway’s
[camera and screen-sharing guide](https://docs.dev.runwayml.com/characters/screens/).
The camera starts off, while the standard control bar exposes camera and screen
sharing. `<UserVideo />` and `<ScreenShareVideo />` show the active feeds inside
the full-height agent panel. The app uses the SDK’s media components and does
not add custom media orchestration.

Nova can be minimized without unmounting an active call. When open, the page
animates to use the remaining width.

## Project structure

```text
app/
  (dashboard)/             # one page per route
actions/
  avatar.ts                # one Runway session action and RPC handler
  demo.ts                  # manual ticket actions
components/
  agent/
  layout/
  overlays/
  overview/
  revenue/
  settings/
  tickets/
  ui/
lib/
  demo-data.ts             # deterministic fixtures and calculations
  demo-store.ts            # shared in-memory ticket state
  tools.ts                 # all 13 tool definitions
```

## Token-free verification

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

The automated tests mock Runway session and RPC behavior. They never start a
Character call or consume Runway credits. Starting a call is a manual demo step.
The Settings microphone test only checks browser permission.

For a recording-ready sequence, see [`DEMO.md`](./DEMO.md).
