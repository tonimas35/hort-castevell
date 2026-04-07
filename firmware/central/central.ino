/*
 * ============================================================
 *  HORT INTEL·LIGENT CASTEVELL — Unitat Central (WiFi + Supabase)
 * ============================================================
 *  ESP32 + ESP-NOW Receiver + DHT22 + WiFi → Supabase PostgreSQL
 *
 *  Connexions:
 *    DHT22 DATA → GPIO 4 (amb resistència pull-up 10K a 3.3V)
 *    DHT22 VCC  → 3.3V
 *    DHT22 GND  → GND
 *
 *    (Futur) Relé IN1 → GPIO 25
 * ============================================================
 */

#include <esp_now.h>
#include <WiFi.h>
#include <esp_wifi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <DHT.h>

// ============================================================
//  CONFIGURACIÓ — MODIFICA AQUÍ
// ============================================================

// --- Credencials (fitxer secrets.h, NO es puja a GitHub) ---
#include "secrets.h"

const char* WIFI_SSID     = SECRET_WIFI_SSID;
const char* WIFI_PASSWORD = SECRET_WIFI_PASSWORD;

// --- Supabase ---
const char* SUPABASE_URL = "https://jraxezlqdhwmxnzcrgcg.supabase.co";
const char* SUPABASE_KEY = SECRET_SUPABASE_KEY;

// --- DHT22 ---
#define DHT_PIN 4
#define DHT_TYPE DHT22
DHT dht(DHT_PIN, DHT_TYPE);

// --- ESP-NOW ---
#define MAX_NODES 4

// --- Intervals ---
#define UPLOAD_INTERVAL_MS  60000   // Puja dades cada 60s
#define AMBIENT_READ_MS     30000   // Llegeix DHT22 cada 30s
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

// Ambient
float ambientTemp = NAN;
float ambientHumidity = NAN;
float luxLevel = NAN;

// Estat
unsigned long lastUpload = 0;
unsigned long lastAmbientRead = 0;
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
//  SENSORS AMBIENTALS
// ============================================================

void readAmbientSensors() {
  float t = dht.readTemperature();
  float h = dht.readHumidity();

  if (!isnan(t)) {
    ambientTemp = t;
  }
  if (!isnan(h)) {
    ambientHumidity = h;
  }

  if (!isnan(t) || !isnan(h)) {
    Serial.printf("🌡 Ambient: %.1f°C  💧 %.1f%%\n", ambientTemp, ambientHumidity);
    // Tenim noves dades ambientals — marcar per pujar
    newDataAvailable = true;
  } else {
    Serial.println("⚠ DHT22: error de lectura");
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
//  SUPABASE — INSERT
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
  }

  // Serialitzar
  JsonDocument postDoc;
  postDoc["timestamp"] = (unsigned long)now;
  postDoc["ambient"] = doc["ambient"];
  postDoc["nodes"] = doc["nodes"];

  String postBody;
  serializeJson(postDoc, postBody);
  Serial.printf("  JSON: %s\n", postBody.c_str());

  // HTTP POST
  HTTPClient http;
  String url = String(SUPABASE_URL) + "/rest/v1/readings";

  http.begin(url);
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Prefer", "return=minimal");

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

  // DHT22
  dht.begin();
  Serial.println("✓ DHT22 inicialitzat (GPIO 4)");

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

  // Primera lectura ambient
  readAmbientSensors();

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

  // Llegir sensors ambientals cada 30s
  if (now - lastAmbientRead >= AMBIENT_READ_MS) {
    readAmbientSensors();
    lastAmbientRead = now;
  }

  // Pujar dades si hi ha noves
  if (newDataAvailable && (now - lastUpload >= UPLOAD_INTERVAL_MS)) {
    uploadData();
    lastUpload = now;
    newDataAvailable = false;
  }

  delay(100);
}
