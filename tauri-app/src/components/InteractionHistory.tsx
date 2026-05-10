import { useEffect, useRef } from "react";
import type { Interaction } from "../App.js";

type Props = { interactions: Interaction[] };

export function InteractionHistory({ interactions }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [interactions]);

  if (interactions.length === 0) {
    return (
      <div style={styles.empty}>
        <span>Press the mic and say something</span>
        <span style={{ fontSize: 10, marginTop: 4, color: "rgba(255,255,255,0.2)" }}>
          "Play some jazz" · "Skip this" · "Turn it up"
        </span>
      </div>
    );
  }

  return (
    <div style={styles.list}>
      {interactions.map((item) => (
        <div key={item.id} style={styles.item}>
          <div style={styles.userBubble}>
            <span style={styles.roleLabel}>You</span>
            <span style={styles.userText}>{item.userText}</span>
          </div>
          <div style={styles.responseBubble}>
            <span style={styles.roleLabel}>Music</span>
            <span style={styles.responseText}>{item.response}</span>
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

const styles = {
  list: {
    flex: 1,
    overflowY: "auto" as const,
    padding: "12px 14px",
    display: "flex",
    flexDirection: "column" as const,
    gap: 16,
  },
  empty: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    color: "rgba(255,255,255,0.25)",
    fontSize: 13,
    gap: 4,
    textAlign: "center" as const,
  },
  item: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
  },
  userBubble: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "flex-end",
    gap: 2,
  },
  responseBubble: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "flex-start",
    gap: 2,
  },
  roleLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.25)",
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    paddingInline: 4,
  },
  userText: {
    background: "rgba(229,52,42,0.2)",
    border: "1px solid rgba(229,52,42,0.25)",
    borderRadius: "12px 12px 4px 12px",
    padding: "8px 12px",
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    maxWidth: "85%",
    lineHeight: 1.4,
  },
  responseText: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "4px 12px 12px 12px",
    padding: "8px 12px",
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    maxWidth: "85%",
    lineHeight: 1.4,
  },
} as const;
