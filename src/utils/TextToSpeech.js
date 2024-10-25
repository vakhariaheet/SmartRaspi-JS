import gtts from 'gtts';
import PlaySound from 'play-sound';

const textToSpeech = async (text, lang = 'en') => {
    try {
        const tts = new gtts(text, lang);
        return new Promise((resolve, reject) => {
            tts.save('welcome.mp3', function (err, result) {
                if (err) {
                    console.error(err);
                    reject(err);
                }
                else resolve("Done")
            });
        })
    }
    catch (err) {
        console.error(err);
    }
}

const playSpeech = async (
    path = 'welcome.mp3', 
    options = { player: 'mplayer' }
) => {
    return new Promise((resolve, reject) => {
        const player = PlaySound(options);
        
        player.play(path, (err) => {
            if (err) {
                reject(err);
                return;
            }
            resolve("Done");
        });
    });
};

const playSpeechSync = (path = "welcome.mp3", loop) => {
    const player = PlaySound({
        player: 'mplayer',
    });
    const playOptions = loop ? { mplayer: ['-loop', '999'] } : {};

    const childProcess = player.play(path, playOptions, (err) => {
        if (err) {
            console.error('Error playing sound:', err);
        }
    });

    const kill = () => {
        childProcess.kill();
    };

    return { kill, childProcess, pid: childProcess.pid };
}

export { textToSpeech, playSpeech, playSpeechSync };