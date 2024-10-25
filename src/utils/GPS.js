import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import GPS from 'gps';
import axios from 'axios';
import { appendFileSync, readFileSync } from 'fs';
import getDB from './DB.js';

let makeAPICall = true;

const initGPS = async () => {
    let timer;
    const port = new SerialPort({
        path: '/dev/ttyS0',
        baudRate: 9600
    });

    const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
    const gps = new GPS;
    const db = await getDB();
    if (!db.getGPS()) {
        await db.setGPS({
            currentLocation: {
                lat: 23.0261316,
                lng: 72.5560948
            },
            destination: {
                lat: 0,
                lng: 0
            },
            destinationName: '',
            destinationPlaceId: '',
            distance: 0,
            isConfirmed: false,
            steps: [],
            currentStepIndex: 0,
            origin: {
                lat: 0,
                lng: 0
            }
        });
    }

    gps.on('data', async (data) => {
        try {
            if (data.type !== 'RMC' || (!data.lat || !data.lon)) return;
            appendFileSync('gps.log', JSON.stringify(data) + '\n');
            const gpsData = db.getGPS();
            await db.setGPS({
                ...gpsData,
                currentLocation: {
                    lat: data.lat,
                    lng: data.lon
                }
            });

            if (!makeAPICall) return;
            const userId = readFileSync('currentUserId.txt', 'utf8');
            console.log('Sending GPS data');
            await axios.post(`${process.env.BACKEND_URL}/api/update-coors`, {
                latitude: data.lat,
                longitude: data.lon,
                speed: data.speed,
                track: data.track,
                glasses_id: 1,
                code: process.env.CODE,
                userId
            });
            makeAPICall = false;
            setTimeout(() => {
                makeAPICall = true;
            }, 10000);
        } catch (err) {
            appendFileSync('gps.log', err.message + '\n');
            console.log('Error sending GPS data', err.message);
        }
    });

    parser.on('data', (data) => {
        const nmeaRegex = /^\$.+\*[0-9A-Fa-f]{2}$/;
        if (!nmeaRegex.test(data)) return;
        gps.update(data);
    });

    // Handle the process termination event
    const handleExit = async () => {
        // Close the serial port
        port.close((err) => {
            if (err) {
                console.error('Error closing port:', err.message);
            } else {
                console.log('Serial port closed');
            }
            process.exit();
        });
    };

    // Register the handleExit function to be called on process termination
    process.on('SIGINT', handleExit);
    process.on('SIGTERM', handleExit);
};

export default initGPS;