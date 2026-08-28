"use client";	

import { useEffect, useState } from "react";
import { resolve } from "../content/resolve";
import { useLocale } from "./LocaleProvider";

export function ReadAloudButton({
  text,
  className = ""
}: {
  text: string;
  className?: string;
}) {
  const { locale } = useLocale();
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setSupported(true);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [text]);

  if (!supported) return null;

  function toggleSpeech() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (locale === "hi") utterance.lang = "hi-IN";
    else if (locale === "mr") utterance.lang = "mr-IN";
    else utterance.lang = "en-IN";

    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }

  const label = speaking
    ? resolve("voice.stop_reading", {}, locale)
    : resolve("voice.read_aloud", {}, locale);

  return (
    <button
      type="button"
      onClick={toggleSpeech}
      aria-pressed={speaking}
      aria-label={label}
      title={label}
      className={
        "inline-flex min-h-10 items-center gap-2 rounded-card border border-rule px-3 py-1.5 text-label font-semibold text-ink transition-colors hover:bg-cyan-pale " +
        (speaking ? "border-teal-deep bg-teal-deep text-paper hover:bg-teal-deep " : "bg-paper ") +
        className
      }
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={speaking ? "animate-pulse text-paper" : "text-teal-deep"}
      >
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        {speaking ? (
          <>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </>
        ) : (
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        )}
      </svg>
      <span>{label}</span>
    </button>
  );
}
