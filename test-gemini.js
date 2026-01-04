
const apiKey = process.env.GEMINI_API_KEY || "YOUR_API_KEY";
const modelUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

async function testHelp() {
    console.log("Fetching models from: " + modelUrl);
    try {
        const resp = await fetch(modelUrl);
        const data = await resp.json();
        console.log("Response Status:", resp.status);
        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => console.log("- " + m.name));
        } else {
            console.log("Error Response:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

testHelp();
