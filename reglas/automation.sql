-- Description:
-- This rule triggers only when the security system is activated(armed)
--and when the state of the exterior Door connected to smart thing
--changes to open and the inner Door is closed, send the payload to
--lamda function to desire open the inner Door.

SELECT {"state":{"desired":{"interiorDoor":"close"}}} AS payload,
    topic(3) AS thingName
FROM '$aws/things/+/shadow/update/documents'
    WHERE current.state.reported.exteriorDoor = 'open'
    AND current.state.reported.securitySystem = 'armed'
    AND current.state.reported.interiorDoor <> 'close'