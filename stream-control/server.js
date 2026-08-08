/* ==========================================================================
   Mitchtopia stream control server

   Runs on the streaming PC. Serves two pages and keeps them in sync:

     http://localhost:PORT/overlay    -> point OBS Browser Source here
     http://<lan-ip>:PORT/control     -> open this on your phone

   Why local rather than hosted on mtch.tech:

     1. A page served over https cannot open a ws:// connection to a device
        on your LAN - browsers block it as mixed content. Serving both pages
        over plain http from here sidesteps that entirely.
     2. No internet dependency in the middle of a stream. If your connection
        drops, the overlay keeps working.

   Security model, stated plainly: this is protected by not being reachable
   from the internet. Do not port-forward it. The token and the LAN check are
   there to stop other devices on your own network poking at it, not to make
   it safe to expose.
   ========================================================================== */

import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { timingSafeEqual } from "node:crypto";
import { WebSocketServer } from "ws";
import { ObsClient } from "./lib/obs.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(HERE, "public");
/* The overlay reuses the site's stylesheets rather than duplicating them, so
   a change to the theme shows up in both places. */
const SITE_ASSETS = path.join(HERE, "..", "src", "assets");

/* --------------------------------------------------------------------- config */

function loadConfig() {
  const file = path.join(HERE, "config.json");
  if (!fs.existsSync(file)) {
    console.error("No config.json. Copy config.example.json to config.json first.");
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const config = loadConfig();

/* ---------------------------------------------------------------------- state

   One object, held here, broadcast to every connected client. The overlay
   renders it; the control panel edits it. Because the server owns it, a
   phone that reconnects immediately sees the truth rather than a stale
   local copy.

   Coordinates are in 1920x1080 overlay space, not browser-source pixels. The
   overlay scales that stage to whatever size OBS gives it, so a position set
   here means the same thing regardless of the source dimensions. */

const DEFAULTS = {
  cam: {
    visible: true,
    /* Bottom-right by default, 48px from each edge. */
    x: 1392, y: 762, w: 480, h: 270,
    shine: true,
    speed: 7,
    frame: 4,
    corners: true,

    /* Edge decoration. All static CSS - no animation, so none of it costs
       the encoder anything. */
    inner: true,      // second hairline outside the main border
    studs: false,     // small diamond at the centre of each edge
    ticks: false,     // repeating marks along the top and bottom

    tone: "default",
    /* A hex string here overrides the tone entirely. Empty means "use the
       tone". Tones are five fixed presets; this is the escape hatch when you
       want to match a game's palette. */
    accent: ""
  },
  info: {
    visible: false,
    banner: "Now",
    title: "",
    subtitle: "",
    body: "",
    x: 48, y: 872, w: 620,
    tone: "default",
    accent: ""
  },
  toast: {
    x: 1412, y: 48, w: 460
  }
};

const SECTIONS = Object.keys(DEFAULTS);

/* --------------------------------------------------------------------------
   Profiles

   Modelled on OBS scene collections: "base" holds a complete set of values,
   and every other profile stores ONLY the keys it overrides, with a pointer
   to what it inherits from.

   Storing overrides rather than full copies is the whole point. Change the
   border thickness on base and every profile that has not deliberately
   overridden it follows - which is what you get from inheritance and not from
   duplicated presets.
   -------------------------------------------------------------------------- */

const STATE_FILE = path.join(HERE, "state.json");

function emptyValues() {
  return SECTIONS.reduce((acc, s) => (acc[s] = {}, acc), {});
}

function freshStore() {
  return {
    active: "base",
    order: ["base"],
    profiles: {
      base: {
        name: "Base",
        inherits: null,
        values: JSON.parse(JSON.stringify(DEFAULTS))
      }
    }
  };
}

/* Walk the inheritance chain to a flat set of values. Base sits at the root,
   so a missing key anywhere still lands on a real default. */
function resolve(store, id = store.active) {
  const chain = [];
  let cursor = id;
  const seen = new Set();

  while (cursor && store.profiles[cursor] && !seen.has(cursor)) {
    seen.add(cursor);                     // a cycle would otherwise hang here
    chain.unshift(store.profiles[cursor]);
    cursor = store.profiles[cursor].inherits;
  }

  const out = JSON.parse(JSON.stringify(DEFAULTS));
  for (const profile of chain) {
    for (const section of SECTIONS) {
      if (profile.values[section]) Object.assign(out[section], profile.values[section]);
    }
  }
  return out;
}

function loadStore() {
  const store = freshStore();
  if (!fs.existsSync(STATE_FILE)) return store;

  try {
    const saved = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));

    if (saved.profiles && saved.profiles.base) {
      Object.assign(store.profiles, saved.profiles);
      /* Base must always carry a complete set, so fill any key added since
         this file was written. */
      for (const section of SECTIONS) {
        store.profiles.base.values[section] = Object.assign(
          {}, DEFAULTS[section], store.profiles.base.values[section] || {}
        );
      }
      store.order = Array.isArray(saved.order) && saved.order.length
        ? saved.order.filter((id) => store.profiles[id])
        : Object.keys(store.profiles);
      if (!store.order.includes("base")) store.order.unshift("base");
      store.active = store.profiles[saved.active] ? saved.active : "base";
    } else if (saved.cam) {
      /* Migrate a pre-profiles state.json: whatever was saved becomes base. */
      for (const section of SECTIONS) {
        if (saved[section]) Object.assign(store.profiles.base.values[section], saved[section]);
      }
      console.log("[state] migrated flat state.json into the base profile");
    }

    console.log(`[state] restored, ${store.order.length} profile(s), active "${store.active}"`);
  } catch (err) {
    console.warn(`[state] could not read state.json (${err.message}), using defaults`);
  }
  return store;
}

const store = loadStore();

/* What the clients get: the profile tree plus the flattened values the
   overlay actually renders. The overlay never has to understand inheritance. */
function payload() {
  return { type: "state", store, state: resolve(store) };
}

/* Debounced so dragging a slider does not write the file sixty times a
   second. Settings survive a restart without the disk doing any real work. */
let saveTimer = null;
function saveState() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    fs.writeFile(STATE_FILE, JSON.stringify(store, null, 2), (err) => {
      if (err) console.warn(`[state] save failed: ${err.message}`);
    });
  }, 400);
}

/* --------------------------------------------------------------------------
   Camera follow

   A browser source cannot contain an OBS camera source, so "docked" has to
   mean "kept in register". Whenever the frame moves or resizes, the camera is
   given the same rectangle.

   Because .cam is content-box, the stored w and h ARE the transparent hole -
   no border maths needed here.
   -------------------------------------------------------------------------- */

let followTimer = null;
let lastFollow = "";
let followedOnce = false;
let lastFollowError = "";

/* Force the next sync through even if the geometry has not changed.

   The dedupe below stops a held nudge button spamming OBS, but it also means
   the server never corrects drift it did not cause - the camera being dragged
   in OBS, a scene collection reload, a resize. Anything that suggests the two
   may have fallen out of step calls this first. */
function resyncCamera() {
  lastFollow = "";
  syncCamera();
}

function syncCamera() {
  const name = config.obs?.cameraSource;

  /* Say why nothing is happening, once, rather than failing silently. Every
     one of these is a configuration mistake worth surfacing. */
  if (!config.obs?.enabled) return;
  if (!name) {
    if (!followedOnce) {
      followedOnce = true;
      console.log("[obs] camera follow off - obs.cameraSource is empty in config.json");
    }
    return;
  }
  if (!obs.ready) return;   // not an error, the reconnect handler retries

  const c = resolve(store).cam;

  /* The hole, not the outer box.

     .cam is content-box, so its width and height ARE the hole - but `left`
     and `top` still position the BORDER box, because absolute positioning
     offsets the margin edge regardless of box-sizing. The transparent middle
     therefore starts one border-width in on each axis.

     Getting this wrong put the camera up and to the left of the hole by the
     frame width, which reads as an uneven gap around the picture. */
  const f = Math.round(c.frame || 0);
  const rect = {
    x: Math.round(c.x) + f,
    y: Math.round(c.y) + f,
    w: Math.round(c.w),
    h: Math.round(c.h)
  };

  /* Skip if nothing actually moved. Holding a nudge button, or changing a
     setting with no geometry effect, should not spam OBS. */
  const signature = `${rect.x},${rect.y},${rect.w},${rect.h}`;
  if (signature === lastFollow) return;

  clearTimeout(followTimer);
  followTimer = setTimeout(async () => {
    try {
      const { currentProgramSceneName } = await obs.currentScene();
      await obs.setItemRect(currentProgramSceneName, name, rect);
      lastFollow = signature;
      lastFollowError = "";

      /* Confirm the first success loudly, then stay quiet. Without this there
         is no way to tell a working setup from a silently broken one. */
      if (!followedOnce) {
        followedOnce = true;
        console.log(
          `[obs] camera follow active - "${name}" in "${currentProgramSceneName}" ` +
          `at ${rect.x},${rect.y} ${rect.w}x${rect.h}`
        );

        /* Aspect check, once.

           Bounds use OBS_BOUNDS_SCALE_INNER, which fits the source inside the
           box without distorting it. If the camera's aspect differs from the
           frame's, that fit leaves bars - which looks like the camera is
           mysteriously smaller than its hole. Say so rather than leaving it
           to be puzzled over. */
        try {
          const found = await obs.findItem(currentProgramSceneName, name);
          const { sceneItemTransform: t } = await obs.call("GetSceneItemTransform", {
            sceneName: currentProgramSceneName,
            sceneItemId: found.sceneItemId
          });

          const srcAspect = t.sourceWidth / t.sourceHeight;
          const boxAspect = rect.w / rect.h;

          if (Math.abs(srcAspect - boxAspect) > 0.02) {
            console.warn(
              `[obs] camera is ${t.sourceWidth}x${t.sourceHeight} ` +
              `(${srcAspect.toFixed(2)}:1) but the frame is ${boxAspect.toFixed(2)}:1.\n` +
              `      The picture is fitted inside the hole without distorting, so ` +
              `you will see bars.\n` +
              `      Set the camera's Device Properties to a 16:9 resolution to match.`
            );
          }
        } catch { /* diagnostic only */ }
      }
    } catch (err) {
      /* Report each distinct problem once. Repeating it on every nudge would
         bury the console, but suppressing it entirely - which the previous
         version did - hides a wrong source name completely. */
      if (err.message !== lastFollowError) {
        lastFollowError = err.message;
        console.warn(`[obs] camera follow failed: ${err.message}`);

        if (err.inGroup) {
          console.warn(
            "      A grouped item's position is relative to the group, not to\n" +
            "      the canvas, so it cannot be placed at canvas coordinates.\n" +
            "      Drag it out of the group in OBS - the group was only ever a\n" +
            "      manual workaround, and the server manages the position now."
          );
        } else if (/no source named/i.test(err.message)) {
          console.warn(
            `      Check the spelling of obs.cameraSource in config.json, or\n` +
            `      switch to the scene that contains it.`
          );
        }
      }
    }
  }, 120);
}

/* Drift watchdog. Reads what OBS actually has and corrects only a real
   mismatch, so it is a no-op read when everything already agrees. */
let enforceTimer = null;

async function checkCameraDrift() {
  const name = config.obs?.cameraSource;
  if (!name || !obs.ready) return;

  try {
    const { currentProgramSceneName } = await obs.currentScene();
    const found = await obs.findItem(currentProgramSceneName, name);
    if (found.inGroup) return;

    const { sceneItemTransform: t } = await obs.call("GetSceneItemTransform", {
      sceneName: currentProgramSceneName,
      sceneItemId: found.sceneItemId
    });

    const c = resolve(store).cam;
    /* A pixel of tolerance - OBS stores these as floats and rounding alone
       should not trigger a correction. */
    const off =
      Math.abs(t.positionX - c.x) > 1 ||
      Math.abs(t.positionY - c.y) > 1 ||
      Math.abs(t.boundsWidth - c.w) > 1 ||
      Math.abs(t.boundsHeight - c.h) > 1;

    if (off) {
      console.log("[obs] camera drifted, correcting");
      resyncCamera();
    }
  } catch { /* wrong scene, source missing - the normal sync path reports it */ }
}

function slug(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "profile";
}

/* ------------------------------------------------------------------ LAN guard */

const PRIVATE = [
  /^127\./, /^10\./, /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^::1$/, /^::ffff:127\./, /^f[cd][0-9a-f]{2}:/i, /^fe80:/i
];

function isLan(addr = "") {
  const clean = addr.replace(/^::ffff:/, "");
  return PRIVATE.some((re) => re.test(addr) || re.test(clean));
}

/* Constant-time compare. The exposure here is tiny, but a plain === leaks
   length and prefix through timing and the fix costs nothing. */
function tokenMatches(supplied) {
  const a = Buffer.from(String(supplied || ""));
  const b = Buffer.from(String(config.token));
  if (a.length !== b.length) return false;
  try { return timingSafeEqual(a, b); } catch { return false; }
}

function guard(req, res) {
  if (!config.lanOnly) return true;
  const addr = req.socket.remoteAddress || "";
  if (isLan(addr)) return true;
  console.warn(`[http] rejected non-LAN request from ${addr}`);
  if (res) { res.writeHead(403); res.end("LAN only"); }
  return false;
}

/* ----------------------------------------------------------------- static http */

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png"
};

function serveFile(res, file) {
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end("not found"); return; }
    res.writeHead(200, {
      "Content-Type": TYPES[path.extname(file)] || "application/octet-stream",
      /* Never cache: you will edit these while OBS has them open. */
      "Cache-Control": "no-store"
    });
    res.end(data);
  });
}

/* Resolve a request path inside a root, refusing anything that escapes it. */
function safeJoin(root, urlPath) {
  const resolved = path.join(root, path.normalize(urlPath).replace(/^(\.\.[/\\])+/, ""));
  return resolved.startsWith(root) ? resolved : null;
}

const server = http.createServer((req, res) => {
  if (!guard(req, res)) return;

  const url = new URL(req.url, "http://localhost");
  let pathname = url.pathname;

  if (pathname === "/") pathname = "/control";
  if (pathname === "/control") pathname = "/control.html";
  if (pathname === "/overlay") pathname = "/overlay.html";

  /* Site stylesheets, shared with the built site. */
  if (pathname.startsWith("/site-assets/")) {
    const file = safeJoin(SITE_ASSETS, pathname.replace("/site-assets/", ""));
    if (!file) { res.writeHead(400); res.end("bad path"); return; }
    return serveFile(res, file);
  }

  /* Lets the control page discover config without hardcoding it. */
  if (pathname === "/api/config") {
    res.writeHead(200, { "Content-Type": TYPES[".json"], "Cache-Control": "no-store" });
    res.end(JSON.stringify({
      needsToken: Boolean(config.token),
      obsEnabled: Boolean(config.obs?.enabled),
      scenes: config.obs?.scenes || []
    }));
    return;
  }

  const file = safeJoin(PUBLIC, pathname);
  if (!file) { res.writeHead(400); res.end("bad path"); return; }
  serveFile(res, file);
});

/* --------------------------------------------------------------------- obs */

const obs = new ObsClient(config.obs || { enabled: false }, console.log);

/* Re-apply the frame rectangle whenever OBS (re)connects. Clearing the
   signature forces it through even if nothing changed on our side - OBS may
   have been restarted with the camera somewhere else entirely. */
obs.onReady = () => {
  resyncCamera();

  /* Optional drift watchdog. Off by default because while you are setting a
     scene up, a server that keeps yanking the camera back is infuriating.
     Turn it on once the layout is settled and the frame becomes authoritative.

     Compares OBS's actual transform against the expected rectangle and only
     writes when they differ, so a matching camera costs one read. */
  if (config.obs?.enforceCamera) {
    clearInterval(enforceTimer);
    enforceTimer = setInterval(checkCameraDrift, 5000);
  }
};

obs.connect();

/* --------------------------------------------------------------- websockets */

const wss = new WebSocketServer({ noServer: true });
const clients = new Set();

server.on("upgrade", (req, socket, head) => {
  if (!guard(req, null)) { socket.destroy(); return; }
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
});

function send(ws, payload) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(payload));
}

function broadcast(payload, exclude = null) {
  for (const ws of clients) {
    if (ws !== exclude && ws.authed) send(ws, payload);
  }
}

/* Loopback is this machine. Anything running here can read config.json and
   the OBS password already, so a token adds nothing - and demanding one broke
   the overlay, whose OBS URL is a bare http://localhost:8420/overlay with no
   ?token= to answer the challenge with. The token exists to keep OTHER LAN
   devices out. */
function isLoopback(addr = "") {
  return /^(::1|::ffff:127\.|127\.)/.test(addr);
}

wss.on("connection", (ws, req) => {
  const addr = req.socket.remoteAddress || "";
  ws.authed = !config.token || isLoopback(addr);
  clients.add(ws);

  const role = new URL(req.url, "http://x").searchParams.get("role") || "unknown";
  ws.role = role;

  if (ws.authed) send(ws, payload());
  else send(ws, { type: "auth-required" });

  /* An overlay connecting means it just loaded or reloaded, and its frame is
     being drawn fresh from state. Re-assert the camera so the two cannot
     drift apart across a reload. */
  if (role === "overlay") resyncCamera();

  ws.on("message", async (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }

    /* --- auth --- */
    if (msg.type === "auth") {
      /* Constant-time-ish comparison. The exposure here is tiny, but a plain
         === leaks length and prefix through timing, and the fix is free. */
      ws.authed = tokenMatches(msg.token);

      send(ws, ws.authed ? payload() : { type: "auth-failed" });
      if (!ws.authed) console.warn(`[ws] bad token from ${req.socket.remoteAddress}`);
      return;
    }

    if (!ws.authed) return;

    /* --- overlay state ---
       Writes land on the ACTIVE profile. On a child profile that creates an
       override; on base it changes the value everything inherits. */
    if (msg.type === "set") {
      const profile = store.profiles[store.active];
      if (!profile) return;

      for (const section of SECTIONS) {
        if (!msg[section]) continue;
        profile.values[section] = profile.values[section] || {};
        Object.assign(profile.values[section], msg[section]);
      }
      broadcast(payload());
      saveState();
      syncCamera();
      return;
    }

    /* Drop an override so the key falls back to whatever it inherits. Base
       has nothing to fall back to, so it resets to the shipped default. */
    if (msg.type === "inherit") {
      const profile = store.profiles[store.active];
      if (!profile || !SECTIONS.includes(msg.section)) return;

      if (store.active === "base") {
        profile.values[msg.section][msg.key] = DEFAULTS[msg.section][msg.key];
      } else if (profile.values[msg.section]) {
        delete profile.values[msg.section][msg.key];
      }
      broadcast(payload());
      saveState();
      syncCamera();
      return;
    }

    /* Reset a whole section on the active profile. */
    if (msg.type === "reset") {
      const profile = store.profiles[store.active];
      if (!profile || !SECTIONS.includes(msg.section)) return;

      if (store.active === "base") {
        profile.values[msg.section] = JSON.parse(JSON.stringify(DEFAULTS[msg.section]));
      } else {
        profile.values[msg.section] = {};
      }
      broadcast(payload());
      saveState();
      syncCamera();
      return;
    }

    /* --- profiles --- */
    if (msg.type === "profile") {
      if (msg.action === "switch" && store.profiles[msg.id]) {
        store.active = msg.id;
      }

      if (msg.action === "create") {
        let id = slug(msg.name);
        let n = 2;
        while (store.profiles[id]) id = `${slug(msg.name)}-${n++}`;

        store.profiles[id] = {
          name: String(msg.name || "Profile").slice(0, 40),
          /* Inherit from base by default. Empty values means it starts
             identical to what it inherits, and only diverges where you
             deliberately change something. */
          inherits: store.profiles[msg.inherits] ? msg.inherits : "base",
          values: emptyValues()
        };
        store.order.push(id);
        store.active = id;
      }

      if (msg.action === "rename" && store.profiles[msg.id] && msg.id !== "base") {
        store.profiles[msg.id].name = String(msg.name || "").slice(0, 40) || "Profile";
      }

      if (msg.action === "delete" && msg.id !== "base" && store.profiles[msg.id]) {
        /* Anything inheriting from the deleted profile is re-pointed at base
           rather than left dangling with a broken chain. */
        for (const p of Object.values(store.profiles)) {
          if (p.inherits === msg.id) p.inherits = "base";
        }
        delete store.profiles[msg.id];
        store.order = store.order.filter((x) => x !== msg.id);
        if (store.active === msg.id) store.active = "base";
      }

      broadcast(payload());
      saveState();
      /* Forced, not deduped. Switching profile can change the whole camera
         rectangle at once, and if the new profile happens to match the last
         pushed signature the dedupe would skip it entirely. */
      resyncCamera();
      return;
    }

    /* --- one-shot events: toasts, flashes --- */
    if (msg.type === "event") {
      broadcast({ type: "event", name: msg.name, payload: msg.payload || {} });
      return;
    }

    /* --- OBS relay ---
       The phone names an action; the password stays here. */
    if (msg.type === "obs") {
      try {
        let result = {};
        if (msg.action === "scene") {
          result = await obs.setScene(msg.scene);
          /* The camera in the new scene is a different scene item, so its
             transform has to be applied there too. */
          resyncCamera();
        }
        else if (msg.action === "transition") result = await obs.triggerTransition();
        else if (msg.action === "mute") result = await obs.toggleMute(msg.input);
        else if (msg.action === "scenes") result = await obs.getScenes();
        else if (msg.action === "resync") { resyncCamera(); result = { ok: true }; }
        else throw new Error(`unknown obs action: ${msg.action}`);

        send(ws, { type: "obs-ok", action: msg.action, result });
      } catch (err) {
        send(ws, { type: "obs-error", action: msg.action, message: err.message });
      }
      return;
    }
  });

  ws.on("close", () => clients.delete(ws));
});

/* -------------------------------------------------------------------- boot */

function lanAddresses() {
  const nets = Object.values(os.networkInterfaces()).flat();
  return nets
    .filter((n) => n && n.family === "IPv4" && !n.internal)
    .map((n) => n.address);
}

server.listen(config.port, () => {
  const port = config.port;
  console.log("");
  console.log("  Mitchtopia stream control");
  console.log("  -------------------------");
  console.log(`  OBS browser source : http://localhost:${port}/overlay`);

  /* Print the token in the URL so it can be copied or QR'd straight to the
     phone - the control page saves it and strips it from the address bar.
     Beats typing a secret on a phone keyboard. */
  const q = config.token ? `?token=${encodeURIComponent(config.token)}` : "";
  for (const ip of lanAddresses()) {
    console.log(`  Phone control      : http://${ip}:${port}/control${q}`);
  }
  if (config.token === "null" || config.token === "undefined") {
    console.log("");
    console.log(`  NOTE: token is the string "${config.token}", not a real null.`);
    console.log("        To disable the token use a bare null with no quotes.");
  }
  console.log(`  OBS relay          : ${config.obs?.enabled ? config.obs.url : "disabled"}`);
  console.log(`  Camera follow      : ${
    !config.obs?.enabled ? "off - obs disabled"
      : config.obs.cameraSource ? `"${config.obs.cameraSource}"`
      : "off - obs.cameraSource is empty"
  }`);
  console.log("");
});

process.on("SIGINT", () => { obs.close(); server.close(); process.exit(0); });
