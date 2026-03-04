require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function checkModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.log("No GEMINI_API_KEY found in .env.local");
        return;
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    const geminiModels = data.models.filter(m => m.name.includes('gemini'));
    console.log("Available Gemini models:");
    geminiModels.forEach(m => console.log(m.name));
}

checkModels();
