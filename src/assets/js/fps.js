/* ==========================================================================
   FPS meter — development only

   Inert unless explicitly switched on, so it never costs anything in
   production:

     ?fps            in the URL, or
     Ctrl + Shift + F to toggle at runtime

   Shows current, average, and worst frame rate over a rolling window, plus a
   dropped-frame count against a 60Hz budget. On a high-refresh display the
   target is your monitor's rate, not 60 — read the numbers relative to that.
   ========================================================================== */

(function () {
  "use strict";

  var el = null;
  var running = false;
  var rafId = null;

  var frames = 0;
  var last = 0;
  var samples = [];
  var worst = Infinity;
  var dropped = 0;
  var prevFrame = 0;

  function build() {
    el = document.createElement("div");
    el.setAttribute("aria-hidden", "true");
    el.style.cssText = [
      "position:fixed",
      "top:8px",
      "left:8px",
      "z-index:9999",
      "padding:6px 9px",
      "background:rgba(0,0,0,.8)",
      "color:#7ee2a8",
      "font:12px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace",
      "white-space:pre",
      "border-radius:3px",
      "pointer-events:none",
      "text-align:left"
    ].join(";");
    document.body.appendChild(el);
  }

  function tick(now) {
    if (!running) return;

    if (prevFrame) {
      var delta = now - prevFrame;
      /* Anything over ~1.5 frames at 60Hz counts as a dropped frame. */
      if (delta > 25) dropped++;
    }
    prevFrame = now;

    frames++;

    if (now - last >= 500) {
      var fps = Math.round((frames * 1000) / (now - last));
      samples.push(fps);
      if (samples.length > 20) samples.shift();
      if (fps < worst) worst = fps;

      var avg = Math.round(
        samples.reduce(function (a, b) { return a + b; }, 0) / samples.length
      );

      el.textContent =
        "fps  " + fps +
        "\navg  " + avg +
        "\nlow  " + (worst === Infinity ? "-" : worst) +
        "\ndrop " + dropped;

      el.style.color = fps >= 55 ? "#7ee2a8" : fps >= 40 ? "#e8c66a" : "#e8776a";

      frames = 0;
      last = now;
    }

    rafId = requestAnimationFrame(tick);
  }

  function start() {
    if (running) return;
    if (!el) build();
    el.style.display = "block";
    running = true;
    frames = 0;
    samples = [];
    worst = Infinity;
    dropped = 0;
    prevFrame = 0;
    last = performance.now();
    rafId = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    if (el) el.style.display = "none";
  }

  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey && e.shiftKey && (e.key === "F" || e.key === "f")) {
      e.preventDefault();
      running ? stop() : start();
    }
  });

  if (location.search.indexOf("fps") > -1) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", start);
    } else {
      start();
    }
  }

  window.MitchFps = { start: start, stop: stop };
})();
