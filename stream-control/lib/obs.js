/* ==========================================================================
   obs-websocket v5 client

   Speaks the protocol built into OBS 28 and later. Lives on the server so the
   OBS password never leaves this machine - the phone sends "switch to Live"
   and this translates it.

   Handshake:
     OBS  -> Hello (op 0), with a challenge and salt if auth is on
     us   -> Identify (op 1), with the auth string derived below
     OBS  -> Identified (op 2)
   then requests are op 6 and responses op 7, matched by requestId.
   ========================================================================== */

import { WebSocket } from "ws";
import crypto from "node:crypto";

const OP = { HELLO: 0, IDENTIFY: 1, IDENTIFIED: 2, REQUEST: 6, RESPONSE: 7 };

function sha256b64(value) {
  return crypto.createHash("sha256").update(value).digest("base64");
}

/* The auth string OBS expects: hash the password with the salt, then hash
   that result with the challenge. Both stages are base64 of a SHA-256. */
function authString(password, salt, challenge) {
  const secret = sha256b64(password + salt);
  return sha256b64(secret + challenge);
}

export class ObsClient {
  constructor(config, log = console.log) {
    this.config = config;
    this.log = log;
    this.ws = null;
    this.ready = false;
    this.pending = new Map();
    this.nextId = 1;
    this.retryDelay = 2000;
    this.stopped = false;
  }

  connect() {
    if (!this.config.enabled || this.stopped) return;

    this.ws = new WebSocket(this.config.url);

    this.ws.on("open", () => this.log(`[obs] socket open ${this.config.url}`));

    this.ws.on("message", (raw) => {
      let msg;
      try { msg = JSON.parse(raw.toString()); } catch { return; }
      this.handle(msg);
    });

    this.ws.on("close", () => {
      this.ready = false;
      /* Reject anything still waiting rather than leaving callers hanging. */
      for (const [, p] of this.pending) p.reject(new Error("obs disconnected"));
      this.pending.clear();
      if (!this.stopped) {
        this.log(`[obs] disconnected, retrying in ${this.retryDelay / 1000}s`);
        setTimeout(() => this.connect(), this.retryDelay);
      }
    });

    /* OBS not running yet is the normal case, not an error worth shouting
       about - 'close' handles the retry. */
    this.ws.on("error", (err) => {
      if (err.code !== "ECONNREFUSED") this.log(`[obs] ${err.message}`);
    });
  }

  handle(msg) {
    if (msg.op === OP.HELLO) {
      const identify = { rpcVersion: 1 };
      const auth = msg.d.authentication;

      if (auth) {
        if (!this.config.password) {
          this.log("[obs] server requires a password but config.obs.password is empty");
          return;
        }
        identify.authentication = authString(
          this.config.password, auth.salt, auth.challenge
        );
      }

      this.ws.send(JSON.stringify({ op: OP.IDENTIFY, d: identify }));
      return;
    }

    if (msg.op === OP.IDENTIFIED) {
      this.ready = true;
      this.log("[obs] connected");
      return;
    }

    if (msg.op === OP.RESPONSE) {
      const p = this.pending.get(msg.d.requestId);
      if (!p) return;
      this.pending.delete(msg.d.requestId);
      if (msg.d.requestStatus?.result) p.resolve(msg.d.responseData || {});
      else p.reject(new Error(msg.d.requestStatus?.comment || "obs request failed"));
    }
  }

  call(requestType, requestData = {}) {
    if (!this.ready) return Promise.reject(new Error("obs not connected"));

    const requestId = String(this.nextId++);
    return new Promise((resolve, reject) => {
      this.pending.set(requestId, { resolve, reject });

      /* Never leave a promise pending forever if OBS goes quiet. */
      setTimeout(() => {
        if (this.pending.has(requestId)) {
          this.pending.delete(requestId);
          reject(new Error("obs request timed out"));
        }
      }, 5000);

      this.ws.send(JSON.stringify({
        op: OP.REQUEST,
        d: { requestType, requestId, requestData }
      }));
    });
  }

  /* --- convenience wrappers ------------------------------------------- */

  setScene(sceneName) { return this.call("SetCurrentProgramScene", { sceneName }); }
  getScenes() { return this.call("GetSceneList"); }
  triggerTransition() { return this.call("TriggerStudioModeTransition"); }

  setSourceVisible(sceneName, sourceName, enabled) {
    return this.call("GetSceneItemId", { sceneName, sourceName })
      .then(({ sceneItemId }) =>
        this.call("SetSceneItemEnabled", { sceneName, sceneItemId, sceneItemEnabled: enabled }));
  }

  toggleMute(inputName) { return this.call("ToggleInputMute", { inputName }); }

  close() {
    this.stopped = true;
    this.ws?.close();
  }
}
