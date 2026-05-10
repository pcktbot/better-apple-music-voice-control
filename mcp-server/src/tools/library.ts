import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { db } from "../db/index.js";

const BRIDGE_URL = process.env.BRIDGE_URL ?? "http://host.docker.internal:7778";

export const libraryTools: Tool[] = [
  {
    name: "search_library",
    description: "Full-text search across the local Music.app library (tracks, albums, artists, genres)",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        limit: { type: "number", default: 20 },
      },
      required: ["query"],
    },
  },
  {
    name: "get_playlists",
    description: "List all playlists in the local library",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "sync_library",
    description: "Sync the local library index from Music.app. Run this if search results seem stale.",
    inputSchema: { type: "object", properties: {} },
  },
];

function ok(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
}

export async function handleLibrary(name: string, args: Record<string, unknown>) {
  switch (name) {
    case "search_library": {
      const limit = (args.limit as number) ?? 20;
      const rows = db
        .query(
          `SELECT t.id, t.name, t.artist, t.album, t.genre
           FROM tracks_fts fts
           JOIN tracks t ON t.rowid = fts.rowid
           WHERE tracks_fts MATCH ?
           LIMIT ?`
        )
        .all(args.query as string, limit);
      return ok(rows);
    }

    case "get_playlists": {
      const rows = db.query("SELECT id, name, track_count FROM playlists ORDER BY name").all();
      return ok(rows);
    }

    case "sync_library": {
      const res = await fetch(`${BRIDGE_URL}/library`);
      if (!res.ok) throw new Error(`Bridge sync error: ${res.status}`);
      const { tracks, playlists } = (await res.json()) as {
        tracks: Array<{ id: string; name: string; artist: string; album: string; genre: string; playlist_ids: string[] }>;
        playlists: Array<{ id: string; name: string; track_count: number }>;
      };

      db.run("BEGIN");
      db.run("DELETE FROM tracks");
      db.run("DELETE FROM playlists");

      const insertTrack = db.prepare(
        "INSERT OR REPLACE INTO tracks (id, name, artist, album, genre, playlist_ids) VALUES (?, ?, ?, ?, ?, ?)"
      );
      for (const t of tracks) {
        insertTrack.run(t.id, t.name, t.artist, t.album, t.genre, JSON.stringify(t.playlist_ids));
      }

      const insertPlaylist = db.prepare(
        "INSERT OR REPLACE INTO playlists (id, name, track_count) VALUES (?, ?, ?)"
      );
      for (const p of playlists) {
        insertPlaylist.run(p.id, p.name, p.track_count);
      }

      db.run("COMMIT");
      return ok({ synced: true, tracks: tracks.length, playlists: playlists.length });
    }

    default:
      return null;
  }
}
