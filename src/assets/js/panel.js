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

  function ms(raw) {
    if (!raw) return 0;
    raw = raw.split(",")[0].trim();
    if (!raw) return 0;
    return raw.indexOf("ms") > -1 ? parseFloat(raw) : parseFloat(raw) * 1000;
  }

  /* Resolve when the element's own animation actually finishes.

     Timing on duration alone is not enough - an animation-delay pushes the
     real end far past it. The landing panel has a 1500ms intro delay, so a
     duration-only timer fired while the animation was still queued and any
     cleanup that ran on it corrupted the animation mid-flight.

     animationend is authoritative. The timeout is only a safety net for the
     case where the animation never runs at all (reduced motion, a browser
     that drops the event on a backgrounded tab). */
  function afterAnimation(el) {
    return new Promise(function (resolve) {
      var settled = false;

      function finish() {
        if (settled) return;
        settled = true;
        el.removeEventListener("animationend", onEnd);
        resolve();
      }

      /* The edge line animates too and its event bubbles. Only the panel's
         own animation counts. */
      function onEnd(e) {
        if (e.target !== el) return;
        finish();
      }

      el.addEventListener("animationend", onEnd);

      var cs = getComputedStyle(el);
      var budget = ms(cs.animationDuration) + Math.max(0, ms(cs.animationDelay));
      setTimeout(finish, budget + 120);
    });
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
    return afterAnimation(panel);
  }

  function close(panel) {
    if (reduceMotion.matches) {
      panel.classList.remove(OPEN);
      return Promise.resolve();
    }
    restart(panel, CLOSING);
    return afterAnimation(panel);
  }

  /* Tabs swap content in place. The panel does NOT close and reopen on tab
     change - watching the animation on every click gets old fast. Only mode
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

  /* In-page panel swap. Closes the current panel and opens another on the
     same page - no navigation, so nothing flashes, the background never
     restarts, and the title card stays put.

     Prefer this over a page load for anything that is really a step in a
     flow rather than a destination:

       <button data-panel-to="options">Interactive</button>
  */
  /* A panel wrapped in an overlay is shown and hidden via its wrapper, so
     the scrim and the fixed positioning come and go with it. */
  function shell(panel) {
    var parent = panel.parentElement;
    return parent && parent.hasAttribute("data-panel-overlay") ? parent : panel;
  }

  function isOverlay(panel) {
    return shell(panel) !== panel;
  }

  var FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select, ' +
    'textarea, [tabindex]:not([tabindex="-1"])';

  function focusInto(el) {
    var target =
      el.querySelector("[autofocus]") ||
      el.querySelector(FOCUSABLE) ||
      el;
    if (target === el && !el.hasAttribute("tabindex")) {
      el.setAttribute("tabindex", "-1");
    }
    target.focus({ preventScroll: true });
  }

  var activeModal = null;
  var lastFocus = null;

  /* Must match the .landing > * opacity transition in landing.css. */
  var VEIL_MS = 240;

  function wait(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }

  /* Open a panel as a modal over whatever is already on screen.

     The outgoing content is faded but deliberately left in the flow and left
     open. Hiding it would let the flex container recentre and shove the
     title card down; closing it would mean re-animating it on the way back
     for no reason. */
  /* True while a history entry exists purely to represent the open modal. */
  var pushedState = false;

  function openModal(panel) {
    lastFocus = document.activeElement;
    activeModal = panel;
    document.documentElement.classList.add("has-overlay");

    /* Back should close the popup, not leave the page. This is what the
       browser Back button, a mouse's back button, and the Android back
       gesture all expect - they all arrive as popstate.

       The URL is deliberately left unchanged, so a reload or a shared link
       still lands on the landing page rather than reopening a dialog. */
    try {
      history.pushState({ mitchModal: true }, "");
      pushedState = true;
    } catch (err) {
      /* Some embedded//file: contexts refuse pushState. Back simply keeps
         its default behaviour there; nothing else breaks. */
      pushedState = false;
    }

    var delay = reduceMotion.matches ? 0 : VEIL_MS;
    return wait(delay).then(function () {
      shell(panel).hidden = false;
      return open(panel);
    }).then(function () {
      focusInto(panel);
    });
  }

  /* Every dismissal - Cancel, Escape, Back - routes through here.

     When a history entry was pushed for the modal, the dismissal is handed
     to history.back() and the popstate handler does the real work. Closing
     directly instead would leave that entry behind, and the next Back press
     would appear to do nothing. */
  function dismiss(panel) {
    if (pushedState) {
      pushedState = false;
      history.back();
      return;
    }
    closeModal(panel);
  }

  /* Dismiss like a popup: quick close, then the backdrop fades straight back
     in. Nothing behind it replays an entrance. */
  function closeModal(panel) {
    return close(panel).then(function () {
      shell(panel).hidden = true;
      if (activeModal === panel) activeModal = null;
      document.documentElement.classList.remove("has-overlay");
      if (lastFocus && document.contains(lastFocus)) {
        lastFocus.focus({ preventScroll: true });
        lastFocus = null;
      }
    });
  }

  /* In-flow swap: the outgoing panel really does go away and the incoming
     one takes its place in the layout. */
  function swapInFlow(from, to) {
    return close(from).then(function () {
      shell(from).hidden = true;
      shell(to).hidden = false;
      return open(to);
    }).then(function () {
      focusInto(to);
    });
  }

  function initSwaps(panel) {
    panel.querySelectorAll("[data-panel-to]").forEach(function (trigger) {
      trigger.addEventListener("click", function (e) {
        var target = document.getElementById(trigger.getAttribute("data-panel-to"));
        if (!target) return;
        e.preventDefault();
        if (isOverlay(target)) openModal(target);
        else swapInFlow(panel, target);
      });
    });

    /* Dismiss the overlay this control sits inside, revealing what was
       already behind it. */
    panel.querySelectorAll("[data-panel-dismiss]").forEach(function (trigger) {
      trigger.addEventListener("click", function (e) {
        e.preventDefault();
        dismiss(panel);
      });
    });
  }

  /* Modal conventions: Escape dismisses, and Tab stays inside.
     Without containment, tabbing walks into the dimmed page behind the
     scrim, where focus is invisible and the controls are inert. */
  document.addEventListener("keydown", function (e) {
    if (!activeModal) return;

    if (e.key === "Escape") {
      dismiss(activeModal);
      return;
    }

    if (e.key !== "Tab") return;

    var items = Array.prototype.filter.call(
      activeModal.querySelectorAll(FOCUSABLE),
      function (el) { return el.offsetParent !== null; }
    );
    if (!items.length) return;

    var first = items[0];
    var last = items[items.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  /* Mode transitions: fade out the title card, close the panel, then
     navigate. The background is deliberately left alone - it is phase-locked
     to wall clock in the head script, so it carries straight across the
     navigation without restarting.

     Links are real <a href> elements, so JS-off, middle-click, and
     open-in-new-tab all behave normally. */
  function initTransitions(panel) {
    panel.querySelectorAll("[data-panel-exit]").forEach(function (link) {
      link.addEventListener("click", function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        if (reduceMotion.matches) return;
        e.preventDefault();

        /* Drives the title/subtitle fade in CSS. Runs concurrently with the
           panel close rather than before it, so the exit stays brisk. */
        document.documentElement.classList.add("is-exiting");

        close(panel).then(function () {
          window.location.href = link.href;
        });
      });
    });
  }

  /* Back button, mouse back button, and the Android back gesture all land
     here. If a modal is open, consume the navigation to close it instead. */
  window.addEventListener("popstate", function () {
    pushedState = false;
    if (activeModal) closeModal(activeModal);
  });

  /* Restoring from bfcache replays a cached frame of the outgoing page -
     including the faded-out title and closed panel. Reset and reopen. */
  window.addEventListener("pageshow", function (e) {
    if (!e.persisted) return;
    document.documentElement.classList.remove("is-exiting", "has-overlay");
    activeModal = null;
    pushedState = false;
    document.querySelectorAll("[data-panel]").forEach(function (panel) {
      if (isOverlay(panel)) shell(panel).hidden = true;
      if (!panel.hasAttribute("data-panel-no-autoopen")) open(panel);
    });
  });

  /* LitRPG system notification. Transient, corner-anchored, auto-dismissing.
     Used for minigame rewards and similar.

       MitchPanel.toast("Chef's hat - gold", "Closest recipe yet.", {
         banner: "Reward",
         tone: "success"
       });

     opts: banner, tone (notice|warning|danger|success|quest), dwell (ms).
   */
  function toast(title, body, opts) {
    var region = document.getElementById("panel-toasts");
    if (!region) return null;

    opts = opts || {};
    /* Back-compat: the fourth argument used to be a plain dwell in ms. */
    if (typeof opts === "number") opts = { dwell: opts };

    var el = document.createElement("div");
    el.className =
      "panel panel--toast" +
      (opts.tone ? " panel--" + opts.tone : "") +
      (opts.banner ? " panel--banner-bar" : "");

    /* An error announces itself; anything else waits its turn. */
    el.setAttribute("role", opts.tone === "danger" ? "alert" : "status");

    var edge = document.createElement("span");
    edge.className = "panel__edge";
    edge.setAttribute("aria-hidden", "true");
    el.appendChild(edge);

    if (opts.banner) {
      var b = document.createElement("p");
      b.className = "panel__banner";
      b.textContent = opts.banner;
      el.appendChild(b);
    }

    /* Same header region as the macro, so a toast is structurally identical
       to any other panel rather than a lookalike assembled by hand. */
    if (title) {
      var head = document.createElement("div");
      head.className = "panel__header";
      var h = document.createElement("p");
      h.className = "panel__title";
      h.textContent = title;
      head.appendChild(h);
      if (opts.subtitle) {
        var sub = document.createElement("p");
        sub.className = "panel__subtitle";
        sub.textContent = opts.subtitle;
        head.appendChild(sub);
      }
      el.appendChild(head);
    }

    if (body) {
      var inner = document.createElement("div");
      inner.className = "panel__body";
      var p = document.createElement("p");
      p.style.margin = "0";
      p.textContent = body;
      inner.appendChild(p);
      el.appendChild(inner);
    }
    region.appendChild(el);
    open(el);

    /* Reduced motion gets a longer dwell - there is no motion cueing the
       arrival, so the text has to carry it. */
    var dwell = opts.dwell || (reduceMotion.matches ? 5000 : 4000);
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
      initSwaps(panel);
      initTransitions(panel);
      if (panel.hasAttribute("data-panel-no-autoopen")) return;

      open(panel).then(function () {
        /* The intro delay is a one-time entrance. Strip it so reopening this
           panel - after dismissing a popup, say - is immediate. */
        panel.classList.remove("is-intro");
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.MitchPanel = { open: open, close: close, toast: toast };
})();
