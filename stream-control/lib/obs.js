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
      if (this.onReady) this.onReady();
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
  currentScene() { return this.call("GetCurrentProgramScene"); }

  /* Place a source at an exact rectangle on the canvas.

     Bounds rather than scale: with OBS_BOUNDS_SCALE_INNER the source is fitted
     into the box preserving its aspect ratio, so it works whether the webcam
     reports 1080p, 720p or something odd. Setting scaleX/scaleY instead would
     need us to know the source's native size and redo the maths every time it
     changed.

     Alignment 5 is OBS_ALIGN_LEFT (1) | OBS_ALIGN_TOP (4), which makes
     positionX/Y the top-left corner rather than the centre. */
  /* Find a source in a scene, including inside groups.

     obs-websocket does not treat a group as part of its scene: children of a
     group are addressed with the GROUP name where a scene name would normally
     go. GetSceneItemId against the scene therefore returns "not found" for a
     source you can plainly see in the source list, because it is nested.

     Returns the container to address it through, plus whether that container
     is a group - which matters, because a grouped item's coordinates are
     relative to the group, not to the canvas. */
  async findItem(sceneName, sourceName) {
    const scene = await this.call("GetSceneItemList", { sceneName });

    const direct = scene.sceneItems.find((i) => i.sourceName === sourceName);
    if (direct) {
      return { container: sceneName, sceneItemId: direct.sceneItemId, inGroup: false };
    }

    for (const item of scene.sceneItems) {
      if (!item.isGroup) continue;
      try {
        const group = await this.call("GetGroupSceneItemList", { sceneName: item.sourceName });
        const child = group.sceneItems.find((i) => i.sourceName === sourceName);
        if (child) {
          return {
            container: item.sourceName,
            sceneItemId: child.sceneItemId,
            inGroup: true,
            groupName: item.sourceName
          };
        }
      } catch { /* a group that cannot be listed is not worth failing over */ }
    }

    throw new Error(`no source named "${sourceName}" in scene "${sceneName}"`);
  }

  async setItemRect(sceneName, sourceName, rect) {
    const found = await this.findItem(sceneName, sourceName);
    if (found.inGroup) {
      const err = new Error(
        `"${sourceName}" is inside the group "${found.groupName}"`
      );
      err.inGroup = true;
      throw err;
    }

    return this.call("SetSceneItemTransform", {
      sceneName,
      sceneItemId: found.sceneItemId,
      sceneItemTransform: {
        positionX: rect.x,
        positionY: rect.y,
        alignment: 5,
        boundsType: "OBS_BOUNDS_SCALE_INNER",
        boundsAlignment: 0,
        boundsWidth: Math.max(1, rect.w),
        boundsHeight: Math.max(1, rect.h)
      }
    });
  }

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
