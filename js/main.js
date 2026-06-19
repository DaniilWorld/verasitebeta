const modalButtons = document.querySelectorAll("[data-modal-open]");
const closeButtons = document.querySelectorAll("[data-modal-close]");
const modals = document.querySelectorAll(".modal");
const revealItems = document.querySelectorAll(".reveal");
const driftItems = document.querySelectorAll(".motion-drift");
const serviceDetails = document.querySelectorAll("[data-service-details]");

let activeModal = null;
let lastTrigger = null;

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

const openModal = (modal, trigger) => {
  if (!modal) return;

  lastTrigger = trigger;
  activeModal = modal;
  modal.classList.add("modal--active");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  const firstFocusable = modal.querySelector(focusableSelector);
  if (firstFocusable) {
    firstFocusable.focus();
  }
};

const closeModal = (modal = activeModal) => {
  if (!modal) return;

  modal.classList.remove("modal--active");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  activeModal = null;

  if (lastTrigger) {
    lastTrigger.focus();
  }
};

modalButtons.forEach(button => {
  button.addEventListener("click", () => {
    const modalId = button.getAttribute("data-modal-open");
    openModal(document.getElementById(modalId), button);
  });
});

closeButtons.forEach(button => {
  button.addEventListener("click", () => {
    closeModal(button.closest(".modal"));
  });
});

modals.forEach(modal => {
  modal.addEventListener("click", event => {
    if (event.target.hasAttribute("data-modal-close")) {
      closeModal(modal);
    }
  });
});

window.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeModal();
  }
});

const revealServiceDetails = (details, index = 0) => {
  if (!details || details.classList.contains("is-revealed")) return;

  window.setTimeout(() => {
    details.classList.add("is-revealed");
  }, index * 150);
};

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.14,
    rootMargin: "0px 0px -8% 0px"
  });

  revealItems.forEach(item => revealObserver.observe(item));
} else {
  revealItems.forEach(item => item.classList.add("is-visible"));
}

if ("IntersectionObserver" in window) {
  const detailsObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const details = entry.target.querySelector("[data-service-details]") || entry.target;
        const index = Number(details.dataset.revealIndex || 0);
        revealServiceDetails(details, index);
        detailsObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.45,
    rootMargin: "0px 0px -16% 0px"
  });

  serviceDetails.forEach((item, index) => {
    item.dataset.revealIndex = String(index);
    detailsObserver.observe(item.closest(".service-offer") || item);
  });
} else {
  serviceDetails.forEach((item, index) => {
    item.dataset.revealIndex = String(index);
    revealServiceDetails(item, index);
  });
}

const canDrift = window.matchMedia("(min-width: 761px) and (prefers-reduced-motion: no-preference)").matches;

if (canDrift && driftItems.length) {
  let ticking = false;

  const updateDrift = () => {
    const viewportCenter = window.innerHeight / 2;

    driftItems.forEach((item, index) => {
      const rect = item.getBoundingClientRect();
      const distance = (rect.top + rect.height / 2 - viewportCenter) / viewportCenter;
      const strength = index % 2 === 0 ? 9 : -7;

      item.style.setProperty("--drift-y", `${Math.max(-14, Math.min(14, distance * strength))}px`);
      item.style.setProperty("--drift-x", `${Math.max(-6, Math.min(6, distance * strength * 0.35))}px`);
    });

    ticking = false;
  };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(updateDrift);
      ticking = true;
    }
  }, { passive: true });

  updateDrift();
}
