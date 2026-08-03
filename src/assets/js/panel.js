/* ==========================================================================
   LitRPG panel behaviour

   Progressive enhancement only. Without this script the panel is already
   open, readable, and navigable via normal links. Nothing here is required
   to reach content.

   Usage:
     <div class="panel" data-panel>
       <span class="panel__edge" aria-hidden="true"></span>
       <div class="panel__tabs" role="tablist"> ... </div>
       <div class="panel__body"> ... </div>
     </div>
   ========================================================================== */

(function () {
  "use strict";

  var OPEN = "is-opening";
  var CLOSING = "is-closing";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function duration(el, prop, fallback) {
    var raw = getComputedStyle(el).getPropertyValue(prop).trim();
    if (!raw) return fallback;
    return raw.indexOf("ms") > -1 ? parseFloat(raw) : parseFloat(raw) * 1000;
  }

  /* Restart a CSS animation. Removing the class and reading offsetWidth
     forces a reflow so the animation re-triggers on re-add. */
  function restart(el, cls) {
    el.classList.remove(OPEN, CLOSING);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  function open(panel) {
    if (reduceMotion.matches) {
      panel.classList.remove(CLOSING);
      panel.classList.add(OPEN);
      return Promise.resolve();
    }
    restart(panel, OPEN);
    return new Promise(function (resolve) {
      setTimeout(resolve, duration(panel, "--panel-open-duration", 550));
    });
  }

  function close(panel) {
    if (reduceMotion.matches) {
      panel.classList.remove(OPEN);
      return Promise.resolve();
    }
    restart(panel, CLOSING);
    return new Promise(function (resolve) {
      setTimeout(resolve, duration(panel, "--panel-close-duration", 450));
    });
  }

  /* Tabs swap content in place. The panel does NOT close and reopen on tab
     change — watching the animation on every click gets old fast. Only mode
     transitions play the full close/open. */
  function initTabs(panel) {
    var tabs = panel.querySelectorAll("[role='tab']");
    if (!tabs.length) return;

    function select(tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.setAttribute("tabindex", on ? "0" : "-1");
        var pane = document.getElementById(t.getAttribute("aria-controls"));
        if (pane) pane.hidden = !on;
      });
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () {
        select(tab);
      });

      /* Roving focus, per the WAI-ARIA tabs pattern. */
      tab.addEventListener("keydown", function (e) {
        var next = null;
        if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
        if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === "Home") next = tabs[0];
        if (e.key === "End") next = tabs[tabs.length - 1];
        if (!next) return;
        e.preventDefault();
        select(next);
        next.focus();
      });
    });
  }

  /* Mode transitions: close the current panel, then navigate.
     Marked up as a real link so it works with JS disabled, middle-click,
     and open-in-new-tab. */
  function initTransitions(panel) {
    panel.querySelectorAll("[data-panel-exit]").forEach(function (link) {
      link.addEventListener("click", function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        if (reduceMotion.matches) return;
        e.preventDefault();
        close(panel).then(function () {
          window.location.href = link.href;
        });
      });
    });
  }

  /* LitRPG system notification. Transient, corner-anchored, auto-dismissing.
     Used for minigame rewards ("Hat acquired") and similar.

       MitchPanel.toast("Hat acquired", "Chef's hat — gold");
   */
  function toast(title, body, ms) {
    var region = document.getElementById("panel-toasts");
    if (!region) return null;

    var el = document.createElement("div");
    el.className = "panel panel--toast";
    el.setAttribute("role", "status");

    var edge = document.createElement("span");
    edge.className = "panel__edge";
    edge.setAttribute("aria-hidden", "true");
    el.appendChild(edge);

    var inner = document.createElement("div");
    inner.className = "panel__body";

    if (title) {
      var h = document.createElement("p");
      h.className = "panel__title";
      h.textContent = title;
      inner.appendChild(h);
    }
    if (body) {
      var p = document.createElement("p");
      p.style.margin = "0";
      p.textContent = body;
      inner.appendChild(p);
    }

    el.appendChild(inner);
    region.appendChild(el);
    open(el);

    /* Reduced motion gets a longer dwell — there is no motion cueing the
       arrival, so the text has to carry it. */
    var dwell = ms || (reduceMotion.matches ? 5000 : 4000);
    setTimeout(function () {
      close(el).then(function () {
        el.remove();
      });
    }, dwell);

    return el;
  }

  function init() {
    document.querySelectorAll("[data-panel]").forEach(function (panel) {
      initTabs(panel);
      initTransitions(panel);
      if (!panel.hasAttribute("data-panel-no-autoopen")) open(panel);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.MitchPanel = { open: open, close: close, toast: toast };
})();
