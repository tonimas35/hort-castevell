/*
 * ============================================================
 *  HORT INTEL·LIGENT CASTEVELL — Unitat Central v3
 * ============================================================
 *  ESP32 + ESP-NOW + DHT22 + Relé + WiFi → Supabase
 *
 *  Funcionalitats:
 *    1. Rep dades dels nodes per ESP-NOW
 *    2. Llegeix DHT22 (temp + humitat aire)
 *    3. Control relé per electroválvules (cicle sec-mullat)
 *    4. Registre de regs a Supabase
 *    5. Config remota des del control panel
 *    6. Alertes: nodes desconnectats + bateria baixa
 *    7. Finestra de reg 8-12h
 *    8. Watchdog hardware (reinicia si es penja)
 *    9. Estat persistent a NVS (sobreviu reinicis)
 *   10. Validació NTP abans de regar
 *
 *  Connexions:
 *    DHT22 DATA  → GPIO 4
 *    Relé IN1    → GPIO 25 (Vàlvula F1)
 *    Relé IN2    → GPIO 26 (Vàlvula F2)
 *    Relé IN3    → GPIO 27 (Vàlvula F3)
 *    Relé IN4    → GPIO 14 (Vàlvula F4)
 * ============================================================
 */

#include <esp_now.h>
#include <WiFi.h>
#include <esp_wifi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <DHT.h>
#include <Preferences.h>       // NVS persistent storage
#include <esp_task_wdt.h>      // Hardware watchdog
#include <ArduinoOTA.h>        // Actualització firmware per WiFi

// --- Credencials ---
#include "secrets.h"

// Llista de xarxes WiFi (intenta la primera, si falla la segona)
const char* wifiNetworks[][2] = {
  { SECRET_WIFI_SSID_1, SECRET_WIFI_PASSWORD_1 },
  { SECRET_WIFI_SSID_2, SECRET_WIFI_PASSWORD_2 },
};
const int NUM_NETWORKS = 2;
int currentNetwork = -1;
const char* SUPABASE_URL  = "https://jraxezlqdhwmxnzcrgcg.supabase.co";
const char* SUPABASE_KEY  = SECRET_SUPABASE_KEY;

// --- DHT22 ---
#define DHT_PIN 4
#define DHT_TYPE DHT22
DHT dht(DHT_PIN, DHT_TYPE);

// --- Relés (actiu BAIX) ---
#define RELAY_F1 25
#define RELAY_F2 26
#define RELAY_F3 27
#define RELAY_F4 14
const uint8_t relayPins[] = { RELAY_F1, RELAY_F2, RELAY_F3, RELAY_F4 };

// --- ESP-NOW ---
#define MAX_NODES 4

// --- Intervals ---
#define UPLOAD_INTERVAL_MS    60000     // Puja dades cada 60s
#define AMBIENT_READ_MS       1800000   // DHT22 cada 30 min
#define WIFI_RETRY_MS         30000     // Reintenta WiFi cada 30s
#define IRRIGATION_CHECK_MS   60000     // Comprova reg cada 60s
#define ALERT_CHECK_MS        300000    // Comprova alertes cada 5 min
#define CONFIG_READ_MS        600000    // Llegeix config cada 10 min
#define COMMANDS_CHECK_MS     10000     // Comprova comandes cada 10s
#define LOG_BATCH_MS          30000     // Envia logs cada 30s
#define MAX_LOG_BUFFER        20        // Màxim logs en buffer
#define WATCHDOG_TIMEOUT_S    120       // Watchdog: reinicia si no respon en 120s

// --- Llindars per defecte (basats en estudis científics) ---
#define DEFAULT_TRIGGER_BELOW     45
#define DEFAULT_IRRIGATION_MIN    120
#define DEFAULT_REST_HOURS        24

// --- Alertes ---
#define NODE_TIMEOUT_MS       28800000  // 8h
#define BATTERY_LOW_V         3.3

// --- NVS ---
Preferences prefs;

// ============================================================
//  ESTRUCTURES DE DADES
// ============================================================

// Central → Node (config remota)
typedef struct {
  uint8_t  targetNodeId;      // 0 = tots
  uint16_t sleepMinutes;      // 0 = no canviar
  uint8_t  wifiChannel;       // 0 = no canviar
  uint8_t  forceRead;         // 1 = lectura immediata
  uint8_t  configVersion;
} NodeConfig;

// Config pendent per enviar als nodes
NodeConfig pendingConfig[MAX_NODES];
bool hasPendingConfig[MAX_NODES] = {false, false, false, false};

// Node → Central
typedef struct {
  uint8_t  nodeId;
  uint16_t humidityRaw;
  uint8_t  humidityPct;
  float    batteryVoltage;
  uint32_t bootCount;
} SensorData;

typedef struct {
  uint8_t  humidityPct;
  uint16_t humidityRaw;
  float    batteryVoltage;
  uint32_t lastSeen;
  bool     active;
  bool     alertDisconnect;
  bool     alertBattery;
} NodeState;

typedef struct {
  bool     irrigating;
  unsigned long startTime;
  unsigned long lastIrrEnd;     // millis() — per descans dins sessió
  uint32_t lastIrrTimestamp;    // epoch — persistent a NVS
  uint16_t durationMin;
  uint8_t  triggerBelow;
  uint16_t restHours;
  bool     autoEnabled;
} IrrigationState;

NodeState nodes[MAX_NODES];
IrrigationState irrigation[MAX_NODES];

// Ambient
float ambientTemp = NAN;
float ambientHumidity = NAN;
float luxLevel = NAN;

// Estat
unsigned long lastUpload = 0;
unsigned long lastAmbientRead = 0;
unsigned long lastWiFiRetry = 0;
unsigned long lastIrrigCheck = 0;
unsigned long lastAlertCheck = 0;
unsigned long lastConfigRead = 0;
unsigned long lastCommandsCheck = 0;
bool newDataAvailable = false;
bool wifiConnected = false;
bool ntpSynced = false;

// Config
uint8_t bestIrrigationHour = 8;

// ============================================================
//  LOG REMOT — Buffer + enviament a Supabase
// ============================================================

struct LogEntry {
  char level[8];     // "info", "warn", "error"
  char message[120];
};

LogEntry logBuffer[MAX_LOG_BUFFER];
int logCount = 0;
unsigned long lastLogFlush = 0;

// Afegir log al buffer (substitueix Serial.println per events importants)
void remoteLog(const char* level, const char* fmt, ...) {
  // Sempre imprimir al Serial
  char msg[120];
  va_list args;
  va_start(args, fmt);
  vsnprintf(msg, sizeof(msg), fmt, args);
  va_end(args);

  Serial.printf("[%s] %s\n", level, msg);

  // Afegir al buffer si hi ha espai
  if (logCount < MAX_LOG_BUFFER) {
    strncpy(logBuffer[logCount].level, level, 7);
    logBuffer[logCount].level[7] = '\0';
    strncpy(logBuffer[logCount].message, msg, 119);
    logBuffer[logCount].message[119] = '\0';
    logCount++;
  }
}

// Enviar buffer de logs a Supabase
void flushLogs() {
  if (logCount == 0) return;
  if (!wifiConnected || WiFi.status() != WL_CONNECTED) return;

  // Construir array JSON amb tots els logs del buffer
  JsonDocument doc;
  JsonArray arr = doc.to<JsonArray>();

  for (int i = 0; i < logCount; i++) {
    JsonObject entry = arr.add<JsonObject>();
    entry["level"] = logBuffer[i].level;
    entry["source"] = "central";
    entry["message"] = logBuffer[i].message;
  }

  String body;
  serializeJson(doc, body);

  HTTPClient http;
  http.begin(String(SUPABASE_URL) + "/rest/v1/device_log");
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Prefer", "return=minimal");

  int code = http.POST(body);
  http.end();

  if (code == 201 || code == 200) {
    logCount = 0;  // Buidar buffer
  }
}

// ============================================================
//  NVS — Guardar/Llegir estat persistent
// ============================================================

void saveIrrigationState() {
  prefs.begin("irrig", false);
  for (int i = 0; i < MAX_NODES; i++) {
    String key = "lastIrr" + String(i);
    prefs.putUInt(key.c_str(), irrigation[i].lastIrrTimestamp);
  }
  prefs.end();
}

void loadIrrigationState() {
  prefs.begin("irrig", true);  // read-only
  for (int i = 0; i < MAX_NODES; i++) {
    String key = "lastIrr" + String(i);
    irrigation[i].lastIrrTimestamp = prefs.getUInt(key.c_str(), 0);
    if (irrigation[i].lastIrrTimestamp > 0) {
      Serial.printf("  F%d: últim reg epoch %u\n", i + 1, irrigation[i].lastIrrTimestamp);
    }
  }
  prefs.end();
}

// ============================================================
//  NTP — Validació hora
// ============================================================

bool checkNTP() {
  time_t now;
  time(&now);
  // Si l'hora és anterior a 2025, NTP no ha sincronitzat
  if (now < 1735689600) {  // 1 Jan 2025
    if (ntpSynced) {
      ntpSynced = false;
      Serial.println("⚠ NTP desincronitzat!");
    }
    return false;
  }
  if (!ntpSynced) {
    ntpSynced = true;
    struct tm timeinfo;
    localtime_r(&now, &timeinfo);
    Serial.printf("✓ NTP sincronitzat: %02d:%02d:%02d\n",
                  timeinfo.tm_hour, timeinfo.tm_min, timeinfo.tm_sec);
  }
  return true;
}

// ============================================================
//  ESP-NOW CALLBACK
// ============================================================

void onDataReceived(const esp_now_recv_info_t *info, const uint8_t *data, int len) {
  if (len != sizeof(SensorData)) return;

  SensorData received;
  memcpy(&received, data, sizeof(received));

  uint8_t idx = received.nodeId - 1;
  if (idx >= MAX_NODES) return;

  nodes[idx].humidityPct = received.humidityPct;
  nodes[idx].humidityRaw = received.humidityRaw;
  nodes[idx].batteryVoltage = received.batteryVoltage;
  nodes[idx].lastSeen = millis();
  nodes[idx].active = true;
  nodes[idx].alertDisconnect = false;
  newDataAvailable = true;

  char macStr[18];
  snprintf(macStr, sizeof(macStr), "%02X:%02X:%02X:%02X:%02X:%02X",
           info->src_addr[0], info->src_addr[1], info->src_addr[2],
           info->src_addr[3], info->src_addr[4], info->src_addr[5]);

  Serial.println("────────────────────────────────");
  Serial.printf("📡 Node F%d [%s]\n", received.nodeId, macStr);
  Serial.printf("   Humitat:  %d%% (raw: %d)\n", received.humidityPct, received.humidityRaw);
  Serial.printf("   Bateria:  %.2fV\n", received.batteryVoltage);
  Serial.printf("   Boot #%d\n", received.bootCount);
  remoteLog("info", "Node F%d: %d%% (raw:%d) bat:%.2fV boot#%d",
    received.nodeId, received.humidityPct, received.humidityRaw, received.batteryVoltage, received.bootCount);

  if (received.batteryVoltage > 0 && received.batteryVoltage < BATTERY_LOW_V) {
    nodes[idx].alertBattery = true;
    remoteLog("warn", "Node F%d bateria baixa: %.2fV", received.nodeId, received.batteryVoltage);
  } else {
    nodes[idx].alertBattery = false;
  }

  // Respondre amb config si hi ha pendent
  if (hasPendingConfig[idx]) {
    // Registrar el node com a peer per poder enviar-li
    esp_now_peer_info_t peerInfo = {};
    memcpy(peerInfo.peer_addr, info->src_addr, 6);
    peerInfo.channel = WiFi.channel();
    peerInfo.encrypt = false;
    esp_now_add_peer(&peerInfo);  // OK si ja existeix

    esp_err_t result = esp_now_send(info->src_addr, (uint8_t *)&pendingConfig[idx], sizeof(NodeConfig));
    if (result == ESP_OK) {
      Serial.printf("   📤 Config enviada al node F%d (sleep=%d canal=%d force=%d)\n",
        idx + 1, pendingConfig[idx].sleepMinutes, pendingConfig[idx].wifiChannel, pendingConfig[idx].forceRead);
      hasPendingConfig[idx] = false;
    } else {
      Serial.println("   ✗ Error enviant config al node");
    }
  }

  Serial.println("────────────────────────────────");
}

// ============================================================
//  SENSORS AMBIENTALS
// ============================================================

void readAmbientSensors() {
  float t = dht.readTemperature();
  float h = dht.readHumidity();

  if (!isnan(t)) ambientTemp = t;
  if (!isnan(h)) ambientHumidity = h;

  if (!isnan(t) || !isnan(h)) {
    Serial.printf("🌡 Ambient: %.1f°C  💧 %.1f%%\n", ambientTemp, ambientHumidity);
    remoteLog("info", "Ambient: %.1fC %.1f%%", ambientTemp, ambientHumidity);
    newDataAvailable = true;
  } else {
    remoteLog("warn", "DHT22: error de lectura");
  }
}

// ============================================================
//  CONTROL RELÉ
// ============================================================

void openValve(uint8_t row) {
  if (row >= MAX_NODES) return;
  digitalWrite(relayPins[row], HIGH);  // Polaritat invertida
  irrigation[row].irrigating = true;
  irrigation[row].startTime = millis();
  Serial.printf("💧 Vàlvula F%d OBERTA\n", row + 1);
  remoteLog("info", "Valvula F%d OBERTA", row + 1);
}

void closeValve(uint8_t row) {
  if (row >= MAX_NODES) return;
  digitalWrite(relayPins[row], LOW);  // Polaritat invertida
  irrigation[row].irrigating = false;
  irrigation[row].lastIrrEnd = millis();

  // Guardar timestamp persistent
  time_t now;
  time(&now);
  irrigation[row].lastIrrTimestamp = (uint32_t)now;
  saveIrrigationState();

  Serial.printf("🔒 Vàlvula F%d TANCADA\n", row + 1);
  remoteLog("info", "Valvula F%d TANCADA", row + 1);
}

void closeAllValves() {
  for (int i = 0; i < MAX_NODES; i++) {
    digitalWrite(relayPins[i], LOW);  // Polaritat invertida
    irrigation[i].irrigating = false;
  }
}

// ============================================================
//  LLEGIR CONFIG DE SUPABASE
// ============================================================

void readConfig() {
  if (!wifiConnected || WiFi.status() != WL_CONNECTED) return;

  Serial.println("⚙ Llegint config de Supabase...");

  HTTPClient http;
  String url = String(SUPABASE_URL) + "/rest/v1/config?id=eq.main&select=rows,global";

  http.begin(url);
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);

  int code = http.GET();

  if (code == 200) {
    String resp = http.getString();
    JsonDocument doc;
    DeserializationError err = deserializeJson(doc, resp);

    if (!err && doc.is<JsonArray>() && doc.size() > 0) {
      JsonObject config = doc[0];

      // Global
      if (config.containsKey("global")) {
        JsonObject global = config["global"];
        if (global.containsKey("irrigation_enabled")) {
          bool globalEnabled = global["irrigation_enabled"];
          if (!globalEnabled) {
            for (int i = 0; i < MAX_NODES; i++) irrigation[i].autoEnabled = false;
          }
          Serial.printf("  Reg global: %s\n", globalEnabled ? "ON" : "OFF");
        }
        if (global.containsKey("best_irrigation_hour")) {
          bestIrrigationHour = global["best_irrigation_hour"];
        }
      }

      // Per fila
      if (config.containsKey("rows")) {
        JsonArray rows = config["rows"];
        for (JsonObject row : rows) {
          int id = row["id"] | 0;
          if (id < 1 || id > MAX_NODES) continue;
          int idx = id - 1;

          if (row.containsKey("trigger_below"))
            irrigation[idx].triggerBelow = row["trigger_below"];
          if (row.containsKey("irrigation_duration_min"))
            irrigation[idx].durationMin = row["irrigation_duration_min"];
          if (row.containsKey("min_rest_hours"))
            irrigation[idx].restHours = row["min_rest_hours"];
          if (row.containsKey("auto_irrigation"))
            irrigation[idx].autoEnabled = row["auto_irrigation"];

          Serial.printf("  F%d: trigger<%d%% dur=%dmin descans=%dh auto=%s\n",
            id, irrigation[idx].triggerBelow, irrigation[idx].durationMin,
            irrigation[idx].restHours, irrigation[idx].autoEnabled ? "ON" : "OFF");
        }
      }
      Serial.println("  ✓ Config actualitzada!");
    }
  } else {
    Serial.printf("  ✗ Error config: %d\n", code);
  }
  http.end();
}

// ============================================================
//  COMANDES REMOTES (des del 3D / control panel)
// ============================================================

void checkCommands() {
  if (!wifiConnected || WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(SUPABASE_URL) + "/rest/v1/commands?status=eq.pending&order=created_at.asc&limit=5";

  http.begin(url);
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);

  int code = http.GET();
  if (code != 200) { http.end(); return; }

  String resp = http.getString();
  http.end();

  JsonDocument doc;
  if (deserializeJson(doc, resp)) return;
  if (!doc.is<JsonArray>()) return;

  JsonArray cmds = doc.as<JsonArray>();
  for (JsonObject cmd : cmds) {
    int id = cmd["id"];
    String command = cmd["command"] | "";
    int rowId = cmd["row_id"] | 0;
    int idx = rowId - 1;

    Serial.printf("📨 Comanda #%d: %s (F%d)\n", id, command.c_str(), rowId);

    if (command == "open_valve" && idx >= 0 && idx < MAX_NODES) {
      int durationMin = cmd["params"]["duration_min"] | irrigation[idx].durationMin;
      Serial.printf("   → Obrint vàlvula F%d per %d min\n", rowId, durationMin);
      irrigation[idx].durationMin = durationMin;
      openValve(idx);
    }
    else if (command == "close_valve" && idx >= 0 && idx < MAX_NODES) {
      Serial.printf("   → Tancant vàlvula F%d\n", rowId);
      unsigned long elapsed = irrigation[idx].irrigating ? (millis() - irrigation[idx].startTime) / 60000 : 0;
      closeValve(idx);
      if (elapsed > 0) logIrrigation(idx, elapsed);
    }
    else if (command == "close_all") {
      Serial.println("   → Tancant totes les vàlvules");
      for (int i = 0; i < MAX_NODES; i++) {
        if (irrigation[i].irrigating) {
          unsigned long elapsed = (millis() - irrigation[i].startTime) / 60000;
          closeValve(i);
          if (elapsed > 0) logIrrigation(i, elapsed);
        }
      }
    }
    else if (command == "node_config" && idx >= 0 && idx < MAX_NODES) {
      // Configurar un node remotament (s'enviarà quan el node es desperti)
      pendingConfig[idx].targetNodeId = rowId;
      pendingConfig[idx].sleepMinutes = cmd["params"]["sleep_minutes"] | 0;
      pendingConfig[idx].wifiChannel = cmd["params"]["wifi_channel"] | 0;
      pendingConfig[idx].forceRead = cmd["params"]["force_read"] | 0;
      pendingConfig[idx].configVersion = cmd["params"]["config_version"] | 1;
      hasPendingConfig[idx] = true;
      Serial.printf("   → Config pendent per node F%d (sleep=%d canal=%d force=%d)\n",
        rowId, pendingConfig[idx].sleepMinutes, pendingConfig[idx].wifiChannel, pendingConfig[idx].forceRead);
    }
    else if (command == "force_read_all") {
      // Forçar lectura de tots els nodes
      for (int i = 0; i < MAX_NODES; i++) {
        pendingConfig[i].targetNodeId = 0;  // broadcast
        pendingConfig[i].sleepMinutes = 0;
        pendingConfig[i].wifiChannel = 0;
        pendingConfig[i].forceRead = 1;
        pendingConfig[i].configVersion = 1;
        hasPendingConfig[i] = true;
      }
      Serial.println("   → Lectura forçada pendent per tots els nodes");
    }

    // Marcar comanda com executada
    HTTPClient http2;
    String updateUrl = String(SUPABASE_URL) + "/rest/v1/commands?id=eq." + String(id);
    http2.begin(updateUrl);
    http2.addHeader("apikey", SUPABASE_KEY);
    http2.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);
    http2.addHeader("Content-Type", "application/json");

    http2.sendRequest("PATCH", "{\"status\":\"executed\"}");
    http2.end();

    Serial.println("   ✓ Executada!");

    // Reset watchdog entre comandes per evitar timeout
    esp_task_wdt_reset();
    delay(100);
  }
}

// ============================================================
//  LÒGICA DE REG — CICLE SEC-MULLAT
// ============================================================

void checkIrrigation() {
  // Seguretat: no regar sense hora vàlida
  if (!checkNTP()) {
    Serial.println("⚠ Reg suspès: NTP no sincronitzat");
    return;
  }

  time_t now;
  time(&now);
  struct tm timeinfo;
  localtime_r(&now, &timeinfo);
  int currentHour = timeinfo.tm_hour;

  for (int i = 0; i < MAX_NODES; i++) {
    // Si vàlvula oberta → comprovar durada
    if (irrigation[i].irrigating) {
      unsigned long elapsedMin = (millis() - irrigation[i].startTime) / 60000;
      if (elapsedMin >= irrigation[i].durationMin) {
        closeValve(i);
        logIrrigation(i, elapsedMin);
      }
      continue;
    }

    if (!irrigation[i].autoEnabled) continue;
    if (!nodes[i].active) continue;

    // Finestra de reg: 8-12h
    if (currentHour < 8 || currentHour >= 12) continue;

    // Descans — usa timestamp persistent (sobreviu reinicis)
    if (irrigation[i].lastIrrTimestamp > 0) {
      uint32_t hoursSinceLast = ((uint32_t)now - irrigation[i].lastIrrTimestamp) / 3600;
      if (hoursSinceLast < irrigation[i].restHours) continue;
    }

    // Humitat per sota del llindar?
    if (nodes[i].humidityPct < irrigation[i].triggerBelow) {
      remoteLog("info", "F%d: Humitat %d%% < %d%% → Reg %d min",
                    i + 1, nodes[i].humidityPct, irrigation[i].triggerBelow, irrigation[i].durationMin);
      openValve(i);
    }
  }
}

// ============================================================
//  REGISTRE DE REGS A SUPABASE
// ============================================================

void logIrrigation(uint8_t row, unsigned long durationMin) {
  if (!wifiConnected || WiFi.status() != WL_CONNECTED) return;

  Serial.printf("📝 Registrant reg F%d (%lu min)\n", row + 1, durationMin);

  JsonDocument doc;
  time_t now;
  time(&now);

  doc["timestamp"] = (unsigned long)now;
  doc["row_id"] = row + 1;
  doc["duration_min"] = durationMin;
  doc["trigger_humidity"] = nodes[row].humidityPct;
  doc["ambient_temp"] = isnan(ambientTemp) ? 0 : round(ambientTemp * 10) / 10.0;

  String body;
  serializeJson(doc, body);

  HTTPClient http;
  http.begin(String(SUPABASE_URL) + "/rest/v1/irrigation_log");
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Prefer", "return=minimal");

  int code = http.POST(body);
  Serial.printf("  %s\n", (code == 201 || code == 200) ? "✓ Registrat!" : "✗ Error");
  http.end();
}

// ============================================================
//  ALERTES
// ============================================================

void checkAlerts() {
  unsigned long now = millis();

  for (int i = 0; i < MAX_NODES; i++) {
    if (!nodes[i].active) continue;

    if ((now - nodes[i].lastSeen) > NODE_TIMEOUT_MS && !nodes[i].alertDisconnect) {
      nodes[i].alertDisconnect = true;
      remoteLog("warn", "Node F%d desconnectat >8h!", i + 1);
    }

    if (nodes[i].batteryVoltage > 0 && nodes[i].batteryVoltage < BATTERY_LOW_V && !nodes[i].alertBattery) {
      nodes[i].alertBattery = true;
      Serial.printf("⚠ ALERTA: Node F%d bateria baixa: %.2fV\n", i + 1, nodes[i].batteryVoltage);
    }
  }
}

// ============================================================
//  WiFi
// ============================================================

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    return;
  }

  // Provar cada xarxa
  for (int n = 0; n < NUM_NETWORKS; n++) {
    Serial.printf("📶 Intentant %s...\n", wifiNetworks[n][0]);
    WiFi.disconnect();
    WiFi.begin(wifiNetworks[n][0], wifiNetworks[n][1]);

    int tries = 0;
    while (WiFi.status() != WL_CONNECTED && tries < 15) {
      delay(500);
      Serial.print(".");
      esp_task_wdt_reset();
      tries++;
    }

    if (WiFi.status() == WL_CONNECTED) {
      currentNetwork = n;
      wifiConnected = true;
      Serial.printf("\n✓ Connectat a %s! IP: %s  Canal: %d\n",
                    wifiNetworks[n][0], WiFi.localIP().toString().c_str(), WiFi.channel());
      configTime(3600, 3600, "pool.ntp.org");
      delay(2000);
      checkNTP();
      return;
    }
    Serial.println(" ✗");
  }

  wifiConnected = false;
  Serial.println("✗ Cap xarxa WiFi disponible");
}

// ============================================================
//  SUPABASE — Puja dades
// ============================================================

void uploadData() {
  if (!wifiConnected || WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠ Sense WiFi, no es pot pujar");
    return;
  }

  Serial.println("\n📤 Pujant dades a Supabase...");

  JsonDocument doc;
  time_t now;
  time(&now);
  doc["timestamp"] = (unsigned long)now;

  // Ambient
  JsonObject amb = doc["ambient"].to<JsonObject>();
  if (!isnan(ambientTemp))     amb["temperature"] = round(ambientTemp * 10) / 10.0;
  if (!isnan(ambientHumidity)) amb["humidity"] = round(ambientHumidity * 10) / 10.0;
  if (!isnan(luxLevel))        amb["lux"] = round(luxLevel);

  // Nodes
  JsonArray nodesArr = doc["nodes"].to<JsonArray>();
  for (int i = 0; i < MAX_NODES; i++) {
    if (!nodes[i].active) continue;
    JsonObject n = nodesArr.add<JsonObject>();
    n["id"] = i + 1;
    n["humidity_pct"] = nodes[i].humidityPct;
    n["humidity_raw"] = nodes[i].humidityRaw;
    n["battery_v"] = round(nodes[i].batteryVoltage * 100) / 100.0;
    n["last_seen_s"] = (millis() - nodes[i].lastSeen) / 1000;
    n["irrigating"] = irrigation[i].irrigating;
    if (nodes[i].alertDisconnect) n["alert"] = "disconnected";
    if (nodes[i].alertBattery) n["alert"] = "low_battery";
  }

  JsonDocument postDoc;
  postDoc["timestamp"] = (unsigned long)now;
  postDoc["ambient"] = doc["ambient"];
  postDoc["nodes"] = doc["nodes"];

  String postBody;
  serializeJson(postDoc, postBody);
  Serial.printf("  JSON: %s\n", postBody.c_str());

  HTTPClient http;
  http.begin(String(SUPABASE_URL) + "/rest/v1/readings");
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Prefer", "return=minimal");

  int code = http.POST(postBody);
  Serial.printf("  %s\n", (code == 201 || code == 200) ? "✓ Dades pujades!" : "✗ Error");
  http.end();
}

// ============================================================
//  SETUP
// ============================================================

void setup() {
  Serial.begin(115200);
  delay(2000);

  Serial.println("\n╔══════════════════════════════════════════╗");
  Serial.println("║  HORT CASTEVELL — Central v3 (Profesional) ║");
  Serial.println("╚══════════════════════════════════════════╝\n");

  // ⚠ PRIMER: Tancar totes les vàlvules (seguretat al reinici)
  for (int i = 0; i < 4; i++) {
    pinMode(relayPins[i], OUTPUT);
    digitalWrite(relayPins[i], LOW);  // Polaritat invertida: LOW = tancat
  }
  Serial.println("✓ Vàlvules tancades (seguretat)");

  // Watchdog — reinicia si es penja >120s
  esp_task_wdt_config_t wdt_config = {
    .timeout_ms = WATCHDOG_TIMEOUT_S * 1000,
    .idle_core_mask = (1 << 0),
    .trigger_panic = true,
  };
  esp_task_wdt_init(&wdt_config);
  esp_task_wdt_add(NULL);
  Serial.printf("✓ Watchdog activat (%ds)\n", WATCHDOG_TIMEOUT_S);

  // Init nodes + reg
  for (int i = 0; i < MAX_NODES; i++) {
    nodes[i].active = false;
    nodes[i].lastSeen = 0;
    nodes[i].alertDisconnect = false;
    nodes[i].alertBattery = false;

    irrigation[i].irrigating = false;
    irrigation[i].startTime = 0;
    irrigation[i].lastIrrEnd = 0;
    irrigation[i].lastIrrTimestamp = 0;
    irrigation[i].durationMin = DEFAULT_IRRIGATION_MIN;
    irrigation[i].triggerBelow = DEFAULT_TRIGGER_BELOW;
    irrigation[i].restHours = DEFAULT_REST_HOURS;
    irrigation[i].autoEnabled = true;
  }

  // Carregar estat persistent (quan va regar per últim cop)
  Serial.println("📦 Carregant estat persistent...");
  loadIrrigationState();

  // DHT22
  dht.begin();
  Serial.println("✓ DHT22 inicialitzat (GPIO 4)");

  // WiFi
  WiFi.mode(WIFI_STA);
  connectWiFi();

  // OTA — actualització firmware per WiFi
  ArduinoOTA.setHostname("hort-central");
  ArduinoOTA.setPassword("hort2026");
  ArduinoOTA.onStart([]() {
    closeAllValves();
    esp_task_wdt_delete(NULL);  // Desactivar watchdog durant OTA
    Serial.println("📥 Actualitzant firmware OTA...");
  });
  ArduinoOTA.onEnd([]() { Serial.println("\n✓ OTA completat! Reiniciant..."); });
  ArduinoOTA.onError([](ota_error_t error) { Serial.printf("✗ OTA error: %u\n", error); });
  ArduinoOTA.begin();
  Serial.println("✓ OTA activat (hort-central)");

  // MAC
  uint8_t mac[6];
  WiFi.macAddress(mac);
  Serial.printf("\n📍 MAC central: %02X:%02X:%02X:%02X:%02X:%02X\n\n",
                mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);

  // ESP-NOW
  if (esp_now_init() != ESP_OK) {
    Serial.println("✗ ERROR ESP-NOW!");
    ESP.restart();
  }
  esp_now_register_recv_cb(onDataReceived);
  Serial.println("✓ ESP-NOW inicialitzat");

  // Ambient + Config
  readAmbientSensors();
  readConfig();

  Serial.println("\n🌱 Central v3 llesta!\n");
  Serial.println("  ✓ ESP-NOW (4 nodes)");
  Serial.println("  ✓ DHT22 (temp + humitat)");
  Serial.println("  ✓ Relé (4 vàlvules)");
  Serial.println("  ✓ Reg automàtic (cicle sec-mullat)");
  Serial.println("  ✓ Registre regs (Supabase)");
  Serial.println("  ✓ Config remota (control panel)");
  Serial.println("  ✓ Alertes (desconnexió + bateria)");
  Serial.println("  ✓ Watchdog hardware");
  Serial.println("  ✓ Estat persistent (NVS)");
  Serial.println("  ✓ Validació NTP");
  Serial.printf("  ✓ Finestra reg: 8-12h\n\n");
  remoteLog("info", "Central v3 arrencada - WiFi: %s Canal: %d", wifiNetworks[currentNetwork >= 0 ? currentNetwork : 0][0], WiFi.channel());
}

// ============================================================
//  LOOP
// ============================================================

void loop() {
  // Reset watchdog
  esp_task_wdt_reset();

  // OTA
  ArduinoOTA.handle();

  unsigned long now = millis();

  // WiFi
  if (WiFi.status() != WL_CONNECTED) {
    wifiConnected = false;
    if (now - lastWiFiRetry >= WIFI_RETRY_MS) {
      connectWiFi();
      lastWiFiRetry = now;
    }
  }

  // DHT22
  if (now - lastAmbientRead >= AMBIENT_READ_MS) {
    readAmbientSensors();
    lastAmbientRead = now;
  }

  // Comandes remotes (cada 10s)
  if (now - lastCommandsCheck >= COMMANDS_CHECK_MS) {
    checkCommands();
    lastCommandsCheck = now;
  }

  // Reg automàtic
  if (now - lastIrrigCheck >= IRRIGATION_CHECK_MS) {
    checkIrrigation();
    lastIrrigCheck = now;
  }

  // Alertes
  if (now - lastAlertCheck >= ALERT_CHECK_MS) {
    checkAlerts();
    lastAlertCheck = now;
  }

  // Config remota
  if (now - lastConfigRead >= CONFIG_READ_MS) {
    readConfig();
    lastConfigRead = now;
  }

  // Enviar logs remots
  if (now - lastLogFlush >= LOG_BATCH_MS) {
    flushLogs();
    lastLogFlush = now;
  }

  // Pujar dades
  if (newDataAvailable && (now - lastUpload >= UPLOAD_INTERVAL_MS)) {
    uploadData();
    lastUpload = now;
    newDataAvailable = false;
  }

  delay(100);
}
