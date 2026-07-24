# Recording runbook

The shortest complete demo takes about two minutes.

## Before the call

1. Open `/settings` and click **Test microphone**. This does not start a Runway
   session or spend call credits.
2. Return to `/`, choose light mode, and close any open panel.
3. Click **Share screen & call** and choose the current Northstar tab.
4. Wait for Nova to appear and greet you.

Nova’s opening is only:

> Hi — how can I help?

## Voice sequence

### 1. Navigate and investigate

> Nova, go to Revenue and investigate why the chart looks off.

Expected:

- Nova says she is opening Revenue before the first Page Action;
- navigation visibly changes from `/` to `/revenue`;
- Nova highlights the Revenue navigation target before clicking it;
- Page Actions scroll to and highlight the chart;
- `set_date_range` selects 30 days;
- `get_revenue` reads Convex;
- Nova briefly states the real total, change, and refund dip.

Every step is also clickable: use the Revenue sidebar link, 30-day button, and
refund callout.

### 2. Create a real ticket

> Go to Tickets and create a Billing ticket for that refund.

Expected:

- navigation visibly changes to `/tickets`;
- Nova highlights the Tickets navigation target before clicking it;
- `create_ticket` writes to Convex and returns a real ticket ID;
- Nova speaks that ID;
- `open_panel` opens the confirmation;
- the new row appears reactively.

The manual equivalent is **New ticket** → complete the form → **Create real
ticket**.

### 3. Change theme

> Switch to dark mode.

Expected: the Page Action clicks the visible theme control.

## If Nova cannot hear you

- Confirm the microphone button in Runway’s control bar is enabled.
- Check that the browser granted microphone permission.
- End and start a fresh call if the one-use session disconnects.

The current Runway SDK has no public interruption or VAD setting. Barge-in is
handled by the hosted session and depends on a genuinely published microphone
track.
