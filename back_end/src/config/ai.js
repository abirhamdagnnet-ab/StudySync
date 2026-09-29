import env from "./env.js";

const isConfigured = Boolean(env.GEMINI_API_KEY);

const generateAnswer = async (messages) => {
  const systemInstruction = messages
    .filter((message) => message.role === "system")
    .map((message) => message.content)
    .join("\n\n");
  const contents = messages
    .filter((message) => message.role !== "system")
    .map(({ role, content }) => ({
      role: role === "assistant" ? "model" : "user",
      parts: [{ text: content }],
    }));
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.GEMINI_MODEL)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
        contents,
      }),
      signal: AbortSignal.timeout(env.AI_TIMEOUT_MS),
    },
  );

  if (!response.ok) {
    const error = new Error(`Gemini request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const result = await response.json();
  const answer = result.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!answer) throw new Error("Gemini returned an empty response");
  return answer;
};

export { generateAnswer, isConfigured };
