/* ==========================================================================
   Phone control panel

   The server owns the state. This page sends an intent and re-renders from
   whatever comes back, so two devices cannot drift apart.

   No range sliders anywhere, deliberately. A slider inside a scrolling page
   eats vertical drags - you go to scroll and instead change a value live on
   stream. Steppers cannot be grabbed by a scroll gesture at all, so the
   problem is removed rather than mitigated.
   ========================================================================== */

(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var statusEl = $("status");
  var authCard = $("auth-card");

  var ws = null;
  var retry = 800;
  var resolved = null;      // flattened values the overlay renders
  var store = null;         // profile tree
  var config = { needsToken: false, obsEnabled: false, scenes: [] };
  /* Default stepper increment for rows that do not declare their own.
     Exact values come from tapping the number and typing. */
  var STEP = 10;

  var TONES = [
    ["default", "#d2beaf"], ["notice", "#7eb2eb"], ["warning", "#e8c66a"],
    ["danger", "#e8776a"], ["success", "#7ee2a8"], ["quest", "#ba9aec"]
  ];

  /* Numeric settings, described once. Each becomes a stepper row with an
     override marker and an inherit button. */
  var ROWS = {
    cam: [
      { key: "w", label: "Width", min: 200, max: 1200, unit: "px", ratio: 9 / 16 },
      { key: "x", label: "X", min: -200, max: 1920, unit: "px" },
      { key: "y", label: "Y", min: -200, max: 1080, unit: "px" },
      { key: "frame", label: "Border", min: 0, max: 16, unit: "px", step: 1 },
      { key: "speed", label: "Shine cycle", min: 2, max: 30, unit: "s", step: 1 }
    ],
    info: [
      { key: "w", label: "Width", min: 200, max: 1400, unit: "px" },
      { key: "x", label: "X", min: -200, max: 1920, unit: "px" },
      { key: "y", label: "Y", min: -200, max: 1080, unit: "px" }
    ],
    toast: [
      { key: "w", label: "Width", min: 200, max: 900, unit: "px" },
      { key: "x", label: "X", min: -200, max: 1920, unit: "px" },
      { key: "y", label: "Y", min: -200, max: 1080, unit: "px" }
    ]
  };

  /* ------------------------------------------------------------------ token */

  var token = "";
  var urlToken = new URLSearchParams(location.search).get("token");
  if (urlToken) {
    token = urlToken;
    localStorage.setItem("mitch.control.token", token);
    history.replaceState(null, "", location.pathname);
  } else {
    token = localStorage.getItem("mitch.control.token") || "";
  }

  /* -------------------------------------------------------------- transport */

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
        resolved = msg.state;
        store = msg.store;
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

  /* Called on every state broadcast, so it must be idempotent. Re-running the
     tab setup here is what used to fire scrollTo on every single edit. */
  function showAuth(show) {
    if (authCard.hidden === !show) return;   // already in this state
    authCard.hidden = !show;
    $("tabs").hidden = show;
    ["triggers", "settings", "profiles"].forEach(function (t) {
      $("tab-" + t).hidden = true;
    });
    if (!show) showTab(currentTab, true);
  }

  /* ------------------------------------------------------------------ tabs */

  var currentTab = "triggers";

  /* Only scroll to the top when the tab genuinely changes. Doing it on every
     render sent you back to the top mid-edit, which is maddening when you are
     adjusting something near the bottom of Settings. */
  function showTab(name, silent) {
    var changed = name !== currentTab;
    currentTab = name;
    ["triggers", "settings", "profiles"].forEach(function (t) {
      $("tab-" + t).hidden = t !== name;
    });
    document.querySelectorAll(".ctl-tab").forEach(function (b) {
      b.setAttribute("aria-selected", b.getAttribute("data-tab") === name ? "true" : "false");
    });
    if (changed && !silent) window.scrollTo(0, 0);
  }

  document.querySelectorAll(".ctl-tab").forEach(function (b) {
    b.addEventListener("click", function () { showTab(b.getAttribute("data-tab")); });
  });

  /* ------------------------------------------------------------- overrides */

  /* True when the ACTIVE profile sets this key itself, rather than inheriting
     it. Drives the marker and whether an inherit button is offered. */
  function isOverride(section, key) {
    if (!store || store.active === "base") return false;
    var v = store.profiles[store.active].values[section];
    return Boolean(v && Object.prototype.hasOwnProperty.call(v, key));
  }

  function set(section, patch) {
    if (resolved) { Object.assign(resolved[section], patch); render(); }
    var msg = { type: "set" };
    msg[section] = patch;
    send(msg);
  }

  /* ---------------------------------------------------------- stepper rows */

  function buildRows(section) {
    var wrap = $("rows-" + section);
    if (!wrap || wrap.dataset.built) return;
    wrap.dataset.built = "1";

    ROWS[section].forEach(function (def) {
      var row = document.createElement("div");
      row.className = "ctl-stepper";
      row.innerHTML =
        '<span class="ctl-stepper__label">' + def.label +
          '<i class="ctl-override" hidden title="Overridden in this profile"></i></span>' +
        '<button class="ctl-btn ctl-stepper__btn" data-dir="-1">&minus;</button>' +
        '<button class="ctl-stepper__val"></button>' +
        '<button class="ctl-btn ctl-stepper__btn" data-dir="1">+</button>' +
        '<button class="ctl-btn ctl-stepper__inherit" hidden title="Use inherited value">&#8617;</button>';

      var amount = def.step || null;   // null means use the shared step size

      function bump(dir) {
        var by = amount || STEP;
        var next = Math.round((resolved[section][def.key] + dir * by) / by) * by;
        next = Math.max(def.min, Math.min(def.max, next));
        var patch = {};
        patch[def.key] = next;
        /* Width drives height so the frame stays 16:9 - keeping that by hand
           on a phone is miserable and a mismatched frame looks broken. */
        if (def.ratio) patch.h = Math.round(next * def.ratio);
        set(section, patch);
      }

      row.querySelectorAll("[data-dir]").forEach(function (b) {
        b.addEventListener("click", function () { bump(parseInt(b.dataset.dir, 10)); });
      });

      /* Tap the number to type an exact value. */
      row.querySelector(".ctl-stepper__val").addEventListener("click", function () {
        var current = resolved[section][def.key];
        var input = window.prompt(def.label, current);
        if (input === null) return;
        var v = parseInt(input, 10);
        if (isNaN(v)) return;
        v = Math.max(def.min, Math.min(def.max, v));
        var patch = {};
        patch[def.key] = v;
        if (def.ratio) patch.h = Math.round(v * def.ratio);
        set(section, patch);
      });

      row.querySelector(".ctl-stepper__inherit").addEventListener("click", function () {
        send({ type: "inherit", section: section, key: def.key });
      });

      row.dataset.section = section;
      row.dataset.key = def.key;
      row.dataset.unit = def.unit;
      wrap.appendChild(row);
    });
  }

  /* Custom accent. A hex value overrides the tone entirely, so the five
     presets stop being a limit. `input` fires continuously while dragging the
     native picker, so it is throttled the same as the steppers. */
  function buildAccents() {
    document.querySelectorAll("[data-accent-for]").forEach(function (wrap) {
      var section = wrap.getAttribute("data-accent-for");
      var input = wrap.querySelector("[data-accent-input]");
      var clear = wrap.querySelector("[data-accent-clear]");
      var timer = null;

      input.addEventListener("input", function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
          set(section, { accent: input.value });
        }, 80);
      });

      clear.addEventListener("click", function () {
        set(section, { accent: "" });
      });
    });
  }

  function buildTones() {
    document.querySelectorAll("[data-tone-for]").forEach(function (wrap) {
      if (wrap.dataset.built) return;
      wrap.dataset.built = "1";
      var section = wrap.getAttribute("data-tone-for");
      TONES.forEach(function (t) {
        var b = document.createElement("button");
        b.className = "ctl-tone";
        b.setAttribute("data-tone", t[0]);
        b.style.setProperty("--t", t[1]);
        b.textContent = t[0].charAt(0).toUpperCase() + t[0].slice(1);
        b.addEventListener("click", function () { set(section, { tone: t[0] }); });
        wrap.appendChild(b);
      });
    });
  }

  /* ------------------------------------------------------------- rendering */

  function getPath(path) {
    var bits = path.split(".");
    return resolved && resolved[bits[0]] ? resolved[bits[0]][bits[1]] : undefined;
  }

  function setInput(id, value) {
    var el = $(id);
    if (el && document.activeElement !== el) el.value = value || "";
  }

  function render() {
    if (!resolved || !store) return;

    document.querySelectorAll("[data-toggle]").forEach(function (btn) {
      btn.setAttribute("aria-pressed",
        getPath(btn.getAttribute("data-toggle")) !== false ? "true" : "false");
    });

    document.querySelectorAll(".ctl-stepper").forEach(function (row) {
      var s = row.dataset.section, k = row.dataset.key;
      row.querySelector(".ctl-stepper__val").textContent =
        Math.round(resolved[s][k]) + row.dataset.unit;
      var over = isOverride(s, k);
      row.querySelector(".ctl-override").hidden = !over;
      row.querySelector(".ctl-stepper__inherit").hidden = !over;
    });

    document.querySelectorAll("[data-tone-for]").forEach(function (wrap) {
      var s = wrap.getAttribute("data-tone-for");
      var custom = Boolean(resolved[s].accent);
      wrap.querySelectorAll("[data-tone]").forEach(function (b) {
        /* A custom accent wins, so showing a tone as selected would be a lie
           about what is actually on screen. */
        b.setAttribute("aria-pressed",
          !custom && b.getAttribute("data-tone") === (resolved[s].tone || "default")
            ? "true" : "false");
      });
      wrap.setAttribute("data-muted", custom ? "true" : "false");
    });

    document.querySelectorAll("[data-accent-for]").forEach(function (wrap) {
      var s = wrap.getAttribute("data-accent-for");
      var input = wrap.querySelector("[data-accent-input]");
      var accent = resolved[s].accent;
      if (accent && document.activeElement !== input) input.value = accent;
      wrap.setAttribute("data-active", accent ? "true" : "false");
    });

    setInput("info-banner", resolved.info.banner);
    setInput("info-title", resolved.info.title);
    setInput("info-subtitle", resolved.info.subtitle);
    setInput("info-body", resolved.info.body);

    renderProfiles();
  }

  function renderProfiles() {
    var active = store.profiles[store.active];

    $("editing-note").textContent =
      "Editing: " + active.name +
      (store.active === "base" ? " - changes affect every profile" : " - changes here override Base");
    $("editing-note").setAttribute("data-base", store.active === "base" ? "true" : "false");

    /* Rebuild the buttons only when the profile set actually changes.
       Recreating them on every broadcast destroys whatever had focus and
       causes needless layout work while you are editing. */
    var list = $("profile-list");
    var signature = store.order.map(function (id) {
      return id + ":" + (store.profiles[id] ? store.profiles[id].name : "");
    }).join("|");

    if (list.dataset.signature !== signature) {
      list.dataset.signature = signature;
      list.innerHTML = "";
      store.order.forEach(function (id) {
        var p = store.profiles[id];
        if (!p) return;
        var b = document.createElement("button");
        b.className = "ctl-scene";
        b.setAttribute("data-profile", id);
        b.textContent = p.name;
        b.addEventListener("click", function () {
          send({ type: "profile", action: "switch", id: id });
        });
        list.appendChild(b);
      });
    }

    /* Selection is cheap to update in place. */
    list.querySelectorAll("[data-profile]").forEach(function (b) {
      b.setAttribute("aria-pressed",
        b.getAttribute("data-profile") === store.active ? "true" : "false");
    });

    $("profile-manage").hidden = store.active === "base";
    setInput("profile-rename", active.name);

    /* Show what this profile actually changes - the whole point of
       inheritance is being able to see the diff at a glance. */
    var count = 0;
    if (store.active !== "base") {
      Object.keys(active.values).forEach(function (s) {
        count += Object.keys(active.values[s] || {}).length;
      });
    }
    $("override-summary").textContent = count
      ? count + " setting" + (count === 1 ? "" : "s") + " overridden. Everything else follows Base."
      : "Nothing overridden yet - identical to Base.";
  }

  /* ---------------------------------------------------------------- wiring */

  document.querySelectorAll("[data-toggle]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var bits = btn.getAttribute("data-toggle").split(".");
      var patch = {};
      patch[bits[1]] = !(getPath(btn.getAttribute("data-toggle")) !== false);
      set(bits[0], patch);
    });
  });

  /* Nine-point placement. The code is two characters: vertical then
     horizontal, each one of t/m/b and l/c/r. Centring is (canvas - size) / 2
     rather than a fixed number, so it stays centred at any size. */
  var MARGIN = 48;
  var CANVAS_W = 1920;
  var CANVAS_H = 1080;

  document.querySelectorAll("[data-corners-for]").forEach(function (wrap) {
    var section = wrap.getAttribute("data-corners-for");

    wrap.querySelectorAll("[data-corner]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!resolved) return;
        var v = resolved[section];
        var pos = btn.getAttribute("data-corner");

        /* The info panel has no stored height - it grows with its content -
           so bottom and middle placements estimate one. Close enough to land
           it sensibly; nudge from there. */
        var h = v.h || 200;
        var vert = pos.charAt(0);
        var horiz = pos.charAt(1);

        var x = horiz === "l" ? MARGIN
              : horiz === "r" ? CANVAS_W - v.w - MARGIN
              : Math.round((CANVAS_W - v.w) / 2);

        var y = vert === "t" ? MARGIN
              : vert === "b" ? CANVAS_H - h - MARGIN
              : Math.round((CANVAS_H - h) / 2);

        set(section, { x: x, y: y });
      });
    });
  });

  ["banner", "title", "subtitle", "body"].forEach(function (key) {
    var el = $("info-" + key), timer = null;
    el.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        var patch = {}; patch[key] = el.value;
        set("info", patch);
      }, 250);
    });
  });

  document.querySelectorAll("[data-reset]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      send({ type: "reset", section: btn.getAttribute("data-reset") });
    });
  });

  document.querySelectorAll("[data-event]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      send({ type: "event", name: btn.getAttribute("data-event"), payload: {} });
    });
  });

  function sendToast(title, body) {
    send({
      type: "event", name: "toast",
      payload: {
        title: title, body: body,
        tone: (resolved && resolved.cam.tone !== "default") ? resolved.cam.tone : "notice"
      }
    });
  }

  $("toast-send").addEventListener("click", function () {
    sendToast($("toast-title").value || "Notice", $("toast-body").value || "");
    $("toast-body").value = "";
  });

  $("toast-preview").addEventListener("click", function () {
    sendToast("Preview", "Checking where this lands.");
  });

  $("token-save").addEventListener("click", function () {
    token = $("token-input").value.trim();
    localStorage.setItem("mitch.control.token", token);
    send({ type: "auth", token: token });
  });

  /* --------------------------------------------------------------- profiles */

  $("profile-create").addEventListener("click", function () {
    var name = $("profile-name").value.trim();
    if (!name) return;
    send({ type: "profile", action: "create", name: name, inherits: "base" });
    $("profile-name").value = "";
  });

  $("profile-rename-save").addEventListener("click", function () {
    send({
      type: "profile", action: "rename",
      id: store.active, name: $("profile-rename").value.trim()
    });
  });

  $("profile-delete").addEventListener("click", function () {
    if (!window.confirm("Delete this profile? Base is unaffected.")) return;
    send({ type: "profile", action: "delete", id: store.active });
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

  Object.keys(ROWS).forEach(buildRows);
  buildTones();
  buildAccents();

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
