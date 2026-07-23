from pathlib import Path
import sys

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
)


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / "assets" / "downloads" / "checklist-21-pontos-lji-studio.pdf"
OUTPUT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else DEFAULT_OUTPUT

PAGE_WIDTH, PAGE_HEIGHT = A4
OBSIDIAN = colors.HexColor("#0B0D12")
GRAPHITE = colors.HexColor("#171C26")
INK = colors.HexColor("#171C26")
STEEL = colors.HexColor("#677386")
ICE = colors.HexColor("#F4F7FB")
SIGNAL = colors.HexColor("#3B82F6")
CYAN = colors.HexColor("#22D3EE")
LINE = colors.HexColor("#D6DEE9")
SURFACE = colors.HexColor("#F6F8FB")


def register_fonts():
    regular = Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
    bold = Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")

    if regular.exists() and bold.exists():
        pdfmetrics.registerFont(TTFont("LJI-Regular", str(regular)))
        pdfmetrics.registerFont(TTFont("LJI-Bold", str(bold)))
        return "LJI-Regular", "LJI-Bold"

    return "Helvetica", "Helvetica-Bold"


REGULAR, BOLD = register_fonts()


def draw_brand(canvas, x, y, compact=False):
    size = 24 if compact else 38
    radius = 7 if compact else 10
    canvas.setFillColor(SIGNAL)
    canvas.roundRect(x, y - size, size, size, radius, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    canvas.setFont(BOLD, 8 if compact else 12)
    canvas.drawCentredString(x + size / 2, y - size * 0.67, "LJI")
    canvas.setFillColor(INK if compact else ICE)
    canvas.setFont(BOLD, 8.5 if compact else 12.5)
    canvas.drawString(x + size + (9 if compact else 14), y - size * 0.52, "LJI STUDIO")


def draw_cover(canvas):
    canvas.setFillColor(OBSIDIAN)
    canvas.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
    draw_brand(canvas, 54, PAGE_HEIGHT - 50)
    canvas.setFillColor(colors.HexColor("#A7B0BF"))
    canvas.setFont(REGULAR, 7.5)
    canvas.drawString(106, PAGE_HEIGHT - 80, "SITES  •  VÍDEOS  •  PRESENÇA DIGITAL")

    canvas.setFillColor(SIGNAL)
    canvas.rect(54, PAGE_HEIGHT - 196, 58, 4, fill=1, stroke=0)
    canvas.setFillColor(ICE)
    canvas.setFont(BOLD, 27)
    canvas.drawString(54, PAGE_HEIGHT - 262, "Seu site transmite confiança?")
    canvas.setFillColor(colors.HexColor("#A7B0BF"))
    canvas.setFont(REGULAR, 12)
    canvas.drawString(54, PAGE_HEIGHT - 307, "Checklist de 21 pontos para pequenos negócios locais")

    canvas.setFillColor(GRAPHITE)
    canvas.roundRect(54, 83, PAGE_WIDTH - 108, 70, 10, fill=1, stroke=0)
    canvas.setFillColor(ICE)
    canvas.setFont(BOLD, 8.5)
    canvas.drawString(71, 124, "LEANDRO JACINSKI")
    canvas.setFillColor(colors.HexColor("#A7B0BF"))
    canvas.setFont(REGULAR, 7.5)
    canvas.drawString(71, 104, "Manual prático  •  Versão 1.1  •  Julho de 2026")
    canvas.setFillColor(CYAN)
    canvas.circle(PAGE_WIDTH - 72, 118, 5, fill=1, stroke=0)


def draw_header_footer(canvas, doc):
    if doc.page == 1:
        draw_cover(canvas)
        return

    canvas.saveState()
    canvas.setFillColor(SURFACE)
    canvas.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
    draw_brand(canvas, 54, PAGE_HEIGHT - 28, compact=True)
    canvas.setFillColor(STEEL)
    canvas.setFont(REGULAR, 7.2)
    canvas.drawRightString(PAGE_WIDTH - 54, PAGE_HEIGHT - 43, "Checklist de 21 pontos")
    canvas.setStrokeColor(LINE)
    canvas.line(54, 44, PAGE_WIDTH - 54, 44)
    canvas.setFillColor(STEEL)
    canvas.setFont(REGULAR, 6.8)
    canvas.drawString(54, 28, "Presença que parece grande. Estratégia que cabe no seu negócio.")
    canvas.setFillColor(SIGNAL)
    canvas.setFont(BOLD, 7)
    canvas.drawRightString(PAGE_WIDTH - 54, 28, f"{doc.page:02d}")
    canvas.restoreState()


styles = getSampleStyleSheet()
body = ParagraphStyle(
    "Body",
    parent=styles["BodyText"],
    fontName=REGULAR,
    fontSize=8.8,
    leading=12.6,
    textColor=INK,
    spaceAfter=6,
)
small = ParagraphStyle(
    "Small",
    parent=body,
    fontSize=7.7,
    leading=10.7,
    textColor=STEEL,
)
eyebrow = ParagraphStyle(
    "Eyebrow",
    parent=body,
    fontName=BOLD,
    fontSize=7.2,
    leading=9,
    textColor=STEEL,
    uppercase=True,
    spaceAfter=4,
)
h1 = ParagraphStyle(
    "H1",
    parent=styles["Heading1"],
    fontName=BOLD,
    fontSize=18,
    leading=22,
    textColor=SIGNAL,
    spaceAfter=9,
)
h2 = ParagraphStyle(
    "H2",
    parent=styles["Heading2"],
    fontName=BOLD,
    fontSize=15,
    leading=18,
    textColor=SIGNAL,
    spaceBefore=2,
    spaceAfter=8,
)
item_title = ParagraphStyle(
    "ItemTitle",
    parent=body,
    fontName=BOLD,
    fontSize=9.7,
    leading=12.5,
    spaceAfter=3,
)
checkboxes = ParagraphStyle(
    "Checkboxes",
    parent=body,
    fontName=BOLD,
    fontSize=8,
    leading=10,
    textColor=INK,
    leftIndent=7,
    spaceAfter=3,
)
cta = ParagraphStyle(
    "CTA",
    parent=body,
    fontName=BOLD,
    fontSize=10,
    leading=14,
    textColor=INK,
    spaceAfter=6,
)


items = [
    (1, "A primeira tela explica o que a empresa faz", "Sem abrir o menu ou rolar, alguém consegue identificar o serviço ou produto principal?", "Troque frases vagas por uma combinação concreta: serviço + público + benefício."),
    (2, "O público consegue se reconhecer", "O texto deixa claro se a solução atende empresas, pessoas, uma região ou um perfil específico?", "Nomeie o público na frase principal, no subtítulo ou nos primeiros blocos."),
    (3, "O principal benefício aparece antes dos recursos", "O visitante entende o que muda para ele, não apenas o que a empresa executa?", "Transforme recurso em consequência. 'Formulário integrado' pode virar 'receba pedidos com as informações certas'."),
    (4, "Cada página possui uma ação principal", "Está claro se o visitante deve pedir orçamento, agendar, comprar, telefonar ou conhecer um serviço?", "Escolha um CTA principal e repita-o em momentos lógicos."),
    (5, "O site mostra quem está por trás do negócio", "Existe nome, rosto, equipe, história ou identificação empresarial real?", "Use foto real, apresentação curta e credenciais relevantes."),
    (6, "As informações de contato são consistentes", "Telefone, e-mail, cidade, endereço e horário aparecem quando fazem sentido?", "Confira se os mesmos dados aparecem no site, Google, Instagram e WhatsApp."),
    (7, "Há exemplos reais do trabalho", "O visitante consegue ver projetos, produtos, ambiente, processo ou resultado?", "Apresente poucos exemplos fortes com contexto. Uma imagem solta prova menos do que um mini case."),
    (8, "Depoimentos têm identificação e autorização", "Os depoimentos possuem nome, empresa ou cargo e contexto, quando autorizado?", "Peça ao cliente para explicar o problema anterior, a experiência e a mudança percebida. Não invente falas."),
    (9, "Dúvidas e objeções são respondidas", "Preço inicial, prazo, processo, pagamento ou perguntas recorrentes aparecem no site?", "Transforme as perguntas mais repetidas no WhatsApp em uma seção de dúvidas frequentes."),
    (10, "O site possui sinais básicos de segurança", "O endereço usa HTTPS, o formulário explica o uso dos dados e os links funcionam?", "Ative o certificado, publique uma política de privacidade adequada e teste os formulários."),
    (11, "O conteúdo pode ser lido sem zoom", "Textos, menus e campos possuem tamanho confortável no celular?", "Teste em mais de um aparelho e evite corpo de texto pequeno."),
    (12, "Os botões são fáceis de tocar", "Eles têm área suficiente e distância entre si?", "Evite links minúsculos, botões grudados e CTAs encostados nas bordas."),
    (13, "O principal CTA aparece cedo", "No celular, o visitante encontra contato ou agendamento sem rolar por muito tempo?", "Coloque o CTA na primeira seção e repita após provas e serviços."),
    (14, "As imagens preservam informações importantes", "Rostos, produtos, textos embutidos e logos continuam visíveis no celular?", "Use enquadramentos próprios para telas menores e não dependa de texto dentro de imagens."),
    (15, "Menu, formulário e WhatsApp funcionam", "Todos os elementos interativos foram testados no celular?", "Faça um contato real pelo site e confirme a mensagem de sucesso, o recebimento e o retorno."),
    (16, "A primeira tela aparece rapidamente", "O site dá sinal de vida sem deixar uma tela vazia ou uma imagem enorme carregando?", "Comprima imagens, evite vídeos pesados em reprodução automática e carregue recursos conforme a necessidade."),
    (17, "Não existem links quebrados", "Menu, redes, botões e páginas legais levam ao destino correto?", "Revise trimestralmente e sempre depois de alterar domínio, menu ou serviço."),
    (18, "A experiência não pula enquanto carrega", "Texto, imagens e botões permanecem estáveis durante o carregamento?", "Reserve espaço para mídia e fontes e reduza scripts desnecessários."),
    (19, "Cada página possui título e descrição claros", "Ao compartilhar ou aparecer em uma busca, o resultado explica o conteúdo?", "Escreva títulos únicos com serviço, marca e local quando relevante."),
    (20, "Localização e região atendida estão explícitas", "O site informa cidade, endereço ou área de atendimento?", "Conecte a página ao Perfil da Empresa no Google e mantenha os dados consistentes."),
    (21, "É possível medir o próximo passo", "Você sabe quantas pessoas clicam, enviam formulário ou chegam pelo site?", "Configure métricas essenciais e pergunte aos novos clientes como encontraram a empresa."),
]


def checklist_item(number, title, question, improvement):
    return KeepTogether([
        Paragraph(f"{number}. {title}", item_title),
        Paragraph(question, body),
        Paragraph("[ ] Sim&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[ ] Parcial&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[ ] Não", checkboxes),
        Paragraph(f"<b>Como melhorar:</b> {improvement}", small),
        Spacer(1, 4),
    ])


def add_group(story, title, group_items, intro=None):
    story.append(Paragraph(title, h2))
    if intro:
        story.append(Paragraph(intro, body))
        story.append(Spacer(1, 4))
    for item in group_items:
        story.append(checklist_item(*item))


def build_pdf():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    document = BaseDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        leftMargin=54,
        rightMargin=54,
        topMargin=72,
        bottomMargin=58,
        title="Seu site transmite confiança?",
        author="LJI Studio - Leandro Jacinski",
        subject="Checklist de 21 pontos para pequenos negócios locais",
        creator="LJI Studio",
    )
    frame = Frame(
        document.leftMargin,
        document.bottomMargin,
        document.width,
        document.height,
        id="content",
        leftPadding=0,
        rightPadding=0,
        topPadding=0,
        bottomPadding=0,
    )
    document.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=draw_header_footer)])

    story = [Spacer(1, 640), PageBreak()]
    story.extend([
        Paragraph("CHECKLIST PRÁTICO", eyebrow),
        Paragraph("21 pontos para pequenos negócios locais", h1),
        Paragraph("Um site profissional não precisa ser enorme. Ele precisa ajudar uma pessoa que ainda não conhece sua empresa a entender rapidamente:", body),
        Paragraph("1. o que o negócio oferece;<br/>2. para quem;<br/>3. por que parece confiável;<br/>4. como entrar em contato.", body),
        Paragraph("Abra o site no celular, marque cada item com Sim, Parcial ou Não e anote a primeira melhoria possível. Faça o teste como visitante: você conhece informações que o público ainda não conhece.", body),
        Paragraph("<b>Pontuação:</b> Sim = 2 pontos | Parcial = 1 ponto | Não = 0 ponto | Total possível = 42 pontos.", cta),
        Spacer(1, 8),
    ])
    add_group(story, "1. Clareza", items[0:4])
    story.append(PageBreak())
    add_group(story, "2. Confiança", items[4:9])
    story.append(PageBreak())
    story.append(checklist_item(*items[9]))
    add_group(story, "3. Experiência no celular", items[10:14])
    story.append(PageBreak())
    story.append(checklist_item(*items[14]))
    add_group(story, "4. Velocidade e funcionamento", items[15:18])
    story.append(PageBreak())
    add_group(story, "5. Descoberta local e conversão", items[18:21])
    story.extend([
        Spacer(1, 8),
        Paragraph("Resultado", h2),
        Paragraph("<b>34 a 42 - Base confiável</b><br/>O site provavelmente cumpre o essencial. Priorize medir contatos, atualizar provas e melhorar páginas com maior saída.", body),
        Paragraph("<b>22 a 33 - Bom começo, com vazamentos</b><br/>Existem elementos profissionais, mas alguns pontos ainda criam dúvida ou atrito. Escolha as três melhorias mais próximas do contato.", body),
        Paragraph("<b>0 a 21 - Prioridade de reorganização</b><br/>Comece por clareza, CTA, confiança e experiência mobile antes de adicionar animações ou novas páginas.", body),
    ])
    story.append(PageBreak())
    story.extend([
        Paragraph("PRÓXIMOS PASSOS", eyebrow),
        Paragraph("Transforme o diagnóstico em ação", h1),
        Paragraph("<b>Minha pontuação:</b> ______ / 42", cta),
        Paragraph("<b>Três prioridades:</b><br/><br/>1. _______________________________________________<br/><br/>2. _______________________________________________<br/><br/>3. _______________________________________________", body),
        Spacer(1, 10),
        Paragraph("Plano de melhoria em 30 minutos", h2),
        Paragraph("1. Reescreva a primeira tela com serviço, público e benefício.<br/>2. Coloque um botão de contato visível.<br/>3. Adicione uma prova real.<br/>4. Teste tudo no celular.<br/>5. Envie um formulário de verdade.<br/>6. Anote as próximas melhorias sem tentar reconstruir tudo hoje.", body),
        Spacer(1, 10),
        Paragraph("Quer uma segunda opinião?", h2),
        Paragraph("A LJI Studio cria sites e vídeos para pequenos negócios que precisam transmitir confiança e gerar novas oportunidades sem contratar a estrutura de uma grande agência.", body),
        Paragraph("Envie sua pontuação e o link do site para receber uma recomendação das três melhorias prioritárias, sem obrigação de contratar.", body),
        Paragraph("contato@ljistudio.com.br<br/>www.ljistudio.com.br", cta),
        Spacer(1, 6),
        Paragraph("LJI Studio", h2),
        Paragraph("Sites que passam confiança. Vídeos que prendem atenção.<br/>Presença que parece grande. Estratégia que cabe no seu negócio.", body),
    ])

    document.build(story)


if __name__ == "__main__":
    build_pdf()
    print(OUTPUT)
