#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

#define DHTPIN 4
#define DHTTYPE DHT22
DHT dht(DHTPIN,DHTTYPE);

const char* WIFI_SSID = "YOUR_WIFI";
const char* WIFI_PASSWORD = "YOUR_PASSWORD";
const char* API_URL = "http://192.168.1.100:5000/api/sensors/ingest";
const char* DEVICE_CODE = "ESP32-ROOM-01";
const char* TRAY_CODE = "TRAY-A101";

void setup(){
  Serial.begin(115200);
  dht.begin();
  WiFi.begin(WIFI_SSID,WIFI_PASSWORD);
  while(WiFi.status()!=WL_CONNECTED){delay(500);Serial.print(".");}
  Serial.println("\nWiFi connected");
}

void loop(){
  float temperature=dht.readTemperature();
  float humidity=dht.readHumidity();
  float co2=640; // Replace with real CO2 sensor reading

  if(WiFi.status()==WL_CONNECTED && !isnan(temperature) && !isnan(humidity)){
    HTTPClient http;
    http.begin(API_URL);
    http.addHeader("Content-Type","application/json");
    JsonDocument doc;
    doc["deviceCode"]=DEVICE_CODE;
    doc["trayCode"]=TRAY_CODE;
    doc["temperature"]=temperature;
    doc["humidity"]=humidity;
    doc["co2"]=co2;
    String body; serializeJson(doc,body);
    int code=http.POST(body);
    Serial.printf("API status: %d\n",code);
    http.end();
  }
  delay(5000);
}
