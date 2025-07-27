// api/chat.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { message } = req.body;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
      console.error("GEMINI_API_KEY is not set.");
      return res.status(500).json({ error: 'Server configuration error.' });
    }

    const geminiApiUrl =
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent?key=${geminiApiKey}`;

    const systemPromptText = "ROLE-SETTING: You are a top-tier venture capitalist...";
    const combinedPrompt = `${systemPromptText} --- USER QUESTION: ${message}`;

    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: combinedPrompt }],
        },
      ],
    };

    const geminiResponse = await fetch(geminiApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const geminiData = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error("Gemini API Error:", geminiData);
      return res
        .status(geminiResponse.status)
        .json({ error: geminiData.error?.message || "AI request failed." });
    }

    const replyText =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn't generate a response.";

    return res.status(200).json({ reply: replyText });
  } catch (err) {
    console.error("Function Error:", err);
    return res.status(500).json({ error: "An internal server error occurred." });
  }
}
