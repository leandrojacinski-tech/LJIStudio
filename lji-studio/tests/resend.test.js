import assert from "node:assert/strict";
import test from "node:test";

import { checklistEmail } from "../api/_emailTemplates.js";
import { sendEmail, upsertContact } from "../api/_helpers.js";

process.env.RESEND_API_KEY = "re_test";
process.env.LJI_SENDER_NAME = "LJI Studio";
process.env.LJI_SENDER_EMAIL = "contato@ljistudio.com.br";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

test("integração com a Resend", async (t) => {
  const originalFetch = global.fetch;

  await t.test("atualiza contato existente, reativa marketing e adiciona segmentos", async () => {
    const calls = [];
    global.fetch = async (url, options) => {
      calls.push({ url, options });
      return jsonResponse({ id: "ok" });
    };

    await upsertContact({
      email: "lead@example.com",
      name: "Lead Teste",
      properties: { nome: "Lead Teste" },
      segmentIds: ["segmento-checklist", "segmento-marketing"],
      marketingConsent: true,
    });

    assert.equal(calls.length, 3);
    assert.equal(calls[0].url, "https://api.resend.com/contacts/lead%40example.com");
    assert.equal(calls[0].options.method, "PATCH");
    assert.equal(JSON.parse(calls[0].options.body).unsubscribed, false);
    assert.match(calls[1].url, /segments\/segmento-checklist$/);
    assert.match(calls[2].url, /segments\/segmento-marketing$/);
    assert.equal(calls[0].options.headers.Authorization, "Bearer re_test");
  });

  await t.test("cria contato novo sem habilitar Broadcasts quando não há consentimento", async () => {
    const calls = [];
    global.fetch = async (url, options) => {
      calls.push({ url, options });
      if (calls.length === 1) {
        return jsonResponse({ message: "Not found" }, 404);
      }
      return jsonResponse({ id: "ok" });
    };

    await upsertContact({
      email: "novo@example.com",
      name: "Novo Lead",
      properties: { nome: "Novo Lead" },
      segmentIds: ["segmento-checklist"],
      marketingConsent: false,
    });

    assert.equal(calls[0].options.method, "PATCH");
    assert.equal(calls[1].url, "https://api.resend.com/contacts");
    const createBody = JSON.parse(calls[1].options.body);
    assert.equal(createBody.unsubscribed, true);
    assert.equal(createBody.first_name, "Novo Lead");
  });

  await t.test("envia e-mail com remetente, resposta e anexo no formato da Resend", async () => {
    const calls = [];
    global.fetch = async (url, options) => {
      calls.push({ url, options });
      return jsonResponse({ id: "email-id" });
    };

    await sendEmail({
      to: { name: "Cliente", email: "cliente@example.com" },
      subject: "Assunto",
      text: "Texto",
      html: "<p>Texto</p>",
      replyTo: { name: "Leandro", email: "contato@ljistudio.com.br" },
      attachments: [{ path: "https://example.com/checklist.pdf", filename: "checklist.pdf" }],
    });

    const body = JSON.parse(calls[0].options.body);
    assert.equal(body.from, "LJI Studio <contato@ljistudio.com.br>");
    assert.deepEqual(body.to, ["Cliente <cliente@example.com>"]);
    assert.equal(body.reply_to, "Leandro <contato@ljistudio.com.br>");
    assert.equal(body.attachments[0].filename, "checklist.pdf");
  });

  await t.test("escapa dados do visitante no HTML transacional", () => {
    const message = checklistEmail({
      name: "<script>alert(1)</script>",
      downloadUrl: "https://example.com/checklist.pdf",
    });

    assert.doesNotMatch(message.html, /<script>alert/);
    assert.match(message.html, /&lt;script&gt;/);
  });

  global.fetch = originalFetch;
});
