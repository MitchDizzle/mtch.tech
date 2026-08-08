/* ==========================================================================
   Phone control panel

   Talks to the local server over WebSocket. The server owns the state, so
   this page never guesses - it sends an intent and re-renders from whatever
   comes back. That means two phones, or a phone and a laptop, cannot drift
   out of sync.
   ========================================================================== */

(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var statusEl = $("status");
  var panel = $("panel");
  var authCard = $("auth-card");

  var ws = null;
  var retry = 800;
  var state = null;
  var config = { needsToken: false, obsEnabled: false, scenes: [] };
  var token = localStorage.getItem("mitch.control.token") || "";

  /* ------------------------------------------------------------- transport */

  function setStatus(text, on) {
    statusEl.textContent = text;
    statusEl.setAttribute("data-state", on ? "on" : "off");
  }

  function send(payload) {
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
  }

  function connect() {
    setStatus("connecting", false);
    ws = new WebSocket("ws://" + location.host + "/?role=control");

    ws.onopen = function () {
      retry = 800;
      setStatus("connected", true);
      if (config.needsToken && token) send({ type: "auth", token: token });
    };

    ws.onmessage = function (e) {
      var msg;
      try { msg = JSON.parse(e.data); } catch (err) { return; }

      if (msg.type === "auth-required") {
        if (token) send({ type: "auth", token: token });
        else showAuth(true);
        return;
      }

      if (msg.type === "auth-failed") {
        localStorage.removeItem("mitch.control.token");
        token = "";
        showAuth(true);
        setStatus("bad token", false);
        return;
      }

      if (msg.type === "state") {
        showAuth(false);
        state = msg.state;
        render();
        return;
      }

      if (msg.type === "obs-ok") {
        $("obs-msg").textContent = "";
        if (msg.action === "scene") markScene(lastScene);
        return;
      }

      if (msg.type === "obs-error") {
        $("obs-msg").textContent = "OBS: " + msg.message;
        return;
      }
    };

    ws.onclose = function () {
      setStatus("offline", false);
      setTimeout(connect, retry);
      retry = Math.min(retry * 1.5, 8000);
    };

    ws.onerror = function () { try { ws.close(); } catch (err) {} };
  }

  function showAuth(show) {
    authCard.hidden = !show;
    panel.hidden = show;
  }

  /* ------------------------------------------------------------- rendering */

  function render() {
    if (!state) return;
    var c = state.cam;

    document.querySelectorAll("[data-toggle]").forEach(function (btn) {
      var key = btn.getAttribute("data-toggle");
      btn.setAttribute("aria-pressed", c[key] !== false ? "true" : "false");
    });

    $("speed").value = c.speed;
    $("speed-out").textContent = c.speed + "s";
    $("frame").value = c.frame;
    $("frame-out").textContent = c.frame + "px";

    document.querySelectorAll("[data-tone]").forEach(function (btn) {
      btn.setAttribute("aria-pressed",
        btn.getAttribute("data-tone") === (c.tone || "default") ? "true" : "false");
    });
  }

  function setCam(patch) {
    /* Optimistic: update locally so the control feels instant, then let the
       server's broadcast confirm. On a LAN the round trip is a few ms, but
       waiting for it still reads as lag on a touch control. */
    if (state) { Object.assign(state.cam, patch); render(); }
    send({ type: "set", cam: patch });
  }

  /* ---------------------------------------------------------------- wiring */

  document.querySelectorAll("[data-toggle]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var key = btn.getAttribute("data-toggle");
      var patch = {};
      patch[key] = !(state && state.cam[key] !== false);
      setCam(patch);
    });
  });

  /* `input` fires continuously while dragging; only the final value needs to
     reach the server, so it is throttled. */
  var throttle = null;
  function slider(id, key, unit) {
    var el = $(id);
    var out = $(id + "-out");
    el.addEventListener("input", function () {
      var v = parseInt(el.value, 10);
      out.textContent = v + unit;
      clearTimeout(throttle);
      throttle = setTimeout(function () {
        var patch = {}; patch[key] = v; setCam(patch);
      }, 60);
    });
  }
  slider("speed", "speed", "s");
  slider("frame", "frame", "px");

  document.querySelectorAll("[data-tone]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      setCam({ tone: btn.getAttribute("data-tone") });
    });
  });

  document.querySelectorAll("[data-event]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      send({ type: "event", name: btn.getAttribute("data-event"), payload: {} });
    });
  });

  $("toast-send").addEventListener("click", function () {
    send({
      type: "event",
      name: "toast",
      payload: {
        title: $("toast-title").value || "Notice",
        body: $("toast-body").value || "",
        tone: (state && state.cam.tone !== "default") ? state.cam.tone : "notice"
      }
    });
    $("toast-body").value = "";
  });

  $("token-save").addEventListener("click", function () {
    token = $("token-input").value.trim();
    localStorage.setItem("mitch.control.token", token);
    send({ type: "auth", token: token });
  });

  /* ------------------------------------------------------------------- OBS */

  var lastScene = null;

  function markScene(name) {
    document.querySelectorAll("[data-scene]").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-scene") === name ? "true" : "false");
    });
  }

  function buildObs() {
    if (!config.obsEnabled) return;
    $("obs-card").hidden = false;

    var wrap = $("scenes");
    wrap.innerHTML = "";
    config.scenes.forEach(function (name) {
      var b = document.createElement("button");
      b.className = "ctl-scene";
      b.setAttribute("data-scene", name);
      b.setAttribute("aria-pressed", "false");
      b.textContent = name;
      b.addEventListener("click", function () {
        lastScene = name;
        $("obs-msg").textContent = "";
        send({ type: "obs", action: "scene", scene: name });
      });
      wrap.appendChild(b);
    });

    document.querySelectorAll("[data-obs]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        send({ type: "obs", action: btn.getAttribute("data-obs") });
      });
    });
  }

  /* ------------------------------------------------------------------ boot */

  fetch("/api/config")
    .then(function (r) { return r.json(); })
    .then(function (c) {
      config = c;
      buildObs();
      if (c.needsToken && !token) showAuth(true);
      connect();
    })
    .catch(function () {
      setStatus("no server", false);
      setTimeout(function () { location.reload(); }, 3000);
    });
})();
