import type { Tool } from "@modelcontextprotocol/sdk/types.js";

// MusicKit REST API — skipped for now (requires Apple Developer account).
// Re-enable when ready: add jose dep, .p8 key, and implement catalog search here.

export const musickitTools: Tool[] = [];

export async function handleMusickit(_name: string, _args: Record<string, unknown>) {
  return null;
}
