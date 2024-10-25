import Tesseract from 'node-tesseract-ocr';

const config = {
    lang: 'eng',
    oem: 1,
    psm: 3,
};

const imageToText = async (path) => {
    const text = await Tesseract.recognize(path, config);
    console.log(`Text: ${text}`);
    return text;
}

export default imageToText;