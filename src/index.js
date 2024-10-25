import { Gpio } from 'pigpio';
import capture from './utils/ImageCapture.js';
import imageToText from './utils/Bard.js';
import { textToSpeech, playSpeech, playSpeechSync } from './utils/TextToSpeech.js';
import initGPS from './utils/GPS.js';
import RGB from './utils/RGB.js';
import PlaySound from 'play-sound';

import { startRecord, stopRecord } from './utils/Record.js';
import handleIntent from './utils/Intent.js';
import { startBLE } from './utils/BLE.js';
import { initWifi } from './utils/Wifi.js';
import getDB from './utils/DB.js';
import { PINS } from './constants/pins.js';

RGB.setColor({ r: 255, b: 0, g: 0 });

const touchSensor = new Gpio(PINS.TOUCH, {
    mode: Gpio.INPUT,
    pullUpDown: Gpio.PUD_DOWN,
    alert: true
});

let timer;
let count = 0;
let currentStatus = '';
let isACommandRunning = false;
let recording = null;

// initGPS();
startBLE();
initWifi();

console.log(process.env);

(async () => {
    try {
        const player = PlaySound({
            player: 'mplayer'
        });
        player.play('welcome.mp3', { timeout: 300 }, function(err) {
            if (err) throw err;
        });
        await playSpeech('./src/assets/sfx/capture.mp3');
        console.log('fdsfdkj');
    } catch (err) {
        console.log(err);
    }
})();

const handleStateChange = (level) => {
    if (level === 1) {
        count++;
        clearTimeout(timer);
        timer = setTimeout(async () => {
            await tapHandler(count);
            count = 0;
        }, 300);
    }
};

touchSensor.on('alert', handleStateChange);

const tapHandler = async (count) => {
    if (currentStatus === 'Capturing') return;
    if (count === 0) {
        // Empty block kept for consistency
    }
    if (count === 1) {
        if (currentStatus === 'Recording') {
            console.log('Recording stopped');

            const resp = await stopRecord(recording);
            if (!resp.isSuccess) {
                isACommandRunning = false;
                currentStatus = '';
                console.log(resp.transcribe);
                await textToSpeech('Sorry, I did not get that');
                await playSpeech();
                return;
            }

            await handleIntent(resp.intents, resp.entities, resp.transcribe);
            currentStatus = '';
            isACommandRunning = false;
            return;
        }
        await singleTapHandler();
    }
    else if (count === 2 && !isACommandRunning) {
        isACommandRunning = true;
        console.log('Recording started');
        currentStatus = 'Recording';
        recording = await startRecord();
    }
    else if (count === 3) {
        // await tripleTapHandler();
    }
};

RGB.setColor({ r: 0, g: 0, b: 255 });

const singleTapHandler = async () => {
    isACommandRunning = true;
    currentStatus = 'Capturing';
    const startTime = Date.now();
    console.log('Capturing image...');
    await capture();

    const imageClickTime = Date.now();
    console.log(`
        Time taken to capture image: ${imageClickTime - startTime}ms
        Current Elapsed Time: ${Date.now() - startTime}ms
    `);
    const loadingProccess = playSpeechSync('./src/assets/sfx/loading.mp3', true);
    try {
        await (await getDB()).setCurrentProcessId(loadingProccess.pid || null);
        console.log('Image captured');
        const text = await imageToText('test.jpeg');
        const textClickTime = Date.now();
        console.log(`
            Time taken to generate text: ${textClickTime - imageClickTime}ms
            Current Elapsed Time: ${Date.now() - startTime}ms
        `);
        console.log('Text generated');
        console.log('Converting text to speech...');
        await textToSpeech(text);
        const speechClickTime = Date.now();
        console.log(`
            Time taken to generate speech: ${speechClickTime - textClickTime}ms
            Current Elapsed Time: ${Date.now() - startTime}ms
        `);
        console.log('Speech generated');
        console.log('Playing speech...');
        loadingProccess.kill();
        await (await getDB()).setCurrentProcessId(null);
        await playSpeech();
        console.log('Text spoken');
        currentStatus = '';
        isACommandRunning = false;
    }
    catch (err) {
        console.log(err);
        loadingProccess.kill();
    }
};

process.on('SIGINT', () => {
    touchSensor.off('alert', handleStateChange);
    RGB.setColor({ r: 255, g: 0, b: 0 });
    process.exit();
});

console.log('Awaiting for touch trigger...');