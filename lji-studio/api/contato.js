import {
  clean,
  getEnv,
  isChecked,
  isValidEmail,
  parseBody,
  sendEmail,
  sendTextEmail,
  upsertContact,
  verifyTurnstile,
} from "./_helpers.js";
import { contactConfirmationEmail } from "./_emailTemplates.js";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Método não permitido." });
  }

  try {
    const body = parseBody(request);

    if (clean(body.website, 100)) {
      return response.status(200).json({ ok: true, redirect: "/obrigado.html?origem=contato" });
    }

    const nome = clean(body.nome, 80).replace(/\s+/g, " ");
    const empresa = clean(body.empresa, 100);
    const whatsapp = clean(body.whatsapp, 30);
    const email = clean(body.email, 150).toLowerCase();
    const servico = clean(body.servico, 100);
    const inicio = clean(body.inicio, 100);
    const objetivo = clean(body.objetivo, 300);
    const orcamento = clean(body.orcamento, 100);
    const links = clean(body.links, 500);
    const mensagem = clean(body.mensagem, 2000);
    const privacidade = isChecked(body.privacidade);
    const turnstileToken = clean(body["cf-turnstile-response"], 2048);

    if (
      !nome ||
      !isValidEmail(email) ||
      !whatsapp ||
      !servico ||
      !inicio ||
      !objetivo ||
      !orcamento ||
      mensagem.length < 10
    ) {
      return response.status(400).json({ error: "Revise os campos obrigatórios do formulário." });
    }

    if (!privacidade) {
      return response.status(400).json({
        error: "Confirme a leitura da Política de Privacidade.",
      });
    }

    if (!(await verifyTurnstile(request, turnstileToken, "contato"))) {
      return response.status(400).json({
        error: "Não foi possível validar o antispam. Atualize a página e tente novamente.",
      });
    }

    const properties = {
      nome,
      telefone: whatsapp,
      servico_interesse: servico,
      ultima_origem: "Formulário de orçamento LJI",
    };

    if (empresa) properties.empresa = empresa;

    await upsertContact({
      email,
      name: nome,
      properties,
      segmentIds: [getEnv("RESEND_ORCAMENTOS_SEGMENT_ID")],
    });

    await sendTextEmail({
      to: { name: "Leandro", email: getEnv("LJI_CONTACT_EMAIL") },
      subject: "Novo pedido de orçamento - LJI Studio",
      content: [
        `Nome: ${nome}`,
        `Empresa ou perfil: ${empresa || "Não informado"}`,
        `E-mail: ${email}`,
        `WhatsApp: ${whatsapp}`,
        `Serviço: ${servico}`,
        `Início desejado: ${inicio}`,
        `Faixa de investimento: ${orcamento}`,
        `Objetivo: ${objetivo}`,
        `Links: ${links || "Não informados"}`,
        "",
        "Mensagem:",
        mensagem,
      ].join("\n"),
      replyTo: { name: nome, email },
    });

    try {
      await sendEmail({
        to: { name: nome, email },
        ...contactConfirmationEmail({ name: nome }),
        replyTo: { name: "Leandro", email: getEnv("LJI_CONTACT_EMAIL") },
      });
    } catch (error) {
      console.error("Falha na confirmação de contato:", error.message);
    }

    return response.status(200).json({
      ok: true,
      redirect: "/obrigado.html?origem=contato",
    });
  } catch (error) {
    console.error("Erro no contato:", error.message);
    return response.status(500).json({
      error: "Não foi possível enviar sua solicitação agora. Tente novamente em alguns minutos.",
    });
  }
}
