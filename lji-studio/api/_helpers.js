const RESEND_API_URL = "https://api.resend.com";

export function getEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Variável de ambiente ausente: ${name}`);
  }

  return value;
}

export function parseBody(request) {
  if (request.body && typeof request.body === "object") {
    return request.body;
  }

  if (typeof request.body !== "string") {
    return {};
  }

  const contentType = request.headers["content-type"] || "";

  if (contentType.includes("application/json")) {
    return JSON.parse(request.body);
  }

  return Object.fromEntries(new URLSearchParams(request.body));
}

export function clean(value, maxLength = 500) {
  return String(value ?? "")
    .trim()
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .slice(0, maxLength);
}

export function isChecked(value) {
  return value === true || ["true", "on", "1"].includes(String(value).toLowerCase());
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

class ResendApiError extends Error {
  constructor(status, message) {
    super(`Resend ${status}: ${message}`);
    this.name = "ResendApiError";
    this.status = status;
  }
}

async function resendRequest(path, { method = "POST", body } = {}) {
  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${getEnv("RESEND_API_KEY")}`,
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${RESEND_API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const raw = await response.text();
  let data = {};

  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = { message: raw };
    }
  }

  if (!response.ok) {
    throw new ResendApiError(
      response.status,
      data.message || data.name || response.statusText || "erro desconhecido",
    );
  }

  return data;
}

function formatAddress(contact) {
  if (typeof contact === "string") return contact;
  return contact.name ? `${contact.name} <${contact.email}>` : contact.email;
}

async function addContactToSegment(email, segmentId) {
  try {
    return await resendRequest(
      `/contacts/${encodeURIComponent(email)}/segments/${encodeURIComponent(segmentId)}`,
      { method: "POST" },
    );
  } catch (error) {
    // Adicionar novamente o mesmo contato ao mesmo segmento não deve quebrar o formulário.
    if (error instanceof ResendApiError && error.status === 409) return null;
    throw error;
  }
}

export async function upsertContact({
  email,
  name,
  properties = {},
  segmentIds = [],
  marketingConsent = null,
}) {
  const contactPath = `/contacts/${encodeURIComponent(email)}`;
  const updateBody = { properties };

  // Só reativa Broadcasts quando houve consentimento explícito neste envio.
  // A ausência da marcação não revoga um consentimento anterior.
  if (marketingConsent === true) {
    updateBody.unsubscribed = false;
  }

  let created = false;

  try {
    await resendRequest(contactPath, { method: "PATCH", body: updateBody });
  } catch (error) {
    if (!(error instanceof ResendApiError) || error.status !== 404) {
      throw error;
    }

    try {
      await resendRequest("/contacts", {
        method: "POST",
        body: {
          email,
          first_name: name,
          properties,
          // Novos contatos sem aceite não ficam habilitados para Broadcasts.
          unsubscribed: marketingConsent !== true,
        },
      });
      created = true;
    } catch (createError) {
      // Protege contra dois envios simultâneos com o mesmo e-mail.
      if (!(createError instanceof ResendApiError) || createError.status !== 409) {
        throw createError;
      }
      await resendRequest(contactPath, { method: "PATCH", body: updateBody });
    }
  }

  await Promise.all(segmentIds.map((segmentId) => addContactToSegment(email, segmentId)));
  return { created };
}

export async function sendEmail({
  to,
  subject,
  text,
  html,
  replyTo,
  attachments,
}) {
  const payload = {
    from: formatAddress({
      name: getEnv("LJI_SENDER_NAME"),
      email: getEnv("LJI_SENDER_EMAIL"),
    }),
    to: [formatAddress(to)],
    subject,
    text,
    html,
  };

  if (replyTo) payload.reply_to = formatAddress(replyTo);
  if (attachments?.length) payload.attachments = attachments;

  return resendRequest("/emails", { method: "POST", body: payload });
}

export async function sendTextEmail({ to, subject, content, replyTo }) {
  return sendEmail({
    to,
    subject,
    text: content,
    html: `<div style="font-family:Arial,sans-serif;white-space:pre-wrap">${escapeHtml(content)}</div>`,
    replyTo,
  });
}

export async function sendMarketingConsentEvent({ email, name, businessType }) {
  return resendRequest("/events/send", {
    method: "POST",
    body: {
      event: "lji.marketing_consent",
      email,
      payload: {
        nome: name,
        tipo_negocio: businessType,
      },
    },
  });
}

export async function verifyTurnstile(request, token, expectedAction) {
  if (!token) return false;

  const forwardedFor = request.headers["x-forwarded-for"];
  const remoteIp = typeof forwardedFor === "string" ? forwardedFor.split(",")[0].trim() : "";
  const verificationBody = {
    secret: getEnv("TURNSTILE_SECRET_KEY"),
    response: token,
  };

  if (remoteIp) {
    verificationBody.remoteip = remoteIp;
  }

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(verificationBody),
  });

  const result = await response.json();
  const allowedHosts = getEnv("TURNSTILE_ALLOWED_HOSTNAMES")
    .split(",")
    .map((hostname) => hostname.trim())
    .filter(Boolean);

  return Boolean(
    result.success &&
      result.action === expectedAction &&
      allowedHosts.includes(result.hostname),
  );
}
