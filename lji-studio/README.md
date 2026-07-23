# LJI Studio - site institucional

Site da LJI Studio para apresentar serviços de criação de sites e edição de vídeos, exibir projetos, captar pedidos de orçamento e entregar o checklist de 21 pontos por e-mail.

## Marca e contatos oficiais

- Marca: **LJI Studio**
- Responsável: **Leandro Jacinski**
- Site: `https://www.ljistudio.com.br`
- E-mail: `contato@ljistudio.com.br`
- Localidade: Ponta Grossa, Paraná, com atendimento remoto

## Estrutura

```text
lji-studio/
├── api/
│   ├── _emailTemplates.js # e-mails transacionais da marca
│   ├── _helpers.js       # validação, Resend e Turnstile
│   ├── checklist.js      # cadastro e entrega do checklist
│   ├── config.js         # fornece a site key pública do Turnstile
│   └── contato.js        # pedido de orçamento e confirmação
├── assets/
│   ├── downloads/        # checklist PDF da LJI
│   └── icons/            # favicon da marca
├── tests/                 # testes da integração com a Resend
├── index.html
├── projetos.html
├── servicos.html
├── sobre.html
├── contato.html
├── obrigado.html
├── politica-de-privacidade.html
├── script.js
├── styles.css
├── robots.txt
├── sitemap.xml
├── package.json
├── .env.example
└── CONFIGURACAO-AUTOMACOES.md
```

## O que já está implementado

- marca, domínio, metadados, dados estruturados e e-mails atualizados para LJI;
- formulário do checklist com e-mail obrigatório e consentimento de marketing separado;
- formulário de orçamento com qualificação completa;
- funções de backend para Vercel;
- integração por API com Resend;
- contatos organizados nos segmentos `Leads - Checklist`, `Leads - Marketing` e `Leads - Orçamentos`;
- checklist enviado como anexo e também disponibilizado por link;
- e-mails transacionais responsivos definidos no próprio projeto;
- evento `lji.marketing_consent` para iniciar a sequência autorizada de conteúdo;
- verificação Cloudflare Turnstile no navegador e no servidor;
- campo-isca adicional contra spam;
- página de obrigado adaptada ao tipo de envio;
- política de privacidade atualizada para as integrações reais;
- checklist em PDF atualizado para a LJI Studio.

## Para executar

1. Copie `.env.example` para `.env.local` e preencha os valores reais.
2. Faça login e vincule o projeto à Vercel.
3. Execute `npx vercel dev`.
4. Abra o endereço informado pelo terminal. Não abra o HTML usando `file://`, pois as funções da pasta `api` não serão executadas.

O procedimento completo da Resend, Turnstile, DNS, Vercel e testes está em `CONFIGURACAO-AUTOMACOES.md`.

## Pendências que exigem dados reais

- trocar `5500000000000` pelo WhatsApp oficial em todos os arquivos;
- confirmar que `ljistudio.com.br` está registrado e apontado para a Vercel;
- autenticar `ljistudio.com.br` na Resend;
- criar os segmentos, propriedades de contato e a automação de marketing na Resend;
- preencher as variáveis de ambiente;
- adicionar foto real de Leandro na página Sobre;
- revisar preços, prazos e disponibilidade da marca antes do lançamento.

Nunca publique `.env.local` nem coloque a chave da Resend ou a secret key do Turnstile dentro do HTML ou do `script.js`.
