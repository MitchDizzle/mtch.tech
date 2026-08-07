/* Tag filtering for the projects grid.

   Progressive enhancement: with JS off every card is visible and the filter
   buttons simply do nothing, which is the correct failure mode for a filter. */

(function () {
  "use strict";

  var buttons = document.querySelectorAll(".filter-btn");
  var cards = document.querySelectorAll(".card");
  var grid = document.getElementById("card-grid");

  if (!buttons.length || !cards.length) return;

  /* Announced when a filter changes. Without it, a screen reader user gets no
     feedback that anything happened — the buttons look pressed but the result
     is silent. */
  var status = document.createElement("p");
  status.className = "sr-only";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  if (grid && grid.parentNode) grid.parentNode.insertBefore(status, grid);

  function apply(selectedTag) {
    var shown = 0;

    cards.forEach(function (card) {
      var tags = (card.getAttribute("data-tags") || "").split(" ");
      var match = selectedTag === "all" || tags.indexOf(selectedTag) !== -1;

      card.classList.toggle("hidden", !match);
      /* `hidden` also removes it from the accessibility tree, so a filtered
         card is not read out or tabbed into while invisible. */
      card.hidden = !match;
      if (match) shown++;
    });

    status.textContent =
      shown + (shown === 1 ? " project" : " projects") +
      (selectedTag === "all" ? "" : " tagged " + selectedTag);
  }

  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      buttons.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle("active", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });

      apply(btn.getAttribute("data-tag"));
    });
  });
})();
