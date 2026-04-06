/*
 * ============================================================
 *  HORT INTEL·LIGENT CASTEVELL — Unitat Central (WiFi + Supabase)
 * ============================================================
 *  ESP32 + ESP-NOW Receiver + WiFi → Supabase PostgreSQL
 *
 *  Funcionament:
 *    1. Rep dades dels nodes sensor per ESP-NOW
 *    2. Connecta per WiFi i insereix a Supabase (PostgreSQL)
 *    3. Sempre encesa (alimentada per USB o font)
 *
 *  Connexions MVP (prototip):
 *    Només USB! Sensor humitat capacitatiu al node, no a la central.
 * ============================================================
 */

#include <esp_now.h>
#include <WiFi.h>
#include <esp_wifi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>

// ============================================================
//  CONFIGURACIÓ — MODIFICA AQUÍ
// ============================================================

// --- WiFi ---
const char* WIFI_SSID     = "iPhone de Antoni (2)";
const char* WIFI_PASSWORD = "minion35";

// --- Supabase ---
const char* SUPABASE_URL = "https://jraxezlqdhwmxnzcrgcg.supabase.co";
// ⚠ Posa aquí la teva clau secreta de Supabase (no pujar a GitHub!)
const char* SUPABASE_KEY = "SUPABASE_SECRET_KEY_HERE";

// --- ESP-NOW ---
#define MAX_NODES 4

// --- Intervals ---
#define UPLOAD_INTERVAL_MS  60000   // Puja dades cada 60s
#define WIFI_RETRY_MS       30000   // Reintenta WiFi cada 30s

// ============================================================
//  ESTRUCTURES DE DADES
// ============================================================

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
} NodeState;

NodeState nodes[MAX_NODES];

// Ambient (fase 2)
float ambientTemp = NAN;
float ambientHumidity = NAN;
float luxLevel = NAN;

// Estat
unsigned long lastUpload = 0;
unsigned long lastWiFiRetry = 0;
bool newDataAvailable = false;
bool wifiConnected = false;

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
  Serial.println("────────────────────────────────");
}

// ============================================================
//  WiFi
// ============================================================

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    return;
  }

  Serial.printf("📶 Connectant a %s...\n", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 20) {
    delay(500);
    Serial.print(".");
    tries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.printf("\n✓ WiFi connectat! IP: %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("  Canal WiFi: %d\n", WiFi.channel());
    configTime(3600, 3600, "pool.ntp.org");
    Serial.println("✓ NTP configurat");
  } else {
    wifiConnected = false;
    Serial.println("\n✗ WiFi no disponible");
  }
}

// ============================================================
//  SUPABASE — INSERT (un sol HTTP POST!)
// ============================================================

void uploadData() {
  if (!wifiConnected || WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠ Sense WiFi, no es pot pujar");
    return;
  }

  Serial.println("\n📤 Pujant dades a Supabase...");

  // Construir JSON
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
  }

  String jsonStr;
  serializeJson(doc, jsonStr);
  Serial.printf("  JSON: %s\n", jsonStr.c_str());

  // HTTP POST a Supabase
  HTTPClient http;
  String url = String(SUPABASE_URL) + "/rest/v1/readings";

  http.begin(url);
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Prefer", "return=minimal");

  // El cos és el JSON directe — Supabase mapeja cada camp a una columna
  String body = "{\"timestamp\":" + String((unsigned long)now) +
                ",\"ambient\":" + String(jsonStr.substring(jsonStr.indexOf("\"ambient\":") + 10,
                                          jsonStr.indexOf(",\"nodes\""))) +
                ",\"nodes\":" + String(jsonStr.substring(jsonStr.indexOf("\"nodes\":") + 8,
                                        jsonStr.length() - 1)) + "}";

  // Més net: serialitzar directament
  JsonDocument postDoc;
  postDoc["timestamp"] = (unsigned long)now;
  postDoc["ambient"] = doc["ambient"];
  postDoc["nodes"] = doc["nodes"];

  String postBody;
  serializeJson(postDoc, postBody);

  int code = http.POST(postBody);

  if (code == 201 || code == 200) {
    Serial.println("  ✓ Dades insertades a Supabase!");
  } else {
    Serial.printf("  ✗ Error Supabase: %d\n", code);
    String resp = http.getString();
    Serial.printf("  Resposta: %s\n", resp.c_str());
  }

  http.end();
}

// ============================================================
//  SETUP
// ============================================================

void setup() {
  Serial.begin(115200);
  delay(2000);

  Serial.println("\n╔══════════════════════════════════════╗");
  Serial.println("║  HORT CASTEVELL — Central (Supabase) ║");
  Serial.println("╚══════════════════════════════════════╝\n");

  for (int i = 0; i < MAX_NODES; i++) {
    nodes[i].active = false;
    nodes[i].lastSeen = 0;
  }

  // WiFi
  WiFi.mode(WIFI_STA);
  connectWiFi();

  // Imprimir MAC
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
  Serial.println("✓ ESP-NOW inicialitzat — esperant nodes...");
  Serial.println("\n🌱 Central llesta!\n");
}

// ============================================================
//  LOOP
// ============================================================

void loop() {
  unsigned long now = millis();

  // Reconnectar WiFi
  if (WiFi.status() != WL_CONNECTED) {
    wifiConnected = false;
    if (now - lastWiFiRetry >= WIFI_RETRY_MS) {
      connectWiFi();
      lastWiFiRetry = now;
    }
  }

  // Pujar dades si hi ha noves
  if (newDataAvailable && (now - lastUpload >= UPLOAD_INTERVAL_MS)) {
    uploadData();
    lastUpload = now;
    newDataAvailable = false;
  }

  delay(100);
}
