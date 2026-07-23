# Northstar — Runway Characters support-agent demo

Northstar is a real Next.js analytics dashboard with an embedded realtime Runway Character named Nova. Nova can see a shared dashboard tab, operate visible controls, query live Convex data, and create a real support ticket during one voice conversation.

Nothing in the revenue or ticket path is mocked. The chart, spoken totals, refund explanation, ticket ID, ticket table, and open-ticket KPI all come from Convex.

For the recording-ready prompt sequence, use [DEMO.md](./DEMO.md).

## What is implemented

- Next.js App Router, React 19, TypeScript, Tailwind CSS, and Recharts.
- `@runwayml/avatars-react` for the WebRTC call UI, screen sharing, Page Actions, and client events.
- `@runwayml/sdk` for server-side session creation and one-time credential consumption.
- `@runwayml/avatars-node-rpc` for the long-lived backend tool connection.
- Convex queries and mutations for revenue, recent tickets, open-ticket count, and ticket creation.
- Three visible Runway tool types in the same session:
  - Page Actions: scroll, highlight, and click real dashboard elements.
  - Client tools: change the chart range and open a confirmation panel.
  - Server tools: read revenue and create a ticket with results returned to Nova.
- A deterministic, repeat-safe demo seed.
- No authentication layer. This is intentionally a focused Characters API demo.

## Prerequisites

- Node.js 20 or newer.
- pnpm.
- A Runway developer account, an active API key, and enough API credits to start a Character session.
- A Convex account, or a Convex local development deployment.
- A current browser with microphone and screen-sharing support. Chrome or Edge is the most predictable recording choice.

## Quick start

Install dependencies and create a local environment file:

```bash
pnpm install
cp .env.example .env.local
```

Add `RUNWAYML_API_SECRET` to `.env.local`. Do not add `NEXT_PUBLIC_` to the key name; it must remain server-only.

Start Convex, reconcile the deterministic demo seed, and launch Next.js together
with one command:

```bash
pnpm demo
```

On the first run, Convex prompts for project/deployment setup, pushes the functions,
generates `convex/_generated`, writes `CONVEX_DEPLOYMENT` plus
`NEXT_PUBLIC_CONVEX_URL` to `.env.local`, runs `seed:seedDemo`, and starts Next.js.
The seed is repeat-safe, so the same command is also the normal recording-day start.
The second command only starts after the sync and seed succeed.

Open [http://localhost:3000](http://localhost:3000). Keep the combined development command running during the demo.

If separate terminals are preferable, run `pnpm convex:dev` in one,
`pnpm convex:seed` once in another, and `pnpm dev` in a third. If the page
says “Connect the live Convex data,” the frontend did not receive
`NEXT_PUBLIC_CONVEX_URL`; finish `convex dev` setup and restart Next.js.

## Environment variables

The checked-in `.env.example` contains names only. Never commit `.env.local` or paste its values into issues, logs, screenshots, or documentation.

| Variable                       | Required        | Exposure             | Purpose                                                                                                                                 |
| ------------------------------ | --------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `RUNWAYML_API_SECRET`          | Yes             | Server only          | Runway API key. The session and RPC routes require `key_` followed by 128 hexadecimal characters.                                       |
| `NEXT_PUBLIC_CONVEX_URL`       | Yes             | Public client config | Deployment URL used by `ConvexReactClient`; also the RPC route fallback when `CONVEX_URL` is absent. `convex dev` normally writes this. |
| `CONVEX_DEPLOYMENT`            | Local CLI setup | Server/CLI only      | Selects the configured Convex development project/deployment. `convex dev` normally writes this.                                        |
| `CONVEX_URL`                   | Optional        | Server only          | Explicit Convex URL for `/api/avatar/rpc`. Recommended for the production server route; otherwise it uses `NEXT_PUBLIC_CONVEX_URL`.     |
| `RUNWAY_AVATAR_ID`             | Optional        | Server only          | Server-side avatar override. The server value wins over the client request.                                                             |
| `RUNWAY_AVATAR_TYPE`           | Optional        | Server only          | `preset`, `runway-preset`, or `custom`. If omitted, known preset IDs are inferred as presets and other IDs as custom.                   |
| `NEXT_PUBLIC_RUNWAY_AVATAR_ID` | Optional        | Public client config | Avatar ID requested by the Nova card. Defaults to `music-superstar`.                                                                    |
| `RUNWAYML_BASE_URL`            | Optional        | Server only          | Alternate Runway API base URL for both session creation and backend RPC. Leave blank for the SDK default.                               |
| `CONVEX_DEPLOY_KEY`            | Deployment only | CI secret            | Allows Vercel to deploy Convex functions non-interactively. It is not used by the running browser app.                                  |

### Avatar safety

The default `music-superstar` preset is an original Runway preset and is ready for screen sharing. For the sponsored demo, use a Runway preset or a custom character made from an original image that you own. Do not use a celebrity, public figure, or existing film, TV, or game character.

If a custom character is used, keep a preset Runway voice. Runway does not support webcam or screen sharing for a custom character paired with a custom voice.

The server currently recognizes these preset IDs:

```text
game-character
music-superstar
game-character-man
cat-character
influencer
tennis-coach
human-resource
fashion-designer
cooking-teacher
```

The default needs no avatar environment variables. A custom original character can be selected with:

```dotenv
RUNWAY_AVATAR_ID=your-original-avatar-id
RUNWAY_AVATAR_TYPE=custom
```

## Architecture

### Session and media flow

1. The “Share screen & call Nova” button asks for display capture before creating a session. Choosing the current browser tab gives Nova the intended visual context.
2. `POST /api/avatar/connect` validates the server-side API key, creates a `gwm1_avatars` session with all tool definitions, and sets `maxDuration` to 300 seconds. Runway presets use their built-in personality; custom original avatars also receive Nova's session-level personality and opening script.
3. The route polls for `READY` for up to 55 seconds, consumes the session once, and returns only ephemeral WebRTC credentials plus the session ID. The Runway API secret never reaches the browser.
4. Before mounting `AvatarCall`, the client opens `POST /api/avatar/rpc` with the session ID and waits for the backend tool handler to connect.
5. `AvatarCall` joins the realtime room with audio, avatar video, the pre-captured screen stream, `ControlBar`, and `PageActions`.
6. The card only says **Live** after the SDK reports an active session, a ready avatar track, and a microphone track. If setup fails after credentials were consumed, `DELETE /api/avatar/connect` cancels that session before a retake.

`sessionId` is also the Runway conversation ID if transcript or recording retrieval is added later.

### Why `/api/avatar/rpc` streams

Runway backend tools need one RPC handler to remain connected for the life of a session. A normal JSON route would return immediately and allow the server process to close the handler.

The Node route therefore returns a long-lived NDJSON stream while `createRpcHandler` stays connected. It:

- emits `connected`, `tool`, and `error` events so the Nova card can show real activity;
- writes a blank heartbeat every 15 seconds so proxies do not treat the response as idle;
- disables response buffering with `X-Accel-Buffering: no`;
- closes on browser abort, RPC disconnect, or after 295 seconds;
- uses `maxDuration = 300`, matching the five-minute Runway session.

This route also owns the server-only Convex client. `get_revenue` calls a Convex query and returns the database total/change/dip to Nova. `create_ticket` calls a Convex mutation and returns the allocated ticket ID. Both tools use Runway’s maximum eight-second backend RPC timeout.

Runway permits one backend RPC handler per session. Do not open a second `/api/avatar/rpc` request for the same session ID.

### The three tool types

| Type                     | Tools/targets                                                                                                       | Visible result                                                 | Returned to Nova?                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------- |
| Built-in Page Actions    | `scroll_to` and `highlight` on `revenue-chart`; `click` on `theme-toggle`; range and ticket targets are also tagged | The page moves, pulses a highlight, or changes theme           | Action completion only                                     |
| Custom client tools      | `set_date_range`, `open_panel`                                                                                      | The chart rerenders to 7/30/90 days; the right panel slides in | No. Client tools are fire-and-forget.                      |
| Server/backend RPC tools | `get_revenue`, `create_ticket`                                                                                      | Live totals are spoken; a real row and ticket count appear     | Yes. Structured Convex results return to the conversation. |

Tool definitions and validation live in `lib/tools.ts`. Nova’s exact operating instructions live in `lib/nova-personality.ts`.

### Convex data

The schema has only two tables:

- `revenue`: ISO UTC date, amount, and optional refund marker, indexed by date.
- `tickets`: numeric ticket ID, subject, team, open/closed status, and creation time, indexed by ID, creation time, and status.

`pnpm convex:seed` calls `seed:seedDemo` and is safe to repeat:

- It reconciles revenue to exactly 90 daily UTC rows.
- The point exactly 14 days before the seed date is a real negative `-$2,850` row with `refunded: true`.
- It upserts seven baseline tickets, IDs `4798` through `4804`.
- Four baseline tickets are open and three are closed.
- On a clean deployment, the first ticket Nova creates is `4805`.
- Tickets created during a demo are deliberately preserved by later seed runs, so subsequent takes continue with `4806`, `4807`, and so on.

Revenue totals are calculated at query time; do not hardcode them in narration. As a reproducibility check, a seed on 2026-07-14 produces a 30-day total of `$122,821`, a `+3.6%` comparison, and the `-$2,850` dip on 2026-06-30. A seed on another UTC date keeps the same invariant dip but may produce a slightly different total because weekday adjustments move with the calendar.

The 7- and 30-day changes compare against the immediately preceding equal period. The 90-day view reports the 90-day total but caps its trend comparison at the latest 30 days versus the preceding 30 days so the entire result remains backed by the 90-row dataset.

## Session constraints and retakes

- A Runway session lasts at most five minutes. This app explicitly requests 300 seconds.
- Session credentials can be consumed only once. A dropped WebRTC connection requires a new session; refreshing cannot revive the consumed credentials.
- The backend RPC stream closes just before the session limit. End the call and start a fresh one for every retake.
- Screen sharing is requested before session creation. If permission is denied, retry or use voice-only mode for diagnostics; the complete demo needs screen sharing.
- A custom character with a custom voice cannot receive the screen stream.

See [DEMO.md](./DEMO.md) for the exact reset and recording flow.

## Commands

| Command                                     | Purpose                                                                   |
| ------------------------------------------- | ------------------------------------------------------------------------- |
| `pnpm demo`                                 | One-command Convex sync, repeat-safe seed, and Next.js development server |
| `pnpm convex:dev -- --start "pnpm run dev"` | Convex watcher plus Next.js without rerunning the seed                    |
| `pnpm convex:dev`                           | Convex setup/sync/watch only                                              |
| `pnpm convex:seed`                          | Seed the selected development deployment                                  |
| `pnpm dev`                                  | Next.js development server only                                           |
| `pnpm lint`                                 | ESLint checks                                                             |
| `pnpm typecheck`                            | TypeScript check without emitting files                                   |
| `pnpm test`                                 | Vitest suite                                                              |
| `pnpm build`                                | Production Next.js build                                                  |
| `pnpm start`                                | Serve an existing production build                                        |

Run the full local verification set with:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

With a configured Convex deployment, this performs a one-shot function sync/typecheck:

```bash
pnpm convex:dev -- --once
```

## Production deployment: Convex and Vercel

1. Confirm all verification commands pass and the local voice flow works.
2. In Convex, create or select the production deployment and generate a production deploy key with deployment permission.
3. Import the Git repository into Vercel and use Node.js 20 or newer.
4. Add these Vercel environment variables:
   - `RUNWAYML_API_SECRET` as a secret for every environment in which calls should work.
   - `CONVEX_DEPLOY_KEY` as a Production-only secret using the Convex production key.
   - Optional server-side avatar variables and `RUNWAYML_BASE_URL` only if overriding defaults.
   - Optional `CONVEX_URL` for Production only, set to the production Convex URL. The route otherwise uses the build-injected public URL.
5. Set the Vercel Build Command to:

   ```bash
   pnpm exec convex deploy --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL --cmd 'pnpm run build'
   ```

   This pushes the Convex schema/functions and injects the selected production URL into the Next.js build.

6. Deploy, then seed production once from a trusted local shell linked to the same Convex project:

   ```bash
   pnpm exec convex run seed:seedDemo --prod
   ```

7. Open the production URL, confirm the chart/tickets load, and complete one short call before recording.

For Vercel preview deployments, use a Convex preview deploy key in the Preview environment and optionally seed each fresh preview automatically:

```bash
pnpm exec convex deploy --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL --cmd 'pnpm run build' --preview-run 'seed:seedDemo'
```

Do not expose the production `CONVEX_URL` to Preview if previews should use their isolated Convex deployments.

The RPC route is a five-minute streaming Node function. Keep Vercel Fluid Compute enabled and confirm the project allows the route’s configured 300-second duration. Without the required duration, the backend tool connection can be terminated before the Runway session ends.

Relevant deployment references:

- [Convex with Vercel](https://docs.convex.dev/production/hosting/vercel)
- [Convex deploy command](https://docs.convex.dev/cli/reference/deploy)
- [Vercel streaming functions](https://vercel.com/docs/functions/streaming-functions)
- [Vercel function duration](https://vercel.com/docs/functions/configuring-functions/duration)

## Troubleshooting

### The page shows “Connect the live Convex data”

`NEXT_PUBLIC_CONVEX_URL` was unavailable when Next.js started. Let `pnpm convex:dev` finish configuration, verify that it updated `.env.local`, then restart Next.js. Do not paste the URL into source code.

### The dashboard loads but the chart and ticket table are empty

Run `pnpm convex:seed` against the same deployment named by `.env.local`. The seed output should report 90 inserted or updated revenue rows and seven inserted or updated baseline tickets.

### `RUNWAYML_API_SECRET` is rejected

The connect and RPC routes enforce the current key shape: `key_` plus 128 hex characters. Copy the complete active key from the Runway Developer Portal, confirm the account has credits, and restart Next.js after changing `.env.local`.

### Session provisioning times out

The app polls for `READY` for 55 seconds inside a 90-second server function. Check the key, Runway credits, and API status, then retry. A failed session is deleted by the route before it returns an error.

### “Nova’s server tools could not connect” or `RPC_DISCONNECTED`

- Confirm `CONVEX_URL` or `NEXT_PUBLIC_CONVEX_URL` points to a reachable deployment containing the current functions.
- Confirm the seed ran on that same deployment.
- Do not connect a second backend RPC handler to the same session.
- On Vercel, confirm streaming is not buffered and Fluid Compute permits 300 seconds.
- End the call and create a new session; do not reuse the old session ID.

### Nova speaks but cannot see or operate the page

Start with “Share screen & call Nova,” select the current browser tab, and keep sharing active. Check microphone and screen permissions. A voice-only call can use tools but does not prove screen awareness. If using a custom character, ensure it uses a preset voice.

### A client tool changes the UI but Nova does not receive data

That is intentional. `set_date_range` and `open_panel` are fire-and-forget browser tools. Only `get_revenue` and `create_ticket` return data to Nova.

### A retake creates ticket `4806` instead of `4805`

The seed preserves tickets created during previous takes. This protects real writes and demonstrates live reactivity. Use the new sequential ID in the recording, or use a fresh Convex deployment and seed it to restore the pristine `4805` starting point.

### The call drops or reaches five minutes

End/reset the Nova card and start a fresh call. One-time session credentials cannot reconnect after consumption.

## Runway references

- [Characters quickstart](https://docs.dev.runwayml.com/characters/quickstart/)
- [Building a Characters integration](https://docs.dev.runwayml.com/characters/integration/)
- [Characters core concepts](https://docs.dev.runwayml.com/characters/concepts/)
- [Tool calling](https://docs.dev.runwayml.com/characters/tools/)
- [Client tools](https://docs.dev.runwayml.com/characters/tools/client-tools/)
- [Server tools](https://docs.dev.runwayml.com/characters/tools/server-tools/)
- [Camera and screen sharing](https://docs.dev.runwayml.com/characters/screens/)
- [React SDK repository](https://github.com/runwayml/avatars-sdk-react)
