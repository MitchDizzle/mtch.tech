/* ==========================================================================
   Overlay runtime

   Self-contained: no accounts, no API keys, nothing that can expire while
   you are live. Every scene is configured through URL query parameters, so
   one built page serves many looks - change the URL in OBS, not the code.

   Supported parameters (all optional):

     title=      panel heading
     sub=        panel subheading
     banner=     LitRPG banner text, e.g. Notice
     tone=       notice | warning | danger | success | quest
     lead=       body line
     handle=     text in the live scene's corner strip
     camlabel=   caption on the camera frame
     mins=15     countdown length in minutes, starts on load
     until=      countdown to an absolute time, e.g. 2026-08-07T19:30
     clock=24    force 24-hour clock (default follows the machine locale)

   Example:
     .../overlay/starting/?mins=10&title=Back%20shortly&banner=Notice
   ========================================================================== */

(function () {
  "use strict";

  const params = new URLSearchParams(location.search);
  const p = (key, fallback = null) => {
    const v = params.get(key);
    return v === null || v === "" ? fallback : v;
  };

  /* ------------------------------------------------------------------ scale

     OBS sizes the Browser Source exactly, so scale is 1 and nothing is
     resampled. In a browser window the same stage shrinks to fit, which is
     what makes previewing on a laptop meaningful. */
  function fitStage() {
    /* Scenes without a stage (the camera frame) fill the browser source and
       need no scaling - they are sized in OBS, not here. */
    if (!document.getElementById("stage")) return;
    const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    document.documentElement.style.setProperty("--overlay-scale", scale);
  }
  fitStage();
  window.addEventListener("resize", fitStage);

  /* ------------------------------------------------------- camera frame */

  function applyCam() {
    const cam = document.getElementById("cam");
    if (!cam) return;
    const body = document.body;

    if (p("shine") === "off") body.setAttribute("data-shine", "off");
    if (p("corners") === "off") body.setAttribute("data-corners", "off");

    const speed = parseFloat(p("speed"));
    if (!isNaN(speed) && speed > 0) {
      body.style.setProperty("--cam-shine", `${speed}s`);
    }

    const frame = parseFloat(p("frame"));
    if (!isNaN(frame) && frame >= 0) {
      body.style.setProperty("--cam-frame", `${frame}px`);
    }
  }

  /* ------------------------------------------------------------------- text */

  function setText(selector, value) {
    if (value === null) return;
    document.querySelectorAll(selector).forEach((el) => { el.textContent = value; });
  }

  function applyText() {
    /* Generic slots. */
    document.querySelectorAll("[data-param]").forEach((el) => {
      const value = p(el.getAttribute("data-param"));
      if (value !== null) el.textContent = value;
    });

    /* Panel parts are addressed by their component classes rather than by
       adding overlay-specific attributes to the shared panel macro - the
       site component stays clean and the overlay adapts to it. */
    setText(".panel__title", p("title"));
    setText(".panel__subtitle", p("sub"));
    setText(".panel__banner", p("banner"));

    const tone = p("tone");
    if (tone) {
      document.querySelectorAll(".panel").forEach((panel) => {
        /* Drop any tone baked in at build time before applying the new one,
           otherwise two tone classes fight and the later rule wins by
           stylesheet order rather than by intent. */
        panel.classList.forEach((c) => {
          if (/^panel--(notice|warning|danger|success|quest)$/.test(c)) {
            panel.classList.remove(c);
          }
        });
        panel.classList.add(`panel--${tone}`);
      });
    }
  }

  /* ------------------------------------------------------------------ clock */

  function startClock() {
    const el = document.querySelector("[data-clock]");
    if (!el) return;

    const force24 = p("clock") === "24";
    const fmt = new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: force24 ? false : undefined
    });

    const tick = () => { el.textContent = fmt.format(new Date()); };
    tick();
    /* Aligned to the next minute boundary rather than a naive 60s interval,
       so the displayed time never sits a few seconds behind the real one. */
    const now = new Date();
    setTimeout(() => {
      tick();
      setInterval(tick, 60000);
    }, (60 - now.getSeconds()) * 1000);
  }

  /* -------------------------------------------------------------- countdown */

  function startCountdown() {
    const el = document.querySelector("[data-timer]");
    if (!el) return;

    let target = null;
    const until = p("until");
    const mins = parseFloat(p("mins"));

    if (until) {
      const t = new Date(until);
      if (!isNaN(t)) target = t.getTime();
    } else if (!isNaN(mins) && mins > 0) {
      target = Date.now() + mins * 60000;
    }

    if (target === null) { el.hidden = true; return; }
    el.hidden = false;

    /* Driven from wall-clock time, not by decrementing a counter. A tab that
       is throttled or a frame that is dropped cannot make the timer drift. */
    const render = () => {
      let remaining = Math.max(0, target - Date.now());
      const total = Math.round(remaining / 1000);
      const h = Math.floor(total / 3600);
      const m = Math.floor((total % 3600) / 60);
      const s = total % 60;

      el.textContent = h > 0
        ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
        : `${m}:${String(s).padStart(2, "0")}`;

      if (remaining <= 0) {
        el.classList.add("is-done");
        clearInterval(handle);
      }
    };

    render();
    const handle = setInterval(render, 250);
  }

  /* ------------------------------------------------------------------ toast

     Exposed so you can fire a themed notification from the OBS Browser
     Source "Custom CSS" box is not possible - but you CAN from the browser
     console while testing, or later from a websocket if you add one:

       MitchOverlay.toast("Follower", "someone just followed", "success");
  */
  function toast(title, body, tone) {
    if (!window.MitchPanel) return;
    window.MitchPanel.toast(title, body, {
      banner: tone === "success" ? "Reward" : "Notice",
      tone: tone || "notice",
      dwell: 6000
    });
  }

  applyText();
  applyCam();
  startClock();
  startCountdown();

  window.MitchOverlay = { toast, fitStage };
})();
