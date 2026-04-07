/*
 * ============================================================
 *  HORT INTEL·LIGENT CASTEVELL — Node Sensor
 * ============================================================
 *  ESP32 + Sensor Humitat Capacitatiu + ESP-NOW + Deep Sleep
 *
 *  Funcionament:
 *    1. Desperta del deep sleep
 *    2. Llegeix el sensor d'humitat capacitatiu (ADC)
 *    3. Envia la lectura per ESP-NOW a la central
 *    4. Torna a dormir 30 minuts
 *
 *  Connexions:
 *    Sensor capacitatiu AOUT → GPIO 34 (ADC1_CH6)
 *    Sensor capacitatiu VCC  → 3.3V
 *    Sensor capacitatiu GND  → GND
 *
 *  Alimentació: 2× 18650 en paral·lel (~5000mAh)
 *  Autonomia estimada: 4-6 mesos amb deep sleep
 * ============================================================
 */

#include <esp_now.h>
#include <WiFi.h>
#include <esp_sleep.h>
#include <esp_wifi.h>

// ============================================================
//  CONFIGURACIÓ — MODIFICA AQUÍ
// ============================================================

// ID del node (canvia per cada node: 1, 2, 3, 4)
#define NODE_ID 1

// Pin del sensor d'humitat capacitatiu
#define SENSOR_PIN 34

// MAC address de l'ESP32 central (es descobreix amb el sketch de la central)
// Substitueix amb la MAC real del teu ESP32 central
uint8_t centralMAC[] = { 0xD4, 0xE9, 0xF4, 0xE6, 0x28, 0xE8 };

// Temps de deep sleep en minuts
#define SLEEP_MINUTES 30

// Calibració del sensor capacitatiu (ajustar per la terra de Castevell)
// Valor ADC amb el sensor a l'aire (sec) — típicament ~3200-3500
#define SENSOR_AIR_VALUE 2622
// Valor ADC amb el sensor en aigua (mullat) — calibrat amb got d'aigua
#define SENSOR_WATER_VALUE 1074

// Canal WiFi fix (ha de coincidir amb la central)
#define WIFI_CHANNEL 11

// ============================================================
//  ESTRUCTURA DE DADES
// ============================================================

// Paquet que s'envia per ESP-NOW
typedef struct {
  uint8_t  nodeId;         // ID del node (1-4)
  uint16_t humidityRaw;    // Valor ADC cru del sensor
  uint8_t  humidityPct;    // Humitat en % (0=sec, 100=mullat)
  float    batteryVoltage; // Voltatge bateria (V)
  uint32_t bootCount;      // Comptador d'arrencades
} SensorData;

SensorData sensorData;

// Comptador d'arrencades (es manté durant deep sleep)
RTC_DATA_ATTR uint32_t bootCount = 0;

// ============================================================
//  LECTURA BATERIA
// ============================================================

// Divisor de tensió: 100K + 100K entre bateria i GND
// Punt mig → GPIO 35
// Si no tens divisor, posa 0.0 i ignora el valor
#define BATTERY_PIN 35
#define BATTERY_DIVIDER_RATIO 2.0  // Ratio del divisor de tensió

float readBattery() {
  // Si no hi ha divisor de tensió connectat, retorna 0
  #ifndef BATTERY_PIN
    return 0.0;
  #endif

  int raw = analogRead(BATTERY_PIN);
  // ESP32 ADC: 0-4095 = 0-3.3V (amb atenuació 11dB per defecte)
  float voltage = (raw / 4095.0) * 3.3 * BATTERY_DIVIDER_RATIO;
  return voltage;
}

// ============================================================
//  LECTURA SENSOR HUMITAT
// ============================================================

uint16_t readHumidityRaw() {
  // Fem 10 lectures i fem mitjana per estabilitat
  uint32_t sum = 0;
  for (int i = 0; i < 10; i++) {
    sum += analogRead(SENSOR_PIN);
    delay(10);
  }
  return (uint16_t)(sum / 10);
}

uint8_t rawToPercent(uint16_t raw) {
  // Converteix el valor ADC a percentatge (0-100%)
  // IMPORTANT: El sensor capacitatiu dóna valor BAIX quan mullat i ALT quan sec
  if (raw >= SENSOR_AIR_VALUE) return 0;
  if (raw <= SENSOR_WATER_VALUE) return 100;

  float pct = 100.0 * (SENSOR_AIR_VALUE - raw) / (SENSOR_AIR_VALUE - SENSOR_WATER_VALUE);
  return (uint8_t)constrain(pct, 0, 100);
}

// ============================================================
//  ESP-NOW CALLBACK
// ============================================================

bool sendSuccess = false;

void onDataSent(const wifi_tx_info_t *info, esp_now_send_status_t status) {
  sendSuccess = (status == ESP_NOW_SEND_SUCCESS);
  Serial.printf("  ESP-NOW enviament: %s\n", sendSuccess ? "OK ✓" : "ERROR ✗");
}

// ============================================================
//  SETUP — S'EXECUTA CADA COP QUE DESPERTA
// ============================================================

void setup() {
  Serial.begin(115200);
  delay(2000);  // Esperar que el Serial Monitor es connecti
  bootCount++;

  Serial.println("\n========================================");
  Serial.printf("  HORT CASTEVELL — Node F%d\n", NODE_ID);
  Serial.printf("  Arrencada #%d\n", bootCount);
  Serial.println("========================================\n");

  // --- 1. Llegir sensors ---
  sensorData.nodeId = NODE_ID;
  sensorData.humidityRaw = readHumidityRaw();
  sensorData.humidityPct = rawToPercent(sensorData.humidityRaw);
  sensorData.batteryVoltage = readBattery();
  sensorData.bootCount = bootCount;

  Serial.printf("  Humitat terra:  %d%% (raw: %d)\n",
                sensorData.humidityPct, sensorData.humidityRaw);
  Serial.printf("  Bateria:        %.2fV\n", sensorData.batteryVoltage);

  // --- 2. Configurar WiFi en mode STA per ESP-NOW ---
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();

  // Fixar canal WiFi (ha de coincidir amb la central)
  esp_wifi_set_channel(WIFI_CHANNEL, WIFI_SECOND_CHAN_NONE);

  // --- 3. Inicialitzar ESP-NOW ---
  if (esp_now_init() != ESP_OK) {
    Serial.println("  ERROR: No s'ha pogut iniciar ESP-NOW");
    goToSleep();
    return;
  }

  esp_now_register_send_cb(onDataSent);

  // Registrar la central com a peer
  esp_now_peer_info_t peerInfo = {};
  memcpy(peerInfo.peer_addr, centralMAC, 6);
  peerInfo.channel = WIFI_CHANNEL;
  peerInfo.encrypt = false;

  if (esp_now_add_peer(&peerInfo) != ESP_OK) {
    Serial.println("  ERROR: No s'ha pogut afegir el peer central");
    goToSleep();
    return;
  }

  // --- 4. Enviar dades ---
  Serial.println("  Enviant dades per ESP-NOW...");
  esp_err_t result = esp_now_send(centralMAC, (uint8_t *)&sensorData, sizeof(sensorData));

  if (result != ESP_OK) {
    Serial.println("  ERROR: Fallada a l'enviar");
  }

  // Esperar callback (màxim 500ms)
  unsigned long start = millis();
  while (!sendSuccess && (millis() - start < 500)) {
    delay(10);
  }

  // --- 5. Dormir ---
  goToSleep();
}

// ============================================================
//  DEEP SLEEP
// ============================================================

void goToSleep() {
  Serial.printf("\n  💤 Dormint %d minuts...\n\n", SLEEP_MINUTES);

  // Desactivar WiFi i Bluetooth per estalviar
  esp_wifi_stop();
  esp_now_deinit();

  // Configurar temps de deep sleep
  esp_sleep_enable_timer_wakeup((uint64_t)SLEEP_MINUTES * 60ULL * 1000000ULL);

  // Bona nit!
  esp_deep_sleep_start();
}

// ============================================================
//  LOOP — Mai s'executa (deep sleep reinicia el setup)
// ============================================================

void loop() {
  // No s'arriba mai aquí perquè el deep sleep reinicia el chip
}
