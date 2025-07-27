// api/chat.js

// Using node-fetch is a good practice for compatibility, but Vercel provides a global fetch.
// For robustness, you could add 'node-fetch' to your package.json.
// For this example, we'll rely on the provided fetch.

exports.handler = async function (event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const { message } = JSON.parse(event.body);
        const geminiApiKey = process.env.GEMINI_API_KEY;

        if (!geminiApiKey) {
            console.error("GEMINI_API_KEY is not set.");
            return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error.' }) };
        }

        const geminiApiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro-latest:generateContent?key=${geminiApiKey}`;
        const systemPromptText = "ROLE-SETTING: You are a top-tier venture capitalist...";
        const combinedPrompt = `${systemPromptText} --- USER QUESTION: ${message}`;

        const payload = {
            contents: [{ "role": "user", "parts": [{ "text": combinedPrompt }] }],
        };

        const geminiResponse = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const geminiData = await geminiResponse.json();

        if (!geminiResponse.ok) {
            console.error('Gemini API Error:', geminiData);
            return { statusCode: geminiResponse.status, body: JSON.stringify({ error: geminiData.error?.message || 'Failed to get response from AI.' }) };
        }

        // **FIX:** Extract only the text you need.
        const replyText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response.";

        return {
            statusCode: 200,
            // **FIX:** Send a simple, clean object back to the frontend.
            body: JSON.stringify({ reply: replyText })
        };

    } catch (error) {
        console.error('Function Error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'An internal server error occurred.' }) };
    }
};