
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

    // Ob-havo savolini aniqlash
    const normalized = message.toLowerCase().replace(/['ʻ’`]/g, "");
    const isWeather =
      /ob.?havo|obu.?xavo|havo qanday|weather|temperatura|harorat|yomgir yogadimi|qor yogadimi/.test(normalized);

    let weatherInfo = "";

    if (isWeather) {
      const cities = [
        ["toshkent", "Tashkent"],
        ["samarqand", "Samarkand"],
        ["buxoro", "Bukhara"],
        ["andijon", "Andijan"],
        ["namangan", "Namangan"],
        ["fargona", "Fergana"],
        ["qarshi", "Karshi"],
        ["nukus", "Nukus"],
        ["jizzax", "Jizzakh"],
        ["guliston", "Gulistan"],
        ["termiz", "Termez"],
        ["urganch", "Urgench"]
      ];

      let city = "Tashkent";

      for (const [alias, english] of cities) {
        if (normalized.includes(alias)) {
          city = english;
          break;
        }
      }

      try {
        const geoResponse = await fetch(
          "https://geocoding-api.open-meteo.com/v1/search?name=" +
          encodeURIComponent(city) +
          "&count=1&language=en&format=json"
        );

        const geoData = await geoResponse.json();
        const place = geoData.results?.[0];

        if (place) {
          const weatherResponse = await fetch(
            "https://api.open-meteo.com/v1/forecast?latitude=" +
            place.latitude +
            "&longitude=" +
            place.longitude +
            "&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&timezone=auto"
          );

          const weather = await weatherResponse.json();
          const current = weather.current;

          if (current) {
            const descriptions = {
              0: "Ochiq osmon",
              1: "Asosan ochiq",
              2: "Qisman bulutli",
              3: "Bulutli",
              45: "Tuman",
              48: "Qirovli tuman",
              51: "Yengil mayda yomgir",
              53: "Mayda yomgir",
              55: "Kuchli mayda yomgir",
              61: "Yengil yomgir",
              63: "Yomgir",
              65: "Kuchli yomgir",
              71: "Yengil qor",
              73: "Qor",
              75: "Kuchli qor",
              80: "Yomgir yogishi",
              81: "Yomgir",
              82: "Kuchli yomgir",
              95: "Momaqaldiroq"
            };

            weatherInfo = `
Haqiqiy ob-havo ma'lumotlari:
Shahar: ${place.name}
Harorat: ${current.temperature_2m}°C
His qilinadigan harorat: ${current.apparent_temperature}°C
Holat: ${descriptions[current.weather_code] || "Ob-havo ma'lumoti"}
Namlik: ${current.relative_humidity_2m}%
Shamol: ${current.wind_speed_10m} km/soat
Yog'ingarchilik: ${current.precipitation} mm
Ma'lumot manbasi: Open-Meteo.
`;
          }
        }
      } catch (error) {
        weatherInfo = "Hozir ob-havo ma'lumotini olish imkoni bo'lmadi.";
      }
    }

    const systemPrompt = `
Sen Universal AI nomli aqlli, muloyim va kuchli yordamchisan.

QOIDALAR:
1. Foydalanuvchiga uning tilida javob ber.
2. O'zbek tilini juda yaxshi tushun.
3. Imlo xatolarini to'g'ri angla.
4. "Obu xavo", "obuxavo", "xavo" kabi yozuvlarni ob-havo deb tushun.
5. Foydalanuvchini imlo xatosi uchun tanqid qilma.
6. Savolga to'g'ridan-to'g'ri va aniq javob ber.
7. Keraksiz uzun tushuntirishlar yozma.
8. Bilmagan narsangni to'qib chiqarmagin.
9. Ovozni o'qish uchun qulay, tabiiy jumlalardan foydalan.
10. Ob-havo haqidagi javobda faqat berilgan haqiqiy ma'lumotlardan foydalan.

${weatherInfo}
`;

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
              content: systemPrompt
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
      reply:
        data.choices?.[0]?.message?.content ||
        "Javob olinmadi."
    });

  } catch (error) {
    return res.status(500).json({
      error: "Server xatosi: " + error.message
    });
  }
};
