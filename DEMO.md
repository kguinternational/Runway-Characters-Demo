# Recording runbook

This sequence shows every useful tool class in about three minutes without one
fragile, cross-page mega command.

## Before the call

1. Run `pnpm demo` and open [http://localhost:3000](http://localhost:3000).
2. Open `/settings` and click **Test microphone**. This checks browser
   permission without starting a Runway session or spending Characters credits.
3. Return to `/`, choose light mode, and close any open panel.
4. Click **Start call** and wait for Nova to appear. This is the only
   credit-consuming step in the runbook.
5. The camera control is available but the camera starts off. Leave it off for
   this screen-sharing flow.
6. In Runway’s standard control bar, click the screen button, choose the current
   Northstar tab, and wait for the sharing indicator. The mounted screen-share
   view appears only while that track is active.

Nova’s opening is only:

> Hi — how can I help?

Say each prompt separately and wait for its speech or visible action before
continuing. Client tools and Page Actions are fire-and-forget browser events, so
they do not return a completion result to the conversation. Short turns give a
new route time to render and let server tools provide the facts Nova speaks.

## Recording sequence

### 1. Live dashboard morning brief

Say:

> Give me the morning brief for this dashboard. Include revenue movement,
> refunds, open tickets, and the busiest support team.

Expected:

- `get_overview_insights` reads current Convex data;
- Nova speaks a concise brief using the returned values;
- she does not estimate from the cards.

Manual equivalent: click the Overview insight control
(`overview-insight`).

Then say:

> Put that brief on screen.

Expected:

- Nova gives a short lead-in;
- `open_panel` opens a visible summary panel;
- the panel is a browser event, not another database lookup.

Manual equivalent: click the dashboard detail control
(`overview-open-panel`).

### 2. Page Actions and Revenue navigation

Say:

> Show me the Page Actions preview.

Expected:

- Nova briefly explains the visible action;
- `highlight` identifies `overview-page-actions`;
- `click` activates it and `scroll_to` brings the target section into view.

Manual equivalent: click `overview-page-actions`.

Now say only:

> Open Revenue.

Expected:

- Nova says she is opening Revenue;
- Page Actions highlight and click the Revenue navigation target;
- the route changes to `/revenue`;
- Nova does not attempt destination-page tools before the route has rendered.

Manual equivalent: click **Revenue** in the sidebar.

After Revenue is visible, say:

> Show me 30 days.

Expected:

- `set_date_range` selects the 30-day view;
- the chart and summary update in the browser.

Manual equivalent: click `range-30d`.

Then say:

> For this 30-day view, give me total revenue, daily average, peak day, and the
> refund insight.

Expected:

- `get_revenue` reads the selected range from Convex;
- Nova speaks the returned total, comparison, daily average, peak, and refund;
- the answer is based on server data, not chart estimation.

Manual equivalent: click `revenue-insight`. The same page also exposes
`range-7d`, `range-30d`, `range-90d`, and `revenue-anomaly`.

For one more visible action, say:

> Highlight and open the refund anomaly.

Expected: Nova speaks first, then highlights and clicks `revenue-anomaly`.

Manual equivalent: click the refund anomaly on the chart.

### 3. Support workload and exact ticket lookup

Say only:

> Open Tickets.

Wait for `/tickets`, then say:

> How is the support workload split by status and team? Include the busiest
> team and latest ticket.

Expected:

- `get_ticket_insights` returns the live open/closed split and team counts;
- Nova speaks the workload insight.

Manual equivalent: click `tickets-insight`; the **All**, **Open**, and
**Billing** filters expose the queue directly.

Then say:

> Look up ticket 4801 and tell me its subject, team, and status.

Expected:

- `get_ticket` returns exactly ticket `4801`;
- Nova speaks the returned record rather than choosing a nearby row.

Manual equivalent: click `ticket-row-4801`.

### 4. Close and reopen a real ticket

Say:

> Close ticket 4801.

Expected:

- `update_ticket_status` writes `closed` to Convex;
- Nova confirms the returned ticket ID and new status;
- the row updates reactively.

Then restore the demo state:

> Reopen ticket 4801.

Expected: the same tool returns and speaks the new `open` status.

Manual equivalent for either change: open `ticket-row-4801`, then click
`ticket-status-4801`.

### 5. Create a real support ticket

Say:

> Create a Billing ticket called Customer refund timeline is incomplete.

Expected:

- `create_ticket` writes a real Convex ticket;
- Nova speaks the returned ticket ID;
- the new ticket appears in the table.

Manual equivalent: click `new-ticket`, complete the form, then click
`submit-ticket`.

### 6. Finish with a visible theme action

Say:

> Switch to dark mode.

Expected: Nova speaks first, then highlights and clicks `theme-toggle`.

Manual equivalent: click the theme button in the top bar.

## Reliable prompt pattern

Use this rhythm when improvising:

1. Navigate: “Open Revenue.”
2. Wait for the page.
3. Change one visible control: “Show me 90 days.”
4. Ask one data question: “What changed, and where is the peak?”

Avoid:

> Open Revenue, switch to 90 days, inspect the refund, open Tickets, create a
> ticket, and change the theme.

That asks fire-and-forget client actions to coordinate across route renders.
Runway’s documented contract does not send those browser results back to the
conversation.

## If Nova cannot hear or respond

- Confirm the microphone button in Runway’s control bar is enabled.
- Confirm the browser granted microphone permission.
- Wait for the current short response before issuing the next prompt.
- If a one-use session disconnects, end it and start a fresh call.
- If a server insight does not produce speech, inspect the local terminal for an
  RPC error; server tools should either return data or return an error to Nova.

The app relies on the hosted Runway session and standard SDK controls for
microphone and interruption behavior. It does not add custom audio, camera, or
screen-share orchestration.
