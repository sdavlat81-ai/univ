
export default async (request) => {
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Faqat POST so'rovi" }),
      { status: 405 }
    );
  }

  try {
    const { message } = await request.json();

    if (!message || !message.trim()) {
      return new Response(
        JSON.stringify({ error: "Xabar bo'sh" }),
        { status: 400 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        reply: "Universal AI serveri ishlayapti! Sizning xabaringiz: " + message
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "Xatolik yuz berdi" }),
      { status: 400 }
    );
  }
};
