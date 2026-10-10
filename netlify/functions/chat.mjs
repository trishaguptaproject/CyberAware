
export default async function handler(request) {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  };

  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Only POST requests are supported." }),
      { status: 405, headers }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "The AI service is not configured. Please contact the website administrator."
      }),
      { status: 503, headers }
    );
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request." }),
      { status: 400, headers }
    );
  }

  const message =
    typeof body.message === "string" ? body.message.trim() : "";

  const language = body.language === "hi" ? "Hindi" : "English";

  if (!message || message.length > 1000) {
    return new Response(
      JSON.stringify({
        error: "Please enter a question between 1 and 1000 characters."
      }),
      { status: 400, headers }
    );
  }

  const instructions = `
You are CyberAware Assistant, an educational cybersecurity awareness
assistant for college students and local communities in India.

Answer in ${language}. Use simple language for beginners.

Help with phishing, UPI scams, OTP fraud, malware, passwords, online
privacy, account security, cyberbullying and reporting suspected cybercrime.

You are NOT a police officer, lawyer, government official or emergency service.
Never claim to file a police complaint or contact police for the user.
Never ask for passwords, OTPs, PINs, bank details, recovery codes or sensitive
identity information.

For suspected financial cyber fraud in India, advise the user to contact their
bank or payment provider immediately and call 1930 promptly. Refer them to
https://cybercrime.gov.in/.

For immediate danger or an emergency in India, advise contacting local police
or calling 112.

Suggest preserving relevant evidence and securing affected accounts when
appropriate. Do not invent phone numbers, complaint status or legal guarantees.
If uncertain, say so and refer to official sources.

Keep the answer concise, practical and focused on cyber safety.
Do not request personal information. Your advice is educational, not a substitute
for official assistance or legal advice.
`;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        instructions,
        input: message,
        max_output_tokens: 450,
        store: false
      })
    });

    if (!response.ok) {
      // Do not expose API keys or internal provider errors to website visitors.
      console.error("AI provider returned status:", response.status);

      return new Response(
        JSON.stringify({
          error: "The AI service is temporarily unavailable. Please try again later."
        }),
        { status: 502, headers }
      );
    }

    const data = await response.json();

    const answer = (data.output || [])
      .filter(item => item.type === "message")
      .flatMap(item => item.content || [])
      .filter(item => item.type === "output_text")
      .map(item => item.text)
      .join("\n")
      .trim();

    if (!answer) {
      return new Response(
        JSON.stringify({ error: "No answer was returned. Please try again." }),
        { status: 502, headers }
      );
    }

    return new Response(
      JSON.stringify({ answer }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error("CyberAware AI request failed.");

    return new Response(
      JSON.stringify({
        error: "Could not connect to the AI service. Please try again later."
      }),
      { status: 502, headers }
    );
  }
}
