import { createServerFn } from "@tanstack/react-start";
import { streamText } from "ai";
import { z } from "zod";
import { AI_MODEL, createLovableAiGatewayProvider } from "./ai-gateway.server";

async function run(system: string, prompt: string) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const gateway = createLovableAiGatewayProvider(key);
  const result = streamText({
    model: gateway(AI_MODEL),
    system,
    prompt,
  });
  return await result.text;
}

const EmailInput = z.object({
  jobTitle: z.string().min(1),
  recipient: z.string().min(1),
  audience: z.string().min(1),
  tone: z.string().min(1),
  context: z.string().optional(),
});

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => EmailInput.parse(i))
  .handler(async ({ data }) => {
    const text = await run(
      "You are PathFinder AI, an expert workplace communication assistant. Write ready-to-send professional emails. Output plain text only: a 'Subject:' line, then the email body with greeting, 2-3 concise paragraphs, and a sign-off. No commentary, no markdown fences.",
      `Write an email.
Role / Job title context: ${data.jobTitle}
Recipient: ${data.recipient}
Audience type: ${data.audience}
Tone: ${data.tone}
Extra context: ${data.context || "none"}`,
    );
    return { text };
  });

const PlannerInput = z.object({
  hours: z.number(),
  focus: z.string().min(1),
  tasks: z.string().optional(),
});

export const planTasks = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => PlannerInput.parse(i))
  .handler(async ({ data }) => {
    const text = await run(
      "You are PathFinder AI, a productivity planning assistant. Always answer with ONLY a JSON array (no markdown fences) of items shaped {\"time\":string,\"task\":string,\"action\":string,\"priority\":\"High\"|\"Medium\"|\"Low\",\"deadline\":string}. Keep each field short.",
      `Build a realistic daily schedule of blocks fitting ${data.hours} available hours.
Priority focus: ${data.focus}
Known tasks: ${data.tasks || "infer sensible tasks for this focus"}`,
    );
    return { text };
  });

const AnalyzerInput = z.object({ content: z.string().min(1) });

export const analyzeJob = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => AnalyzerInput.parse(i))
  .handler(async ({ data }) => {
    const text = await run(
      "You are PathFinder AI, a job posting analyst and research assistant. Respond in markdown with exactly these sections: '## Key Requirements' (bullets), '## Research Insights' (bullets), '## Scam Risk Check' starting with a line 'Risk Score: N/100 (Low|Medium|High)' followed by bullets of specific red or green flags, and '## Recommended Next Steps' (bullets).",
      `Analyse the following job description or research notes:\n\n${data.content}`,
    );
    return { text };
  });

const NotesInput = z.object({ content: z.string().min(1) });

export const summarizeNotes = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => NotesInput.parse(i))
  .handler(async ({ data }) => {
    const text = await run(
      "You are PathFinder AI, a meeting notes summarizer. Respond in markdown with exactly: '## Key Points' (bullets), '## Action Items' (bullets as 'Owner — task'), '## Deadlines' (bullets as 'Date — what is due'; write 'No explicit deadlines mentioned' if none), '## Open Questions' (bullets).",
      `Summarize these raw meeting notes or transcript:\n\n${data.content}`,
    );
    return { text };
  });

const ChatInput = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })),
});

export const mentorChat = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => ChatInput.parse(i))
  .handler(async ({ data }) => {
    const transcript = data.messages
      .map((m) => `${m.role === "user" ? "User" : "Mentor"}: ${m.content}`)
      .join("\n\n");
    const text = await run(
      "You are PathFinder AI's Career Mentor: a warm, direct career coach for job seekers and professionals. You run interview practice, give feedback with concrete examples, and answer career questions. Keep replies under 200 words, use markdown, and end with one focused follow-up question.",
      `Conversation so far:\n\n${transcript}\n\nMentor:`,
    );
    return { text };
  });
