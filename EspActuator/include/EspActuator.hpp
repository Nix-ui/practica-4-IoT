#pragma once
#include "Mqtt.hpp"
#include "ServoController.hpp"
#include <ArduinoJson.h>

class EspActuator {
private:
    ServoController* servoController;
    MqttClient* mqtt;
    NetworkConfig* networkConfig;
    NetworkHandler* net;
    MqttConfig* mqttConfig;
    static EspActuator* instance;
    const char* publishTopic;
    const char* subscribeTopic;
    static void mqttCallback(char* topic, uint8_t* payload, unsigned int length) {
        if (instance) instance->handleMessage(topic, payload, length);
    }

    void handleMessage(char* topic, uint8_t* payload, unsigned int length) {
        Serial.print("Mensaje recibido [");
        Serial.print(topic);
        Serial.print("]: ");        
        Serial.println();
        JsonDocument doc;
        DeserializationError error = deserializeJson(doc, payload);
        if (error) {
            Serial.print("Error parseando JSON: ");
            Serial.println(error.c_str());
            return;
        }
        const char* doorState = doc["state"]["interiorDoor"];  
        if (strcmp(doorState, "open") == 0) {
            servoController->open();
        } else if (strcmp(doorState, "close") == 0) {
            servoController->close();
        }
        JsonDocument responseDoc;
        responseDoc["state"]["reported"]["interiorDoor"] = doorState;
        mqtt->publish(publishTopic, responseDoc.as<String>().c_str());
    }

public:
    EspActuator(byte actuatorPin, const char* ssid, const char* password, const char* server, int port,
                   const char* publishTopic, const char* subscribeTopic, const char* clientId) {
        instance = this;
        networkConfig = new NetworkConfig(ssid, password);
        net = new NetworkHandler(networkConfig);
        servoController = new ServoController(actuatorPin);
        mqttConfig = new MqttConfig(server, clientId, &mqttCallback, port);
        mqtt = new MqttClient(mqttConfig,net);
        this->publishTopic = publishTopic;
        this->subscribeTopic = subscribeTopic;
    }

    void setup() {
        Serial.begin(115200);
        mqtt->initialize();
        mqtt->subscribe(subscribeTopic);
        servoController->begin();
        JsonDocument doc;
        doc["state"]["reported"]["interiorDoor"] = servoController->getState() ? "close" : "open";
        doc["state"]["reported"]["deviceStatus"] = "connected";
        mqtt->publish(publishTopic, doc.as<String>().c_str());
    }

    void loop() {
        if(!mqtt->connected()){
            mqtt->reconnect();
            mqtt->subscribe(subscribeTopic);
        }
        mqtt->loop();
    }
};

EspActuator* EspActuator::instance = nullptr;