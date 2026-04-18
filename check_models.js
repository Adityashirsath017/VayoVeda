require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    try {
        // There isn't a direct listModels on genAI instance in some versions, 
        // but typically we can try to guess or use a known working model.
        // However, let's try a standard model first.
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hello");
        console.log("gemini-pro check:", result.response.text());
    } catch (error) {
        console.error("Error with gemini-pro:", error.message);
    }

    try {
        const model2 = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result2 = await model2.generateContent("Hello");
        console.log("gemini-1.5-flash check:", result2.response.text());
    } catch (error) {
        console.error("Error with gemini-1.5-flash:", error.message);
    }
}

listModels();
