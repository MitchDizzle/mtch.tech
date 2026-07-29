(function () {
  var buttons = document.querySelectorAll(".filter-btn");
  var cards = document.querySelectorAll(".card");

  if (!buttons.length || !cards.length) return;

  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var selectedTag = btn.getAttribute("data-tag");

      // Update active button
      buttons.forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");

      // Show/hide cards
      cards.forEach(function (card) {
        var cardTags = card.getAttribute("data-tags") || "";
        if (selectedTag === "all" || cardTags.split(" ").indexOf(selectedTag) !== -1) {
          card.classList.remove("hidden");
        } else {
          card.classList.add("hidden");
        }
      });
    });
  });
})();
