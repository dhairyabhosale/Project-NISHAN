"use client";

/* In-browser e-KYC by camera. The answer to P7 and P10.
 *
 * P7 is the e-KYC dead end: the portal's mandatory identity step depends on an
 * OTP to the Aadhaar-linked mobile, and when that number is stale the web path
 * fails with no in-browser alternative - the reader is ejected to an app
 * download or a Common Service Centre. A camera needs no phone number, so it
 * works for exactly the person the OTP route abandons.
 *
 * WHAT IS REAL HERE: the camera. getUserMedia is a genuine permission prompt,
 * the preview is the reader's real video stream, and the liveness prompts are
 * real instructions they have to follow.
 *
 * WHAT IS SIMULATED: the verification. There is no real UIDAI system, and the
 * captured frame is resolved against the mock records. Said on screen, at the
 * moment of highest risk of being believed (§12.7).
 *
 * WHAT NEVER HAPPENS: the frame never leaves the device. It is drawn to a
 * canvas in memory, its dimensions are checked, and it is discarded - there is
 * no upload, no fetch carrying image data, and no storage write. §12.1 and
 * §12.5 both forbid collecting what we do not need, and a photograph of a
 * reader's face is the clearest possible example of something we do not need.
 * The CSP (connect-src 'self') means a browser would block an upload even if
 * this code tried, which is worth more than the promise.
 *
 * THE TRACK IS ALWAYS STOPPED. Every exit path - success, cancel, unmount,
 * error - runs stop(). A camera light left on after the reader thinks they are
 * finished would be the single worst thing in this build.
 *
 * This component is loaded dynamically so its code never reaches any other
 * route: §11.9 caps the primary path at 150KB and a camera is not on it.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "./LocaleProvider";
import { resolve } from "../content/resolve";
import type { CatalogueKey } from "../lib/content";

type Phase = "idle" | "starting" | "center" | "turn" | "blink" | "ready" | "denied";

const PROMPT: Record<"center" | "turn" | "blink" | "ready", CatalogueKey> = {
  center: "act.ekyc.step_center",
  turn: "act.ekyc.step_turn",
  blink: "act.ekyc.step_blink",
  ready: "act.ekyc.step_hold"
};

/** Long enough for the reader to actually do the thing being asked. */
const STEP_MS = 2600;

export function FaceCheck({ onVerified }: { onVerified: () => void }) {
  const { locale } = useLocale();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");

  /** The only way the camera is released, and every path leads here. */
  const stop = useCallback(() => {
    const stream = streamRef.current;
    streamRef.current = null;
    if (stream) for (const track of stream.getTracks()) track.stop();
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  // Unmount, navigation, tab close: the light goes off.
  useEffect(() => stop, [stop]);

  async function start() {
    setPhase("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => { /* autoplay policy; the stream is still live */ });
      }
      setPhase("center");
    } catch {
      // Denied, no camera, or an insecure origin. Never a dead end (§10.4).
      stop();
      setPhase("denied");
    }
  }

  /* The liveness sequence. Prompts advance on a timer rather than on detection:
     real face and gesture detection would mean a model, and §16.2 keeps models
     out of this build entirely. The prompts are real instructions and the
     camera is real - what is simulated is the judgement, which is exactly what
     the disclosure says. */
  useEffect(() => {
    if (phase !== "center" && phase !== "turn" && phase !== "blink") return;
    const next: Record<string, Phase> = { center: "turn", turn: "blink", blink: "ready" };
    const id = window.setTimeout(() => setPhase(next[phase]), STEP_MS);
    return () => window.clearTimeout(id);
  }, [phase]);

  /** Capture, check, discard. Nothing survives this function. */
  function finish() {
    const video = videoRef.current;
    let captured = false;
    if (video && video.videoWidth > 0) {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        captured = canvas.width > 0 && canvas.height > 0;
        // Discarded here, in this scope, before anything else can reach it.
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = 0;
        canvas.height = 0;
      }
    }
    stop();
    if (captured) onVerified();
    else setPhase("denied");
  }

  if (phase === "denied") {
    return (
      <p className="mt-4 rounded-card border-2 border-pending bg-paper p-4 text-body text-ink" role="alert">
        {resolve("act.ekyc.denied", {}, locale)}
      </p>
    );
  }

  if (phase === "idle") {
    return (
      <div className="mt-4">
        <p className="prose-measure text-label text-ink-soft">{resolve("act.ekyc.permission", {}, locale)}</p>
        <button
          type="button"
          onClick={start}
          className="mt-4 inline-flex min-h-14 items-center rounded-card bg-teal-deep px-6 text-body font-semibold text-paper"
        >
          {resolve("act.ekyc.start", {}, locale)}
        </button>
      </div>
    );
  }

  const prompt = phase === "starting" ? null : PROMPT[phase];

  return (
    <div className="mt-4">
      <div className="overflow-hidden rounded-card border-2 border-teal-deep bg-ink">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          aria-label={resolve("act.ekyc.title", {}, locale)}
          className="block aspect-[4/3] w-full object-cover"
        />
      </div>

      {prompt && (
        <p className="mt-4 rounded-card bg-cyan-pale p-4 text-answer font-semibold leading-tight text-ink" role="status">
          {resolve(prompt, {}, locale)}
        </p>
      )}

      <p className="mt-3 prose-measure text-label text-ink-soft">{resolve("act.ekyc.live_note", {}, locale)}</p>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={finish}
          disabled={phase !== "ready"}
          className="inline-flex min-h-14 items-center rounded-card bg-teal-deep px-6 text-body font-semibold text-paper disabled:bg-rule disabled:text-ink-soft"
        >
          {resolve("act.ekyc.confirm", {}, locale)}
        </button>
        <button
          type="button"
          onClick={() => { stop(); setPhase("idle"); }}
          className="inline-flex min-h-14 items-center rounded-card border border-rule px-5 text-body font-semibold text-ink"
        >
          {resolve("act.ekyc.cancel", {}, locale)}
        </button>
      </div>
    </div>
  );
}
