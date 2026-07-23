const menuButton = document.querySelector("[data-menu-button]");
const navigation = document.querySelector("[data-navigation]");

if (menuButton && navigation) {
  const closeMenu = () => {
    menuButton.setAttribute("aria-expanded", "false");
    navigation.removeAttribute("data-open");
    document.body.classList.remove("menu-open");
  };

  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    navigation.toggleAttribute("data-open", !isOpen);
    document.body.classList.toggle("menu-open", !isOpen);
  });

  navigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 800) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
}

const filterButtons = document.querySelectorAll("[data-filter]");
const projects = document.querySelectorAll("[data-project-category]");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;

    filterButtons.forEach((item) => {
      const selected = item === button;
      item.classList.toggle("is-active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });

    projects.forEach((project) => {
      const categories = project.dataset.projectCategory.split(" ");
      project.hidden = filter !== "all" && !categories.includes(filter);
    });
  });
});

const revealItems = document.querySelectorAll("[data-reveal]");

if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.documentElement.classList.add("has-reveal");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealItems.forEach((item) => observer.observe(item));
}

document.querySelectorAll("[data-current-year]").forEach((item) => {
  item.textContent = new Date().getFullYear();
});

const serviceSelect = document.querySelector("[data-service-select]");

if (serviceSelect) {
  const requestedService = new URLSearchParams(window.location.search).get("servico");
  const matchingOption = [...serviceSelect.options].some((option) => option.value === requestedService);

  if (requestedService && matchingOption) {
    serviceSelect.value = requestedService;
  }
}

const turnstileWidgets = new WeakMap();
const apiForms = document.querySelectorAll("[data-api-form]");

function setFormStatus(form, message) {
  const status = form.querySelector("[data-form-status]");
  if (status) status.textContent = message;
}

function waitForTurnstile(timeout = 5000) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      if (window.turnstile) {
        window.clearInterval(interval);
        resolve(window.turnstile);
      } else if (Date.now() - startedAt >= timeout) {
        window.clearInterval(interval);
        reject(new Error("O serviço de verificação não carregou."));
      }
    }, 100);
  });
}

async function initializeTurnstile() {
  if (!apiForms.length) return;

  try {
    const [configResponse, turnstile] = await Promise.all([
      fetch("/api/config", { headers: { Accept: "application/json" } }),
      waitForTurnstile(),
    ]);

    const config = await configResponse.json().catch(() => ({}));

    if (!configResponse.ok || !config.turnstileSiteKey) {
      throw new Error(config.error || "A verificação antispam ainda não foi configurada.");
    }

    document.querySelectorAll("[data-turnstile-action]").forEach((container) => {
      const form = container.closest("form");
      const widgetId = turnstile.render(container, {
        sitekey: config.turnstileSiteKey,
        action: container.dataset.turnstileAction,
        theme: "auto",
        size: "flexible",
      });

      if (form) turnstileWidgets.set(form, widgetId);
    });
  } catch (error) {
    apiForms.forEach((form) => {
      setFormStatus(form, `${error.message} Tente novamente mais tarde.`);
      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) submitButton.disabled = true;
    });
  }
}

apiForms.forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    const originalLabel = submitButton?.textContent;

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Enviando...";
    }

    setFormStatus(form, "Enviando seus dados com segurança...");

    try {
      const payload = Object.fromEntries(new FormData(form).entries());
      const response = await fetch(form.action, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Não foi possível concluir o envio.");
      }

      window.location.assign(result.redirect || "/obrigado.html");
    } catch (error) {
      setFormStatus(form, error.message);

      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalLabel;
      }

      const widgetId = turnstileWidgets.get(form);
      if (widgetId !== undefined && window.turnstile) {
        window.turnstile.reset(widgetId);
      }
    }
  });
});

initializeTurnstile();

const thankYouTitle = document.querySelector("[data-thank-you-title]");

if (thankYouTitle) {
  const origin = new URLSearchParams(window.location.search).get("origem");
  const message = document.querySelector("[data-thank-you-message]");
  const download = document.querySelector("[data-checklist-download]");

  if (origin === "checklist") {
    thankYouTitle.textContent = "Seu checklist está a caminho.";
    if (message) {
      message.textContent = "Enviamos o material para o e-mail informado. Se a mensagem demorar, verifique também as pastas de spam e promoções. O botão abaixo funciona como alternativa.";
    }
  } else {
    thankYouTitle.textContent = "Sua solicitação foi recebida.";
    if (message) {
      message.textContent = "Vou analisar o cenário e responder em até 1 dia útil com perguntas objetivas ou uma recomendação de próximo passo.";
    }
    if (download) download.hidden = true;
  }
}
