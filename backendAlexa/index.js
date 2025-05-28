import { DateTime } from 'luxon';
const Alexa = require('ask-sdk-core');
const AWS = require('aws-sdk');

const IotData = new AWS.IotData({endpoint: 'a2rmxu7hc5rdsd-ats.iot.us-east-2.amazonaws.com', region: 'us-east-2'});
const iot = new AWS.Iot({region: 'us-east-2'});
const ddb = new AWS.DynamoDB.DocumentClient();

// Name of the DynamoDB tables 
const USERS_TABLE_NAME = 'IoTThingUsers'; // Table to store userID and their thingName and their linked IoT devices when they were last linked date.
const THINGS_STATE_TABLE_NAME = 'IoTDeviceStates'; // Table to store the state of the IoT devices, including their doors and security system states.

// Function to get the thingName associated with a userId
/**
 * Retrieves the thingName associated with a userId from the USERS_TABLE_NAME.
 * @param {string} userId - The userId for which to retrieve the thingName.
 * @returns {Promise<string|null>} - Returns the thingName if found, otherwise null.
 */
async function getThingNameForUser(userId) {
    const params = {
        TableName: USERS_TABLE_NAME,
        KeyConditionExpression: 'userId = :uId',
        ExpressionAttributeValues: {
            ':uId': userId
        }
    };
    try {
        const data = await ddb.query(params).promise();
        if (data.Items && data.Items.length > 0) {
            return data.Items[0].thingName;
        }
        return null;
    } catch (error) {
        console.error("Error al obtener thingName para el usuario:", error);
        return null;
    }
}

//function to handle the LaunchRequestIntent recieived when the skill is launched with the invocation name
/**
 * Handles the LaunchRequest when the skill is invoked.
 * @param {Object} handlerInput - The input handler for the request.
 * @returns {Object} - The response to be sent back to the user.
 */
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'Bienvenido a tu objeto inteligente, tienes las opciones de encender, apagar y consultar el estado, ¿Qué deseas hacer?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

// Handler for the StateExteriorDoorIntent, which checks the state of the exterior door of the IoT device linked to the user, the state is stored in the THINGS_STATE_TABLE_NAME DynamoDB table
/**
 * Handles the StateExteriorDoorIntent, which checks the state of the exterior door of the IoT device linked to the user.
 * @param {Object} handlerInput - The input handler for the request.
 * @returns {Object} - The response to be sent back to the user.
 */
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

// Handler for the OpenInteriorDoorIntent, which sends a command to open the interior door of the IoT device linked to the user
//this command is sent to the AWS IoT Data Plane using the updateThingShadow method and the payload is a JSON string that sets the desired state of the interior door to "open"
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

// Handler for the CloseInteriorDoorIntent, which sends a command to close the interior door of the IoT device linked to the user
//this command is sent to the AWS IoT Data Plane using the updateThingShadow method and the payload is a JSON string that sets the desired state of the interior door to "close"
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

// Handler for the StateInteriorDoorIntent, which retrieves the state of the interior door of the IoT device linked to the user
// the state is stored in the THINGS_STATE_TABLE_NAME DynamoDB table
/**
 * Handles the StateInteriorDoorIntent, which retrieves the state of the interior door of the IoT device linked to the user.
 * @param {Object} handlerInput - The input handler for the request.
 * @returns {Object} - The response to be sent back to the user.
 */
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

// Handler for the ActivateSecuritySystemIntent, which sends a command to activate the security system of the IoT device linked to the user
// this command is sent to the AWS IoT Data Plane using the updateThingShadow method and the payload is a JSON string that sets the desired state of the security system to "armed"

/**
 * Handles the ActivateSecuritySystemIntent, which sends a command to activate the security system of the IoT device linked to the user.
 * @param {Object} handlerInput - The input handler for the request.
 * @return {Object} - The response to be sent back to the user.
 * */
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

// Handler for the DeactivateSecuritySystemIntent, which sends a command to deactivate the security system of the IoT device linked to the user
/**
 * Handles the DeactivateSecuritySystemIntent, which sends a command to deactivate the security system of the IoT device linked to the user.
 * @param {Object} handlerInput - The input handler for the request.
 * @return {Object} - The response to be sent back to the user.
 * */
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

// Handler for the LinkThingToUserIntent, which links a thing to the user by saving the thingName in the USERS_TABLE_NAME DynamoDB table
/**
 * Handles the LinkThingToUserIntent, which links a thing to the user by saving the thingName in the USERS_TABLE_NAME DynamoDB table.
 * @param {Object} handlerInput - The input handler for the request.
 * @return {Object} - The response to be sent back to the user.
 * */
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

// Handler for the DiscoverDevicesIntent, which lists all IoT devices registered in the AWS IoT account
/**
 * Handles the DiscoverDevicesIntent, which lists all IoT devices registered in the AWS IoT account.
 * @param {Object} handlerInput - The input handler for the request.
 * @return {Object} - The response to be sent back to the user. 
 * */
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

// Handler for the ListMyDevicesIntent, which lists all devices linked to the user's account
/**
 * Handles the ListMyDevicesIntent, which lists all devices linked to the user's account.
 * @param {Object} handlerInput - The input handler for the request.
 * @return {Object} - The response to be sent back to the user. 
 * */
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

// Handler for the HelpIntent, which provides help information to the user
const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Puedes pedirme que abra o cierre la puerta interior, o que consulte el estado de las puertas. También puedes vincular un dispositivo diciendo "vincula mi [nombre del dispositivo]". ¿Qué deseas hacer?';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
// Handler for the Cancel and Stop Intent
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Hasta pronto!';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

// Handler for the Fallback Intent, which is triggered when the skill does not understand the user's request
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Lo siento, no entendí, intenta de nuevo.';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
// Handler for the SessionEndedRequest, which is triggered when the session ends
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        return handlerInput.responseBuilder.getResponse();
    }
};

// Handler for the Intent Reflector, which is used to reflect the intent name back to the user
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `Intentó ejecutar ${intentName}`;
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
// Error Handler to catch any errors that occur during the request processing
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Disculpa, hubo un error. Intenta de nuevo.';
        console.error(`~~~~ Error handled: ${JSON.stringify(error)}`);
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        StateExteriorDoorHandler,
        StateInteriorDoorHandler,
        OpenInteriorDoorIntentHandler,
        CloseInteriorDoorIntentHandler,
        ActivateSecuritySystemIntentHandler,
        DeactivateSecuritySystemIntentHandler,
        LinkThingToUserIntentHandler,
        ListMyDevicesIntentHandler,
        DiscoverDevicesIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addErrorHandlers(
        ErrorHandler)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .lambda();