
const AWS = require('aws-sdk');

const iotData = new AWS.IotData({
    endpoint: 'a2rmxu7hc5rdsd-ats.iot.us-east-2.amazonaws.com',
    region: 'us-east-2'});


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