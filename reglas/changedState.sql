-- Description:
-- This rule triggers only when the security system is activated(armed) 
--and when the state of the exterior or/and inner Door connected to smart thing
--changes and register that one on dynamodb table with the current state 
-- and the date and time.

SELECT topic(3) as thingName,
    current.state.reported.interiorDoor as currentInteriorDoor, 
    current.state.reported.exteriorDoor as currentExteriorDoor,
    current.state.reported.securitySystem as currentSecuritySystem
FROM '$aws/things/+/shadow/update/documents' 
    WHERE (current.state.reported.interiorDoor <> previous.state.reported.interiorDoor 
    OR current.state.reported.exteriorDoor <> previous.state.reported.exteriorDoor)
    AND current.state.reported.securitySystem = 'armed'
    AND current.state.reported.deviceStatus = 'connected'