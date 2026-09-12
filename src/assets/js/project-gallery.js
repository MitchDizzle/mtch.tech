/* Five-second rotation with manual controls and a readable no-JS fallback. */
document.querySelectorAll("[data-gallery]").forEach(function (gallery) {
  var slides = Array.from(gallery.querySelectorAll("[data-slide]"));
  var controls = gallery.querySelector("[data-gallery-controls]");
  if (slides.length < 2 || !controls) return;
  var status = gallery.querySelector("[data-gallery-status]");
  var autoplay = gallery.querySelector("[data-autoplay]");
  var imageLinks = Array.from(gallery.querySelectorAll("[data-gallery-image]"));
  var original = gallery.querySelector("[data-gallery-original]");
  var motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var current = 0;
  var paused = motion.matches;
  var hovered = false;
  var focused = false;
  var visible = true;
  var timer;

  // Native fullscreen keeps the same gallery controls and Escape behavior.
  // The original image URL remains a fallback where fullscreen is unavailable.
  if (gallery.requestFullscreen && document.fullscreenEnabled) {
    original.setAttribute("role", "button");
    original.addEventListener("click", function (event) {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      var action = document.fullscreenElement === gallery ? document.exitFullscreen() : gallery.requestFullscreen();
      action.catch(function () { window.location.assign(original.href); });
    });
    original.addEventListener("keydown", function (event) {
      if (event.key === " ") { event.preventDefault(); original.click(); }
    });
    document.addEventListener("fullscreenchange", function () {
      var expanded = document.fullscreenElement === gallery;
      var label = expanded ? "Exit fullscreen" : "Expand image";
      original.setAttribute("aria-label", label);
      original.title = label;
      original.querySelector("[data-expand-icon]").toggleAttribute("hidden", expanded);
      original.querySelector("[data-collapse-icon]").toggleAttribute("hidden", !expanded);
      schedule();
    });
  }

  function schedule() {
    window.clearTimeout(timer);
    var running = !paused && !hovered && !focused && visible && !document.hidden;
    // Automatic updates should not repeatedly interrupt screen-reader speech.
    status.setAttribute("aria-live", running ? "off" : "polite");
    var label = paused ? "Play slideshow" : "Pause slideshow";
    autoplay.setAttribute("aria-label", label);
    autoplay.title = label;
    autoplay.querySelector("[data-play-icon]").toggleAttribute("hidden", !paused);
    autoplay.querySelector("[data-pause-icon]").toggleAttribute("hidden", paused);
    imageLinks.forEach(function (link) {
      link.setAttribute("aria-label", label + ": " + link.querySelector("img").alt);
    });
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
    original.href = imageLinks[current].href;
  }

  function step(direction) {
    show(current + direction);
    schedule();
  }

  gallery.querySelector("[data-previous]").addEventListener("click", function () { step(-1); });
  gallery.querySelector("[data-next]").addEventListener("click", function () { step(1); });
  function togglePlayback() {
    paused = !paused;
    // Focus stays on the stable toolbar when image playback resumes.
    if (!paused && imageLinks.includes(document.activeElement)) autoplay.focus();
    if (!paused) { focused = false; hovered = false; }
    schedule();
  }
  autoplay.addEventListener("click", togglePlayback);
  imageLinks.forEach(function (link) {
    link.setAttribute("role", "button");
    link.addEventListener("click", function (event) {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      togglePlayback();
    });
    link.addEventListener("keydown", function (event) {
      if (event.key === " ") { event.preventDefault(); togglePlayback(); }
    });
  });
  gallery.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && document.fullscreenElement === gallery) {
      event.preventDefault();
      document.exitFullscreen().catch(function () { /* The visible exit control remains available. */ });
      return;
    }
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
  gallery.querySelector("[data-gallery-overlay]").hidden = false;
  schedule();
});
