#pragma once
#include <ESP32Servo.h>

class ServoController {
  private:
    int pin;
    Servo servo;
    bool isClosed;

  public:
    ServoController(int pin){
        this->pin = pin;
        this->isClosed = false;
    };
    void begin(){
        servo.setPeriodHertz(50);                
        servo.attach(pin, 500, 2400);            
        open();
    };
    void open(){
        servo.write(0);                          
        isClosed = false;
    };
    void close(){
        servo.write(90);                         
        isClosed = true;
    };
    bool getState() const{
        return isClosed;
    };
};