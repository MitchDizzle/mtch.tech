# Stream control

A small Node server that runs on the streaming PC. It serves the camera
overlay to OBS and a control panel to your phone, and keeps them in sync over
a WebSocket. It also relays commands to OBS so you can switch scenes and fire
transitions from the phone.

## Why this is local rather than on mtch.tech

Two reasons, both hard constraints rather than preferences:

1. **Mixed content.** A page served over `https` cannot open a `ws://`
   connection to a device on your LAN - browsers block it. Serving both pages
   over plain http from this machine avoids the problem entirely.
2. **No internet dependency mid-stream.** If your connection drops, the
   overlay keeps working.

The hosted overlays at `mtch.tech/overlay/...` still exist and still work.
They are the zero-setup option; this is the controllable one.

## Setup

```
cd stream-control
npm install
cp config.example.json config.json
```

Edit `config.json`:

- `token` - a shared secret the phone must present. Anything on your LAN can
  reach this server, so it is worth setting even at home.
- `obs.password` - from OBS under **Tools -> WebSocket Server Settings**.
  It stays on this machine; the phone never receives it.
- `obs.scenes` - the scene names to show as buttons. Must match OBS exactly.

Then:

```
npm start
```

It prints the two URLs you need.

### While developing

```
npm run dev
```

Node's built-in `--watch` restarts the server whenever `server.js`, anything
in `lib/`, or `config.json` changes - no Ctrl+C and re-run. No extra
dependency; this is a Node feature, not nodemon.

Files in `public/` are deliberately **not** watched. They are served from disk
on every request, so a browser refresh already picks them up - restarting for
those would only drop the websocket for no reason.

Use plain `npm start` when you are actually streaming. A stray file save
should not restart the server mid-broadcast.

## OBS

1. **Tools -> WebSocket Server Settings**, enable the server, copy the
   password into `config.json`.
2. Add a **Browser Source** pointing at `http://localhost:8420/overlay`.
3. Set Width **1920** and Height **1080**. The overlay now covers the whole
   canvas rather than being sized to the camera - everything inside it is
   positioned from the control panel.
4. **Add the same source to every scene.** In each other scene use
   *Add existing* rather than creating a new Browser Source. OBS shares one
   instance, so the page never reloads on a scene cut. That is what keeps the
   websocket connected and what will let a transition animation survive the
   cut.
5. Drag the browser source **above** your camera in the source list. The
   camera frame is a border with a transparent middle, so the camera shows
   through.
6. Do **not** tick *Refresh browser when scene becomes active* - this overlay
   holds a live connection and refreshing drops it for no reason.
7. Untick **Shutdown source when not visible** on the shared overlay. Shutting
   it down defeats the point of one persistent instance.

### Camera settings

**Capture resolution:** set the camera source to your webcam's native
resolution in Device Properties - 1080p if it does it. Let OBS scale it down.
Downscaling looks clean; upscaling a small capture to fill the frame looks
soft. Capture resolution and on-canvas size are independent.

**On-canvas transform: let the panel manage it.** Put your camera source's
exact name in `config.json`:

```json
"cameraSource": "Webcam"
```

Now moving or resizing the frame from your phone moves the camera to match.
The camera is re-positioned when you switch scenes, and re-applied whenever
the server reconnects to OBS.

Two details that make this work properly:

- The stored width and height describe the **transparent hole**, not the outer
  box - the border is drawn outside them. So the camera rectangle is exactly
  the width and height shown in the panel, and a 16:9 frame gives a 16:9 hole
  with no letterboxing.
- The camera is placed using OBS **bounds** (`OBS_BOUNDS_SCALE_INNER`) rather
  than a scale factor, so it fits the box preserving aspect ratio whatever
  resolution the webcam reports. Change the capture resolution and nothing
  needs recalculating.

**Do not put the camera in a group** when using `cameraSource`. Two reasons:

- obs-websocket does not treat a group as part of its scene. Children of a
  group are addressed with the *group* name where a scene name would go, so a
  grouped source looks "not found" even though it is plainly visible in the
  source list. The server detects this case and says so explicitly.
- A grouped item's position is relative to the group, not the canvas, so
  canvas coordinates would not land where you expect even once found.

Grouping was only ever the manual workaround. With `cameraSource` set, drag
the camera out of the group and let the server position it.

Leave `cameraSource` empty to manage the camera yourself. In that case group
them instead: select the camera and the overlay in the source list, right
click, *Group Selected Items*, and drag the group.

## Phone

The server prints a LAN URL with the token already embedded, something like:

```
http://192.168.1.20:8420/control?token=your-token
```

Open that on the phone and it authenticates itself - the page saves the token
and strips it from the address bar so it does not sit in your history. Easiest
way across is to text the URL to yourself or make a QR of it.

You can also open `/control` bare and type the token into the form. Either
way it is stored on the phone and only asked once.

Add it to your home screen and it opens like an app.

### Turning the token off

Use a bare `null`, no quotes:

```json
"token": null
```

`"token": "null"` is a *string* - a perfectly valid token that the server will
sit there asking you to type. The server warns on startup if it spots this.

## Networking

**You do not need to port forward anything.** Port forwarding exists to let
traffic in from the internet. Your phone and this PC are on the same LAN, so
packets go phone -> router -> PC and never touch your WAN interface.

Forwarding this would be actively harmful - it would expose a panel that can
drive your OBS to the public internet.

### If the phone cannot connect

In the order worth checking:

1. **Windows Firewall.** Node binds the port fine, but Windows blocks inbound
   connections from other devices by default. You normally get a prompt the
   first time you run the server - allow it on **Private** networks, not
   Public. If you dismissed that prompt, the phone will just time out with no
   error worth reading.

   To add the rule by hand, in an elevated PowerShell:

   ```
   New-NetFirewallRule -DisplayName "Mitchtopia stream control" `
     -Direction Inbound -Protocol TCP -LocalPort 8420 `
     -Profile Private -Action Allow
   ```

2. **Phone is on cellular, not Wi-Fi.** Obvious, easily missed.

3. **Phone is on the guest network.** Most routers isolate guest clients from
   the main network completely.

4. **AP isolation / client isolation** is on in the router. This blocks
   device-to-device traffic even within one network. Usually off by default,
   but it exists and it produces exactly this symptom.

5. **The server rejected it as non-LAN.** Check the server console - it logs
   any request it turns away and the address it came from. If your network
   uses an address range outside the normal private blocks, add it to
   `PRIVATE` in `server.js` or set `lanOnly: false`.

### Reaching it from outside the house

Do not open a port. Use a VPN back into your network, or Tailscale, which
gives the PC and the phone addresses on a private mesh with no router
configuration at all.

## Profiles

Modelled on OBS scene collections, but with inheritance.

**Base** holds a complete set of values. Every other profile stores **only the
keys it overrides**, plus a pointer to what it inherits from. A new profile
starts identical to Base and diverges only where you deliberately change
something.

That is the whole point: change the border thickness on Base and every profile
that has not overridden it follows. Duplicated presets would not do that.

In the Settings tab, a small dot next to a setting means the active profile
overrides it. The arrow button beside it drops the override so the value falls
back to what it inherits. The banner at the top of Settings always says which
profile you are editing, and turns red on Base as a reminder that changes there
reach everything.

Profiles and their overrides are saved in `state.json`. An older, pre-profiles
`state.json` is migrated into Base automatically on first run.

## What the panel does

**Camera frame** - show/hide the frame, toggle the shine and corners, set the
shine cycle and border thickness, and retint the frame with the site's panel
tones.

**Trigger** - restart the shine sweep on demand, or push a themed toast onto
the overlay with your own text.

**OBS** - switch scenes and fire the studio-mode transition. Extend
`lib/obs.js` for anything else; the protocol covers source visibility, audio
muting, recording and much more.

## Security, stated plainly

This is protected by **not being reachable from the internet**. Do not
port-forward it.

The LAN check and the token exist to stop other devices on your own network
from poking at it - a smart TV, a games console, a guest phone - not to make
it safe to expose. There is no TLS and no rate limiting, because on a LAN
neither buys much.

If you ever want this reachable from outside your house, do not open a port.
Use a VPN back into your network, or Tailscale.

## Extending

- **State** lives in one object in `server.js`. Add a key, send it from the
  phone, read it in `overlay.html`. Nothing else needs changing.
- **Events** are fire-and-forget: `{ type: "event", name: "...", payload: {} }`
  is broadcast to every client. Handle the new name in the overlay's
  `onEvent`.
- **OBS actions** are wrappers in `lib/obs.js`. Add a method, add a case in
  the `msg.type === "obs"` branch of `server.js`, add a button.

## Planned

**Themes as shareable templates.** The edge decoration (double line, studs,
ticks, corner brackets) is currently a handful of booleans on `cam`. The next
step is bundling a look - decoration set, palette, panel styling - into a named
theme that lives in its own file, so a theme can be swapped wholesale and
shared with someone else running this tool.

The shape that fits what already exists: a theme is a set of *defaults*, and a
profile overrides on top of it. That is the same inheritance the profile system
already implements, with one more layer underneath - so `resolve()` grows a
step rather than being rewritten.

Worth doing only once the decoration set stops changing. Freezing a file format
around booleans that are still in flux would mean migrating every theme each
time one is added.

Also outstanding from the original list:

- Toast presets with sound
- `POST /api/trigger` so Streamer.bot, Firebot or curl can fire alerts
- The scene transition sequence (outro panels, cut, intro)

## Known limitations

- The scene buttons show what you last pressed, not what OBS is actually on.
  Reading real scene state needs a subscription to OBS events, which is a
  larger change than it looks.
- One state object, so all overlays share it. Fine for one camera frame; if
  you add more overlays they will need namespacing.
