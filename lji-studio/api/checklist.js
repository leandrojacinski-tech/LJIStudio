import {
  clean,
  getEnv,
  isChecked,
  isValidEmail,
  parseBody,
  sendEmail,
  sendMarketingConsentEvent,
  sendTextEmail,
  upsertContact,
  verifyTurnstile,
} from "./_helpers.js";
import { checklistEmail } from "./_emailTemplates.js";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Método não permitido." });
  }

  try {
    const body = parseBody(request);

    // Campo-isca: responde como sucesso sem cadastrar ou enviar nada.
    if (clean(body.website, 100)) {
      return response.status(200).json({ ok: true, redirect: "/obrigado.html?origem=checklist" });
    }

    const nome = clean(body.nome, 80).replace(/\s+/g, " ");
    const email = clean(body.email, 150).toLowerCase();
    const tipoNegocio = clean(body.tipoNegocio, 100);
    const whatsapp = clean(body.whatsapp, 30);
    const privacidade = isChecked(body.privacidade);
    const marketing = isChecked(body.marketing);
    const turnstileToken = clean(body["cf-turnstile-response"], 2048);

    if (!nome || !isValidEmail(email) || !tipoNegocio) {
      return response.status(400).json({
        error: "Preencha nome, e-mail e tipo de negócio corretamente.",
      });
    }

    if (!privacidade) {
      return response.status(400).json({
        error: "Confirme a leitura da Política de Privacidade.",
      });
    }

    if (!(await verifyTurnstile(request, turnstileToken, "checklist"))) {
      return response.status(400).json({
        error: "Não foi possível validar o antispam. Atualize a página e tente novamente.",
      });
    }

    const segmentIds = [getEnv("RESEND_CHECKLIST_SEGMENT_ID")];

    if (marketing) {
      segmentIds.push(getEnv("RESEND_MARKETING_SEGMENT_ID"));
    }

    const properties = {
      nome,
      tipo_negocio: tipoNegocio,
      ultima_origem: "Checklist do site LJI",
    };

    if (whatsapp) properties.telefone = whatsapp;
    if (marketing) properties.consentimento_marketing_em = new Date().toISOString();

    await upsertContact({
      email,
      name: nome,
      properties,
      segmentIds,
      marketingConsent: marketing,
    });

    const checklistUrl = getEnv("LJI_CHECKLIST_URL");
    const message = checklistEmail({ name: nome, downloadUrl: checklistUrl });

    await sendEmail({
      to: { name: nome, email },
      ...message,
      replyTo: { name: "Leandro", email: getEnv("LJI_CONTACT_EMAIL") },
      attachments: [
        {
          path: checklistUrl,
          filename: "checklist-21-pontos-lji-studio.pdf",
        },
      ],
    });

    if (marketing) {
      try {
        await sendMarketingConsentEvent({
          email,
          name: nome,
          businessType: tipoNegocio,
        });
      } catch (error) {
        console.error("Falha ao iniciar a sequência de conteúdo:", error.message);
      }
    }

    try {
      await sendTextEmail({
        to: { name: "Leandro", email: getEnv("LJI_CONTACT_EMAIL") },
        subject: "Novo lead do checklist - LJI Studio",
        content: [
          `Nome: ${nome}`,
          `E-mail: ${email}`,
          `WhatsApp: ${whatsapp || "Não informado"}`,
          `Tipo de negócio: ${tipoNegocio}`,
          `Aceitou conteúdos adicionais: ${marketing ? "Sim" : "Não"}`,
        ].join("\n"),
        replyTo: { name: nome, email },
      });
    } catch (error) {
      console.error("Falha na notificação do checklist:", error.message);
    }

    return response.status(200).json({
      ok: true,
      redirect: "/obrigado.html?origem=checklist",
    });
  } catch (error) {
    console.error("Erro no checklist:", error.message);
    return response.status(500).json({
      error: "Não foi possível enviar o checklist agora. Tente novamente em alguns minutos.",
    });
  }
}
