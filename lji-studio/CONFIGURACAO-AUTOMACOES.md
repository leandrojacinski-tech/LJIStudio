# Configuração das automações da LJI Studio

Este documento coloca em produção os formulários do site usando **Vercel Functions + Resend + Cloudflare Turnstile**.

## 1. Resultado esperado

### Checklist

1. O visitante informa nome, e-mail, tipo de negócio e WhatsApp opcional.
2. O Turnstile valida o envio.
3. A função `/api/checklist` cria ou atualiza o contato na Resend.
4. O contato entra no segmento `Leads - Checklist`.
5. Sem autorização de marketing, um contato novo fica desabilitado para Broadcasts.
6. Com autorização, o contato também entra em `Leads - Marketing` e é habilitado para Broadcasts.
7. A Resend envia o checklist como PDF anexado e também inclui o link de download.
8. Com autorização, o evento `lji.marketing_consent` inicia a sequência de conteúdo.
9. Leandro recebe uma notificação com os dados do lead.
10. O visitante vai para `obrigado.html?origem=checklist`.

### Orçamento

1. O visitante envia as informações do projeto.
2. O Turnstile valida o envio.
3. A função `/api/contato` cria ou atualiza o contato.
4. O contato entra no segmento `Leads - Orçamentos`.
5. Leandro recebe o pedido completo em `contato@ljistudio.com.br`.
6. O visitante recebe uma confirmação.
7. O visitante vai para `obrigado.html?origem=contato`.

Os e-mails do checklist e da confirmação são transacionais e já estão definidos em `api/_emailTemplates.js`. Eles não dependem de modelos criados manualmente no painel da Resend.

## 2. Preparar a Resend

### Criar a conta e autenticar o domínio

1. Crie a conta em `https://resend.com`.
2. Abra **Domains** e adicione `ljistudio.com.br`.
3. Copie para o DNS da Cloudflare todos os registros mostrados pela Resend.
4. Mantenha os valores exatamente como a plataforma informar.
5. Não apague os registros MX usados pelo serviço que recebe mensagens em `contato@ljistudio.com.br`.
6. Aguarde o domínio aparecer como **Verified**.

Os registros de autenticação permitem que a Resend envie como:

```text
LJI Studio <contato@ljistudio.com.br>
```

O endereço precisa existir para receber respostas, mas o recebimento da caixa postal continua sendo responsabilidade do provedor de e-mail escolhido pela LJI.

### Criar a chave da API

1. Abra **API Keys**.
2. Crie uma chave chamada `Site LJI Studio`.
3. Use uma chave com acesso aos recursos de envio, contatos, segmentos e eventos.
4. Copie a chave uma única vez.
5. Salve-a somente como `RESEND_API_KEY` na Vercel.

Nunca coloque a chave em HTML, `script.js` ou repositório público.

### Criar os segmentos

Em **Audience > Segments**, crie:

- `Leads - Checklist`
- `Leads - Marketing`
- `Leads - Orçamentos`

Copie o UUID de cada segmento para:

| Segmento | Variável |
|---|---|
| `Leads - Checklist` | `RESEND_CHECKLIST_SEGMENT_ID` |
| `Leads - Marketing` | `RESEND_MARKETING_SEGMENT_ID` |
| `Leads - Orçamentos` | `RESEND_ORCAMENTOS_SEGMENT_ID` |

Os IDs da Resend são textos no formato UUID. Não os transforme em números.

### Criar as propriedades de contato

Em **Audience > Properties**, crie as propriedades abaixo com o tipo `string`:

| Chave exata | Finalidade |
|---|---|
| `nome` | Nome informado |
| `tipo_negocio` | Tipo de negócio |
| `telefone` | WhatsApp |
| `empresa` | Empresa ou perfil |
| `servico_interesse` | Serviço solicitado |
| `ultima_origem` | Último formulário enviado |
| `consentimento_marketing_em` | Data e hora do consentimento |
| `sequencia_marketing_status` | Controle contra sequência duplicada |

Para `sequencia_marketing_status`, use `nao_iniciada` como valor padrão. Nas demais, use um valor padrão neutro apenas se o painel exigir.

## 3. Criar a automação autorizada de marketing

A função do checklist dispara o evento:

```text
lji.marketing_consent
```

Esse evento só é enviado quando o visitante marca a autorização opcional.

### Modelos da sequência

Em **Templates**, crie e publique três modelos:

1. `Checklist - Como aplicar`
2. `Checklist - Confiança e contato`
3. `Checklist - Convite para análise`

Inclua o link de descadastro da Resend em todas as mensagens de marketing:

```text
{{{RESEND_UNSUBSCRIBE_URL}}}
```

### Fluxo da automação

1. Crie uma automação chamada `Nutrição - Checklist LJI`.
2. Use o evento `lji.marketing_consent` como gatilho.
3. Adicione uma condição: prossiga somente quando `sequencia_marketing_status` for `nao_iniciada`.
4. Atualize `sequencia_marketing_status` para `em_andamento`.
5. Aguarde 1 dia e envie `Checklist - Como aplicar`.
6. Aguarde mais 2 dias e envie `Checklist - Confiança e contato`.
7. Aguarde mais 4 dias e envie `Checklist - Convite para análise`.
8. Atualize `sequencia_marketing_status` para `concluida`.
9. Publique e inicie a automação.

Essa condição evita iniciar novamente a sequência para quem já a recebeu. O checklist e a confirmação de orçamento continuam sendo enviados independentemente da automação.

## 4. Preparar o Cloudflare Turnstile

1. No painel da Cloudflare, abra **Turnstile**.
2. Crie o widget `Formulários LJI Studio`.
3. Autorize `ljistudio.com.br`, `www.ljistudio.com.br`, o domínio estável da Vercel e `localhost` durante testes.
4. Copie a site key para `TURNSTILE_SITE_KEY`.
5. Copie a secret key para `TURNSTILE_SECRET_KEY`.
6. Liste os hostnames autorizados em `TURNSTILE_ALLOWED_HOSTNAMES`, separados por vírgula.

A site key é enviada ao navegador por `/api/config`. A secret key permanece apenas no backend.

## 5. Variáveis de ambiente da Vercel

Use `.env.example` como referência:

| Variável | Conteúdo |
|---|---|
| `RESEND_API_KEY` | Chave secreta da Resend |
| `RESEND_CHECKLIST_SEGMENT_ID` | UUID de `Leads - Checklist` |
| `RESEND_MARKETING_SEGMENT_ID` | UUID de `Leads - Marketing` |
| `RESEND_ORCAMENTOS_SEGMENT_ID` | UUID de `Leads - Orçamentos` |
| `LJI_CONTACT_EMAIL` | `contato@ljistudio.com.br` |
| `LJI_SENDER_EMAIL` | `contato@ljistudio.com.br` |
| `LJI_SENDER_NAME` | `LJI Studio` |
| `LJI_CHECKLIST_URL` | URL pública completa do PDF |
| `TURNSTILE_SITE_KEY` | Site key pública |
| `TURNSTILE_SECRET_KEY` | Secret key privada |
| `TURNSTILE_ALLOWED_HOSTNAMES` | Hostnames separados por vírgula |

Cadastre cada variável para **Production**, **Preview** e **Development** quando necessário. Faça um novo deploy depois de qualquer alteração.

Exemplo da URL do PDF:

```text
https://www.ljistudio.com.br/assets/downloads/checklist-21-pontos-lji-studio.pdf
```

## 6. Executar localmente

1. Copie `.env.example` para `.env.local`.
2. Preencha os valores reais.
3. Execute:

```bash
npm test
npx vercel dev
```

4. Abra o endereço informado pela Vercel.
5. Não abra os arquivos por `file://`, pois as funções da pasta `api` não serão executadas.

## 7. Publicar na Vercel

1. Envie a pasta `lji-studio` para um repositório Git.
2. Importe o repositório na Vercel.
3. Use o preset **Other**.
4. Não defina comando de build nem pasta de saída.
5. Cadastre as variáveis de ambiente.
6. Faça o deploy.
7. Vincule `ljistudio.com.br` e `www.ljistudio.com.br`.
8. Atualize `TURNSTILE_ALLOWED_HOSTNAMES` com o domínio final da Vercel.

## 8. Migração segura da Brevo

1. Configure domínio, segmentos, propriedades e automação na Resend.
2. Cadastre todas as variáveis `RESEND_*` na Vercel.
3. Publique esta versão do código.
4. Teste os dois formulários com endereços reais.
5. Confirme entrega no Gmail e no Outlook.
6. Exporte da Brevo apenas contatos que tenham base legítima e consentimento aplicável.
7. Importe na Resend somente quem deve continuar recebendo conteúdo.
8. Mantenha a Brevo ativa até confirmar que os fluxos da Resend funcionam.
9. Depois da validação, remova da Vercel as antigas variáveis `BREVO_*`.

O front-end não precisa ser alterado: as rotas continuam sendo `/api/checklist` e `/api/contato`.

## 9. Testes obrigatórios

### Checklist sem marketing

- recebe o PDF anexado;
- o botão de download funciona;
- entra somente em `Leads - Checklist`;
- fica desabilitado para Broadcasts quando é um contato novo;
- Leandro recebe a notificação;
- não gera o evento de marketing.

### Checklist com marketing

- recebe o PDF anexado;
- entra em `Leads - Checklist` e `Leads - Marketing`;
- fica habilitado para Broadcasts;
- gera o evento `lji.marketing_consent`;
- inicia a sequência de 1, 3 e 7 dias.

### Orçamento

- entra em `Leads - Orçamentos`;
- Leandro recebe todos os campos;
- o visitante recebe a confirmação;
- a página de obrigado não exibe o download do checklist;
- um contato que já consentiu com marketing não perde esse consentimento.

### Segurança e repetição

- um token Turnstile inválido deve ser recusado;
- o campo-isca preenchido não deve gerar e-mail;
- repetir um e-mail existente deve atualizar o contato;
- nenhuma chave secreta deve aparecer no código enviado ao navegador;
- a automação não deve iniciar novamente quando `sequencia_marketing_status` não for `nao_iniciada`.

## 10. Manutenção

- revise mensalmente os erros das funções na Vercel;
- acompanhe entregas, bounces e bloqueios nos logs da Resend;
- acompanhe o limite diário e mensal do plano;
- remova contatos inativos que não tenham finalidade de retenção;
- respeite solicitações de descadastro e eliminação;
- atualize a Política de Privacidade antes de adicionar Analytics, pixels, anúncios ou novos operadores;
- teste os dois formulários após qualquer mudança de domínio, DNS ou automação.
