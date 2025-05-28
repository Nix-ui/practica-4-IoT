#pragma once
#include <Arduino.h>

class MagneticSensor {
  private:
    int pin;
    bool lastState;

  public:
    MagneticSensor(int pin){
        this->pin = pin;
        this->lastState = false;
    };
    void begin(){
        pinMode(pin, INPUT_PULLUP);           // Reed switch normalmente cerrado
        lastState = !digitalRead(pin);
    };
    bool isOpen(){
        return digitalRead(pin) == LOW;
    };             // Devuelve true si la puerta está abierta
    bool hasStateChanged(){
        bool currentState = isOpen();
        if (currentState != lastState) {
            lastState = currentState;
            return true;
        }
        return false;
    };    // Detecta si el estado cambió desde la última lectura
    bool getLastState(){
        return lastState;
    };       // Último estado leído
};
