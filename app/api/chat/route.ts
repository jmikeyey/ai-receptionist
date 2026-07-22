import { groq } from "@ai-sdk/groq";
import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from "ai";
import { DateTime } from "luxon";
import { getBusiness, ensureConversation, saveMessage } from "@/lib/db/queries";
import { buildSystemPrompt } from "@/lib/ai/prompt";
import { buildReceptionistTools } from "@/lib/ai/tools";

export const maxDuration = 30;

const MODEL = "openai/gpt-oss-120b";

function textOf(message: UIMessage): string {
  return (message.parts ?? [])
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
    .trim();
}

export async function POST(req: Request) {
  const { messages, businessId, conversationId } = (await req.json()) as {
    messages: UIMessage[];
    businessId: string;
    conversationId: string;
  };

  if (!businessId || !conversationId) {
    return Response.json({ error: "businessId and conversationId are required." }, { status: 400 });
  }

  const business = await getBusiness(businessId);
  if (!business) return Response.json({ error: "Business not found." }, { status: 404 });

  const nowLocal = DateTime.now().setZone(business.timezone).toFormat("cccc, LLL d yyyy, h:mm a");
  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: groq(MODEL),
    temperature: 0,
    system: buildSystemPrompt(business, nowLocal),
    messages: modelMessages,
    tools: buildReceptionistTools(business),
    stopWhen: stepCountIs(6),
    // Free models are more reliable emitting one tool call at a time.
    providerOptions: { groq: { parallelToolCalls: false } },
    onError: ({ error }) => console.error("receptionist stream error", error),
    onFinish: async ({ text }) => {
      try {
        await ensureConversation(conversationId, businessId);
        const lastUser = [...messages].reverse().find((m) => m.role === "user");
        if (lastUser) await saveMessage(conversationId, "user", textOf(lastUser));
        await saveMessage(conversationId, "assistant", text);
      } catch (err) {
        console.error("persist turn failed", err);
      }
    },
  });

  return result.toUIMessageStreamResponse({
    onError: () => "Sorry — I hit a problem. Please try again, or email us directly.",
  });
}
