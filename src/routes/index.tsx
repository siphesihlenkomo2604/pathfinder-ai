import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { generateEmail } from "@/lib/ai.functions";
import {
  ActionButton,
  Card,
  CopyButton,
  ErrorNote,
  Field,
  Input,
  LoadingBlock,
  PageHeader,
  Select,
  Textarea,
} from "@/components/ui-kit";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator — PathFinder AI" },
      {
        name: "description",
        content:
          "Generate polished, tone-matched professional emails for job applications, follow-ups and workplace outreach.",
      },
      { property: "og:title", content: "Smart Email Generator — PathFinder AI" },
      {
        property: "og:description",
        content: "AI-drafted professional emails tailored to your role, recipient and tone.",
      },
    ],
  }),
  component: EmailPage,
});

function EmailPage() {
  const call = useServerFn(generateEmail);
  const [form, setForm] = useState({
    jobTitle: "",
    recipient: "",
    audience: "Hiring Manager",
    tone: "Formal",
    context: "",
  });
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOutput("");
    try {
      const res = await call({ data: form });
      setOutput(res.text);
    } catch {
      setError("The email could not be generated right now. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Smart Email Generator"
        description="Describe the role, recipient and tone. PathFinder AI drafts a structured, ready-to-send email."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <Field label="Job title / role">
              <Input
                required
                value={form.jobTitle}
                onChange={set("jobTitle")}
                placeholder="Junior Data Analyst"
              />
            </Field>
            <Field label="Recipient">
              <Input
                required
                value={form.recipient}
                onChange={set("recipient")}
                placeholder="Ms. Dlamini, Talent Lead at Nedbank"
              />
            </Field>
            <Field label="Audience">
              <Select value={form.audience} onChange={set("audience")}>
                <option>Hiring Manager</option>
                <option>Recruiter</option>
                <option>Colleague</option>
                <option>Client</option>
                <option>Manager / Supervisor</option>
                <option>Networking Contact</option>
              </Select>
            </Field>
            <Field label="Tone">
              <Select value={form.tone} onChange={set("tone")}>
                <option>Formal</option>
                <option>Persuasive</option>
                <option>Enthusiastic</option>
              </Select>
            </Field>
            <Field label="Context (optional)">
              <Textarea
                rows={4}
                value={form.context}
                onChange={set("context")}
                placeholder="Following up after an interview on Tuesday..."
              />
            </Field>
            <ActionButton type="submit" loading={loading}>
              {loading ? "Drafting email..." : "Generate email"}
            </ActionButton>
          </form>
        </Card>

        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Draft</h2>
            {output && <CopyButton text={output} />}
          </div>
          {loading && <LoadingBlock label="Writing your draft..." />}
          {error && <ErrorNote message={error} />}
          {!loading && !error && !output && (
            <p className="text-sm text-muted-foreground">
              Your generated email will appear here, ready to review and copy.
            </p>
          )}
          {output && (
            <Textarea
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              rows={18}
              className="font-mono text-[13px] leading-relaxed"
            />
          )}
        </Card>
      </div>
    </>
  );
}
