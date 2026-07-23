# Nova recording runbook

This is the shortest reliable path through all three Runway tool types. The complete live sequence should take about two minutes and must stay below the five-minute session limit.

## Before recording

- Confirm `pnpm convex:seed` succeeded against the deployment shown by the app.
- Open the dashboard in a current Chrome or Edge window.
- Set the UI to light mode, close the right-hand panel, and select the 90-day chart range.
- Confirm the Nova card says “Ready for a voice prompt.”
- Check microphone input, speaker output, network stability, and Runway credits.
- Use the default original `music-superstar` preset, or another approved original Runway preset.
- If using a custom original character, use a preset voice so screen sharing remains available.
- Keep this runbook on a second display. Share only the dashboard tab.

## Start the call

1. Click **Share screen & call Nova**.
2. In the browser picker, choose **This Tab** / the Northstar dashboard tab.
3. Allow microphone access.
4. Wait until the card says **Live · Nova can see this tab** and the selected preset finishes its opening greeting. Custom original avatars use Nova's configured opening line.

Do not begin the first prompt while the card still says “Provisioning” or “Connecting live tools.”

## Main recording sequence

Say each prompt exactly, then wait for Nova to finish the visible actions and spoken response before continuing.

### 1. Investigate revenue

> Nova, my revenue chart looks off, can you help?

Expected proof, in order:

1. Page Action `scroll_to` moves the revenue chart into view.
2. Page Action `highlight` pulses around the chart.
3. Client tool `set_date_range` changes the chart to 30 days.
4. Server tool `get_revenue` reads Convex.
5. Nova says the returned total, comparison percentage, refund date, and negative refund amount.

The Nova activity footer should show the Page Actions/client event and then a message like `Revenue checked · $…`. The chart should display a red refund point and refund callout. Do not supply Nova with a number; the proof is that she reads it from the server result.

### 2. Create a real ticket

> Log a ticket for the billing team to check that refund.

Expected proof, in order:

1. Server tool `create_ticket` inserts a real open Billing ticket in Convex.
2. Nova reads back the returned numeric ticket ID.
3. The recent-tickets table and open-ticket KPI update reactively.
4. Client tool `open_panel` slides in a confirmation containing the same ticket ID.

On a pristine seed the first created ticket is `4805`. If previous takes created tickets, the correct result is the next sequential ID. Use the ID Nova actually returns.

### 3. Change theme by voice

> Switch to dark mode.

Expected proof:

1. Page Action `click` targets `theme-toggle`.
2. The dashboard changes to dark mode.
3. Nova confirms the action briefly.

That completes the required flow: built-in Page Actions, custom client tools, backend server tools, screen awareness, spoken database facts, a real write, and a visible UI update.

## Independent tool checks

Use these before the main take if one beat needs isolation.

| Capability | Voice prompt | Expected result |
| --- | --- | --- |
| Page scroll/highlight | “Scroll to the revenue chart and highlight it.” | The chart is centered and highlighted. |
| Client chart state | “Show the revenue chart for the last 30 days.” | `set_date_range` changes the active range without supplying spoken data. |
| Revenue server tool | “Use the database and tell me the exact 30-day revenue total, change, and refund dip.” | `get_revenue` returns real Convex values and Nova speaks them. |
| Ticket server tool | “Create a Billing ticket called Investigate refund in the 30-day revenue report.” | A real row is inserted and Nova reads its ID. |
| Client panel | “Open a panel titled Demo ready with a short confirmation.” | The right-hand panel opens. |
| Theme Page Action | “Switch to dark mode.” | `click` activates the real theme button. |

Client tools intentionally do not return values to Nova. Use the server prompts when the spoken answer must be grounded in data.

## Retake flow

Runway session credentials are one-use and a session lasts at most five minutes. Never try to reconnect the previous WebRTC credentials.

1. End the current call from the call controls and wait for the Nova card to return to idle.
2. Close the confirmation panel.
3. Switch the dashboard back to light mode and select 90 days.
4. If desired, run `pnpm convex:seed` again. This refreshes the 90 revenue rows and seven baseline tickets, but intentionally preserves tickets created during earlier takes.
5. Click **Share screen & call Nova** again, select the dashboard tab again, and wait for **Live**.
6. Start again from prompt 1.

If the recording must begin with ticket `4805`, use a fresh Convex deployment and run the seed once. Otherwise, let the ID increase; that is valid evidence of a real persistent write.

## Failure recovery during a take

- **Screen share denied:** end/reset, click the screen-share start button again, and choose the current dashboard tab.
- **Microphone denied:** allow access in browser site settings, then use **Retry microphone** in the Nova card. Start a fresh session only if the room has already ended.
- **Server tools fail to connect:** end the call, verify the Convex URL/deployment and RPC route logs, then create a fresh session.
- **Session drops:** do not retry the same credentials. Start a fresh session.
- **Nova changes the range but does not state numbers:** ask, “Use the database and tell me the exact 30-day total and refund dip.”
- **Nova states a ticket ID but the panel is late:** wait for the table update, then say, “Open a confirmation panel for that ticket.”
- **The five-minute timer is close:** end and restart rather than risking an on-camera timeout.

## Truth checklist

Before accepting a take, verify all of the following:

- The screen-share indicator was active.
- The chart visibly scrolled/highlighted.
- The chart visibly changed to 30 days.
- Nova’s total/change/dip matched the displayed Convex-backed data.
- The ticket ID appeared both in speech and the UI.
- The ticket row persisted after the action.
- The panel used the returned ID rather than an invented one.
- Dark mode changed through the real tagged button.
- The complete sequence finished under five minutes.
