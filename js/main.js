const modalButtons = document.querySelectorAll("[data-modal-open]");
    const closeButtons = document.querySelectorAll("[data-modal-close]");
    const modals = document.querySelectorAll(".modal");

    modalButtons.forEach(button => {
      button.addEventListener("click", () => {
        const modalId = button.getAttribute("data-modal-open");
        document.getElementById(modalId).classList.add("modal--active");
      });
    });

    closeButtons.forEach(button => {
      button.addEventListener("click", () => {
        button.closest(".modal").classList.remove("modal--active");
      });
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        modals.forEach(modal => modal.classList.remove("modal--active"));
      }
});