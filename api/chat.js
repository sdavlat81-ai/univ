
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Faqat POST so'rovi" });
  }

  try {
    const message = req.body?.message;

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Xabar bo'sh" });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "OPENROUTER_API_KEY sozlanmagan"
      });
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://univ-gilt.vercel.app/",
          "X-Title": "Universal AI"
        },
        body: JSON.stringify({
          model: "openrouter/free",
          messages: [
            {
              role: "system",
              content: "Sen Universal AI nomli foydali, muloyim va ko'p tilli yordamchisan. Foydalanuvchiga uning tilida javob ber."
            },
            {
              role: "user",
              content: message
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "OpenRouter xatosi"
      });
    }

    return res.status(200).json({
      reply: data.choices?.[0]?.message?.content || "Javob olinmadi."
    });

  } catch (error) {
    return res.status(500).json({
      error: "Server xatosi: " + error.message
    });
  }
};
