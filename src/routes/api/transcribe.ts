import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return new Response(JSON.stringify({ error: "Transcription is not configured." }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return new Response(JSON.stringify({ error: "Expected an audio upload." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const file = form.get("file");
        if (!(file instanceof File) || file.size < 2048) {
          return new Response(
            JSON.stringify({ error: "That recording was empty — please try again." }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }
        if (file.size > 24 * 1024 * 1024) {
          return new Response(
            JSON.stringify({ error: "That audio file is too large (max 24 MB)." }),
            { status: 413, headers: { "Content-Type": "application/json" } },
          );
        }

        const ext =
          (
            {
              "audio/wav": "wav",
              "audio/x-wav": "wav",
              "audio/wave": "wav",
              "audio/mpeg": "mp3",
              "audio/mp3": "mp3",
              "audio/mp4": "mp4",
              "audio/m4a": "m4a",
              "audio/x-m4a": "m4a",
              "audio/webm": "webm",
              "audio/flac": "flac",
            } as Record<string, string>
          )[file.type.split(";")[0] ?? ""] ?? "wav";

        const upstream = new FormData();
        upstream.append("model", "openai/gpt-4o-transcribe");
        upstream.append("file", file, `recording.${ext}`);

        const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}` },
          body: upstream,
        });

        if (!res.ok) {
          const detail = await res.text().catch(() => "");
          return new Response(
            JSON.stringify({
              error:
                res.status === 429
                  ? "Too many requests right now — please try again shortly."
                  : `Transcription failed (${res.status}). ${detail.slice(0, 200)}`,
            }),
            { status: res.status, headers: { "Content-Type": "application/json" } },
          );
        }

        const json = (await res.json()) as { text?: string };
        return new Response(JSON.stringify({ text: json.text ?? "" }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
