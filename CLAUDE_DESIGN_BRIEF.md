# Brief per Claude Design — Redisseny Hort Castevell

> Copia-ho sencer al primer missatge de Claude Design. Adjunta els screenshots del final.

---

## 🌱 El projecte

**Hort Castevell** és un sistema IoT real que monitoritza i rega automàticament l'hort familiar d'una masia al poble de Castevell (Tarragona). 4 nodes ESP32 amb sensors d'humitat del sòl + 1 central amb 4 electrovàlvules + dashboard web accessible remotament.

- **Usuari principal:** el pare del creador (agricultor, 60+ anys)
- **Usuari secundari:** creador (gestiona config i troubleshooting)
- **Context d'ús:** consulta diària des del mòbil, setmanalment des del portàtil
- **Objectiu del redisseny:** passar de "dashboard funcional" a **digital twin professional impressionant**, que mereixi ser compartit a xarxes socials. La vista 3D ha de ser la protagonista.

---

## 🎨 Direcció estètica — "Agrotech clar premium"

**Sensació que ha de transmetre:**
- Llum natural, net, terra de pagès modernitzat
- Precisió tecnològica sense ser fred
- Qualitat de producte premium (Oura / WHOOP però en versió agro)
- Serietat científica amb calidesa humana

**Paleta actual (es pot evolucionar, no tancar):**
- Base clara: `#F2EBD9` (beige) / `#FDFAF3` (crema)
- Tinta: `#3A3225` (marró fosc) / `#7A6F5E` (taupe secundari)
- Accents: **Olive `#3D5A3A`** (primari), Terracotta `#C4673D`, Amber `#D4A04A`, Sky `#3B7A8C`
- Per fila: F1 verd, F2 blau, F3 terracotta, F4 ocre

**Tipografia actual (mantenir filosofia):**
- Display/títols: **Fraunces** (serif contemporàni, càlid)
- Body/UI: **Outfit** (sans geomètric, clar)

**Referències visuals que m'agraden:**
- WHOOP — densitat de dades sense saturar, tipografia enorme en mètriques clau
- Oura Ring — minimalisme amb colors càlids, anells com hero visual
- Hyperice — premium fitness, fons fosc selectiu + micro-animacions
- Linear.app — espaiat, jerarquia, transicions subtils
- Farmbot UI — agrotech real

---

## 📐 Arquitectura — 4 pàgines

### 1. `/` **Dashboard** (vista resum)
**Què mostra ara:**
- Header sticky (logo + nav + badge de connexió + timestamp)
- `AmbientStrip` — 3 cartes: temperatura (°C), humitat aire (%), llum (lux)
- `NodesGrid` — 4 `NodeCard` (una per fila F1-F4): humitat sòl %, bateria, temps última lectura
- `HumidityChart` — gràfic línia Chart.js, 4 sèries, selector 24h/3d/7d
- `IrrigationLog` — placeholder buit (futur: log de regs)
- Footer

**Problemes del disseny actual:** tot té el mateix pes visual, manca jerarquia, les cartes són genèriques.

### 2. `/3d` **Scene3D** — LA PROTAGONISTA ⭐
**Què hi ha:** Canvas fullscreen React Three Fiber amb:
- Terreny ondulat amb vertex colors (herba/terra) + 60 matolls d'herba
- Bancal de fusta amb clearcoat (260cm × 670cm, 4 files)
- Plantes 3D modelades (enciams, tomaqueres, pebrots, albergínies, porros)
- Sensors d'humitat (peces físiques clavades al terra, una per fila)
- Línies de reg negres amb gotes blaves animades (shader GLSL quan rega)
- Central amb LEDs amb bloom
- HDRI sunset environment + post-processing (Bloom + Vignette)
- Sparkles de pol·len flotant

**Interactivitat:**
- Clic sensor → mostra humitat + bateria + temps
- Clic vàlvula central → permet obrir/tancar reg manual
- Clic planta → tooltip amb info de la varietat
- Controls càmera: Reset + Vista zenital
- Indicador "F1 regant..." top-left quan hi ha reg actiu

**Problema actual:** la UI overlay damunt del canvas és massa estàndard, no aprofita el fet que és un 3D real. **Aquí cal la inspiració més forta.**

### 3. `/control` **ControlPanel**
- Toggle global "Reg automàtic ON/OFF"
- Interval de lectura (min), millor hora de reg (h)
- **4 cards per fila (RowConfigCard)**, cada una:
  - Toggle auto/manual
  - **Selector de fase de creixement** (4 fases amb emoji: 🌱 Vegetatiu / 🌸 Floració / 🍅 Fructificació / 🔴 Maduració) — això canvia automàticament els paràmetres per defecte
  - 3 sliders: llindar humitat %, durada reg min, descans entre regs h
  - Badge d'estat amb humitat actual
- Save bar fix a baix

### 4. `/log` **DeviceLog**
- Console terminal-style, 100 entrades
- Filtre per level (info / warn / error) amb colors
- Auto-refresh 10s opcional
- Source + timestamp + missatge

---

## 📊 Dades reals que es mostren

**Per node (×4):**
- `humidity_pct` (0-100) + `humidity_raw` ADC
- `battery_v` (3.0-4.2V Li-ion)
- `last_seen_s` (segons des de l'última transmissió)

**Ambient (central):**
- `temperature` °C (DHT22)
- `humidity` % aire
- `lux` (pendent: BH1750)

**Config per fila:**
- `trigger_below` %, `irrigation_duration_min`, `min_rest_hours`, `growth_stage`

**Realitat del hort:**
- F1: enciams + porros
- F2: enciams
- F3: tomaqueres
- F4: pebrots + albergínies + tomaqueres

---

## 🛠️ Stack tècnic (a respectar)

- React 19 + Vite + TypeScript + React Router (HashRouter — deploy a GitHub Pages)
- **React Three Fiber v9 + Drei v10** per 3D
- **Zustand** per estat global
- **Supabase** PostgreSQL per dades + realtime
- **Chart.js** via `react-chartjs-2`
- CSS modular per pàgina (`tokens.css`, `dashboard.css`, `scene3d.css`, `control.css`)
- No TailwindCSS actualment (pots proposar si creus que val la pena)

---

## 🎯 Què vull del redisseny

### Prioritats (ordre de impacte)

1. **Pàgina 3D com a landing-hero**: entrar a la web = veure l'hort 3D en acció, data overlay superposada amb jerarquia clara. Mètriques clau flotant (HUD style). Nothing is hidden behind clicks — la info important es veu d'entrada.

2. **Dashboard amb jerarquia real**: una mètrica "estrella" al top (p.ex. "Salut global del hort" amb algun índex calculat), després el gràfic gran, i les cartes de nodes com a detall. No tot a la mateixa alçada.

3. **Control Panel premium**: les fases de creixement han de ser visuals (imatges / il·lustracions / icones grans), no només emoji. Sliders amb feedback visual ric. Quan canvies de fase ha de semblar que canvies de "mode" del sistema.

4. **DeviceLog com a terminal bonic**: dark mode opcional, tipografia mono ben escollida, filtres com pills, severity amb colors vius.

### Micro-interaccions
- Hover sobre node → mostra detalls addicionals sense canvi de pàgina
- Transició de pàgina suau (no recàrregues brusques)
- Quan es detecta reg actiu, algun feedback visual global (barra de progrés? ondulació?)
- Pull-to-refresh sentit al mòbil

### Responsive
- **Mòbil first** en Dashboard i Control (ús real diari)
- 3D sempre fullscreen, adapta HUD
- DeviceLog es pot quedar més desktop-oriented

### NO vull
- ❌ Dark mode global per defecte (és un hort, volem llum)
- ❌ Glassmorphism exagerat (blurs gegants)
- ❌ Gradients chillout/crypto
- ❌ Més decoració que contingut — la dada mana

---

## ✅ Deliverables que espero de Claude Design

1. **Homepage nou** (la `/3d` convertida en landing amb HUD sobreposat)
2. **Dashboard redissenyat** amb jerarquia clara
3. **Control Panel** amb selector de fases visual
4. **Mobile view** dels 3 anteriors
5. **Components atòmics reutilitzables:** MetricCard, NodeCard, Toggle, Slider, GrowthStageSelector, ConnectionBadge, LogEntry
6. **Design tokens exportables** (colors, typography scale, spacing, radius, shadows, motion)
7. **Guia d'ús**: quan usar quin component, patrons d'espaiat, jerarquia tipogràfica

---

## 📸 Screenshots adjunts (estat actual)

Adjunta aquests quan enviïs el brief:
- Dashboard complet (desktop)
- Scene3D amb HUD actual
- ControlPanel (desktop)
- DeviceLog
- Versió mòbil de cadascun (DevTools 390×844)

URL desplegada: **https://tonimas35.github.io/hort-castevell/**

---

## 💬 Una línia per Claude Design

> "Converteix un dashboard agrotech funcional en un digital twin premium amb el 3D com a protagonista, manté l'ànima agro-clara (no crypto-dark), i prioritza mètriques tangibles per un usuari que consulta 3 cops al dia des del mòbil."
