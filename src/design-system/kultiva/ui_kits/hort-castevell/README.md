# Hort Castevell — UI Kit

Quatre pàgines del producte real, amb tots els components atòmics reutilitzables. React + Babel inline, sense build. Dos temes:

- **`index.html`** — *Mediterranean farmhouse* clar, càlid, amb Fraunces+Outfit. **Default.**
- **`index-agrotech.html`** — *Agrotech light*: paper off-white, accents lima, dades monoespaiades, graella hairline, geometria afilada. 3D scene en fons fosc (HUD).

## Pàgines

| Ruta (switcher) | Component | Què conté |
|---|---|---|
| **Dashboard** | `DashboardPage` (`Pages1.jsx`) | AmbientStrip · NodesGrid (4 NodeCard) · HumidityChart · IrrigationLog |
| **Vista 3D** | `Scene3DPage` (`Pages1.jsx`) | Canvas gradient stub + HUD (topbar · info panel · ambient strip · controls) |
| **Control** | `ControlPage` (`Pages2.jsx`) | Global settings (toggle + inputs) · 4 RowConfigCard amb GrowthStageSelector + sliders |
| **Log** | `DeviceLogPage` (`Pages2.jsx`) | Filtres INFO/WARN/ERROR · consola terminal-like amb entrades mostra |

## Fitxers

```
Shared.jsx             Header · Footer · ConnectionBadge · SectionDivider · ROWS · formatters
Cards.jsx              NodeCard (gauge gota) · AmbientStrip
Charts.jsx             HumidityChart (SVG inline, 24h) · IrrigationLog (empty state)
ControlComponents.jsx  GlobalSettings · RowConfigCard · GrowthStageSelector · Slider · Toggle · SaveBar
Pages1.jsx             DashboardPage · Scene3DPage
Pages2.jsx             ControlPage · DeviceLogPage
styles.css             Tema farmhouse clar (default)
styles-agrotech.css    Tema agrotech light (override)
index.html             Entry farmhouse
index-agrotech.html    Entry agrotech
```

## Reutilitzar

1. Copia `colors_and_type.css` al teu projecte (tokens base).
2. Copia `styles.css` **o** `styles-agrotech.css` segons el tema.
3. Copia els `.jsx` que necessitis — tots exporten al `window` al final (no type="module").
4. Ordre de càrrega: `Shared` → `Cards` → `Charts` → `ControlComponents` → `Pages1` → `Pages2`.

## Estat persistent

La pàgina activa es guarda a `localStorage`:
- `hc-page` → per `index.html`
- `hc-page-v2` → per `index-agrotech.html`

## Dades mock

Al root de cada entry:
```js
const NODES = [{humidity_pct, battery_v, last_seen_s}, ...4]
const AMBIENT = {temperature, humidity, lux}
```

Substituir per subscripcions Supabase al producte real.
