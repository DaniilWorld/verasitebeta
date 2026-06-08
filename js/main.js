const modalButtons = document.querySelectorAll("[data-modal-open]");
const closeButtons = document.querySelectorAll("[data-modal-close]");
const modals = document.querySelectorAll(".modal");
const revealItems = document.querySelectorAll(".reveal");
const driftItems = document.querySelectorAll(".motion-drift");
const serviceDetails = document.querySelectorAll("[data-service-details]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

const easeOutCubic = value => 1 - Math.pow(1 - value, 3);
const easeInOutCubic = value => value < 0.5
  ? 4 * value * value * value
  : 1 - Math.pow(-2 * value + 2, 3) / 2;

const drawRoundedRect = (context, x, y, width, height, radius) => {
  const safeRadius = Math.min(radius, width / 2, height / 2);

  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
};

const createParticleTargets = (width, height, count) => {
  const targets = [];
  const insetX = Math.max(14, width * 0.045);
  const insetY = Math.max(14, height * 0.08);
  const innerWidth = width - insetX * 2;
  const innerHeight = height - insetY * 2;
  const outlineCount = Math.round(count * 0.56);
  const contentCount = count - outlineCount;

  for (let index = 0; index < outlineCount; index += 1) {
    const side = index % 4;
    const t = (index / outlineCount * 4) % 1;
    const jitter = 4;
    let x = insetX;
    let y = insetY;

    if (side === 0) {
      x = insetX + innerWidth * t;
      y = insetY;
    } else if (side === 1) {
      x = insetX + innerWidth;
      y = insetY + innerHeight * t;
    } else if (side === 2) {
      x = insetX + innerWidth * (1 - t);
      y = insetY + innerHeight;
    } else {
      x = insetX;
      y = insetY + innerHeight * (1 - t);
    }

    targets.push({
      x: x + (Math.random() - 0.5) * jitter,
      y: y + (Math.random() - 0.5) * jitter,
      type: "outline"
    });
  }

  const columns = Math.max(5, Math.round(Math.sqrt(contentCount * 1.2)));
  const rows = Math.max(3, Math.ceil(contentCount / columns));

  for (let row = 0; row < rows && targets.length < count; row += 1) {
    for (let column = 0; column < columns && targets.length < count; column += 1) {
      const xBase = columns === 1 ? 0.5 : column / (columns - 1);
      const yBase = rows === 1 ? 0.5 : row / (rows - 1);
      targets.push({
        x: insetX + innerWidth * Math.min(1, Math.max(0, xBase + (Math.random() - 0.5) * 0.1)),
        y: insetY + innerHeight * Math.min(1, Math.max(0, yBase + (Math.random() - 0.5) * 0.16)),
        type: "content"
      });
    }
  }

  return targets;
};

const animateServiceDetails = details => {
  if (!details || details.classList.contains("is-revealed") || details.classList.contains("is-assembling")) return;

  if (reduceMotion) {
    details.classList.add("is-revealed");
    return;
  }

  details.classList.add("is-assembling");

  window.requestAnimationFrame(() => {
    const rect = details.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(180, details.scrollHeight + 36, rect.height);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      details.classList.remove("is-assembling");
      details.classList.add("is-revealed");
      return;
    }

    const isMobile = window.matchMedia("(max-width: 760px)").matches;
    const isTablet = window.matchMedia("(max-width: 1024px)").matches;
    const particleCount = isMobile ? 72 : isTablet ? 104 : 144;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.className = "service-particles-canvas";
    canvas.dataset.particleCount = String(particleCount);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.scale(dpr, dpr);
    details.appendChild(canvas);

    const targets = createParticleTargets(width, height, particleCount);
    const particles = targets.map((target, index) => {
      const startZone = index % 5;
      const sourceX = startZone === 0 ? width * 0.12 : startZone === 1 ? width * 0.88 : Math.random() * width;
      const sourceY = startZone === 2 ? height * 0.18 : startZone === 3 ? height * 0.86 : Math.random() * height;

      return {
        startX: sourceX + (Math.random() - 0.5) * width * 0.18,
        startY: sourceY + (Math.random() - 0.5) * height * 0.18,
        targetX: target.x,
        targetY: target.y,
        type: target.type,
        radius: isMobile ? 1.75 + Math.random() * 1.05 : 1.95 + Math.random() * 1.35,
        delay: Math.random() * 130,
        alpha: 0.72 + Math.random() * 0.22
      };
    });

    const duration = isMobile ? 1500 : 1650;
    const particleDuration = duration * 0.72;
    const structureStart = duration * 0.4;
    const contentStart = duration * 0.72;
    const start = performance.now();

    const drawFrame = now => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);

      context.clearRect(0, 0, width, height);

      const structureProgress = Math.min(1, Math.max(0, (elapsed - structureStart) / (contentStart - structureStart)));
      const structureEase = easeInOutCubic(structureProgress);

      if (structureProgress > 0) {
        const cardInsetX = (width * 0.24) * (1 - structureEase);
        const cardInsetY = (height * 0.34) * (1 - structureEase);

        context.save();
        context.globalAlpha = Math.min(0.34, structureEase * 0.34);
        context.fillStyle = "#ffffff";
        drawRoundedRect(context, cardInsetX, cardInsetY, width - cardInsetX * 2, height - cardInsetY * 2, 18);
        context.fill();
        context.globalAlpha = Math.min(0.55, structureEase * 0.55);
        context.strokeStyle = "rgba(115, 92, 73, 0.34)";
        context.lineWidth = 1;
        drawRoundedRect(context, cardInsetX, cardInsetY, width - cardInsetX * 2, height - cardInsetY * 2, 18);
        context.stroke();
        context.restore();
      }

      particles.forEach(particle => {
        const particleElapsed = Math.max(0, elapsed - particle.delay);
        const particleProgress = Math.min(1, particleElapsed / particleDuration);
        const eased = easeOutCubic(particleProgress);
        const settle = Math.sin(Math.min(1, particleProgress) * Math.PI) * 7;
        const x = particle.startX + (particle.targetX - particle.startX) * eased;
        const y = particle.startY + (particle.targetY - particle.startY) * eased - settle;
        const fadeOut = progress > 0.78 ? 1 - Math.min(1, (progress - 0.78) / 0.18) : 1;
        const structureBoost = particle.type === "outline" && progress > 0.4 && progress < 0.74 ? 1.24 : 1;
        const alpha = particle.alpha * Math.min(1, particleProgress * 2.4) * fadeOut * structureBoost;

        if (alpha <= 0) return;

        context.beginPath();
        context.globalAlpha = alpha;
        context.fillStyle = particle.type === "outline"
          ? "rgba(115, 92, 73, 0.95)"
          : "rgba(115, 92, 73, 0.82)";
        context.arc(x, y, particle.radius, 0, Math.PI * 2);
        context.fill();

        if (particle.type === "outline" && structureProgress > 0.1 && structureProgress < 0.94) {
          context.beginPath();
          context.globalAlpha = alpha * 0.36;
          context.strokeStyle = "rgba(115, 92, 73, 0.72)";
          context.lineWidth = 1;
          context.moveTo(x, y);
          context.lineTo(
            x + (particle.targetX - x) * 0.28,
            y + (particle.targetY - y) * 0.28
          );
          context.stroke();
        }
      });

      context.globalAlpha = 1;

      if (elapsed >= contentStart && !details.classList.contains("is-revealed")) {
        details.classList.add("is-revealed");
      }

      if (progress < 1) {
        window.requestAnimationFrame(drawFrame);
      } else {
        details.classList.remove("is-assembling");
        details.classList.add("is-revealed");
        canvas.remove();
      }
    };

    window.requestAnimationFrame(drawFrame);
  });
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
        animateServiceDetails(details);
        detailsObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.45,
    rootMargin: "0px 0px -16% 0px"
  });

  serviceDetails.forEach(item => {
    detailsObserver.observe(item.closest(".service-offer") || item);
  });
} else {
  serviceDetails.forEach(item => item.classList.add("is-revealed"));
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
