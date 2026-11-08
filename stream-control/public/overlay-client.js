/* ==========================================================================
   Overlay client

   Holds a WebSocket to the local server and renders whatever state arrives.
   Reconnects on its own: OBS may load this before the server is up, and the
   server may restart while OBS keeps the page open.
   ========================================================================== */

(function () {
  "use strict";

  var stage = document.getElementById("stage");
  var cam = document.getElementById("cam");
  var info = document.getElementById("info");
  var body = document.body;

  var ws = null;
  var retry = 1000;

  var TONES = ["notice", "warning", "danger", "success", "quest"];

  /* Tones only shift the accent, border and background tint - never the body
     text colour. On a text-heavy panel that difference is subtle, which is
     part of why a custom accent exists. A hex value here overrides the tone
     completely. */
  function rgba(hex, alpha) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
    if (!m) return null;
    var n = parseInt(m[1], 16);
    return "rgb(" + ((n >> 16) & 255) + " " + ((n >> 8) & 255) + " " + (n & 255) +
           " / " + alpha + ")";
  }

  var ACCENT_VARS = [
    "--panel-accent", "--panel-border-color", "--panel-banner-bg",
    "--ov-accent", "--ov-border", "--cam-sweep-color"
  ];

  function applyAccent(el, hex) {
    ACCENT_VARS.forEach(function (v) { el.style.removeProperty(v); });
    if (!hex) return;

    var solid = rgba(hex, 1);
    if (!solid) return;

    el.style.setProperty("--panel-accent", solid);
    el.style.setProperty("--panel-border-color", rgba(hex, 0.55));
    el.style.setProperty("--panel-banner-bg", rgba(hex, 0.14));
    el.style.setProperty("--ov-accent", solid);
    el.style.setProperty("--ov-border", rgba(hex, 0.55));
    /* The sweep stays near-white with a hint of the accent - a fully tinted
       shine reads as a coloured bar sliding past rather than as light. */
    el.style.setProperty("--cam-sweep-color", rgba(hex, 0.9));
  }

  /* Scale the 1920x1080 stage to whatever size OBS gave the source. At a
     1920x1080 browser source this is exactly 1 and nothing is resampled. */
  function fit() {
    var scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    document.documentElement.style.setProperty("--overlay-scale", scale);
  }
  fit();
  window.addEventListener("resize", fit);

  function applyCam(c) {
    if (!c) return;

    cam.hidden = c.visible === false;
    cam.style.left = c.x + "px";
    cam.style.top = c.y + "px";
    cam.style.width = c.w + "px";
    cam.style.height = c.h + "px";

    body.setAttribute("data-shine", c.shine === false ? "off" : "on");
    body.setAttribute("data-corners", c.corners === false ? "off" : "on");

    /* Edge decoration. Attributes rather than classes so the CSS reads as
       on/off switches and the markup stays constant. */
    body.setAttribute("data-inner", c.inner ? "on" : "off");
    body.setAttribute("data-studs", c.studs ? "on" : "off");
    body.setAttribute("data-ticks", c.ticks ? "on" : "off");

    if (typeof c.speed === "number") body.style.setProperty("--cam-shine", c.speed + "s");
    if (typeof c.frame === "number") body.style.setProperty("--cam-frame", c.frame + "px");

    /* Tone goes on the frame element, NOT on body. On body it cascaded into
       the info panel and the toasts, so picking a camera colour silently
       retinted everything else. Each section owns its own tone. */
    TONES.forEach(function (t) {
      cam.classList.remove("panel--" + t);
      body.classList.remove("panel--" + t);   // clear any legacy state
    });
    if (c.tone && TONES.indexOf(c.tone) !== -1) cam.classList.add("panel--" + c.tone);

    applyAccent(cam, c.accent);
  }

  function applyInfo(i) {
    if (!i) return;

    info.hidden = i.visible === false;
    info.style.left = i.x + "px";
    info.style.top = i.y + "px";
    info.style.width = i.w + "px";

    document.getElementById("info-banner").textContent = i.banner || "";
    document.getElementById("info-title").textContent = i.title || "";
    document.getElementById("info-subtitle").textContent = i.subtitle || "";
    document.getElementById("info-body").textContent = i.body || "";

    /* An empty banner would still paint its accent bar and border, so hide
       the element rather than just clearing the text. */
    document.getElementById("info-banner").hidden = !i.banner;

    var panel = document.getElementById("info-panel");
    TONES.forEach(function (t) { panel.classList.remove("panel--" + t); });
    if (i.tone && TONES.indexOf(i.tone) !== -1) panel.classList.add("panel--" + i.tone);

    applyAccent(panel, i.accent);
  }

  function applyToast(t) {
    if (!t) return;
    var rail = document.getElementById("panel-toasts");
    if (!rail) return;
    /* Positioned rather than corner-anchored, so the control panel can put
       the rail anywhere. Right and bottom are cleared in case a previous
       state pinned them. */
    rail.style.left = t.x + "px";
    rail.style.top = t.y + "px";
    rail.style.right = "auto";
    rail.style.width = t.w + "px";
    rail.style.setProperty("--toast-width", t.w + "px");
  }

  function apply(state) {
    applyCam(state.cam);
    applyInfo(state.info);
    applyToast(state.toast);
  }

  function onEvent(name, payload) {
    payload = payload || {};

    if (name === "toast" && window.MitchPanel) {
      window.MitchPanel.toast(payload.title || "", payload.body || "", {
        banner: payload.banner || "Notice",
        tone: payload.tone || "notice",
        dwell: payload.dwell || 6000
      });
      return;
    }

    /* Reload from the phone rather than hunting for OBS's refresh button,
       which lives inside the source's Properties dialog. Needed whenever the
       overlay's own CSS or JS changes - state updates arrive over the socket,
       but the page itself does not re-fetch. */
    if (name === "reload") {
      location.reload();
      return;
    }

    if (name === "flash") {
      /* Restart the sweep now rather than waiting for its cycle. Removing the
         animation and forcing a reflow is what makes it re-trigger. */
      var sweep = document.querySelector(".cam__sweep");
      if (!sweep) return;
      sweep.style.animation = "none";
      void sweep.offsetWidth;
      sweep.style.animation = "";
    }
  }

  function connect() {
    ws = new WebSocket("ws://" + location.host + "/?role=overlay");

    ws.onopen = function () { retry = 1000; };

    ws.onmessage = function (e) {
      var msg;
      try { msg = JSON.parse(e.data); } catch (err) { return; }

      if (msg.type === "state") apply(msg.state);
      else if (msg.type === "event") onEvent(msg.name, msg.payload);
      else if (msg.type === "auth-required") {
        /* Only reached when the overlay is loaded from another machine -
           locally the server trusts loopback. Answer with ?token= if the URL
           carries one. */
        var t = new URLSearchParams(location.search).get("token");
        ws.send(JSON.stringify({ type: "auth", token: t || "" }));
      }
      else if (msg.type === "auth-failed") {
        /* Silent failure here meant the overlay reconnected forever and
           simply never received any state. Say so. */
        console.warn(
          "[overlay] auth failed - add ?token=... to the browser source URL, " +
          "or load the overlay from localhost."
        );
      }
    };

    /* Back off gradually so a stopped server is not hammered, but stay quick
       enough that a restart reconnects while you are still looking at it. */
    ws.onclose = function () {
      setTimeout(connect, retry);
      retry = Math.min(retry * 1.5, 10000);
    };

    ws.onerror = function () { try { ws.close(); } catch (err) {} };
  }

  connect();
})();
