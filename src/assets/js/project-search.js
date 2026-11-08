(function () {
  "use strict";
  var tools = document.querySelector("[data-project-tools]");
  var grid = document.getElementById("card-grid");
  if (!tools || !grid) return;
  var search = document.getElementById("project-search");
  var buttons = Array.from(tools.querySelectorAll("[data-category-filter]"));
  var cards = Array.from(grid.querySelectorAll(".card"));
  var status = tools.querySelector("[data-project-status]");
  var empty = document.querySelector("[data-project-empty]");
  var selected = "";

  function apply() {
    var terms = search.value.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    var shown = 0;
    cards.forEach(function (card) {
      var text = (card.dataset.search || "").toLocaleLowerCase();
      var match = (!selected || card.dataset.category === selected) &&
        terms.every(function (term) { return text.includes(term); });
      card.hidden = !match;
      if (match) shown++;
    });
    status.textContent = shown + " of " + cards.length + (cards.length === 1 ? " project" : " projects");
    empty.hidden = shown !== 0;
  }

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      selected = button.dataset.categoryFilter;
      buttons.forEach(function (other) {
        var active = other === button;
        other.classList.toggle("active", active);
        other.setAttribute("aria-pressed", String(active));
      });
      apply();
    });
  });
  search.addEventListener("input", apply);
  // Browsers may restore the search value when returning from a project.
  window.addEventListener("pageshow", apply);
  apply();
  tools.hidden = false;
})();
