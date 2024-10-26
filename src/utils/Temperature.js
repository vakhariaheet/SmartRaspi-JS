import * as sensor from 'node-dht-sensor';
import { PINS } from '../constants/pins.js';

const sensorType = 11; // DHT11 sensor type
const sensorPin = PINS.TEMPERATURE; // GPIO17 or the pin you connected the DHT11 sensor to

export const readTemperature = () => new Promise((resolve, reject) => {
    sensor.read(sensorType, sensorPin, (err, temperature, humidity) => {
        if (!err) {
            resolve(temperature.toFixed(2));
        } else {
            reject(err);
        }
    });
});

readTemperature().then(console.log);