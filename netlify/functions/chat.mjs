
export default async (request) => {
  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Please send a POST request." }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error("OPENAI_API_KEY is missing from Netlify environment variables.");

    return new Response(
      JSON.stringify({
        error: "The AI service is not configured. Please contact the website administrator."
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request body." }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  const message =
    typeof body.message === "string" ? body.message.trim() : "";

  if (!message) {
    return new Response(
      JSON.stringify({ error: "Please enter a question." }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  if (message.length > 4000) {
    return new Response(
      JSON.stringify({
        error: "Please shorten your question to 4,000 characters or fewer."
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  const instructions = `
You are CyberAware, a helpful cybersecurity awareness assistant
for college students and the local community in India.

Give clear, practical advice about phishing, UPI scams, online fraud,
suspicious calls, passwords, account security, privacy, and cybercrime reporting.

Never ask users to share passwords, OTPs, PINs, full card numbers,
or other sensitive personal information.

For suspected financial cyber fraud in India, advise the user to contact
their bank immediately and call the national cyber financial fraud helpline
1930 as soon as possible. They can also use https://cybercrime.gov.in/.
For immediate physical danger, advise calling 112 or local police.

Do not claim to be police, a lawyer, or an official government service.
Explain uncertainty when appropriate and recommend official sources
for important decisions. Be concise, friendly, and easy to understand.
`;

  try {
    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          instructions,
          input: message,
          store: false
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      // Keep API credentials and sensitive details out of public responses.
      console.error(
        "OpenAI API request failed:",
        response.status,
        result?.error?.code || "unknown_error",
        result?.error?.message || "No error message returned"
      );

      const status = response.status === 429 ? 429 : 502;

      return new Response(
        JSON.stringify({
          error: response.status === 429
            ? "The AI service has reached a usage limit. Please try again later."
            : "The AI service could not answer right now. Please try again later."
        }),
        {
          status,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const answer = (result.output || [])
      .flatMap((item) => item.content || [])
      .filter((item) => item.type === "output_text")
      .map((item) => item.text)
      .join("\n")
      .trim();

    if (!answer) {
      console.error("OpenAI returned no text output.");

      return new Response(
        JSON.stringify({
          error: "No answer was returned. Please try asking another question."
        }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    return new Response(
      JSON.stringify({ answer }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Chat function error:", error.message);

    return new Response(
      JSON.stringify({
        error: "The AI service is temporarily unavailable. Please try again."
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
