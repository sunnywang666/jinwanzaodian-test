const AIPING_ENDPOINT = process.env.AIPING_API_ENDPOINT || "https://aiping.cn/api/v1/chat/completions";
const AIPING_MODEL = process.env.AIPING_MODEL || "deepseek-v3";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.AIPING_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Missing AIPING_API_KEY environment variable" });
  }

  const { messages } = req.body || {};
  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  try {
    const upstream = await fetch(AIPING_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: AIPING_MODEL,
        max_tokens: 400,
        messages,
      }),
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: `AIPing API ${upstream.status}`,
        details: text.slice(0, 500),
      });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(502).json({ error: "Invalid JSON from upstream" });
    }

    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return res.status(502).json({ error: "Empty response from upstream" });
    }

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to reach upstream LLM provider",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
