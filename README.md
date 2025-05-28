# Practica 4

## Codigo
1. ### Lambda Backend Alexa
    * **Handlers**
      * #### LaunchRequestHandler
        * **Descripcion:**  Handler usado para  la invocacion del skill correspondiente 
        * **Codigo**
          * ```javascript
              const LaunchRequestHandler = {
                canHandle(handlerInput) {
                    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
                },
                handle(handlerInput) {
                    const speakOutput = 'Bienvenido a tu objeto inteligente, 
                    tienes las opciones de encender, apagar y consultar el estado, ¿Qué deseas hacer?';

                    return handlerInput.responseBuilder
                        .speak(speakOutput)
                        .reprompt(speakOutput)
                        .getResponse();
                }
            };
            ```
      * #### StateExteriorDoorHandler
        * **Descripcion:** Handelr encargado de obtener el ultimo estado de la puerta exterior del objeto inteligente haciendo uso de dynamoDB
        * **Codigo**
          * ```javascript
              const StateExteriorDoorHandler = {
                canHandle(handlerInput) {
                    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
                        && Alexa.getIntentName(handlerInput.requestEnvelope) === 'StateExteriorDoorIntent';
                },
                async handle(handlerInput) {
                    const userId = Alexa.getUserId(handlerInput.requestEnvelope);
                    const thingName = await getThingNameForUser(userId);

                    let speakOutput = "No pude encontrar un dispositivo vinculado a tu cuenta para consultar. Por favor, asegúrate de vincularlo primero.";
                    if (thingName) {
                        try {
                            const data = await ddb.get({
                                TableName: THINGS_STATE_TABLE_NAME,
                                Key: { 'thingName': thingName }
                            }).promise();

                            if (data.Item && data.Item.exteriorDoor) {
                                const exteriorDoor = data.Item.exteriorDoor;
                                const stateDoor = exteriorDoor === "open" ? "Abierta" : "Cerrada";
                                speakOutput = `La puerta exterior de tu dispositivo ${thingName} está ${stateDoor}.`;
                            } else {
                                speakOutput = `No tengo información de estado para la puerta exterior de tu dispositivo ${thingName}.`;
                            }
                        } catch (error) {
                            console.error("Error en StateExteriorDoorHandler al obtener estado de DynamoDB:", error);
                            speakOutput = 'Hubo un problema al consultar la puerta exterior. Por favor, inténtalo de nuevo.';
                        }
                    }
                    return handlerInput.responseBuilder
                        .speak(speakOutput)
                        .reprompt(speakOutput)
                        .getResponse();
                }
            };
            ```
      * #### OpenInteriorDoorIntentHandler
        * **Descripcion:** Handler encargado de modificar el estado de la puerta interior haciendo uso del shadow haciendo un desired a la puerta interior para abrirla
        * **Codigo**
          * ```javascript
              const OpenInteriorDoorIntentHandler = {
                canHandle(handlerInput) {
                    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
                        && Alexa.getIntentName(handlerInput.requestEnvelope) === 'OpenInteriorDoorIntent';
                },
                async handle(handlerInput) {
                    const userId = Alexa.getUserId(handlerInput.requestEnvelope);
                    const thingName = await getThingNameForUser(userId);

                    let speakOutput = "No pude encontrar un dispositivo vinculado a tu cuenta para abrir la puerta interior. Por favor, asegúrate de vincularlo primero.";
                    if (thingName) {
                        try {
                            const OpenInteriorDoorParams = {
                                thingName: thingName,
                                payload: '{"state": {"desired": {"interiorDoor": "open"}}}',
                            };
                            await IotData.updateThingShadow(OpenInteriorDoorParams).promise();
                            speakOutput = `Solicitaste abrir la puerta interior de tu dispositivo ${thingName}. El dispositivo debería actualizar su estado pronto.`;
                        } catch (err) {
                            console.error("Error al actualizar shadow para abrir puerta interior:", err);
                            speakOutput = 'Hubo un problema al intentar abrir la puerta interior. Por favor, inténtalo de nuevo.';
                        }
                    }
                    return handlerInput.responseBuilder
                        .speak(speakOutput)
                        .reprompt(speakOutput)
                        .getResponse();
                }
            };
            ```
      * #### CloseInteriorDoorIntentHandler
        * **Descripcion:** Handler encargado de modificar el estado de la puerta interior haciendo uso del shadow haciendo un desired a la puerta interior para abrirla
        * **Codigo**
          * ```javascript
               const CloseInteriorDoorIntentHandler = {
                canHandle(handlerInput) {
                    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
                        && Alexa.getIntentName(handlerInput.requestEnvelope) === 'CloseInteriorDoorIntent';
                },
                async handle(handlerInput) {
                    const userId = Alexa.getUserId(handlerInput.requestEnvelope);
                    const thingName = await getThingNameForUser(userId);

                    let speakOutput = "No pude encontrar un dispositivo vinculado a tu cuenta para cerrar la puerta interior. Por favor, asegúrate de vincularlo primero.";
                    if (thingName) {
                        try {
                            const CloseInteriorDoorParams = {
                                thingName: thingName,
                                payload: '{"state": {"desired": {"interiorDoor": "close"}}}',
                            };
                            await IotData.updateThingShadow(CloseInteriorDoorParams).promise();
                            speakOutput = `Solicitaste cerrar la puerta interior de tu dispositivo ${thingName}. El dispositivo debería actualizar su estado pronto.`;
                        } catch (err) {
                            console.error("Error al actualizar shadow para cerrar puerta interior:", err);
                            speakOutput = 'Hubo un problema al intentar cerrar la puerta interior. Por favor, inténtalo de nuevo.';
                        }
                    }
                    return handlerInput.responseBuilder
                        .speak(speakOutput)
                        .reprompt(speakOutput)
                        .getResponse();
                }
            };
            ```
      * #### StateInteriorDoorHandler
        * **Descripcion:** Handelr encargado de obtener el ultimo estado de la puerta interior del objeto inteligente haciendo uso de dynamoDB
        * **Codigo**
          * ```javascript
              const StateInteriorDoorHandler = {
                canHandle(handlerInput) {
                    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
                        && Alexa.getIntentName(handlerInput.requestEnvelope) === 'StateInteriorDoorIntent';
                },
                async handle(handlerInput) {
                    const userId = Alexa.getUserId(handlerInput.requestEnvelope);
                    const thingName = await getThingNameForUser(userId);

                    let speakOutput = "No pude encontrar un dispositivo vinculado a tu cuenta para consultar. Por favor, asegúrate de vincularlo primero.";
                    if (thingName) {
                        try {
                            const data = await ddb.get({
                                TableName: THINGS_STATE_TABLE_NAME,
                                Key: { 'thingName': thingName }
                            }).promise();

                            if (data.Item && data.Item.interiorDoor) {
                                const interiorDoor = data.Item.interiorDoor;
                                const stateDoor = interiorDoor === "open" ? "Abierta" : "Cerrada";
                                speakOutput = `La puerta interior de tu dispositivo ${thingName} está ${stateDoor}.`;
                            } else {
                                speakOutput = `No tengo información de estado para la puerta interior de tu dispositivo ${thingName}.`;
                            }
                        } catch (error) {
                            console.error("Error en StateInteriorDoorHandler al obtener estado de DynamoDB:", error);
                            speakOutput = 'Hubo un problema al consultar la puerta interior. Por favor, inténtalo de nuevo.';
                        }
                    }
                    return handlerInput.responseBuilder
                        .speak(speakOutput)
                        .reprompt(speakOutput)
                        .getResponse();
                }
            };
            ```
      * #### ActivateSecuritySystemIntentHandler
        * **Descripcion:** Handler encargado de modificar el estado del shadow del dispositivo inteligente permitiendo al sitema de seguridad ser activado
        * **Codigo**
          * ```javascript
              const ActivateSecuritySystemIntentHandler = {
                canHandle(handlerInput) {
                    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
                        && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ActivateSecuritySystemIntent';
                },
                async handle(handlerInput) {
                    const userId = Alexa.getUserId(handlerInput.requestEnvelope);
                    const thingName = await getThingNameForUser(userId);

                    let speakOutput = "No pude encontrar un dispositivo vinculado a tu cuenta para activar el sistema de seguridad. Por favor, asegúrate de vincularlo primero.";
                    if (thingName) {
                        try {
                            const ActivateSecuritySystemParams = {
                                thingName: thingName,
                                payload: '{"state": {"reported": {"securitySystem": "armed"}}}',
                            };
                            await IotData.updateThingShadow(ActivateSecuritySystemParams).promise();
                            speakOutput = `activaste el sistema de seguridad de tu dispositivo ${thingName}.`;
                        } catch (err) {
                            console.error("Error al actualizar shadow para activar sistema de seguridad:", err);
                            speakOutput = 'Hubo un problema al intentar activar el sistema de seguridad. Por favor, inténtalo de nuevo.';
                        }
                    }
                    return handlerInput.responseBuilder
                        .speak(speakOutput)
                        .reprompt(speakOutput)
                        .getResponse();
                }
            };
            ```
      * #### DeactivateSecuritySystemIntentHandler
        * **Descripcion:** Handler encargado de modificar el estado del shadow del dispositivo inteligente permitiendo al sitema de seguridad ser desactivado
        * **Codigo**
          * ```javascript
                const DeactivateSecuritySystemIntentHandler = {
                canHandle(handlerInput) {
                    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
                        && Alexa.getIntentName(handlerInput.requestEnvelope) === 'DeactivateSecuritySystemIntent';
                },
                async handle(handlerInput) {
                    const userId = Alexa.getUserId(handlerInput.requestEnvelope);
                    const thingName = await getThingNameForUser(userId);

                    let speakOutput = "No pude encontrar un dispositivo vinculado a tu cuenta para desactivar el sistema de seguridad. Por favor, asegúrate de vincularlo primero.";
                    if (thingName) {
                        try {
                            const DeactivateSecuritySystemParams = {
                                thingName: thingName,
                                payload: '{"state": {"reported": {"securitySystem": "disarmed"}}}'
                            };
                            await IotData.updateThingShadow(DeactivateSecuritySystemParams).promise();
                            speakOutput = `desactivaste el sistema de seguridad de tu dispositivo ${thingName}.`;
                        } catch (err) {
                            console.error("Error al actualizar shadow para desactivar sistema de seguridad:", err);
                            speakOutput = 'Hubo un problema al intentar desactivar el sistema de seguridad. Por favor, inténtalo de nuevo.';
                        }
                    }
                    return handlerInput.responseBuilder
                        .speak(speakOutput)
                        .reprompt(speakOutput)
                        .getResponse();
                }
            };
            ```
      * #### LinkThingToUserIntentHandler
        * **Descripcion:** Handler encargado de enlazar un smart thing a la cuenta del usuario haciendo uso de dynamoDB
        * **Codigo**
          * ```javascript
                const LinkThingToUserIntentHandler = {
                canHandle(handlerInput) {
                    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
                        && Alexa.getIntentName(handlerInput.requestEnvelope) === 'LinkThingToUserIntent';
                },
                async handle(handlerInput) {
                    const userId = Alexa.getUserId(handlerInput.requestEnvelope);
                    console.log("DEBUG: --- INICIO LinkThingToUserIntentHandler ---");
                    console.log("DEBUG: userId:", userId);

                    const slots = handlerInput.requestEnvelope.request.intent.slots;
                    const thingNameSlot = slots.ThingNameSlot;

                    let rawThingName = thingNameSlot && thingNameSlot.value ? thingNameSlot.value : null;

                    if (!rawThingName || rawThingName.trim() === '') {
                        const speakOutput = '<speak>No pude identificar el nombre del dispositivo que deseas vincular. Por favor, menciona el nombre del dispositivo que deseas vincular. Si no lo sabes, puedes decir "Alexa, descubre mis dispositivos" para ver la lista.</speak>';
                        console.log("DEBUG: thingName vacío o nulo.");
                        return handlerInput.responseBuilder.speak(speakOutput).reprompt(speakOutput).getResponse();
                    }
                    const standardizedThingName = rawThingName.trim().toLowerCase().replace(/ /g, '_');
                    console.log(`DEBUG: thingName recibido del slot: '${rawThingName}'`);
                    console.log(`DEBUG: thingName estandarizado para guardar: '${standardizedThingName}'`);

                    const params = {
                        TableName: USERS_TABLE_NAME,
                        Item: {
                            'userId': userId,
                            'thingName': standardizedThingName,
                            'lastLinked': DateTime.local().setZone('America/La_Paz').toFormat("yyyy-MM-dd'T'HH:mm:ssZZ")
                        }
                    };

                    let speakOutput;
                    try {
                        await ddb.put(params).promise();
                        speakOutput = `<speak>He vinculado el dispositivo <say-as interpret-as="spell-out">${standardizedThingName.replace(/_/g, ' ')}</say-as> con tu cuenta.</speak>`;
                        console.log(`INFO: Dispositivo ${standardizedThingName} vinculado con éxito para userId ${userId}.`);
                    } catch (error) {
                        console.error("ERROR: Error al guardar en DynamoDB (LinkThingToUserIntentHandler):", error);
                        speakOutput = '<speak>Hubo un problema al vincular el dispositivo con tu cuenta. Por favor, inténtalo de nuevo.</speak>';
                    }

                    return handlerInput.responseBuilder
                        .speak(speakOutput)
                        .reprompt(speakOutput)
                        .getResponse();
                }
            };
            ```
      * #### DiscoverDevicesIntentHandler
        * **Descripcion:** Handler encargado de  listar todos los objetos del IoT Core que no esten enlazados al usuario
        * **Codigo**
          * ```javascript
                const DiscoverDevicesIntentHandler = {
                canHandle(handlerInput) {
                    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
                        && Alexa.getIntentName(handlerInput.requestEnvelope) === 'DiscoverDevicesIntent';
                },
                async handle(handlerInput) {
                    let speakOutput = "No pude encontrar ningún dispositivo IoT en tu cuenta. Asegúrate de que estén registrados en AWS IoT.";
                    try {
                        const data = await iot.listThings().promise();

                        console.log("Response from iot.listThings():", JSON.stringify(data, null, 2));

                        if (data.things && data.things.length > 0) {
                            const thingNames = data.things.map(thing => thing.thingName);
                            if (thingNames.length > 1) {
                                speakOutput = `He encontrado los siguientes dispositivos: ${thingNames.slice(0, -1).join(', ')} y ${thingNames[thingNames.length - 1]}. ¿Cuál te gustaría vincular?`;
                            } else {
                                speakOutput = `He encontrado el dispositivo: ${thingNames[0]}. ¿Te gustaría vincularlo?`;
                            }
                        } else {
                            speakOutput = "No he encontrado ningún dispositivo IoT registrado en tu cuenta.";
                        }

                    } catch (error) {
                        console.error("Error in DiscoverDevicesIntentHandler al listar things:", error);
                        console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
                        speakOutput = 'Hubo un problema al intentar descubrir tus dispositivos. Por favor, inténtalo de nuevo.';
                    }

                    return handlerInput.responseBuilder
                        .speak(speakOutput)
                        .reprompt(speakOutput)
                        .getResponse();
                }
            };
            ```
        * #### ListMyDevicesIntentHandler
          * **Descripcion:** Handler encargado de listar todos los dispositivos o smart things asociados al usuario  obteniendolos de dynamoDB
          * **Codigo**
            * ```javascript
                const ListMyDevicesIntentHandler = {
                    canHandle(handlerInput) {
                        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
                            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ListMyDevicesIntent';
                    },
                    async handle(handlerInput) {
                        const userId = Alexa.getUserId(handlerInput.requestEnvelope);
                        console.log("DEBUG: --- INICIO ListMyDevicesIntentHandler ---");
                        console.log("DEBUG: userId obtenido de Alexa:", userId);

                        let speakOutput = "<speak>No he encontrado ningún dispositivo vinculado a tu cuenta. Di 'Alexa, vincula mi dispositivo' para empezar.</speak>";

                        try {
                            console.log("DEBUG: Intentando consultar USERS_TABLE_NAME:", USERS_TABLE_NAME);
                            console.log("DEBUG: Con userId para query en IoTThingUsers:", userId);

                            const userDevices = await ddb.query({
                                TableName: USERS_TABLE_NAME,
                                KeyConditionExpression: 'userId = :uId',
                                ExpressionAttributeValues: { ':uId': userId }
                            }).promise();

                            console.log("DEBUG: Respuesta de ddb.query (userDevices - IoTThingUsers):", JSON.stringify(userDevices, null, 2));

                            if (!userDevices.Items || userDevices.Items.length === 0) {
                                console.log("DEBUG: No se encontraron dispositivos vinculados para este usuario en IoTThingUsers.");
                                return handlerInput.responseBuilder.speak(speakOutput).reprompt(speakOutput).getResponse();
                            }

                            const thingNames = userDevices.Items.map(item => item.thingName);
                            console.log("DEBUG: thingNames vinculados al usuario (desde IoTThingUsers):", thingNames);

                            let devicePhrases = [];

                            for (const thingNameFromUserTable of thingNames) {
                                    const thingNameForGSIQuery = thingNameFromUserTable.replace(/ /g, '_');

                                console.log(`DEBUG: Consultando GSI '${'thingName-lastUpdated-index'}' para thingName: '${thingNameFromUserTable}' (convertido a '${thingNameForGSIQuery}' para la consulta)`);

                                try {
                                    const deviceState = await ddb.query({
                                        TableName: THINGS_STATE_TABLE_NAME, 
                                        IndexName: 'thingName-lastUpdated-index',
                                        KeyConditionExpression: 'thingName = :tn',
                                        ExpressionAttributeValues: { ':tn': thingNameForGSIQuery },
                                        ScanIndexForward: false,
                                        Limit: 1 
                                    }).promise();

                                    console.log("DEBUG: Resultado crudo de la consulta al GSI:", JSON.stringify(deviceState, null, 2));

                                    if (deviceState.Items && deviceState.Items.length > 0) {
                                        const device = deviceState.Items[0]; 
                                        console.log("DEBUG: Objeto 'device' del GSI (esperado normal JSON):", JSON.stringify(device, null, 2));

                                        const interior = device.interiorDoor ? (device.interiorDoor === "open" ? "abierta" : "cerrada") : "estado desconocido";
                                        const exterior = device.exteriorDoor ? (device.exteriorDoor === "open" ? "abierta" : "cerrada") : "estado desconocido";
                                            
                                        devicePhrases.push(
                                            `<p>El dispositivo ${device.thingName}<break time="0.3s"/> ` +
                                            `tiene la puerta interior: ${interior}<break time="0.2s"/> ` + 
                                            `y la exterior: ${exterior}.</p>`
                                        );
                                    } else {
                                        console.log(`DEBUG: GSI no encontró resultados para ${thingNameFromUserTable}.`);
                                        devicePhrases.push(`<p>No tengo información del estado actual para el dispositivo ${thingNameFromUserTable}.</p>`);
                                    }
                                } catch (innerError) {
                                    console.error(`ERROR: Error al obtener estado para ${thingNameFromUserTable} (usando GSI):`, innerError);
                                    devicePhrases.push(`<p>No pude obtener el estado para el dispositivo ${thingNameFromUserTable}.</p>`);
                                }
                            }
                            if (devicePhrases.length > 0) {
                                speakOutput = `<speak>Aquí están tus dispositivos: ${devicePhrases.join('<break time="1s"/>')}</speak>`;
                            } else {
                                speakOutput = "<speak>He encontrado tus dispositivos vinculados, pero no tengo información de su estado actual.</speak>";
                            }
                        } catch (error) {
                            console.error("ERROR: Error en ListMyDevicesIntentHandler (consulta inicial a IoTThingUsers):", error);
                            speakOutput = '<speak>Hubo un problema al consultar tus dispositivos. Por favor, inténtalo de nuevo.</speak>';
                       }
                        console.log("DEBUG: --- FIN ListMyDevicesIntentHandler ---");
                        return handlerInput.responseBuilder
                            .speak(speakOutput)
                            .reprompt(speakOutput)
                            .getResponse();
                    }
                };
                ```
2.  ### Lambda Dynamo
    *  Handlers
       *  #### firstConection
          *  **Descripcion:** Handler disparado por una regla la cual nos permite registrar los dispositivos del smart_thing  en una tabla de dynamoDB
          *  **Codigo**
             *  ```javascript
                  exports.handler = async (event) => {
                    console.log("Evento recibido de IoT Rule:", JSON.stringify(event, null, 2));
                    const thingName = event.thingName;
                    const currentInteriorDoor = event.currentInteriorDoor;
                    const currentExteriorDoor = event.currentExteriorDoor;
                    if (!thingName) {
                        console.error("thingName no encontrado en el evento de IoT. Ignorando.");
                        return { statusCode: 400, body: 'Bad Request: thingName missing' };
                    }

                    const params = {
                        TableName: THINGS_STATE_TABLE_NAME,
                        Item: {
                            'thingName': thingName,
                            'interiorDoor': currentInteriorDoor,
                            'exteriorDoor': currentExteriorDoor,
                            'lastUpdated': DateTime.local().setZone('America/La_Paz').toFormat("yyyy-MM-dd'T'HH:mm:ssZZ")
                        }
                    };

                    try {
                        await ddb.put(params).promise();
                        console.log(`Estado de ${thingName} actualizado en DynamoDB (${THINGS_STATE_TABLE_NAME}).`);
                        return { statusCode: 200, body: 'State updated successfully' };
                    } catch (error) {
                        console.error("Error al guardar estado de IoT en DynamoDB:", error);
                        return { statusCode: 500, body: `Error updating state: ${error.message}` };
                    }
                };
                ```
3. ### Lambda Republish
   * Handlers
     * #### republishHandler
       * **Descripcion:** Handler para capturar el payload de una regla de IoT Core el que permite la automatizacion del sistema de seguridad
       * **Codigo**
         * ```javascript
              exports.handler = async (event) => {
                console.log("Evento recibido en ShadowUpdaterLambda:", JSON.stringify(event, null, 2));

                const payloadToRepublish = event.payload;
                const thingName = event.thingName;

                if (!thingName) {
                    console.error("ERROR: 'thingName' no encontrado en el evento. No se puede actualizar el Shadow.");
                    throw new Error("Missing 'thingName' in event payload.");
                }

                if (!payloadToRepublish) {
                    console.error("ERROR: 'payload_to_send' (el objeto desired) no encontrado en el evento. No se puede actualizar el Shadow.");
                    throw new Error("Missing 'payload_to_send' (desired object) in event payload.");
                }

                const updateParams = {
                    thingName: thingName,
                    payload: JSON.stringify(payloadToRepublish)
                };
                try {
                    console.log("Intentando actualizar Shadow con params:", JSON.stringify(updateParams, null, 2));
                    const data = await iotData.updateThingShadow(updateParams).promise();
                    console.log("Shadow actualizado exitosamente:", JSON.stringify(data));
                    return { statusCode: 200, body: 'Shadow updated successfully' };
                } catch (error) {
                    console.error("ERROR al actualizar Shadow:", error);
                    throw error;
                }
            };
            ```
4. ### Reglas
   * #### RegisterRule
     * **Description:** Regla encargada de capturar la primera coneccion de los smartThings conectados  para ser registrados en la tabla de DynamoDB
     * **Codigo**
       * ```sql
          SELECT topic(3) AS thingName, 
            state.reported.interiorDoor as currentInteriorDoor, 
            state.reported.exteriorDoor as currentExteriorDoor, 
            state.reported.securitySystem as currentSecuritySystem 
          FROM '$aws/things/+/shadow/update' 
            WHERE state.reported.deviceStatus = 'connected'
          ```
    * ### ChangedState Rule
      * **Description:** Regla encargada de capturar las actualizaciones de estado de los objetos limitando los registros a almacenarse en la base de datos solo a cuando el estado cambie  y el sistema este activado, haciendo uso de un lambda
       * **Codigo**
         * ```sql
            SELECT topic(3) as thingName,
                current.state.reported.interiorDoor as currentInteriorDoor, 
                current.state.reported.exteriorDoor as currentExteriorDoor,
                current.state.reported.securitySystem as currentSecuritySystem
            FROM '$aws/things/+/shadow/update/documents' 
                WHERE (current.state.reported.interiorDoor <> previous.state.reported.interiorDoor 
                OR current.state.reported.exteriorDoor <> previous.state.reported.exteriorDoor)
                AND current.state.reported.securitySystem = 'armed'
                AND current.state.reported.deviceStatus = 'connected'
            ```
    * ### Automation Rule
      * **Description:** Regla encargada de capturar el estado  actualizado por los componentes del smartThing  asegurando que si solo se automatize cuando el sistema este activado, logrando actualizar el shadow usando un lamnda
       * **Codigo**
         * ```sql
            SELECT {"state":{"desired":{"interiorDoor":"close"}}} AS payload,
                topic(3) AS thingName
            FROM '$aws/things/+/shadow/update/documents'
                WHERE current.state.reported.exteriorDoor = 'open'
                AND current.state.reported.securitySystem = 'armed'
                AND current.state.reported.interiorDoor <> 'close'
            ```

## Diagramas
1. Comportamiento
    * [![](https://mermaid.ink/img/pako:eNrdWdtu2zYYfhVCyIWDOqnjOE2siwJ1nGIBknarsxVY3Qta-muzoUiXpNKmgZ9qj7AX20_qbMmO3DXAsFy0OvzHjx8_kvKDF8gQPN_T8CUGEcCY0bmi0VQQ_FtSZVjAllQYMgGhpSJUkwu9TG7qRq8CE9MwN3O3psnwHYTW5g2Yr1Ld_kJFyKHBbKTkLbhor95PmmpSd9K-dRfnUhgleWOgiM4F4F3RxXXlSd1D3zLOXWYO3-jE3tWNVMxBp-WRS3lD3tkHdbsZDW5BhJmlC0lG6cPOFY1mId1vCA_LeMaZXiQWmXt69y57W3cM7wWNZDhr9Bu7l-PRJrfxKHMoLBNbBQEWNZ91-oNel_RPTvCfQS8tXEgDRN7hcCWQdjMy-OQ11UBCIJcCM1HOvtOA_f1XGjSxPnj5EjnhE5Ew4jCQQmC2Thoc3x2gSWLrk_fsNSNoghaYITHJ0rWLVBTXFGutsmcJD30SfTHmkAlmXBeQxcwNHR98ko5L52HqaUMNTD0fL3E0pTIQJnfwzYBiUo0lss_zp55cgph6z6dewKVGl-7UC-GOBTDBELF2NmkvNsZqtUqzu6SYvDroPtFIrk45DXHFpF5V69x9PPJxmOdMoxsJqaHkKzMLewWEidSLGDrjsNZ7ilG8tLaTBWL5NbFIXljQD7LxKxsRHQcB6E8xv68N5GPAl0x3gJ6J_wf0pe6fAvwK9jqe6UCxGXQQWAhixcz95B5LjZ6HwA2demlz2HkmF1zKJRnFAQfyq2LCikyqoVUxSXWkLCaNgpKqKOoJjz_Lppg5Gat675MF1XYs4XxBxRzCTinN2tJgoSKZG6faOL_CPAW0rCAXuO7AnJIIvehnIJ2Acm6LLWUp4Vo4Lty6dw1a0zmUa6Lc4Ppp9YgESBKWC1O1UWJrrQxTRv-pt7vgrFZ2EL39aia3DmKeHHw6U0B0hMsGMQsm5lXz1Myi6Dx9MmIg7kAw7AUhYkTOPoORxE5CzuYgyuDmCV1necqNthanS3wqzIep5wbqotLlx6p5A-2OLO36vf26Ydb4s7yMOZhyeJev0-CZYYC-xcyWMywTuRxzw3Aa4xSUdknkFCULFE72bHzq8bIgbhbn1cB6KZsLsX7paFwV-ZBfZO-h1tGqHsfN6coDrmEN-EvxA8D3WgNfDt8C-HVBztHfAH62JNRjFgJaoeNPQL7W0u7Iv8UpvCvwfQT-aNgO-PJSsQ3w0mqhwSTqE4Jm6pElN5GcTZiXpRKbYHd2E4lrDQqtU8y6Y0ll3ZHAloP_HdpsTfXn9gd5_VsU9IeaOMh2JgE1waKThkcOfZL7ZHZPkhXJjb89PDQM34Y9Rr5VSAbpxmqxC2M3C9U9fl1MGjcfNAzrwaQgN8WW4xGOTyTHHb7BVRPsOsFUMcV25va5XZV2IHcvERQnLW1VxfX5hkbwc8ldWVCfnt0u3RPQu1UbP4nfB0_E74OmzTUGcNvo17vod5nbAShF_w25cWTYnZXWylb6EYYfo3wfnVn5PtnG8Izgbfld0Lsi99tOUHqtbCQLVVH1bPTUaNipnqBx9t9DI2R6R0C2IzRmOrBHobE7lurkeett1qANQFYPr3B-OJR0O4jQ5RXnzqOzTenyHDxP8OHjtlmX7ZmkJtj6Umo8-d_hjcblaO-hiLL7lumKiVvneyN_R_lsj-SxpVorJPceTMa0CZdm9fhGFdXJfTLYe4htTeNVdz0GPhjbLeJ-C9TCAjHyB56RY24PkpSTWMcUFf4HMNPm-n4X7h3nk7PfBjGbAPU0YrpcvG4FnKOtuIUwYYQd1CYulg5RWVZecmtDRxNXy8vZWIR5jI_1m6YPIum3EPeJtfGDSLawd7OJeE3tqLAIz9p4tLn-7eamcFtS1fTxYP0Lj_1aU_kGsc6JTZ-G1h2bG8YLr-vNFQs936gYul4EKqL2FrciaDL1zAIiK7B4KSA2ivKpNxUrdFtS8aeUUeapZDxfeP4niizteolOpz9c5E8VJgR1LmNhPP9F7-TIRUG99r55_mD44vD0aDA8OT09Oh4eD4cnXe_e809eHOKbweD0tNc7G_b7x6uu993l7R2enQ6G9u_sbDA87ttwEDIj1XXy-4n7GSWr5cK9SUtZ_QNITtMG?type=png)](https://mermaid.live/edit#pako:eNrdWdtu2zYYfhVCyIWDOqnjOE2siwJ1nGIBknarsxVY3Qta-muzoUiXpNKmgZ9qj7AX20_qbMmO3DXAsFy0OvzHjx8_kvKDF8gQPN_T8CUGEcCY0bmi0VQQ_FtSZVjAllQYMgGhpSJUkwu9TG7qRq8CE9MwN3O3psnwHYTW5g2Yr1Ld_kJFyKHBbKTkLbhor95PmmpSd9K-dRfnUhgleWOgiM4F4F3RxXXlSd1D3zLOXWYO3-jE3tWNVMxBp-WRS3lD3tkHdbsZDW5BhJmlC0lG6cPOFY1mId1vCA_LeMaZXiQWmXt69y57W3cM7wWNZDhr9Bu7l-PRJrfxKHMoLBNbBQEWNZ91-oNel_RPTvCfQS8tXEgDRN7hcCWQdjMy-OQ11UBCIJcCM1HOvtOA_f1XGjSxPnj5EjnhE5Ew4jCQQmC2Thoc3x2gSWLrk_fsNSNoghaYITHJ0rWLVBTXFGutsmcJD30SfTHmkAlmXBeQxcwNHR98ko5L52HqaUMNTD0fL3E0pTIQJnfwzYBiUo0lss_zp55cgph6z6dewKVGl-7UC-GOBTDBELF2NmkvNsZqtUqzu6SYvDroPtFIrk45DXHFpF5V69x9PPJxmOdMoxsJqaHkKzMLewWEidSLGDrjsNZ7ilG8tLaTBWL5NbFIXljQD7LxKxsRHQcB6E8xv68N5GPAl0x3gJ6J_wf0pe6fAvwK9jqe6UCxGXQQWAhixcz95B5LjZ6HwA2demlz2HkmF1zKJRnFAQfyq2LCikyqoVUxSXWkLCaNgpKqKOoJjz_Lppg5Gat675MF1XYs4XxBxRzCTinN2tJgoSKZG6faOL_CPAW0rCAXuO7AnJIIvehnIJ2Acm6LLWUp4Vo4Lty6dw1a0zmUa6Lc4Ppp9YgESBKWC1O1UWJrrQxTRv-pt7vgrFZ2EL39aia3DmKeHHw6U0B0hMsGMQsm5lXz1Myi6Dx9MmIg7kAw7AUhYkTOPoORxE5CzuYgyuDmCV1necqNthanS3wqzIep5wbqotLlx6p5A-2OLO36vf26Ydb4s7yMOZhyeJev0-CZYYC-xcyWMywTuRxzw3Aa4xSUdknkFCULFE72bHzq8bIgbhbn1cB6KZsLsX7paFwV-ZBfZO-h1tGqHsfN6coDrmEN-EvxA8D3WgNfDt8C-HVBztHfAH62JNRjFgJaoeNPQL7W0u7Iv8UpvCvwfQT-aNgO-PJSsQ3w0mqhwSTqE4Jm6pElN5GcTZiXpRKbYHd2E4lrDQqtU8y6Y0ll3ZHAloP_HdpsTfXn9gd5_VsU9IeaOMh2JgE1waKThkcOfZL7ZHZPkhXJjb89PDQM34Y9Rr5VSAbpxmqxC2M3C9U9fl1MGjcfNAzrwaQgN8WW4xGOTyTHHb7BVRPsOsFUMcV25va5XZV2IHcvERQnLW1VxfX5hkbwc8ldWVCfnt0u3RPQu1UbP4nfB0_E74OmzTUGcNvo17vod5nbAShF_w25cWTYnZXWylb6EYYfo3wfnVn5PtnG8Izgbfld0Lsi99tOUHqtbCQLVVH1bPTUaNipnqBx9t9DI2R6R0C2IzRmOrBHobE7lurkeett1qANQFYPr3B-OJR0O4jQ5RXnzqOzTenyHDxP8OHjtlmX7ZmkJtj6Umo8-d_hjcblaO-hiLL7lumKiVvneyN_R_lsj-SxpVorJPceTMa0CZdm9fhGFdXJfTLYe4htTeNVdz0GPhjbLeJ-C9TCAjHyB56RY24PkpSTWMcUFf4HMNPm-n4X7h3nk7PfBjGbAPU0YrpcvG4FnKOtuIUwYYQd1CYulg5RWVZecmtDRxNXy8vZWIR5jI_1m6YPIum3EPeJtfGDSLawd7OJeE3tqLAIz9p4tLn-7eamcFtS1fTxYP0Lj_1aU_kGsc6JTZ-G1h2bG8YLr-vNFQs936gYul4EKqL2FrciaDL1zAIiK7B4KSA2ivKpNxUrdFtS8aeUUeapZDxfeP4niizteolOpz9c5E8VJgR1LmNhPP9F7-TIRUG99r55_mD44vD0aDA8OT09Oh4eD4cnXe_e809eHOKbweD0tNc7G_b7x6uu993l7R2enQ6G9u_sbDA87ttwEDIj1XXy-4n7GSWr5cK9SUtZ_QNITtMG)
