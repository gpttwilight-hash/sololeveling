import Anthropic from "npm:@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { goal, deadline, weeks = 4 } = await req.json();

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `You are a productivity coach for a gamified life app. Generate ${weeks} weeks of quests for this goal.

Goal: "${goal}"
Deadline: ${deadline ?? "flexible"}

Return ONLY a valid JSON array with no extra text. Each quest object:
{
  "title": "string (max 60 chars, start with action verb)",
  "description": "string (max 120 chars, optional hint)",
  "type": "daily" or "weekly",
  "difficulty": "easy" or "medium" or "hard",
  "attribute": "str" or "int" or "cha" or "dis" or "wlt",
  "xp_reward": number between 50 and 300,
  "coin_reward": number between 25 and 150,
  "week": number from 1 to ${weeks}
}

Rules:
- Max 5 quests per week
- Use Russian language for title and description
- Vary difficulty across weeks (start easier)
- Match attribute to goal domain (health=str, learning=int, social=cha, habits=dis, career/money=wlt)
- Return valid JSON array only, no markdown`
      }],
    });

    const text = (message.content[0] as { type: string; text: string }).text;
    // Extract JSON array robustly
    const match = text.match(/\[[\s\S]*\]/);
    const quests = match ? JSON.parse(match[0]) : [];

    return new Response(JSON.stringify({ quests }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
