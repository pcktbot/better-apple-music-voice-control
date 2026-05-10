import { useEffect, useRef, useState } from "react";

type Props = {
  status: "idle" | "listening" | "thinking";
  onListeningStart: () => void;
  onTranscript: (text: string) => void;
};

export function MicButton({ status, onListeningStart, onTranscript }: Props) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const [text, setText] = useState("");

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

    rec.onend = () => {
      onTranscript("");
    };

    recognitionRef.current = rec;
    setSpeechAvailable(true);
    return () => rec.abort();
  }, [onTranscript]);

  function handleMicClick() {
    if (status !== "idle") return;
    onListeningStart();
    recognitionRef.current?.start();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const val = text.trim();
    if (!val || status !== "idle") return;
    setText("");
    onTranscript(val);
  }

  const isListening = status === "listening";
  const isThinking = status === "thinking";

  return (
    <div style={styles.wrap}>
      {speechAvailable && (
        <button
          onClick={handleMicClick}
          disabled={isThinking}
          style={{
            ...styles.btn,
            background: isListening
              ? "rgba(229,52,42,0.9)"
              : isThinking
              ? "rgba(80,80,80,0.5)"
              : "rgba(229,52,42,0.8)",
            boxShadow: isListening
              ? "0 0 0 8px rgba(229,52,42,0.2), 0 0 0 16px rgba(229,52,42,0.08)"
              : "0 4px 24px rgba(229,52,42,0.35)",
            transform: isListening ? "scale(1.06)" : "scale(1)",
            cursor: isThinking ? "default" : "pointer",
          }}
          title={isListening ? "Listening…" : "Press to speak"}
        >
          <MicIcon active={isListening} />
        </button>
      )}

      <form onSubmit={handleSubmit} style={styles.inputRow}>
        <input
          style={styles.input}
          placeholder={speechAvailable ? "or type a command…" : "Type a command…"}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={status !== "idle"}
        />
        <button
          type="submit"
          disabled={!text.trim() || status !== "idle"}
          style={styles.sendBtn}
        >
          ↵
        </button>
      </form>
    </div>
  );
}

function MicIcon({ active }: { active: boolean }) {
  const fill = active ? "#fff" : "rgba(255,255,255,0.92)";
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="2" width="6" height="11" rx="3" fill={fill} />
      <path d="M5 10a7 7 0 0014 0" stroke={fill} strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="17" x2="12" y2="21" stroke={fill} strokeWidth="2" strokeLinecap="round" />
      <line x1="8" y1="21" x2="16" y2="21" stroke={fill} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const styles = {
  wrap: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 12,
    width: "100%",
    padding: "0 16px",
  },
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
  },
  inputRow: {
    display: "flex",
    width: "100%",
    gap: 6,
  },
  input: {
    flex: 1,
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: "8px 12px",
    color: "#fff",
    fontSize: 13,
    outline: "none",
  },
  sendBtn: {
    background: "rgba(229,52,42,0.7)",
    border: "none",
    borderRadius: 8,
    color: "#fff",
    fontSize: 16,
    padding: "0 12px",
    cursor: "pointer",
  },
} as const;

declare global {
  interface Window {
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
