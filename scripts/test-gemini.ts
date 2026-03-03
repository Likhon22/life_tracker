import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function testGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.GEMINI_MODEL_NAME || "gemini-1.5-flash";

    console.log("🔍 Testing Gemini API Accessibility...");
    console.log(`📡 Model: ${modelName}`);
    console.log(`🔑 API Key: ${apiKey ? (apiKey.substring(0, 5) + "..." + apiKey.substring(apiKey.length - 5)) : "MISSING"}`);

    if (!apiKey) {
        console.error("❌ GEMINI_API_KEY is not set in .env.local");
        process.exit(1);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    try {
        console.log("🚀 Sending test request...");
        const result = await model.generateContent("Say 'Gemini is accessible' if you can hear me.");
        const response = await result.response;
        const text = response.text();

        console.log("✅ Success!");
        console.log(`🤖 Response: ${text}`);
    } catch (error: any) {
        console.error("❌ Gemini API connection failed!");
        if (error.status === 404) {
            console.error("Error 404: The model name you provided was not found. Try 'gemini-1.5-flash'.");
        } else if (error.status === 429) {
            console.error("Error 429: Rate limit exceeded or Quota exhausted.");
        } else {
            console.error(`Error ${error.status || 'Unknown'}: ${error.message}`);
        }
    }
}

testGemini();
