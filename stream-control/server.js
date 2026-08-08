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
   local copy. */

const state = {
  cam: {
    visible: true,
    shine: true,
    speed: 7,
    frame: 4,
    corners: true,
    tone: "default"
  }
};

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

wss.on("connection", (ws, req) => {
  ws.authed = !config.token;
  clients.add(ws);

  const role = new URL(req.url, "http://x").searchParams.get("role") || "unknown";
  ws.role = role;

  if (ws.authed) send(ws, { type: "state", state });
  else send(ws, { type: "auth-required" });

  ws.on("message", async (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }

    /* --- auth --- */
    if (msg.type === "auth") {
      /* Constant-time-ish comparison. The exposure here is tiny, but a plain
         === leaks length and prefix through timing, and the fix is free. */
      ws.authed = tokenMatches(msg.token);

      send(ws, { type: ws.authed ? "state" : "auth-failed", state });
      if (!ws.authed) console.warn(`[ws] bad token from ${req.socket.remoteAddress}`);
      return;
    }

    if (!ws.authed) return;

    /* --- overlay state --- */
    if (msg.type === "set") {
      Object.assign(state.cam, msg.cam || {});
      broadcast({ type: "state", state });
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
        if (msg.action === "scene") result = await obs.setScene(msg.scene);
        else if (msg.action === "transition") result = await obs.triggerTransition();
        else if (msg.action === "mute") result = await obs.toggleMute(msg.input);
        else if (msg.action === "scenes") result = await obs.getScenes();
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
  for (const ip of lanAddresses()) {
    console.log(`  Phone control      : http://${ip}:${port}/control`);
  }
  if (config.token) console.log(`  Token              : ${config.token}`);
  console.log(`  OBS relay          : ${config.obs?.enabled ? config.obs.url : "disabled"}`);
  console.log("");
});

process.on("SIGINT", () => { obs.close(); server.close(); process.exit(0); });
