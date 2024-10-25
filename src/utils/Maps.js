import getDB from "./DB";
import { playSpeech, textToSpeech } from "./TextToSpeech";
import { convert } from "html-to-text";

export const getPlaceInfo = async (q) => {
    const gps = await (await getDB()).getGPS();
    if (!gps) return;
    
    const latLong = `${gps.currentLocation?.lat},${gps.currentLocation?.lng}`;
    const response = await fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${q}&key=${process.env.GOOGLE_MAPS_API_KEY}&radius=20000&location=${latLong},&origin=${latLong}&region=in&components=country:in&limit=1`);
    const data = await response.json();

    const firstPlace = data.predictions[0];
    console.log(firstPlace.description, firstPlace.place_id, latLong);
    const directionsResp = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${latLong}&destination=place_id:${firstPlace.place_id}&key=${process.env.GOOGLE_MAPS_API_KEY}`);
    const directionsData = await directionsResp.json();
    
    if (directionsData.routes.length === 0) {
        await textToSpeech('No place found please try again');
        await playSpeech();
        return;
    };

    const newGPS = {
        ...gps,
        destinationName: firstPlace.description,
        isConfirmed: true,
        destinationPlaceId: firstPlace.place_id,
        distance: directionsData.routes[0].legs[0].distance.value,
        steps: directionsData.routes[0].legs[0].steps,
        currentStepIndex: 0,
        destination: {
            lat: directionsData.routes[0].legs[0].end_location.lat,
            lng: directionsData.routes[0].legs[0].end_location.lng
        },
        origin: {
            lat: directionsData.routes[0].legs[0].start_location.lat,
            lng: directionsData.routes[0].legs[0].start_location.lng
        }
    }
    
    await (await getDB()).setGPS(newGPS);

    await textToSpeech(`Destination set to ${convert(firstPlace.description)}`);
    await playSpeech();
    await textToSpeech(convert(gps.steps[0].html_instructions));
    await playSpeech();
}