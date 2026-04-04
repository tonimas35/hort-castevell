# 🌱 Hort Intel·ligent Castevell

Sistema IoT per monitoritzar la humitat de la terra i controlar el reg automàtic a la masia de Castevell (Tarragona).

## Arquitectura

```
[Node F1] ──ESP-NOW──► [ESP32 Central] ──SIM 4G──► [GitHub Pages Dashboard]
                         │
                     DHT22 + BH1750
                     Relé 4 canals → Electroválvules
```

## Estructura del projecte

```
hort-castevell/
├── firmware/
│   ├── node_sensor/       ← ESP32 amb sensor humitat (×4 nodes)
│   │   └── node_sensor.ino
│   └── central/           ← ESP32 central amb SIM + relés
│       └── central.ino
├── dashboard/             ← GitHub Pages
│   ├── index.html
│   ├── css/style.css
│   ├── js/app.js
│   └── data/
│       ├── latest.json    ← Últimes dades
│       └── history.json   ← Historial
└── README.md
```

## Comanda de peces — Prototip MVP

### Essencial (1 node + central)

| Peça | Quantitat | Preu est. | Link |
|------|-----------|-----------|------|
| ESP32 DevKit V1 (WROOM-32) | 2 | ~10€ | AliExpress / Amazon |
| Sensor humitat capacitatiu v1.2 | 1 | ~2€ | AliExpress |
| SIM800L (2G) o SIM7600 (4G) | 1 | ~8-15€ | AliExpress |
| Antena GSM amb connector | 1 | ~2€ | Inclosa amb SIM |
| SIM de dades (prepagament) | 1 | ~5€/mes | Simyo / Digi |

**Total prototip: ~25-35€**

### Per completar (fase 2+)

| Peça | Quantitat | Preu est. |
|------|-----------|-----------|
| ESP32 DevKit addicionals | 3 | ~15€ |
| Sensors humitat capacitatius | 3 | ~6€ |
| DHT22 | 1 | ~3€ |
| BH1750 | 1 | ~2€ |
| Relé 4 canals 5V | 1 | ~5€ |
| Electroválvules 12V | 4 | ~32€ |
| Bateries 18650 | 8 | ~24€ |
| Portabateries 2×18650 | 4 | ~8€ |
| Font 12V 2A | 1 | ~8€ |
| DC-DC 12V→5V | 1 | ~3€ |
| Caixes IP65 (petita ×4 + gran ×1) | 5 | ~20€ |

## Configuració ràpida

### 1. Descobrir la MAC de la central

1. Puja `central.ino` a l'ESP32 central
2. Obre el Monitor Serial a 115200 bauds
3. Copia la MAC que apareix: `📍 MAC d'aquesta central: XX:XX:XX:XX:XX:XX`

### 2. Configurar el node

1. Obre `node_sensor.ino`
2. Canvia `centralMAC[]` amb la MAC del pas anterior
3. Ajusta `NODE_ID` (1 per F1, 2 per F2, etc.)
4. Puja al ESP32 del node

### 3. Calibrar el sensor

1. Posa el sensor a l'aire → anota el valor `raw` al Serial → posa a `SENSOR_AIR_VALUE`
2. Posa el sensor en un got d'aigua → anota el valor `raw` → posa a `SENSOR_WATER_VALUE`
3. Puja el firmware actualitzat

### 4. Dashboard

1. Crea un repo a GitHub amb el contingut de `dashboard/`
2. Activa GitHub Pages (Settings → Pages → Branch: main)
3. Configura el token PAT a `central.ino`

## Llibreries Arduino necessàries

Instal·lar des del Library Manager de l'Arduino IDE:

- **DHT sensor library** (Adafruit)
- **BH1750** (Christopher Laws)
- **ArduinoJson** (Benoit Blanchon)

Les llibreries ESP-NOW i WiFi ja venen amb l'ESP32 board package.

### Configurar ESP32 a Arduino IDE

1. File → Preferences → Additional Board URLs:
   `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
2. Tools → Board → Boards Manager → Buscar "esp32" → Instal·lar
3. Tools → Board → ESP32 Dev Module

## Fases

- [x] Fase 0: Disseny i planificació
- [ ] Fase 1: MVP (1 node + central + dashboard)
- [ ] Fase 2: Reg automàtic + sensors ambient + alertes
- [ ] Fase 3: PWA pare + expansions
