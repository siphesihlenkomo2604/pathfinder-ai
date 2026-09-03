import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { analyzeJob } from "@/lib/ai.functions";
import { MicButton } from "@/components/MicButton";
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

export const Route = createFileRoute("/analyzer")({
  head: () => ({
    meta: [
      { title: "Job & Scam Analyzer — PathFinder AI" },
      {
        name: "description",
        content:
          "Paste any job description to extract key requirements, research insights and a scam risk score.",
      },
      { property: "og:title", content: "Job & Scam Analyzer — PathFinder AI" },
      {
        property: "og:description",
        content: "Spot red flags and key requirements in any job posting before you apply.",
      },
    ],
  }),
  component: AnalyzerPage,
});

function riskFrom(text: string) {
  const m = text.match(/Risk Score:\s*(\d{1,3})/i);
  return m ? Math.min(100, Number(m[1])) : null;
}

function AnalyzerPage() {
  const call = useServerFn(analyzeJob);
  const [content, setContent] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const score = output ? riskFrom(output) : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOutput("");
    try {
      const res = await call({ data: { content } });
      setOutput(res.text);
    } catch {
      setError("The analysis could not be completed right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Job & Scam Analyzer"
        description="Paste a job description or research notes. PathFinder AI extracts requirements, adds research insight and flags scam risk."
      />
      <div className="grid gap-6">
        <Card>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <Field
              label="Job description or research notes"
              action={<MicButton onText={(t) => setContent((v) => (v ? `${v} ${t}` : t))} label="Dictate notes" />}
            >
              <Textarea
                required
                rows={10}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste the full posting here, including contact details and pay information..."
              />
            </Field>
            <ActionButton type="submit" loading={loading}>
              {loading ? "Analysing..." : "Analyse posting"}
            </ActionButton>
          </form>
        </Card>

        {loading && (
          <Card>
            <LoadingBlock label="Checking requirements and scam signals..." />
          </Card>
        )}
        {error && (
          <Card>
            <ErrorNote message={error} />
          </Card>
        )}

        {output && (
          <Card className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Analysis</h2>
              <CopyButton text={output} />
            </div>
            {score !== null && (
              <div className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium">Scam risk score</span>
                  <span className="font-semibold">{score}/100</span>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-accent">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      score < 34 ? "bg-success" : score < 67 ? "bg-warning" : "bg-destructive"
                    }`}
                    style={{ width: `${score}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {score < 34
                    ? "Low risk — looks like a legitimate posting."
                    : score < 67
                      ? "Medium risk — verify the company and never pay any fees."
                      : "High risk — strong scam indicators, proceed with caution."}
                </p>
              </div>
            )}
            <div className="prose-output text-sm leading-relaxed">
              <ReactMarkdown>{output}</ReactMarkdown>
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
