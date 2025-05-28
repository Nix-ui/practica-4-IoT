import { DateTime } from 'luxon';
const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

// Name of the DynamoDB tables
const THINGS_STATE_TABLE_NAME = 'IoTDeviceStates'; //Name of the DynamoDB table to store IoT device states and their last updated date

// Ensure the AWS SDK is configured with the correct region
//Handler for AWS Lambda function triggered by IoT Rule
//Updates the state of the IoT device in the DynamoDB table
/** 
 * @description AWS Lambda function to update the state of an IoT device in DynamoDB
 * @param {Object} event - The event object containing the IoT Rule data
 * @param {string} event.thingName - The name of the IoT device (thing)
 * @param {string} event.currentInteriorDoor - The current state of the interior door
 * @param {string} event.currentExteriorDoor - The current state of the exterior door
 * @return {Object} - The response object containing the status code and message
 * @throws {Error} - If there is an error updating the state in DynamoDB
*/
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