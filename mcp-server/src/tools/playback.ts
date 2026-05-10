import type { Tool } from "@modelcontextprotocol/sdk/types.js";

const BRIDGE_URL = process.env.BRIDGE_URL ?? "http://host.docker.internal:7778";

export const playbackTools: Tool[] = [
  {
    name: "play_pause",
    description: "Toggle play/pause in Music.app",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "skip_track",
    description: "Skip to the next track",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "previous_track",
    description: "Go back to the previous track",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "set_volume",
    description: "Set Music.app volume (0–100)",
    inputSchema: {
      type: "object",
      properties: { level: { type: "number", minimum: 0, maximum: 100 } },
      required: ["level"],
    },
  },
  {
    name: "get_now_playing",
    description: "Get the currently playing track info",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "play_track",
    description: "Play a specific track from the local library by name",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Track name" },
        artist: { type: "string", description: "Artist name (optional, narrows results)" },
      },
      required: ["name"],
    },
  },
  {
    name: "play_playlist",
    description: "Play a playlist by name",
    inputSchema: {
      type: "object",
      properties: { name: { type: "string" } },
      required: ["name"],
    },
  },
  {
    name: "play_album",
    description: "Play an album from the local library",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Album name" },
        artist: { type: "string", description: "Artist name (optional)" },
      },
      required: ["name"],
    },
  },
];

async function callBridge(command: string, args?: Record<string, unknown>) {
  const res = await fetch(`${BRIDGE_URL}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ command, args }),
  });
  if (!res.ok) throw new Error(`Bridge error: ${res.status}`);
  return res.json();
}

function ok(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
}

export async function handlePlayback(name: string, args: Record<string, unknown>) {
  switch (name) {
    case "play_pause":      return ok(await callBridge("play_pause"));
    case "skip_track":      return ok(await callBridge("skip_track"));
    case "previous_track":  return ok(await callBridge("previous_track"));
    case "set_volume":      return ok(await callBridge("set_volume", args));
    case "get_now_playing": return ok(await callBridge("get_now_playing"));
    case "play_track":      return ok(await callBridge("play_track", args));
    case "play_playlist":   return ok(await callBridge("play_playlist", args));
    case "play_album":      return ok(await callBridge("play_album", args));
    default: return null;
  }
}
