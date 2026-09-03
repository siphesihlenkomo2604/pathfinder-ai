import { Loader2, Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDictation } from "@/lib/dictation";

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function MicButton({
  onText,
  label = "Dictate",
  className,
}: {
  onText: (text: string) => void;
  label?: string;
  className?: string;
}) {
  const { state, error, seconds, toggle } = useDictation(onText);

  const recording = state === "recording";
  const busy = state === "transcribing";

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-label={recording ? "Stop recording" : label}
        title={recording ? "Stop recording" : label}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-full border transition disabled:opacity-60",
          recording
            ? "animate-pulse border-destructive bg-destructive/15 text-destructive"
            : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
        )}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : recording ? (
          <Square className="h-3.5 w-3.5 fill-current" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </button>
      {recording && (
        <span className="text-xs font-medium text-destructive">Listening… {fmt(seconds)}</span>
      )}
      {busy && <span className="text-xs text-muted-foreground">Transcribing…</span>}
      {!recording && !busy && error && <span className="text-xs text-destructive">{error}</span>}
    </span>
  );
}
