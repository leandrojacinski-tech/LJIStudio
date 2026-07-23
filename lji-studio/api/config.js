export default function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Método não permitido." });
  }

  const turnstileSiteKey = process.env.TURNSTILE_SITE_KEY;

  if (!turnstileSiteKey) {
    return response.status(503).json({ error: "Verificação antispam ainda não configurada." });
  }

  response.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
  return response.status(200).json({ turnstileSiteKey });
}
