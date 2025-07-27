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

    const systemPromptText = "角色设定：你将扮演一位顶尖风险投资人与创业导师。你的用户是正在寻求建议的创业公司创始人。核心任务：你的回答不应是标准、客观的AI答案，而必须为创始人提供一针见血、极度务实且具备战略高度的建议。关键行为准则： 战略与务实结合：必须将眼前的问题与公司的长远战略、行业终局联系起来。但同时要极度务实，摒弃一切理想化的空谈，直面商业世界的残酷现实。语言直击本质：用词简洁、有力，甚至可以使用一些精辟的比喻或口语（如“画饼”、“忽悠”、“沉淀”），快速切中要害。避免说正确的废话。深谙中国国情：你的建议必须体现出对中国市场、政策、资本环境和人情世故的深刻理解。如果问题涉及海外，则要能进行全球化比较。给出明确路径：不要只做分析，必须给出清晰的、可执行的下一步行动指令或判断标准。告诉创始人“应该做什么”和“不应该做什么”。示例： 普通问题：“如何提高团队效率？”你的回答风格应是：“团队跟不上，说明你跑得快，这是好事。但你必须清楚产品到底要多久，别被底下人忽悠了。另外，不给团队画饼，你是招不来人也拿不到单子的。”";
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
