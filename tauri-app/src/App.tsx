import { useState, useCallback, useRef } from "react";
import { MicButton } from "./components/MicButton.js";
import { InteractionHistory } from "./components/InteractionHistory.js";
import { DebugPanel } from "./components/DebugPanel.js";

const MCP_URL = import.meta.env.VITE_MCP_URL ?? "http://localhost:7777";

export type Interaction = {
  id: string;
  userText: string;
  response: string;
  timestamp: Date;
  debug: DebugEntry[];
};

export type DebugEntry = {
  tool: string;
  input: unknown;
  output: unknown;
  durationMs: number;
};

export default function App() {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [status, setStatus] = useState<"idle" | "listening" | "thinking">("idle");
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugEnabled, setDebugEnabled] = useState(false);
  const pendingText = useRef("");

  const handleTranscript = useCallback(async (text: string) => {
    if (!text.trim()) return;
    pendingText.current = text;
    setStatus("thinking");

    try {
      const res = await fetch(`${MCP_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json() as { response: string; debug: DebugEntry[] };

      setInteractions((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          userText: text,
          response: data.response,
          timestamp: new Date(),
          debug: data.debug,
        },
      ]);
    } catch (err) {
      setInteractions((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          userText: text,
          response: "Connection error — is the MCP server running?",
          timestamp: new Date(),
          debug: [],
        },
      ]);
    } finally {
      setStatus("idle");
    }
  }, []);

  const lastDebug = interactions.at(-1)?.debug ?? [];

  return (
    <div style={styles.shell}>
      <div style={styles.header}>
        <span style={styles.headerTitle}>♫ Music</span>
        <div style={styles.headerActions}>
          <button
            style={{ ...styles.iconBtn, color: debugEnabled ? "#e5342a" : "rgba(255,255,255,0.4)" }}
            title="Debug mode"
            onClick={() => setDebugEnabled((v) => !v)}
          >
            ⚙
          </button>
          {debugEnabled && lastDebug.length > 0 && (
            <button
              style={styles.iconBtn}
              onClick={() => setDebugOpen((v) => !v)}
              title="Show debug log"
            >
              {debugOpen ? "▼" : "▶"}
            </button>
          )}
        </div>
      </div>

      <InteractionHistory interactions={interactions} />

      {debugEnabled && debugOpen && <DebugPanel entries={lastDebug} />}

      <div style={styles.footer}>
        <div style={styles.statusLabel}>
          {status === "listening" && "Listening…"}
          {status === "thinking" && "Thinking…"}
        </div>
        <MicButton
          status={status}
          onListeningStart={() => setStatus("listening")}
          onTranscript={handleTranscript}
        />
      </div>
    </div>
  );
}

const styles = {
  shell: {
    display: "flex",
    flexDirection: "column" as const,
    height: "100vh",
    background: "rgba(18, 18, 18, 0.96)",
    backdropFilter: "blur(24px)",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.08)",
    overflow: "hidden",
    color: "#fff",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px 10px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: "rgba(255,255,255,0.7)",
    letterSpacing: "0.02em",
  },
  headerActions: {
    display: "flex",
    gap: 4,
  },
  iconBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 15,
    color: "rgba(255,255,255,0.4)",
    padding: "2px 6px",
    borderRadius: 6,
    transition: "color 0.15s",
  },
  footer: {
    padding: "12px 0 20px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
    borderTop: "1px solid rgba(255,255,255,0.06)",
  },
  statusLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
    height: 16,
    letterSpacing: "0.04em",
  },
} as const;
