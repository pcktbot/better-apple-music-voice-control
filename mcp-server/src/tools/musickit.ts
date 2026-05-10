import { SignJWT, importPKCS8 } from "jose";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const musickitTools: Tool[] = [
  {
    name: "search_catalog",
    description: "Search the Apple Music catalog for tracks, albums, or artists not in the local library",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        types: {
          type: "string",
          enum: ["songs", "albums", "artists", "playlists"],
          description: "Type of results to return",
        },
        limit: { type: "number", default: 10 },
      },
      required: ["query"],
    },
  },
  {
    name: "get_album_details",
    description: "Get album details from the Apple Music catalog including track listing",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Apple Music album ID" },
      },
      required: ["id"],
    },
  },
];

let _developerToken: string | null = null;
let _tokenExpiry = 0;

async function getDeveloperToken(): Promise<string> {
  if (_developerToken && Date.now() < _tokenExpiry) return _developerToken;

  const keyId = process.env.MUSICKIT_KEY_ID!;
  const teamId = process.env.MUSICKIT_TEAM_ID!;
  const keyPath = process.env.MUSICKIT_PRIVATE_KEY_PATH!;

  const pem = await Bun.file(keyPath).text();
  const privateKey = await importPKCS8(pem, "ES256");

  _developerToken = await new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .setIssuer(teamId)
    .setIssuedAt()
    .setExpirationTime("6months")
    .sign(privateKey);

  _tokenExpiry = Date.now() + 1000 * 60 * 60 * 24 * 180; // 6 months in ms
  return _developerToken;
}

async function catalogFetch(path: string) {
  const token = await getDeveloperToken();
  const res = await fetch(`https://api.music.apple.com${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`MusicKit API error: ${res.status}`);
  return res.json();
}

function ok(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data) }] };
}

export async function handleMusickit(name: string, args: Record<string, unknown>) {
  switch (name) {
    case "search_catalog": {
      const types = (args.types as string) ?? "songs";
      const limit = (args.limit as number) ?? 10;
      const data = await catalogFetch(
        `/v1/catalog/us/search?term=${encodeURIComponent(args.query as string)}&types=${types}&limit=${limit}`
      );
      return ok(data);
    }
    case "get_album_details": {
      const data = await catalogFetch(`/v1/catalog/us/albums/${args.id}`);
      return ok(data);
    }
    default:
      return null;
  }
}
