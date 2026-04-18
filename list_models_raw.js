require("dotenv").config();

async function listModels() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error("API Key missing");
        return;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    console.log("Fetching models from:", url.replace(key, "HIDDEN_KEY"));

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error("API Error:", JSON.stringify(data.error, null, 2));
        } else {
            console.log("Available Models:");
            (data.models || []).forEach(m => console.log(`- ${m.name}`));
        }
    } catch (error) {
        console.error("Network Error:", error);
    }
}

listModels();
