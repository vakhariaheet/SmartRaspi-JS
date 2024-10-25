import { libcamera } from 'libcamera';
import { playSpeech } from './TextToSpeech.js';

const capture = async (name = 'test.jpeg') => {
    await libcamera.still({
        config: {
            output: name,
        }
    });
    await playSpeech('./src/assets/sfx/capture.mp3');
    return name;
};

export default capture;