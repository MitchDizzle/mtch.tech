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

## OBS

1. **Tools -> WebSocket Server Settings**, enable the server, copy the
   password into `config.json`.
2. Add a **Browser Source** pointing at `http://localhost:8420/overlay`.
3. Set its Width and Height to your camera's on-screen size - 480 and 270 for
   a typical corner cam, not 1920x1080. Matching them keeps the border an even
   thickness on all four sides.
4. Drag the browser source **above** your camera in the source list. The
   centre is transparent, so the camera shows through.
5. Leave **Shutdown source when not visible** on. Do **not** tick *Refresh
   browser when scene becomes active* - this overlay holds a live connection
   and refreshing drops it needlessly.

## Phone

Open the LAN URL the server prints, something like
`http://192.168.1.20:8420/control`. Enter the token once; it is stored on the
phone.

Add it to your home screen and it opens like an app.

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

## Known limitations

- The scene buttons show what you last pressed, not what OBS is actually on.
  Reading real scene state needs a subscription to OBS events, which is a
  larger change than it looks.
- One state object, so all overlays share it. Fine for one camera frame; if
  you add more overlays they will need namespacing.
