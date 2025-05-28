#include "EspActuator.hpp"

 EspActuator* espActuator = new EspActuator(25, "Matheo", "cg4hts55fh4fyr7",
        "a2rmxu7hc5rdsd-ats.iot.us-east-2.amazonaws.com", 8883,
        "$aws/things/securitySystem/shadow/update", 
        "$aws/things/securitySystem/shadow/update/delta","ESP_CLIENT_Actuator");

void setup() {
    espActuator->setup();
}
void loop() {
    espActuator->loop();
}