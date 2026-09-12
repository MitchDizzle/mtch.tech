/* Five-second rotation with manual controls and a readable no-JS fallback. */
document.querySelectorAll("[data-gallery]").forEach(function (gallery) {
  var slides = Array.from(gallery.querySelectorAll("[data-slide]"));
  var controls = gallery.querySelector("[data-gallery-controls]");
  if (slides.length < 2 || !controls) return;
  var status = gallery.querySelector("[data-gallery-status]");
  var autoplay = gallery.querySelector("[data-autoplay]");
  var motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var current = 0;
  var paused = motion.matches;
  var hovered = false;
  var focused = false;
  var visible = true;
  var timer;

  function schedule() {
    window.clearTimeout(timer);
    var running = !paused && !hovered && !focused && visible && !document.hidden;
    // Automatic updates should not repeatedly interrupt screen-reader speech.
    status.setAttribute("aria-live", running ? "off" : "polite");
    autoplay.textContent = paused ? "Play slideshow" : "Pause slideshow";
    if (running) {
      timer = window.setTimeout(function () {
        show(current + 1);
        schedule();
      }, 5000);
    }
  }

  function show(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach(function (slide, i) {
      slide.hidden = i !== current;
      slide.inert = i !== current;
    });
    status.textContent = "Image " + (current + 1) + " of " + slides.length;
  }

  function step(direction) {
    show(current + direction);
    schedule();
  }

  gallery.querySelector("[data-previous]").addEventListener("click", function () { step(-1); });
  gallery.querySelector("[data-next]").addEventListener("click", function () { step(1); });
  autoplay.addEventListener("click", function () {
    paused = !paused;
    // Explicit Play may resume while focus remains safely on this control.
    if (!paused && document.activeElement === autoplay) focused = false;
    schedule();
  });
  gallery.addEventListener("keydown", function (event) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    if (slides.some(function (slide) { return slide.contains(document.activeElement); })) {
      gallery.querySelector(event.key === "ArrowLeft" ? "[data-previous]" : "[data-next]").focus();
    }
    step(event.key === "ArrowRight" ? 1 : -1);
  });
  gallery.addEventListener("mouseenter", function () { hovered = true; schedule(); });
  gallery.addEventListener("mouseleave", function () { hovered = false; schedule(); });
  gallery.addEventListener("focusin", function () { focused = true; schedule(); });
  gallery.addEventListener("focusout", function (event) {
    focused = gallery.contains(event.relatedTarget);
    schedule();
  });
  document.addEventListener("visibilitychange", schedule);
  motion.addEventListener("change", function () {
    if (motion.matches) paused = true;
    schedule();
  });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      schedule();
    }).observe(gallery);
  }
  gallery.classList.add("is-enhanced");
  show(0);
  controls.hidden = false;
  gallery.querySelector("[data-gallery-arrows]").hidden = false;
  schedule();
});
