import { useCallback, useRef, useState } from "react";

/** Encode mono Float32 PCM chunks into a 16-bit WAV blob at 16 kHz. */
function encodeWav(chunks: Float32Array[], sampleRate: number): Blob {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const merged = new Float32Array(total);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.length;
  }

  const targetRate = 16000;
  const ratio = sampleRate / targetRate;
  const outLength = ratio > 1 ? Math.floor(merged.length / ratio) : merged.length;
  const samples = new Float32Array(outLength);
  for (let i = 0; i < outLength; i++) samples[i] = merged[Math.floor(i * ratio)] ?? 0;
  const rate = ratio > 1 ? targetRate : sampleRate;

  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeStr = (pos: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(pos + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, samples.length * 2, true);
  let p = 44;
  for (let i = 0; i < samples.length; i++, p += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(p, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}

export async function transcribeBlob(blob: Blob, filename = "recording.wav"): Promise<string> {
  const body = new FormData();
  body.append("file", blob, filename);
  const res = await fetch("/api/transcribe", { method: "POST", body });
  const json = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
  if (!res.ok) throw new Error(json.error || "Transcription failed. Please try again.");
  return (json.text ?? "").trim();
}

export type DictationState = "idle" | "recording" | "transcribing";

export function useDictation(onText: (text: string) => void) {
  const [state, setState] = useState<DictationState>("idle");
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(0);
  const ref = useRef<{
    stream: MediaStream;
    ctx: AudioContext;
    node: ScriptProcessorNode;
    source: MediaStreamAudioSourceNode;
    chunks: Float32Array[];
    timer: ReturnType<typeof setInterval>;
  } | null>(null);

  const start = useCallback(async () => {
    setError("");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("Microphone access is needed to record.");
      return;
    }
    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const node = ctx.createScriptProcessor(4096, 1, 1);
    const chunks: Float32Array[] = [];
    node.onaudioprocess = (e) => chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
    source.connect(node);
    node.connect(ctx.destination);
    setSeconds(0);
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    ref.current = { stream, ctx, node, source, chunks, timer };
    setState("recording");
  }, []);

  const stop = useCallback(async () => {
    const r = ref.current;
    if (!r) return;
    ref.current = null;
    clearInterval(r.timer);
    r.stream.getTracks().forEach((t) => t.stop());
    r.node.disconnect();
    r.source.disconnect();
    const blob = encodeWav(r.chunks, r.ctx.sampleRate);
    await r.ctx.close();
    if (blob.size < 2048) {
      setState("idle");
      setError("That recording was empty — please try again.");
      return;
    }
    setState("transcribing");
    try {
      const text = await transcribeBlob(blob);
      if (text) onText(text);
      else setError("No speech was detected — please try again.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transcription failed. Please try again.");
    } finally {
      setState("idle");
    }
  }, [onText]);

  const toggle = useCallback(() => {
    if (state === "recording") void stop();
    else if (state === "idle") void start();
  }, [state, start, stop]);

  return { state, error, seconds, start, stop, toggle };
}
