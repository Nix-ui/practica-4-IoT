#pragma once
#include "Mqtt.hpp"
#include "MagneticSensor.hpp"
#include "ArduinoJson.h"

class EspSensor {
    private:
        MagneticSensor* doorSensor;
        MqttClient* mqtt;
        NetworkConfig* networkConfig;
        NetworkHandler* net;
        MqttConfig* mqttConfig;
        static EspSensor* instance;
        const char* publishTopic;
        const char* subscribeTopic;
    public:
        EspSensor(int sensorPin, const char* ssid, const char* password, const char* server, int port, const char* publishTopic, const char* subscribeTopic, const char* clientId) {
            instance = this;
            this->publishTopic = publishTopic;
            this->subscribeTopic = subscribeTopic;
            networkConfig = new NetworkConfig(ssid, password);
            net = new NetworkHandler(networkConfig);
            doorSensor = new MagneticSensor(sensorPin);
            mqttConfig = new MqttConfig(server, clientId, 
                [](char* topic, uint8_t* payload, unsigned int length) {
                    Serial.print("Mensaje recibido [");
                    Serial.print(topic);
                    Serial.print("]: ");
                    Serial.println((char)payload[0]);
                }
                , port);
            mqtt = new MqttClient( mqttConfig,net);
        }
        void setup() {
            Serial.begin(115200);
            doorSensor->begin();
            mqtt->initialize();
            JsonDocument doc;
            doc["state"]["reported"]["exteriorDoor"] = doorSensor->getLastState() ?  "close":"open" ;
            doc["state"]["reported"]["deviceStatus"] = "connected";
            mqtt->publish(publishTopic, doc.as<String>().c_str());
            mqtt->subscribe(subscribeTopic);
        }
        void loop() {
            mqtt->loop();
            if (doorSensor->hasStateChanged()) {
                JsonDocument doc;
                doc["state"]["reported"]["exteriorDoor"] = doorSensor->getLastState() ?  "close":"open" ;
                mqtt->publish(publishTopic, doc.as<String>().c_str());
            }
        }
};
EspSensor* EspSensor::instance = nullptr;

