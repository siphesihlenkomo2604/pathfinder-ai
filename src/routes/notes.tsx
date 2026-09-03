import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { summarizeNotes } from "@/lib/ai.functions";
import {
  ActionButton,
  Card,
  CopyButton,
  ErrorNote,
  Field,
  LoadingBlock,
  PageHeader,
  Textarea,
} from "@/components/ui-kit";

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "Meeting Notes Summarizer — PathFinder AI" },
      {
        name: "description",
        content:
          "Turn raw meeting notes or transcripts into key points, owned action items and clear deadlines.",
      },
      { property: "og:title", content: "Meeting Notes Summarizer — PathFinder AI" },
      {
        property: "og:description",
        content: "Key points, action items and deadlines extracted from any transcript.",
      },
    ],
  }),
  component: NotesPage,
});

function NotesPage() {
  const call = useServerFn(summarizeNotes);
  const [content, setContent] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOutput("");
    try {
      const res = await call({ data: { content } });
      setOutput(res.text);
    } catch {
      setError("The summary could not be generated right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Meeting Notes Summarizer"
        description="Paste raw notes or a transcript and get a clean summary with action items and deadlines."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <Field label="Raw notes or transcript">
              <Textarea
                required
                rows={14}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste the meeting transcript or your rough notes here..."
              />
            </Field>
            <ActionButton type="submit" loading={loading}>
              {loading ? "Summarising..." : "Summarise notes"}
            </ActionButton>
          </form>
        </Card>

        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Summary</h2>
            {output && <CopyButton text={output} />}
          </div>
          {loading && <LoadingBlock label="Pulling out key points and actions..." />}
          {error && <ErrorNote message={error} />}
          {!loading && !error && !output && (
            <p className="text-sm text-muted-foreground">
              Key points, action items and deadlines will appear here.
            </p>
          )}
          {output && (
            <div className="prose-output text-sm leading-relaxed">
              <ReactMarkdown>{output}</ReactMarkdown>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
