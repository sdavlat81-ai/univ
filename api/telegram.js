
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Faqat POST so'rovi mumkin"
    });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const secret = process.env.TELEGRAM_NOTIFY_SECRET;

  if (!token || !chatId || !secret) {
    return res.status(500).json({
      success: false,
      error: "Server sozlamalari to'liq emas"
    });
  }

  const receivedSecret = req.headers["x-notify-secret"];

  if (receivedSecret !== secret) {
    return res.status(401).json({
      success: false,
      error: "Ruxsat berilmadi"
    });
  }

  const message = req.body?.message;

  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json({
      success: false,
      error: "Xabar matni kerak"
    });
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message.slice(0, 3500)
        })
      }
    );

    const result = await response.json();

    if (!response.ok || !result.ok) {
      return res.status(502).json({
        success: false,
        error: "Telegram xabarni yubora olmadi"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Telegram xabari yuborildi"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Telegram bilan bog'lanishda xatolik"
    });
  }
};
