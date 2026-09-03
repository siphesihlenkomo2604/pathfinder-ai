import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  Mail,
  CalendarClock,
  ShieldCheck,
  NotebookPen,
  MessagesSquare,
  Menu,
  X,
  Compass,
} from "lucide-react";

const nav = [
  { to: "/", label: "Email Generator", icon: Mail },
  { to: "/planner", label: "Task Planner", icon: CalendarClock },
  { to: "/analyzer", label: "Job & Scam Analyzer", icon: ShieldCheck },
  { to: "/notes", label: "Meeting Notes", icon: NotebookPen },
  { to: "/mentor", label: "Career Mentor", icon: MessagesSquare },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const links = (
    <nav className="flex flex-col gap-1">
      {nav.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          activeOptions={{ exact: to === "/" }}
          activeProps={{
            className:
              "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground shadow-sm",
          }}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar p-5 lg:flex">
        <Brand />
        <div className="mt-8 flex-1">{links}</div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          PathFinder AI helps you write, plan and decide with confidence.
        </p>
      </aside>

      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-sidebar px-4 py-3 lg:hidden">
        <Brand />
        <button
          aria-label="Toggle navigation"
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg border border-border p-2 text-foreground"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </header>
      {open && (
        <div className="sticky top-[57px] z-30 border-b border-border bg-sidebar px-4 py-3 lg:hidden">{links}</div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto max-w-5xl px-4 pb-24 pt-8 sm:px-8">{children}</div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 px-4 py-2.5 text-center text-xs text-muted-foreground backdrop-blur lg:pl-64">
        AI-generated content may require human review.
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Compass className="h-5 w-5" />
      </span>
      <span className="text-lg font-semibold tracking-tight text-foreground">PathFinder AI</span>
    </div>
  );
}
