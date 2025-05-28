import { DateTime } from 'luxon';
const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();


const THINGS_STATE_TABLE_NAME = 'IoTDeviceStates';
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