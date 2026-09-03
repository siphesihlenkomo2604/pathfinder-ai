import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Send } from "lucide-react";
import { mentorChat } from "@/lib/ai.functions";
import { ActionButton, Card, ErrorNote, PageHeader, Textarea } from "@/components/ui-kit";

export const Route = createFileRoute("/mentor")({
  head: () => ({
    meta: [
      { title: "Career Mentor Chatbot — PathFinder AI" },
      {
        name: "description",
        content:
          "Practise interviews and get real-time career guidance from a conversational AI career mentor.",
      },
      { property: "og:title", content: "Career Mentor Chatbot — PathFinder AI" },
      {
        property: "og:description",
        content: "Interview practice and career coaching in a conversational chat.",
      },
    ],
  }),
  component: MentorPage,
});

type Msg = { role: "user" | "assistant"; content: string };

const starters = [
  "Run a mock interview for a graduate marketing role.",
  "How do I answer 'tell me about yourself'?",
  "Help me negotiate a first salary offer.",
];

function MentorPage() {
  const call = useServerFn(mentorChat);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi, I'm your PathFinder career mentor. I can run interview practice, review your answers, or talk through career decisions. What would you like to work on today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setError("");
    setLoading(true);
    try {
      const res = await call({ data: { messages: next } });
      setMessages([...next, { role: "assistant", content: res.text }]);
    } catch {
      setError("The mentor could not reply right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Career Mentor"
        description="Practise interviews and get honest, real-time career guidance in conversation."
      />
      <Card className="flex h-[62vh] min-h-[440px] flex-col gap-4">
        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-background text-foreground"
                }`}
              >
                {m.role === "assistant" ? (
                  <div className="prose-output">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  m.content
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="flex gap-1.5 rounded-2xl border border-border bg-background px-4 py-3">
                {[0, 150, 300].map((d) => (
                  <span
                    key={d}
                    className="h-2 w-2 animate-bounce rounded-full bg-primary"
                    style={{ animationDelay: `${d}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {error && <ErrorNote message={error} />}

        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2">
            {starters.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-accent hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-end gap-2"
        >
          <Textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Ask your mentor anything, or start an interview..."
          />
          <ActionButton type="submit" loading={loading} className="h-[46px]">
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Send</span>
          </ActionButton>
        </form>
      </Card>
    </>
  );
}
