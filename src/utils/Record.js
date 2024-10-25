import fs from 'fs';
import recorder from 'node-record-lpcm16';
import { playSpeech } from './TextToSpeech.js';
import axios from 'axios';

export const startRecord = async () => {
    const file = fs.createWriteStream('user.wav', { encoding: 'binary' });
    await playSpeech('./src/assets/sfx/start.mp3');
    const recording = recorder.record({
        sampleRate: 16000,
        threshold: 0.5,
        silence: '1.0',
        audioType: 'wav',
    });
    const stream = recording.stream();
    stream.on('error', (err) => {
        console.log(err);
    })
    stream.pipe(file);
    setTimeout(() => {
        recording.stop();
    }, 10000);
    return recording;
};

const getLastChuck = (resp) => {
    const lastChuck = resp.split(/\n(?={)/);
    return lastChuck[lastChuck.length - 1];
};

export const stopRecord = async (recording) => {
    if (!recording)
        return { message: 'No recording found', isSuccess: false, transcribe: '' };
    recording.stop();
    await playSpeech('./src/assets/sfx/stop.mp3');
    const buffer = fs.readFileSync('user.wav');
    const resp = await axios.post(
        'https://api.wit.ai/speech?client=chromium&lang=en-us&output=json',
        buffer,
        {
            headers: {
                Authorization: `Bearer ${process.env.WIT_API_KEY}`,
                'Content-Type': 'audio/wav',
            },
        },
    );
    fs.writeFileSync('wit.json', resp.data);
    const { intents, entities, text } = JSON.parse(getLastChuck(resp.data));

    if (!intents.length)
        return {
            message: 'No intent detected',
            isSuccess: false,
            transcribe: text,
        };

    return { intents, entities, isSuccess: true, transcribe: text };
};