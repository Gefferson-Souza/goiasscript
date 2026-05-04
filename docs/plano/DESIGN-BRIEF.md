# GoiásScript v1.5 — Design Brief (para Google Stitch via MCP)

**Criado:** 2026-05-03 · **Ferramenta:** Google Stitch (`mcp__stitch__*` tools) · **Output esperado:** project + design system + 4-6 telas geradas

---

## 🎯 Posicionamento visual

**Tese:** *"Caipira-tech autêntico. Brincalhão sem ser meme barato. Identidade goiana de verdade."*

**O que evitar (anti-padrões):**
- ❌ Caricatura forçada (chapéu de palha + galinha + "uai" em comic sans)
- ❌ Estética "dev hipster" genérica (terminal preto + green retrô + pixelart)
- ❌ Gradientes saturados de Web 3.0 / SaaS B2B genérico
- ❌ Mascote infantil (não é game pra criança)
- ❌ Verde-amarelo bandeira BR óbvio (vira nacionalismo, não regional)

**O que buscar:**
- ✅ Tipografia confiante mas com personalidade (mistura sans-serif moderno + 1 display goiano)
- ✅ Paleta inspirada no **cerrado em estação seca** (não verde tropical, é cerrado de Goiás)
- ✅ Microinterações com bordão sutil ("uai", "ô sô", "tá ligado") em loadings/erros
- ✅ Visual referencia objetos goianos REAIS modernizados: pequi, ipê amarelo, tijolo bruto, tampão de pingo
- ✅ Equilíbrio: 80% interface clean dev tool + 20% personalidade goiana (não inverter)

---

## 🎨 Sistema de design (pra `mcp__stitch__create_design_system`)

### Paleta de cores

**Primária — Cerrado**
```
--cerrado-terra:     #8B4513  /* terra vermelha de Goiás */
--cerrado-tijolo:    #A0522D  /* tijolo bruto, paredes do interior */
--cerrado-areia:     #D2B48C  /* areia da seca, bege quente */
```

**Secundária — Ipê e Pequi**
```
--ipe-amarelo:       #F4C430  /* amarelo do ipê em agosto */
--ipe-mostarda:      #C9A227  /* tom mais escuro, profissional */
--pequi-verde:       #6B8E23  /* verde do pequi maduro, nem brilhante nem opaco */
```

**Neutros — Papel e Cerâmica**
```
--papel-jornal:      #FAF6EE  /* fundo principal, off-white morno */
--ceramica-clara:    #EDE4D3  /* superfícies elevadas */
--carvao-fogao:      #2B2622  /* texto principal, NÃO preto puro */
--cinza-cinza:       #6B6258  /* texto secundário */
```

**Acentos — Sinal e Alerta**
```
--cerveja-bamburral: #C77B30  /* CTAs primários, "Bota pra Moer" */
--vermelho-arroz:    #B23A3A  /* erros (sem ser sangue) */
--azul-cu-de-junho:  #4A7B9D  /* links e info, céu seco de Goiás */
```

**Modo dark (Fase 2):**
```
--noite-cerrado:     #1A1612  /* fundo dark, marrom-preto */
--lua-cheia:         #F2EAD3  /* texto dark mode */
```

### Tipografia

**Display (títulos grandes, hero):**
- **Família:** Bricolage Grotesque (Google Fonts, free)
- **Por quê:** geometric sans com personalidade quirky, não corporativo
- **Pesos:** 700 (bold) e 800 (extra bold)

**Body (texto, UI):**
- **Família:** Inter (Google Fonts, free)
- **Por quê:** legibilidade dev-tool padrão, casa com qualquer coisa
- **Pesos:** 400 (regular), 500 (medium), 600 (semibold)

**Mono (código, output):**
- **Família:** JetBrains Mono (Google Fonts, free)
- **Por quê:** padrão dev-tool, ligatures bonitas, alta legibilidade
- **Pesos:** 400 (regular), 700 (bold)

**Display goiano (acentos opcionais):**
- **Família:** Caveat (Google Fonts, free) — handwritten, tipo letra de cordel
- **Uso:** apenas em microinterações (tooltips, easter eggs, citações)
- **Não usar:** em títulos principais (vira caricato)

### Espaçamento (8pt grid)

```
--space-1: 4px    /* aperto */
--space-2: 8px    /* base */
--space-3: 12px
--space-4: 16px   /* padrão de margin entre elementos relacionados */
--space-6: 24px   /* separação entre seções dentro de mesma área */
--space-8: 32px   /* separação entre áreas/cards */
--space-12: 48px  /* respiro grande */
--space-16: 64px  /* hero verticalmente */
```

### Border radius

```
--radius-sm: 4px   /* badges, tags */
--radius-md: 8px   /* botões, inputs */
--radius-lg: 12px  /* cards */
--radius-xl: 24px  /* "balão de fala" do ENGOIANADOR */
--radius-full: 9999px
```

### Sombras (sutis, papel/cerâmica)

```
--shadow-sm:  0 1px 2px rgba(43, 38, 34, 0.06)
--shadow-md:  0 4px 8px rgba(43, 38, 34, 0.08)
--shadow-lg:  0 12px 24px rgba(43, 38, 34, 0.12)
--shadow-xl:  0 24px 48px rgba(43, 38, 34, 0.16)
```

### Iconografia

**Lib base:** Lucide Icons (free, open source, casa com Inter)
**Custom icons goianos (criar em SVG):**
- 🐂 Boi (mascote sutil, não em todo lugar)
- 🌳 Pé de pequi estilizado
- 🌻 Ipê florido
- 📜 Cordel (pra easter eggs / footer)

**Princípio:** ícones genéricos = Lucide. Personalidade = SVGs próprios usados COM PARCIMÔNIA.

---

## 📱 Telas a gerar (pra `mcp__stitch__generate_screen_from_text`)

### Tela 1 — Landing / Home (`/`)

**Prompt pro Stitch:**
```
Landing page for "GoiásScript" — a Brazilian-Portuguese programming language with regional Goiás dialect.

Layout: single column, hero-first, 3 sections vertical.

HERO (full viewport height):
- Top-left: small logo + nav (Playground, ENGOIANADOR, Sobre, GitHub)
- Center-left: massive headline "Programa em goianês, sô." (Bricolage Grotesque 800, 80px)
- Below headline: subheadline "Linguagem de programação com identidade. Roda no browser, sem instalar nada." (Inter 400, 20px)
- Two CTAs side-by-side: primary "Bota pra Moer →" (cerveja-bamburral background, white text) + secondary "ENGOIANAR algo →" (outline)
- Center-right: animated terminal showing live code transpilation, GoiásScript on left, JavaScript on right
- Background: warm off-white (papel-jornal), subtle texture of brushed cerâmica

SECTION 2 — "Por que GoiásScript":
- 3 cards horizontal
- Card 1: "Goianês de verdade" — icon: pé de pequi
- Card 2: "Roda no navegador" — icon: globe with chevron
- Card 3: "100% open source" — icon: github
- Each card: cerâmica-clara bg, terra-tijolo accent on icon, 12px radius

SECTION 3 — "Pega um exemplo":
- Tabs: "Olá Mundo", "Lista e Mapeamento", "Classe Pequi"
- Below tabs: split panel — code editor (left, dark theme JetBrains Mono) + output (right, terminal)
- "Bota pra Moer" button to execute

FOOTER:
- 3 columns: links, social, donations
- Right column: "🐂 Pagar um cafezinho goiano" — GitHub Sponsors badge + Pix QR small + Ko-fi
- Bottom: "Feito em Goiânia, Goiás 🌾 — MIT License"

Style: warm, confident, dev-tool-meets-cultura-popular. NOT meme. NOT cartoon. NOT pixel art.
Use Bricolage Grotesque for display, Inter for UI, JetBrains Mono for code.
Color palette: terra/tijolo browns, ipê yellow accents, papel jornal background, carvao fogão for text.
Generate desktop AND mobile responsive views.
```

### Tela 2 — Playground (`/playground`)

**Prompt pro Stitch:**
```
Code playground page for GoiásScript.

Layout: full-screen split, top toolbar.

TOP TOOLBAR (60px tall, papel-jornal bg, bottom border):
- Left: logo + back button
- Center: example dropdown ("Carregar exemplo: Olá Mundo / Lista / Classe / Async")
- Right: "Bota pra Moer 🐂" primary button (cerveja-bamburral) + "Compartilhar 📸" secondary

MAIN AREA (split horizontal 50/50):
- LEFT: Monaco code editor with GoiásScript syntax highlighting
  - Background: noite-cerrado (#1A1612)
  - Line numbers gutter
  - Active line highlight: cerveja-bamburral 10% opacity
- RIGHT: output panel split vertical
  - Top half: "JavaScript transpilado" (read-only Monaco, smaller font)
  - Bottom half: "Resultado" (terminal-style, white text on noite-cerrado)
- Vertical divider: draggable, 4px wide, papel-jornal color

BOTTOM STATUS BAR (32px):
- Left: "Linha 5, Coluna 12 · sem erros ✓" (small, cinza-cinza)
- Right: "GoiásScript v1.5.0 · MIT"

Mobile: stack vertical (editor top, output bottom), hide JS panel by default with toggle.

Generate desktop AND mobile responsive views.
```

### Tela 3 — ENGOIANADOR (`/engoianador`)

**Prompt pro Stitch:**
```
AI text translation page — translates technical jargon into Goiás regional Portuguese.

Layout: centered single column, 720px max width.

HERO (top, 200px tall):
- Headline: "ENGOIANADOR" (Bricolage 800, 64px, with subtle 🐂 emoji after)
- Subheadline: "Cola um trem complicado, recebe explicação em goianês legítimo." (Inter 400, 18px, cinza-cinza)

INPUT CARD (cerâmica-clara bg, 24px radius, papel-jornal border):
- Label: "Cola aqui o trem complicado:" (Inter 500, 14px)
- Textarea: 8 rows, JetBrains Mono 16px, papel-jornal bg, 12px radius, focus ring cerveja-bamburral
- Below textarea: chip cluster of 5 quick examples ("Algoritmo de consenso", "Async/await", "Por que Rust?", "TCP vs UDP", "WebAssembly") — each chip cerâmica-clara bg, click fills textarea
- Bottom-right: counter "0 / 2000 caracteres"

CTA:
- Big button: "ENGOIANAR 🐂" (full width, cerveja-bamburral, 56px tall, Bricolage 700, white text)
- States: idle / loading (spinner + "Pensando no trem...") / done

OUTPUT CARD (appears after first translation, anchored below CTA):
- Styled as "balão de fala" cartoon — papel-jornal bg, ipê-amarelo border-left 4px, 24px radius
- Top of balloon: small avatar emoji + "Tio Geffin disse:" (Caveat font, ipê-mostarda)
- Body: response text (Inter 400, 18px, line-height 1.7, carvao-fogao)
- Bottom of card: 3 actions
  - "📸 Salvar como imagem" (primary outline)
  - "🔄 Engoianar de novo" (secondary)
  - "📋 Copiar texto" (icon only)

DISCRETE FOOTER:
- "Funcionando com modelo gratuito Groq Llama 3.1 70B + Cloudflare Workers AI fallback"
- "Curtiu? Paga um pequi pro Gefferson 🐂" (link sponsors + pix)

EMPTY STATE (before first translation):
- Below CTA, light placeholder text + 3 example outputs in faded cards (preview do resultado)

Mobile: stack natural, mantém legibilidade de "balão de fala".

Generate desktop AND mobile responsive views.
```

### Tela 4 — Sobre / Manifesto (`/sobre`)

**Prompt pro Stitch:**
```
About page — manifesto and origin story.

Layout: single column, magazine-style, 680px max width centered.

HERO:
- Pull quote (Bricolage 800, 48px, italic): "Inventei uma linguagem de programação porque o sotaque também merece código."
- Author byline: "Por Gefferson Teodoro de Souza · Goiânia, GO" (Inter 500, 14px, cinza-cinza)

SECTIONS (long-form text, prose magazine):
1. "De onde veio" — origin story 2 paragraphs
2. "Por que goianês e não 'brasileiro genérico'" — 2 paragraphs about regional identity
3. "O que mudou no v1.5" — release notes em prosa, mention "cortei 70% das features"
4. "Onde isso vai" — roadmap honesto, sem promessa de SaaS

FEATURED PEOPLE (carousel):
- "Quem ajudou": GitHub contributors + Discord beta testers
- Cards horizontais com avatar + nome + 1 linha de contribuição

CTA FINAL:
- Big card terra-tijolo bg: "Quer participar?" + 3 botões
  - "GitHub Issues" / "Discord" / "Pix de R$ 5"

Style: editorial, confident voice, like a Substack post but more designed.
Use Bricolage for headers, Inter for body, occasional Caveat for pull quotes.

Generate desktop AND mobile responsive views.
```

### Tela 5 — Doação (`/doacao`)

**Prompt pro Stitch:**
```
Donations page — multi-channel giving, no aggressive copy.

Layout: single column, 600px max width centered, generous spacing.

HERO:
- Headline: "Paga um pequi 🌳" (Bricolage 800, 64px)
- Subheadline: "GoiásScript é 100% grátis, pra sempre. Mas o servidor cobra, e o tempo do Gefferson também. Se te ajudou, ajuda também." (Inter 400, 18px, cinza-cinza)

3 CHANNELS (stacked vertical, each card cerâmica-clara bg, 16px radius, 24px padding):

CHANNEL 1 — Pix:
- Big QR code (left, 200x200, com border)
- Right: "Chave Pix: geffersonteodorodesouza@gmail.com" (mono, copy button)
- "Sugestão: R$ 5 (cafezinho), R$ 20 (almoço de PF), R$ 50 (jantar com a turma)"

CHANNEL 2 — GitHub Sponsors:
- GitHub logo + "Sponsor @Gefferson-Souza"
- Tier preview: "$5/mês — apoiador, $20/mês — colaborador, $100/mês — patrono"
- Big button "Ir pro GitHub Sponsors →"

CHANNEL 3 — Ko-fi:
- Ko-fi orange logo + "Buy me a coffee"
- "Doação única, sem cadastro complicado"
- Button "Abrir Ko-fi →"

TRANSPARENCY SECTION:
- Title: "Pra onde vai o dinheiro"
- Bullet list:
  - "🟢 Servidor (R$ 0 hoje, pode chegar a US$30/mês se viralizar)"
  - "🟢 Domínio próprio quando o subdomain `pages.dev` ficar feio (R$ 50/ano)"
  - "🟢 ElevenLabs TTS sotaque goiano (Fase 4, US$ 5/mês)"
  - "🟢 Café pro Gefferson em pé na cozinha às 23h corrigindo bug"

THANK YOU:
- "Quem já ajudou" — wall of avatars com nomes (limit 50, anon opcional)
- Botão "Ver lista completa em GitHub →"

Mobile: stack natural, QR code reduzido pra 160x160.

Generate desktop AND mobile responsive views.
```

### Tela 6 (opcional Fase 2) — Galeria Pública (`/galeria`)

**Prompt pro Stitch:**
```
Gallery of public ENGOIANADOR translations, voted by community.

Layout: masonry grid, 3 columns desktop, 1 column mobile.

TOP BAR:
- "Galeria — Os melhores trens engoianados" (Bricolage 800, 36px)
- Filter chips: "Mais aplaudidos", "Recentes", "Por categoria"
- Login button (Google) right

GRID CARDS (each):
- Card cerâmica-clara bg, 16px radius, shadow-md
- Top: small badge "Categoria: Sistemas Distribuídos" (cerveja-bamburral)
- Body: input text (italic, 14px) + output text (Inter 400, 16px, max 200 chars w/ "ver mais")
- Bottom row: avatar + name + "👏 1.2k aplausos" + "📸 share" icon

PAGINATION: "Carregar mais →" button no bottom

EMPTY STATE: "Ainda não tem nada na galeria. Seja o primeiro a engoianar algo memorável."

Mobile: 1 column, full-width cards.

Generate desktop AND mobile responsive views.
```

---

## 🎬 Como executar com o MCP do Stitch

**Sequência sugerida:**

```
1. Criar projeto:
   mcp__stitch__create_project name="GoiásScript v1.5"

2. Criar design system (cola o conteúdo da seção "Sistema de design" acima):
   mcp__stitch__create_design_system project_id=<id> spec=<JSON com cores/fonts/spacing>

3. Gerar tela 1 (landing):
   mcp__stitch__generate_screen_from_text project_id=<id> prompt=<prompt da Tela 1>

4. Aplicar design system na tela:
   mcp__stitch__apply_design_system screen_id=<id> design_system_id=<id>

5. Repetir 3+4 pras telas 2, 3, 4, 5 (e 6 quando ativar Fase 2)

6. Gerar variantes pra testar (mobile-first, dark mode, layout alternativo):
   mcp__stitch__generate_variants screen_id=<id> count=3
```

**Custo cognitivo:** ~30min pra rodar todas as gerações + 1-2h pra ajustar manualmente os prompts se Stitch errar tom (e vai errar — é IA gerando design, sempre tem ajuste).

---

## 🪶 Microcopy goiana (pra incorporar nas telas)

**Estados de loading:**
- "Pensando no trem..."
- "Catando os bagulho..."
- "Quase, sô..."

**Estados de erro:**
- "Eita, deu ruim. Tenta de novo, sô."
- "O servidor tá travado igual mineiro em fila do banco. Calma."
- "Ô rapaz, esgotei minha cota grátis hoje. Volta amanhã ou cola tua chave."

**Estados de sucesso:**
- "Tá pronto, ó!"
- "Mió que encomenda."
- "Bão demais."

**Empty states:**
- "Ainda não tem nada aqui não, sô. Cola algum trem pra começar."

**Tooltips:**
- Hover em "Bota pra Moer": "Roda teu código aí, ó"
- Hover em "ENGOIANAR": "Manda o texto, eu engoiano"
- Hover em "Salvar como imagem": "Vira foto pra mandar no zap"

**Footer easter egg:**
- "Feito em Goiânia, com pequi e código aberto 🌾"

---

## 🎨 Referências visuais úteis (links pra colar no Stitch como inspiração)

**Tom geral (warm + dev-tool):**
- https://railway.app (warm pastels + dev tools)
- https://supabase.com (clean, confident, dev-first)
- https://vercel.com/templates (espaçamento generoso, tipografia)

**Identidade regional sem caricatura:**
- https://nytcooking.com (warm, cultural, nem tudo é foto de comida)
- Brand "Cuscuz Cocoricó" (Brasileiro com personalidade sem cair no clichê)

**Code playground references:**
- https://playground.solidjs.com
- https://stackblitz.com
- https://codepen.io

**AI tools com personalidade:**
- https://character.ai (cards com personagem, voz definida)
- https://perplexity.ai (clean + AI confidence)

---

## ✅ Critério de aceite do design

Antes de implementar, validar com 3 perguntas:

1. **Pergunta-teste TESE:** *"Esse design destaca o ARTEFATO técnico ou a persona do Gefferson?"* → tem que ser artefato (linguagem real, código real)
2. **Pergunta-teste viralidade:** *"Em 5 segundos olhando o site, eu entendo o que é e quero compartilhar?"* → sim/não binário
3. **Pergunta-teste autenticidade:** *"Goiano de verdade que olhar isso vai sentir representado ou vai sentir ridicularizado?"* → tem que ser representado

Se qualquer dos 3 falhar → pedir variante no Stitch antes de implementar.

---

## 🏷️ Tags
#design #goiasscript #stitch #brand #2026
