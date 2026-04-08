/*
 * ============================================================
 *  HORT INTEL·LIGENT CASTEVELL — Node Sensor v2
 * ============================================================
 *  ESP32 + Sensor Humitat + ESP-NOW bidireccional + Deep Sleep
 *
 *  Protocol:
 *    1. Desperta del deep sleep
 *    2. Llegeix sensor d'humitat
 *    3. Envia dades a la central per ESP-NOW
 *    4. Espera 500ms per rebre config de la central
 *    5. Si rep config nova → guarda a NVS (persistent)
 *    6. Dorm segons la config (per defecte 4h)
 *
 *  Config remota (des del control panel):
 *    - Sleep interval (minuts)
 *    - Canal WiFi
 *    - Forçar lectura immediata
 *
 *  Connexions:
 *    Sensor AOUT → GPIO 34
 *    Sensor VCC  → 3.3V
 *    Sensor GND  → GND
 * ============================================================
 */

#include <esp_now.h>
#include <WiFi.h>
#include <esp_sleep.h>
#include <esp_wifi.h>
#include <Preferences.h>

// ============================================================
//  CONFIGURACIÓ INICIAL (pot ser sobreescrita per config remota)
// ============================================================

#define NODE_ID 1
#define SENSOR_PIN 34
#define BATTERY_PIN 35
#define BATTERY_DIVIDER_RATIO 2.0

uint8_t centralMAC[] = { 0xD4, 0xE9, 0xF4, 0xE6, 0x28, 0xE8 };

// Valors per defecte (es carreguen de NVS si existeixen)
#define DEFAULT_SLEEP_MINUTES  240   // 4 hores
#define DEFAULT_WIFI_CHANNEL   6
#define SENSOR_AIR_VALUE       2622
#define SENSOR_WATER_VALUE     1074

// ============================================================
//  ESTRUCTURES DE DADES — PROTOCOL BIDIRECCIONAL
// ============================================================

// Node → Central (el que ja teníem)
typedef struct {
  uint8_t  nodeId;
  uint16_t humidityRaw;
  uint8_t  humidityPct;
  float    batteryVoltage;
  uint32_t bootCount;
} SensorData;

// Central → Node (NOU: config remota)
typedef struct {
  uint8_t  targetNodeId;      // Per quin node és (0 = tots)
  uint16_t sleepMinutes;      // 0 = no canviar
  uint8_t  wifiChannel;       // 0 = no canviar
  uint8_t  forceRead;         // 1 = desperta i llegeix immediatament
  uint8_t  configVersion;     // Incrementa cada cop que canvia la config
} NodeConfig;

// ============================================================
//  ESTAT PERSISTENT (NVS)
// ============================================================

Preferences prefs;

// Config activa (carregada de NVS o defaults)
uint16_t sleepMinutes;
uint8_t  wifiChannel;
uint8_t  lastConfigVersion;

void loadConfig() {
  prefs.begin("nodeconf", true);  // read-only
  sleepMinutes = prefs.getUShort("sleepMin", DEFAULT_SLEEP_MINUTES);
  wifiChannel = prefs.getUChar("channel", DEFAULT_WIFI_CHANNEL);
  lastConfigVersion = prefs.getUChar("confVer", 0);
  prefs.end();

  Serial.printf("  Config NVS: sleep=%dmin canal=%d versió=%d\n",
                sleepMinutes, wifiChannel, lastConfigVersion);
}

void saveConfig() {
  prefs.begin("nodeconf", false);  // read-write
  prefs.putUShort("sleepMin", sleepMinutes);
  prefs.putUChar("channel", wifiChannel);
  prefs.putUChar("confVer", lastConfigVersion);
  prefs.end();
  Serial.println("  💾 Config guardada a NVS");
}

// ============================================================
//  VARIABLES
// ============================================================

SensorData sensorData;
RTC_DATA_ATTR uint32_t bootCount = 0;

bool sendSuccess = false;
bool configReceived = false;
bool forceImmediateRead = false;

// ============================================================
//  LECTURA SENSORS
// ============================================================

float readBattery() {
  int raw = analogRead(BATTERY_PIN);
  return (raw / 4095.0) * 3.3 * BATTERY_DIVIDER_RATIO;
}

uint16_t readHumidityRaw() {
  uint32_t sum = 0;
  for (int i = 0; i < 10; i++) {
    sum += analogRead(SENSOR_PIN);
    delay(10);
  }
  return (uint16_t)(sum / 10);
}

uint8_t rawToPercent(uint16_t raw) {
  if (raw >= SENSOR_AIR_VALUE) return 0;
  if (raw <= SENSOR_WATER_VALUE) return 100;
  float pct = 100.0 * (SENSOR_AIR_VALUE - raw) / (SENSOR_AIR_VALUE - SENSOR_WATER_VALUE);
  return (uint8_t)constrain(pct, 0, 100);
}

// ============================================================
//  ESP-NOW CALLBACKS
// ============================================================

// Callback quan s'envia
void onDataSent(const wifi_tx_info_t *info, esp_now_send_status_t status) {
  sendSuccess = (status == ESP_NOW_SEND_SUCCESS);
  Serial.printf("  ESP-NOW enviament: %s\n", sendSuccess ? "OK ✓" : "ERROR ✗");
}

// Callback quan es REP config de la central
void onDataReceived(const esp_now_recv_info_t *info, const uint8_t *data, int len) {
  if (len != sizeof(NodeConfig)) {
    Serial.printf("  📨 Rebut paquet desconegut (%d bytes)\n", len);
    return;
  }

  NodeConfig config;
  memcpy(&config, data, sizeof(config));

  // Comprovar si és per nosaltres (0 = broadcast a tots)
  if (config.targetNodeId != 0 && config.targetNodeId != NODE_ID) {
    Serial.printf("  📨 Config per node %d, no per nosaltres\n", config.targetNodeId);
    return;
  }

  Serial.println("  ┌─────────────────────────────┐");
  Serial.println("  │  📨 CONFIG REBUDA DEL CENTRAL │");
  Serial.println("  └─────────────────────────────┘");

  bool changed = false;

  // Sleep interval
  if (config.sleepMinutes > 0 && config.sleepMinutes != sleepMinutes) {
    Serial.printf("  Sleep: %d → %d min\n", sleepMinutes, config.sleepMinutes);
    sleepMinutes = config.sleepMinutes;
    changed = true;
  }

  // Canal WiFi
  if (config.wifiChannel > 0 && config.wifiChannel != wifiChannel) {
    Serial.printf("  Canal: %d → %d\n", wifiChannel, config.wifiChannel);
    wifiChannel = config.wifiChannel;
    changed = true;
  }

  // Forçar lectura
  if (config.forceRead == 1) {
    Serial.println("  ⚡ Lectura forçada — dormirà 1 min i tornarà a llegir");
    forceImmediateRead = true;
  }

  // Guardar si ha canviat
  if (changed) {
    lastConfigVersion = config.configVersion;
    saveConfig();
  }

  configReceived = true;
}

// ============================================================
//  SETUP — S'EXECUTA CADA COP QUE DESPERTA
// ============================================================

void setup() {
  Serial.begin(115200);
  delay(1000);
  bootCount++;

  Serial.println("\n========================================");
  Serial.printf("  HORT CASTEVELL — Node F%d v2\n", NODE_ID);
  Serial.printf("  Arrencada #%d\n", bootCount);
  Serial.println("========================================\n");

  // 1. Carregar config persistent
  loadConfig();

  // 2. Llegir sensors
  sensorData.nodeId = NODE_ID;
  sensorData.humidityRaw = readHumidityRaw();
  sensorData.humidityPct = rawToPercent(sensorData.humidityRaw);
  sensorData.batteryVoltage = readBattery();
  sensorData.bootCount = bootCount;

  Serial.printf("  Humitat:  %d%% (raw: %d)\n", sensorData.humidityPct, sensorData.humidityRaw);
  Serial.printf("  Bateria:  %.2fV\n", sensorData.batteryVoltage);

  // 3. WiFi + ESP-NOW
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  esp_wifi_set_channel(wifiChannel, WIFI_SECOND_CHAN_NONE);

  if (esp_now_init() != ESP_OK) {
    Serial.println("  ERROR: ESP-NOW init");
    goToSleep();
    return;
  }

  // Registrar AMBDÓS callbacks (enviar + rebre)
  esp_now_register_send_cb(onDataSent);
  esp_now_register_recv_cb(onDataReceived);

  // Registrar central com a peer
  esp_now_peer_info_t peerInfo = {};
  memcpy(peerInfo.peer_addr, centralMAC, 6);
  peerInfo.channel = wifiChannel;
  peerInfo.encrypt = false;

  if (esp_now_add_peer(&peerInfo) != ESP_OK) {
    Serial.println("  ERROR: Peer central");
    goToSleep();
    return;
  }

  // 4. Enviar dades
  Serial.println("  Enviant dades per ESP-NOW...");
  esp_now_send(centralMAC, (uint8_t *)&sensorData, sizeof(sensorData));

  // Esperar callback enviament (500ms)
  unsigned long start = millis();
  while (!sendSuccess && (millis() - start < 500)) {
    delay(10);
  }

  // 5. Esperar config de la central (800ms)
  Serial.println("  Esperant config del central...");
  start = millis();
  while (!configReceived && (millis() - start < 800)) {
    delay(10);
  }

  if (!configReceived) {
    Serial.println("  (cap config rebuda — usant valors actuals)");
  }

  // 6. Dormir
  goToSleep();
}

// ============================================================
//  DEEP SLEEP
// ============================================================

void goToSleep() {
  uint16_t actualSleep = forceImmediateRead ? 1 : sleepMinutes;  // 1 min si forçat

  Serial.printf("\n  💤 Dormint %d minuts (canal %d)...\n\n", actualSleep, wifiChannel);

  esp_wifi_stop();
  esp_now_deinit();

  esp_sleep_enable_timer_wakeup((uint64_t)actualSleep * 60ULL * 1000000ULL);
  esp_deep_sleep_start();
}

// ============================================================
//  LOOP — Mai s'executa
// ============================================================

void loop() {}
