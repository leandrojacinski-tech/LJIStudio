import { escapeHtml } from "./_helpers.js";

function emailLayout({ eyebrow, title, content, cta }) {
  return `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;background:#0B0D12;color:#F4F7FB;font-family:Arial,sans-serif">
    <div style="display:none;max-height:0;overflow:hidden">${escapeHtml(title)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0B0D12">
      <tr>
        <td align="center" style="padding:32px 16px">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#151922;border:1px solid #2A3140;border-radius:16px">
            <tr>
              <td style="padding:32px">
                <p style="margin:0 0 18px;color:#22D3EE;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">${escapeHtml(eyebrow)}</p>
                <h1 style="margin:0 0 18px;color:#F4F7FB;font-size:28px;line-height:1.2">${escapeHtml(title)}</h1>
                <div style="color:#C9D2E3;font-size:16px;line-height:1.65">${content}</div>
                ${cta ? `<p style="margin:28px 0 8px"><a href="${escapeHtml(cta.url)}" style="display:inline-block;padding:14px 20px;background:#3B82F6;color:#FFFFFF;text-decoration:none;font-weight:700;border-radius:10px">${escapeHtml(cta.label)}</a></p>` : ""}
                <p style="margin:30px 0 0;padding-top:22px;border-top:1px solid #2A3140;color:#8F9BB0;font-size:13px;line-height:1.5">LJI Studio · Sites, vídeos e presença digital<br>Ponta Grossa, Paraná · Atendimento remoto</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function checklistEmail({ name, downloadUrl }) {
  return {
    subject: "Seu checklist de 21 pontos está aqui",
    text: [
      `Olá, ${name}!`,
      "",
      "Obrigado por solicitar o checklist da LJI Studio.",
      "O PDF está anexado a este e-mail e também pode ser baixado pelo link:",
      downloadUrl,
      "",
      "Se precisar de ajuda para aplicar os pontos no seu site, responda este e-mail.",
      "",
      "Leandro Jacinski",
      "LJI Studio",
    ].join("\n"),
    html: emailLayout({
      eyebrow: "Material solicitado",
      title: `Olá, ${name}! Seu checklist está pronto.`,
      content: "<p style=\"margin:0 0 14px\">Obrigado por solicitar o checklist da LJI Studio.</p><p style=\"margin:0\">O PDF está anexado a este e-mail. Você também pode usar o botão abaixo para baixar uma nova cópia quando precisar.</p><p style=\"margin:16px 0 0\">Se quiser ajuda para aplicar os 21 pontos no seu site, basta responder esta mensagem.</p>",
      cta: { label: "Baixar checklist", url: downloadUrl },
    }),
  };
}

export function contactConfirmationEmail({ name }) {
  return {
    subject: "Recebemos sua solicitação",
    text: [
      `Olá, ${name}!`,
      "",
      "Recebi sua solicitação e vou analisar as informações enviadas.",
      "Você receberá uma resposta em até 1 dia útil com perguntas objetivas ou uma recomendação de próximo passo.",
      "",
      "Leandro Jacinski",
      "LJI Studio",
    ].join("\n"),
    html: emailLayout({
      eyebrow: "Solicitação recebida",
      title: `Obrigado pelo contato, ${name}.`,
      content: "<p style=\"margin:0 0 14px\">Recebi sua solicitação e vou analisar as informações enviadas.</p><p style=\"margin:0\">Você receberá uma resposta em até <strong style=\"color:#F4F7FB\">1 dia útil</strong>, com perguntas objetivas ou uma recomendação de próximo passo.</p>",
    }),
  };
}
