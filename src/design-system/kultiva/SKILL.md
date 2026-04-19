# Hort Castevell — Skill

IoT digital twin d'un hort familiar a Tarragona. 4 nodes ESP32 (humitat sòl) + unitat central (electrovàlvules) + dashboard web amb escena 3D.

## Estètica

**Farmhouse clar premium** (default) o **Agrotech light** (variant). No dark mode — l'única vista fosca és `/3d` (contrast sobre canvas). Tinta més fosca = `#3A3225`, mai negre pur.

## Idioma

**Tot en català.** Cap barreja amb castellà/anglès. Tona: tècnica, concisa, impersonal. Sentence case, etiquetes de metadades MAJÚSCULES amb tracking. Numeric sempre tabular-nums amb unitat enganxada (`45%`, `23.5°C`, `45k lux`).

## Stack

React 19 · Vite · TypeScript · React Three Fiber v9 · Zustand · Supabase · Chart.js. **CSS modular, no Tailwind.**

## Fitxers clau

- `README.md` — content + visual foundations complets
- `colors_and_type.css` — tokens (colors · type · spacing · radius · shadows · motion)
- `preview/` — 20 review cards del design system
- `ui_kits/hort-castevell/` — 4 pàgines producte (`index.html` farmhouse · `index-agrotech.html` agrotech)

## Files reals

- **F1** Enciams + porros · olive `#4E7A48`
- **F2** Enciams · sky `#3B7A8C`
- **F3** Tomàqueres · terracotta `#C4673D`
- **F4** Pebrots + albergínies + tomàqueres · clay `#8B6A3E`

Un color per fila, consistent a tot arreu (node card, chart, 3D, config). L'usuari aprèn *"terracotta = tomàqueres"* una sola vegada.

## Regles ràpides

1. **Català, sempre.**
2. **Tokens del CSS**, no colors inline. L'accent d'una fila es manifesta com a barra superior del card (mai borders de 2px amb color).
3. **SVG inline per icones.** Stroke 1.2–1.5, `currentColor`. No icon fonts.
4. **Emoji** només en contextos secundaris (growth stage). Mai com a icona principal.
5. **3D és protagonista** de la fase 3 — la resta de la UI ha de callar perquè les dades cantin.
6. **Numèric monoespaiat i tabular** en valors que canvien.
