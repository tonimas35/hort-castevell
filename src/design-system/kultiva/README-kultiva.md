# Hort Castevell — Design System

**Hort Castevell** és un digital twin IoT d'un hort familiar al camp de Tarragona (Castevell, Espanya). El sistema està format per **4 nodes ESP32** amb sensors de humitat del sòl + una **unitat central** amb electrovàlvules + un **dashboard web** amb una escena 3D en temps real.

L'estètica és **"Agrotech clar premium"** — llum natural, net, terra de pagès modernitzat. Precisió tecnològica amb calidesa humana. Referents: Oura Ring (minimal + càlid), WHOOP (mètriques grans), Linear (jerarquia), Farmbot.

## Audiència

| Rol | Descripció |
|---|---|
| **Primari** | Agricultor, 60+ anys. Consulta el dashboard des del mòbil diàriament. Vol respostes simples: *cal regar? està tot bé?* |
| **Secundari** | Enginyer. Configura llindars, revisa logs, troubleshooting. |

## Producte

Quatre superfícies, una mateixa veu:

- **`/` Dashboard** — AmbientStrip + NodesGrid + HumidityChart + IrrigationLog. La vista diària de l'agricultor.
- **`/3d` Scene3D** — Canvas R3F a pantalla completa amb l'hort en 3D. HUD overlay semi-transparent. **És la protagonista** de la fase 3.
- **`/control` ControlPanel** — Configuració global + 4 RowConfigCard amb GrowthStageSelector per fase de creixement.
- **`/log` DeviceLog** — Consola estil terminal amb filtres de severity.

## Realitat del camp

Cada fila (F1..F4) té cultius reals:

- **F1** — Enciams + porros · accent olive `#4E7A48`
- **F2** — Enciams · accent sky `#3B7A8C`
- **F3** — Tomàqueres · accent terracotta `#C4673D`
- **F4** — Pebrots + albergínies + tomàqueres · accent clay `#8B6A3E`

## Stack tècnic (a respectar)

React 19 · Vite · TypeScript · React Three Fiber v9 · Drei v10 · Zustand · Supabase · Chart.js. CSS modular (`tokens.css`, per pàgina). **No Tailwind.**

---

## CONTENT FUNDAMENTALS

**Idioma: català.** Tot. Cap barreja amb castellà o anglès dins de la UI.

**Tona de veu:** clara, tècnica però no freda. Etiquetes curtes i directes, com les diria un enginyer amable a un pagès. Preferim una paraula a dues.

**Casing:** Sentence case per a titulars i botons (*"Reg automàtic activat"*, no *"Reg Automàtic Activat"*). Etiquetes de metadades en MAJÚSCULES amb tracking ampli (*"HUMITAT", "TEMPERATURA"*). Els badges de fila són sempre en majúscules i monotipogràfiques: `F1`, `F2`, `F3`, `F4`.

**Persona:** no direccionem amb "tu/vostè". La interfície descriu estats de forma impersonal (*"Humitat correcta, descansant"*, *"Tens canvis sense guardar"*). Quan sí apareix segona persona, és informal **"tu"**.

**Numèric:** unitats enganxades al número (`45%`, `23.5°C`, `3.85V`, `45k lux`). Tabular-nums sempre per a valors que canvien. Duracions humanes: *"Ara"*, *"12 min"*, *"3h"*, *"2d"*.

**Emoji:** només com a tokens secundaris molt puntuals (💧 regar, 🌱 creixement) — **mai** com a icona principal d'un component de producció. Els nodes, cards, chips i estats fan servir SVG.

**Exemples reals del producte:**

- `Hort Castevell` / `Masia de Castevell, Tarragona`
- `Connectat` · `Desconnectat`
- `Última lectura` · `17:42`
- `Humitat correcta, descansant` · `Per sota del llindar, cal regar!`
- `Regar quan <` · `Durada del reg` · `Descans entre regs`
- `Fase de creixement` · `Creixement / Floració / Fructificació / Maduració`
- `Encara sense registres de reg`
- `Reset vista` · `Vista zenital`
- `Guardant...` · `💾 Guardar configuració`

**Què evitem:**

- Veus de *marketing* (*"Descobreix la teva humitat ideal!"*). Som un instrument, no una app.
- Majúscules emfàtiques o signes d'exclamació innecessaris. Un sol `!` només en alertes reals (*"cal regar!"*).
- Frases llargues. Si no cap en una línia d'un mòbil, el tallem.

---

## VISUAL FOUNDATIONS

**Aesthetic one-liner:** terra de pagès modernitzat. Cremós, càlid, precís. **Llum natural — no dark mode per defecte.** L'única vista fosca és `/3d`, on el 3D demana contrast.

### Paleta

Base *"Mediterranean farmhouse"*. Cremes i beiges com a superfícies; marró fosc com a tinta; olive com a brand primari; una rodeta d'accents (terracotta, amber, sky, clay) per diferenciar context. No fem servir negre pur — la tinta més fosca és `#3A3225`.

Els accents de fila (F1–F4) són **signals**, no decoració: un mateix color identifica la fila al node card, al chart, al 3D, a la config. Un usuari aprèn "terracotta = tomàqueres" una vegada.

### Tipografia

- **Fraunces** — serif contemporani càlid. Títols, metric-values grans, `.divider-label` en cursiva. Dona calidesa i identitat.
- **Outfit** — sans geomètric. Body, UI, labels, botons. Clar a mides petites.
- **JetBrains Mono** — logs, valors raw ADC, MAC, ID tècnics. Només en contexts "tècnics".

Jerarquia típica en un card: `label` (MAJ, taupe, 11px) → `metric` (Outfit 800, 36–44px, ink) → unit (Outfit 500, taupe).

### Espai i rítme

Grid de 4px (tokens `--space-1`..`--space-12`). Cards respiren: padding 16–20px. Entre cards: 12–20px. Pàgines tenen max-width 960px per no dispersar l'atenció al mòbil/desktop.

### Fons

Pla. `var(--bg)` a tota la pàgina. **Ni gradients, ni textures, ni imatges de farmhouse.** El 3D és el "fons ric" de l'app; la resta ha de ser silenciós perquè les dades cantin. L'única excepció són els gradients verticals cap a negre del `.scene-topbar` i `.scene-bottombar` (protection gradients sobre el 3D).

### Cards

- `background: var(--surface)` (cream)
- `border: 1px solid var(--border)`
- `border-radius: var(--radius-lg)` (20px) per cards principals, `var(--radius)` (14px) per cards petites
- `box-shadow: var(--shadow)` — molt subtil, marró-tintat
- Accent de fila aplicat com a **barra superior** de 3px, `opacity: 0.6–0.7`, arrodonida per seguir el card

### Hover / Press

- Cards: `transform: translateY(-2px|-3px)` + shadow augmenta (`--shadow → --shadow-lg`). Transició 300–350ms amb `--ease-out`.
- Botons de període / nav: background fill canvia (`transparent` → `rgba(255,255,255,.5)` o accent).
- Toggle: trasllat del thumb 20px en 300ms; el track canvia de `border-strong` → `olive`.
- Press: normalment només `transform: translateY(-1px)` o opacity. Cap shrink dramàtic.

### Borders

Un sol pes (`1px`). Color: `--border` default, `--border-strong` en disabled/inset. Cap borde de 2px amb color accent — l'accent es manifesta com a barra superior del card o com a omplert de badge.

### Shadows

Tres nivells, tots marró-tintats (`rgba(58, 50, 37, α)`):
- `--shadow-sm` (0.06α) — ambient cards
- `--shadow` (0.08/0.04α) — node cards, panels
- `--shadow-lg` (0.10/0.06α) — hover elevat, save bar sticky

En vista `/3d`, les ombres canvien a `rgba(0,0,0,.5–.7)` i es combinen amb `backdrop-filter: blur(16–24px)` per al HUD.

### Animacions

- `slideUp` (opacity 0 → 1, translateY 16 → 0) amb delays escalonats per quadrícula (0.05s, 0.10s, 0.15s).
- `fadeIn` per modals i divisors.
- `pulse` (opacity 1 ↔ 0.4) en dots d'estat crític i regant.
- `waveMotion` per a l'ona dels gauges.
- Curtes (150–350ms). Easing `cubic-bezier(0.16, 1, 0.3, 1)` o `cubic-bezier(0.4, 0, 0.2, 1)`. No bounces mai excepte spring en interaccions (`--ease-spring`, raríssim).

### Transparència i blur

Només en la vista `/3d`:
- HUD cards: `rgba(26, 26, 20, 0.75)` + `backdrop-filter: blur(16px)`
- Modals sobre 3D: `rgba(10, 10, 8, 0.8)` + `blur(8px)`
- Gradients de protecció verticals a top/bottom de la pantalla

**Mai** glassmorphism exagerat amb blurs grans fora del 3D.

### Corner radii

- `--radius-sm` 8px — inputs, chips, botons petits
- `--radius` 14px — ambient cards, save bar
- `--radius-lg` 20px — node cards, panels principals
- `--radius-pill` 9999px — connection badge, chips d'estat

### Color vibe de la imatgeria

Càlid, saturat però no llampant. Si afegim fotos reals del hort, han de tirar a *golden hour* / terra marró / verds d'olivera — coherent amb la paleta. Evitem bluetones crypto, filtres cyanotipia o neons.

### Layout rules

- Max-width de pàgina 960px, centrat.
- Header sticky (olive) amb nav i connection badge.
- Footer discret a ~18px, italic, brand en cursiva.
- Mobile: nav desapareix, ambient strip passa a 1 columna, node grid manté 2 columnes (és un resum visual).

---

## ICONOGRAPHY

**Aproximació:** SVGs inline, dibuixats al mateix fitxer JSX/TSX de cada component. Stroke-only per a icones d'UI, fill-only per a icones semàntiques (gota d'aigua, logo).

- **Stroke weight:** `1.2–1.5` (fi, coherent amb el to "premium clar").
- **Stroke caps:** `round`.
- **Fill:** només per a gotes d'aigua, logos, símbols plens. Els outline-style són majoritaris.
- **Tamanys típics:** 13px (meta icons), 28–38px (ambient/header), 48px (empty states).
- **Color:** heretat (`currentColor`) i controlat via CSS vars.

**Sprite del codebase:** `assets/icons.svg` conté una col·lecció de símbols brand (Bluesky, Discord, documentation, etc.) imports existents del repo. No són clau per al producte agrícola però es conserven.

**Logo/favicon:** `assets/favicon.svg` — identitat en forma de gota amb fulla.

**Emoji:** Només com a tokens menors en contextos secundaris (💧 🌱 🌸 🍅 🔴). **No apareixen en components de producció crítica** (node cards, HUD, log entries). Les fases de creixement SI fan servir emoji com a índex visual ràpid — acceptat perquè la captura d'atenció importa més que la puresa estètica.

**No fem servir cap icon font** (Font Awesome, Material Icons). No cal CDN — tot va inline amb els components.

---

## INDEX

Fitxers a l'arrel del projecte:

- `README.md` — *aquest fitxer*. Context, content, visual foundations, iconography.
- `colors_and_type.css` — tots els tokens (colors, type, spacing, radius, shadows, motion).
- `SKILL.md` — resum cross-compatible amb Agent Skills / Claude Code.
- `assets/` — `favicon.svg`, `icons.svg`.
- `preview/` — cards de revisió del design system (colors, type, components).
- `ui_kits/hort-castevell/` — UI kit amb les 4 pàgines reals del producte:
  - `index.html` — demo interactiva amb nav entre pàgines
  - `Dashboard.jsx`, `Scene3D.jsx`, `ControlPanel.jsx`, `DeviceLog.jsx`
  - Components atòmics (`NodeCard.jsx`, `AmbientStrip.jsx`, `GrowthStageSelector.jsx`, etc.)
- `_source/` — codi importat del repo `tonimas35/hort-castevell` (referència).

**Font source:** https://github.com/tonimas35/hort-castevell (branch `master`).
