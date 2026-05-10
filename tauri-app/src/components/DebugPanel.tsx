import type { DebugEntry } from "../App.js";

type Props = { entries: DebugEntry[] };

export function DebugPanel({ entries }: Props) {
  if (entries.length === 0) return null;

  return (
    <div style={styles.panel}>
      <div style={styles.title}>Tool calls ({entries.length})</div>
      {entries.map((entry, i) => (
        <div key={i} style={styles.entry}>
          <div style={styles.entryHeader}>
            <span style={styles.toolName}>{entry.tool}</span>
            <span style={styles.duration}>{entry.durationMs}ms</span>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>in</span>
            <pre style={styles.code}>{JSON.stringify(entry.input, null, 2)}</pre>
          </div>
          <div style={styles.row}>
            <span style={styles.label}>out</span>
            <pre style={styles.code}>{JSON.stringify(entry.output, null, 2)}</pre>
          </div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  panel: {
    background: "rgba(0,0,0,0.4)",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    padding: "10px 14px",
    maxHeight: 180,
    overflowY: "auto" as const,
    flexShrink: 0,
  },
  title: {
    fontSize: 10,
    color: "rgba(255,255,255,0.3)",
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    marginBottom: 8,
  },
  entry: {
    marginBottom: 10,
    borderLeft: "2px solid rgba(229,52,42,0.4)",
    paddingLeft: 8,
  },
  entryHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  toolName: {
    fontSize: 11,
    fontWeight: 600,
    color: "#e5342a",
    fontFamily: "monospace",
  },
  duration: {
    fontSize: 10,
    color: "rgba(255,255,255,0.3)",
  },
  row: {
    display: "flex",
    gap: 6,
    alignItems: "flex-start",
  },
  label: {
    fontSize: 9,
    color: "rgba(255,255,255,0.25)",
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    paddingTop: 1,
    minWidth: 18,
  },
  code: {
    fontSize: 10,
    color: "rgba(255,255,255,0.55)",
    fontFamily: "monospace",
    whiteSpace: "pre-wrap" as const,
    wordBreak: "break-all" as const,
    margin: 0,
    lineHeight: 1.4,
  },
} as const;
