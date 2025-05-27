--Description:
--this role triggers when the smart thing(esp32) connects to the mqtt broker for
--first time to register in dynamodb
SELECT topic(3) AS thingName, 
    state.reported.interiorDoor as currentInteriorDoor, 
    state.reported.exteriorDoor as currentExteriorDoor, 
    state.reported.securitySystem as currentSecuritySystem 
FROM '$aws/things/+/shadow/update' 
    WHERE state.reported.deviceStatus = 'connected'