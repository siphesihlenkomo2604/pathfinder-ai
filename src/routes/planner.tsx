import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { planTasks } from "@/lib/ai.functions";
import {
  ActionButton,
  Card,
  ErrorNote,
  Field,
  Input,
  LoadingBlock,
  PageHeader,
  Textarea,
} from "@/components/ui-kit";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "AI Task Planner — PathFinder AI" },
      {
        name: "description",
        content:
          "Turn your available hours and priority focus into a prioritised, deadline-aware daily schedule.",
      },
      { property: "og:title", content: "AI Task Planner — PathFinder AI" },
      {
        property: "og:description",
        content: "A prioritised daily schedule generated around your available hours.",
      },
    ],
  }),
  component: PlannerPage,
});

type Row = { time: string; task: string; action: string; priority: string; deadline: string };

function parseRows(text: string): Row[] {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1) return [];
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    return Array.isArray(parsed) ? (parsed as Row[]) : [];
  } catch {
    return [];
  }
}

const priorityClass: Record<string, string> = {
  High: "bg-destructive/15 text-destructive",
  Medium: "bg-warning/20 text-foreground",
  Low: "bg-success/15 text-success",
};

function PlannerPage() {
  const call = useServerFn(planTasks);
  const [hours, setHours] = useState("6");
  const [focus, setFocus] = useState("");
  const [tasks, setTasks] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [done, setDone] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setRows([]);
    setDone({});
    try {
      const res = await call({ data: { hours: Number(hours) || 6, focus, tasks } });
      const parsed = parseRows(res.text);
      if (!parsed.length) throw new Error("empty");
      setRows(parsed);
    } catch {
      setError("The schedule could not be generated right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="AI Task Planner"
        description="Tell PathFinder AI how much time you have and what matters most today. Get a prioritised schedule you can work through."
      />
      <div className="grid gap-6">
        <Card>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <Field label="Available hours today">
              <Input
                type="number"
                min={1}
                max={16}
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </Field>
            <Field label="Priority focus">
              <Input
                required
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                placeholder="Job applications & interview prep"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Known tasks (optional)">
                <Textarea
                  rows={3}
                  value={tasks}
                  onChange={(e) => setTasks(e.target.value)}
                  placeholder="Finish portfolio case study, follow up with two recruiters..."
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <ActionButton type="submit" loading={loading}>
                {loading ? "Building schedule..." : "Generate schedule"}
              </ActionButton>
            </div>
          </form>
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Today&apos;s schedule</h2>
          {loading && <LoadingBlock label="Prioritising your day..." />}
          {error && <ErrorNote message={error} />}
          {!loading && !error && rows.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Your generated schedule grid will appear here.
            </p>
          )}
          {rows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-separate border-spacing-y-2 text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-1">Done</th>
                    <th className="px-3 py-1">Time</th>
                    <th className="px-3 py-1">Task</th>
                    <th className="px-3 py-1">Action</th>
                    <th className="px-3 py-1">Priority</th>
                    <th className="px-3 py-1">Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr
                      key={i}
                      className={`rounded-xl bg-background/70 align-top ${done[i] ? "opacity-50" : ""}`}
                    >
                      <td className="rounded-l-xl border-y border-l border-border px-3 py-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-[oklch(0.53_0.048_63)]"
                          checked={!!done[i]}
                          onChange={() => setDone((d) => ({ ...d, [i]: !d[i] }))}
                        />
                      </td>
                      <td className="border-y border-border px-3 py-3 whitespace-nowrap font-medium">
                        {r.time}
                      </td>
                      <td className="border-y border-border px-3 py-3 font-medium">{r.task}</td>
                      <td className="border-y border-border px-3 py-3 text-muted-foreground">
                        {r.action}
                      </td>
                      <td className="border-y border-border px-3 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${priorityClass[r.priority] ?? "bg-accent"}`}
                        >
                          {r.priority}
                        </span>
                      </td>
                      <td className="rounded-r-xl border-y border-r border-border px-3 py-3 whitespace-nowrap text-muted-foreground">
                        {r.deadline}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
