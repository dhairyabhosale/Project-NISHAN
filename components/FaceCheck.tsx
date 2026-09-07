"use client";

/* In-browser e-KYC by camera. The answer to P7 and P10.
 *
 * P7 is the e-KYC dead end: the portal's mandatory identity step depends on an
 * OTP to the Aadhaar-linked mobile, and when that number is stale the web path
 * fails with no in-browser alternative. A camera needs no phone number, so it
 * works for exactly the person the OTP route abandons.
 *
 * WHY THIS NEVER WORKED BEFORE. next.config.mjs sent
 * `Permissions-Policy: camera=()`, which denies the camera to the page itself,
 * so getUserMedia rejected on every deployment before the browser ever asked
 * the reader anything. The failure surfaced as "permission was refused", which
 * is what a reader would reasonably blame themselves for. The header now sends
 * camera=(self); the microphone stays fully denied, which is the claim the
 * disabled Bhashini button actually rests on.
 *
 * WHAT IS REAL: the camera. A genuine permission prompt, the reader's own video
 * in the ring, a real shutter.
 *
 * WHAT IS SIMULATED: the verification, and the photograph that comes back. The
 * captured frame is measured and discarded in the same function, and what the
 * reader is then shown is a drawn stand-in, not their face. That is a stronger
 * privacy position than showing the real capture, and it is said on screen.
 *
 * WHAT NEVER HAPPENS: the frame never leaves the device. No upload, no fetch
 * carrying image data, no storage write. connect-src 'self' means the browser
 * would refuse an upload even if this code tried one.
 *
 * THE TRACK IS ALWAYS STOPPED. Every exit path - success, cancel, unmount,
 * error - runs stop(). A camera light left on after the reader thinks they are
 * finished would be the worst thing in this build.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "./LocaleProvider";
import { resolve } from "../content/resolve";

type Phase = "idle" | "starting" | "framing" | "flash" | "processing" | "done" | "denied";

/** Long enough to read as work, short enough not to feel stalled. */
const PROCESS_MS = 1000;
const FLASH_MS = 420;

/** The stand-in. Drawn, not photographed: a neutral bust in the palette, so it
 *  is unmistakably a placeholder and cannot resemble anybody. */
function drawStandIn(canvas: HTMLCanvasElement) {
  const S = 320;
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "#E0F7FA";
  ctx.fillRect(0, 0, S, S);
  ctx.fillStyle = "#A5D6A7";
  ctx.beginPath();
  ctx.arc(S / 2, S * 0.38, S * 0.17, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(S * 0.18, S);
  ctx.quadraticCurveTo(S * 0.5, S * 0.55, S * 0.82, S);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#00796B";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(S / 2, S / 2, S / 2 - 4, 0, Math.PI * 2);
  ctx.stroke();
}

export function FaceCheck({ onVerified, otherWayHref }: { onVerified: () => void; otherWayHref?: string }) {
  const { locale } = useLocale();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const shotRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");

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
        await videoRef.current.play().catch(() => { /* autoplay policy; the stream is live */ });
      }
      setPhase("framing");
    } catch {
      stop();
      setPhase("denied");
    }
  }

  /** Capture, measure, discard, then show the stand-in. Nothing survives. */
  function capture() {
    const video = videoRef.current;
    let captured = false;
    if (video && video.videoWidth > 0) {
      const scratch = document.createElement("canvas");
      scratch.width = video.videoWidth;
      scratch.height = video.videoHeight;
      const ctx = scratch.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, scratch.width, scratch.height);
        captured = scratch.width > 0 && scratch.height > 0;
        // Discarded here, in this scope, before anything else can reach it.
        ctx.clearRect(0, 0, scratch.width, scratch.height);
        scratch.width = 0;
        scratch.height = 0;
      }
    }
    stop();
    if (!captured) { setPhase("denied"); return; }
    setPhase("flash");
  }

  /* flash -> processing -> done, on timers, with the stand-in drawn once the
     shutter has fired so there is something in the ring to look at. */
  useEffect(() => {
    if (phase === "flash") {
      const t = window.setTimeout(() => setPhase("processing"), FLASH_MS);
      return () => window.clearTimeout(t);
    }
    if (phase === "processing") {
      const t = window.setTimeout(() => setPhase("done"), PROCESS_MS);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [phase]);

  useEffect(() => {
    if (phase === "flash" && shotRef.current) drawStandIn(shotRef.current);
  }, [phase]);

  if (phase === "denied") {
    return (
      <div className="mt-4">
        <p className="rounded-card border-2 border-pending bg-paper p-4 text-body text-ink" role="alert">
          {resolve("act.ekyc.denied", {}, locale)}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setPhase("idle")}
            className="btn-pop inline-flex min-h-14 items-center rounded-card bg-teal-deep px-6 text-body font-semibold text-paper"
          >
            {resolve("act.ekyc.retry", {}, locale)}
          </button>
          {otherWayHref && (
            <a
              href={otherWayHref}
              className="btn-fill inline-flex min-h-14 items-center rounded-card border-2 border-teal-deep px-5 text-body font-semibold text-teal-deep"
            >
              {resolve("act.ekyc.other_way", {}, locale)}
            </a>
          )}
        </div>
      </div>
    );
  }

  if (phase === "idle") {
    return (
      <div className="mt-4">
        <p className="prose-measure text-label text-ink-soft">{resolve("act.ekyc.permission", {}, locale)}</p>
        <button
          type="button"
          onClick={start}
          className="btn-pop mt-4 inline-flex min-h-14 items-center rounded-card bg-teal-deep px-6 text-body font-semibold text-paper"
        >
          {resolve("act.ekyc.start", {}, locale)}
        </button>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="mt-4">
        <p role="status" className="rounded-card border-2 border-green bg-green-soft p-4 text-body font-semibold text-ink">
          {resolve("act.ekyc.success", {}, locale)}
        </p>
        <button
          type="button"
          onClick={onVerified}
          className="btn-pop mt-4 inline-flex min-h-14 items-center rounded-card bg-teal-deep px-6 text-body font-semibold text-paper"
        >
          {resolve("act.ekyc.confirm", {}, locale)}
        </button>
      </div>
    );
  }

  const shot = phase === "flash" || phase === "processing";

  return (
    <div className="mt-4">
      {/* The ring. A circle is what every e-KYC capture screen uses, and it
          tells the reader where to put their face without a sentence. */}
      <div className="ekyc-stage mx-auto">
        <div className={"ekyc-ring" + (phase === "processing" ? " ekyc-ring-busy" : "")}>
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            aria-label={resolve("act.ekyc.title", {}, locale)}
            className={"ekyc-media" + (shot ? " ekyc-hidden" : "")}
          />
          <canvas ref={shotRef} aria-hidden="true" className={"ekyc-media" + (shot ? "" : " ekyc-hidden")} />
        </div>
        {phase === "flash" && <div className="ekyc-flash" aria-hidden="true" />}
      </div>

      {phase === "framing" && (
        <p className="mt-5 text-center text-body font-semibold text-ink" role="status">
          {resolve("act.ekyc.frame_hint", {}, locale)}
        </p>
      )}
      {phase === "processing" && (
        <p className="mt-5 text-center text-body font-semibold text-ink" role="status">
          {resolve("act.ekyc.processing", {}, locale)}
        </p>
      )}
      {shot && (
        <p className="mt-2 text-center text-label text-ink-soft">{resolve("act.ekyc.demo_photo", {}, locale)}</p>
      )}
      {phase === "framing" && (
        <p className="mt-3 prose-measure text-label text-ink-soft">{resolve("act.ekyc.live_note", {}, locale)}</p>
      )}

      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={capture}
          disabled={phase !== "framing"}
          className="btn-pop inline-flex min-h-14 items-center rounded-card bg-teal-deep px-6 text-body font-semibold text-paper disabled:bg-rule disabled:text-ink-soft"
        >
          {resolve("act.ekyc.capture", {}, locale)}
        </button>
        {phase === "framing" && (
          <button
            type="button"
            onClick={() => { stop(); setPhase("idle"); }}
            className="btn-pop inline-flex min-h-14 items-center rounded-card border border-rule px-5 text-body font-semibold text-ink"
          >
            {resolve("act.ekyc.cancel", {}, locale)}
          </button>
        )}
      </div>
    </div>
  );
}
