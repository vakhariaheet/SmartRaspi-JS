import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from "@google/generative-ai/server";
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const fileManager = new GoogleAIFileManager(process.env.API_KEY);

const fileToGenerativePart = async (path, mimeType) => {
    const uploadResponse = await fileManager.uploadFile(path, {
        mimeType,
        displayName: 'test.jpeg',
    });

    return uploadResponse;
}

async function imageToText(image) {
    // For text-and-image input (multimodal), use the gemini-pro-vision model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    console.log(`Generating...`);
    const prompt = `Describe this scene as if narrating to someone who can't see it. Be detailed but natural, avoiding any mention of an image. Use only elements present in the scene. Keep your description concise, under 100 words, while capturing the essence of what's visible.`;

    const uploadedImage = await fileToGenerativePart(image, 'image/jpeg');
    const result = await model.generateContent([prompt, {
        fileData: {
            fileUri: uploadedImage.file.uri,
            mimeType: uploadedImage.file.mimeType,
        }
    }]);
    const response = await result.response;
    const text = response.text();
    console.log(`Generated: ${text}`);
    return text;
}

export const detectCurrency = async (image) => {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
    console.log(`Generating...`);
    const prompt = `Analyze the image and identify the currency. Provide the name of the currency and its denomination.`;

    const uploadedImage = await fileToGenerativePart(image, 'image/jpeg');

    const result = await model.generateContent([prompt, {
        fileData: {
            fileUri: uploadedImage.file.uri,
            mimeType: uploadedImage.file.mimeType,
        }
    }]);
    const response = await result.response;
    const text = response.text();
    console.log(`Generated: ${text}`);
    return text;
}

export const generateText = async (prompt) => {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    console.log(`Generating...`);
    const result = await model.generateContent([`Generate text based on the provided prompt. Remove any phrases like 'ask visio' or 'hey visio.' Ensure the text is concise (under 100 words unless otherwise specified). Avoid introductory phrases such as 'here is the generated text.'
    prompt: ${prompt}`]);
    const response = await result.response;
    const text = response.text();
    console.log(`Generated: ${text}`);
    return text;
}

export default imageToText;