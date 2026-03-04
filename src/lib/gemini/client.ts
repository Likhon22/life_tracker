import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export function getGeminiModel(): GenerativeModel {
    if (!genAI) {
        throw new Error("GEMINI_API_KEY is not configured in .env.local");
    }
    const modelName = process.env.GEMINI_MODEL_NAME || "gemini-1.5-flash";
    return genAI.getGenerativeModel({ model: modelName });
}
