import { useEffect, useRef } from "react";

type Props = {
  status: "idle" | "listening" | "thinking";
  onListeningStart: () => void;
  onTranscript: (text: string) => void;
};

export function MicButton({ status, onListeningStart, onTranscript }: Props) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      onTranscript(transcript);
    };

    rec.onerror = (e) => {
      console.error("Speech recognition error:", e.error);
      onTranscript("");
    };

    recognitionRef.current = rec;
    return () => rec.abort();
  }, [onTranscript]);

  function handleClick() {
    if (status !== "idle") return;
    onListeningStart();
    recognitionRef.current?.start();
  }

  const isActive = status === "listening";
  const isDisabled = status === "thinking";

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      style={{
        ...styles.btn,
        background: isActive
          ? "rgba(229,52,42,0.9)"
          : isDisabled
          ? "rgba(80,80,80,0.5)"
          : "rgba(229,52,42,0.8)",
        boxShadow: isActive
          ? "0 0 0 8px rgba(229,52,42,0.2), 0 0 0 16px rgba(229,52,42,0.08)"
          : "0 4px 24px rgba(229,52,42,0.35)",
        transform: isActive ? "scale(1.06)" : "scale(1)",
        cursor: isDisabled ? "default" : "pointer",
      }}
      title={isActive ? "Listening…" : "Press to speak"}
    >
      <MicIcon active={isActive} />
    </button>
  );
}

function MicIcon({ active }: { active: boolean }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="2" width="6" height="11" rx="3" fill={active ? "#fff" : "rgba(255,255,255,0.92)"} />
      <path
        d="M5 10a7 7 0 0014 0"
        stroke={active ? "#fff" : "rgba(255,255,255,0.92)"}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line x1="12" y1="17" x2="12" y2="21" stroke={active ? "#fff" : "rgba(255,255,255,0.92)"} strokeWidth="2" strokeLinecap="round" />
      <line x1="8" y1="21" x2="16" y2="21" stroke={active ? "#fff" : "rgba(255,255,255,0.92)"} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const styles = {
  btn: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
    outline: "none",
    WebkitTapHighlightColor: "transparent",
  },
} as const;

declare global {
  interface Window {
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
