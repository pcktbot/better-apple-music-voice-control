const PORT = Number(process.env.PORT ?? 7778);

function sanitize(s: unknown): string {
  return String(s ?? "").replace(/["\\\n\r\t]/g, "");
}

async function runAppleScript(script: string): Promise<string> {
  const proc = Bun.spawn(["osascript", "-e", script], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const [out, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    proc.exited,
  ]);
  if (exitCode !== 0) {
    const err = await new Response(proc.stderr).text();
    throw new Error(err.trim());
  }
  return out.trim();
}

type CommandHandler = (args?: Record<string, unknown>) => string;

const commands: Record<string, CommandHandler> = {
  play_pause: () => `tell application "Music" to playpause`,

  skip_track: () => `tell application "Music" to next track`,

  previous_track: () => `tell application "Music" to previous track`,

  set_volume: (args) =>
    `tell application "Music" to set sound volume to ${Number(args?.level ?? 50)}`,

  get_now_playing: () => `
    tell application "Music"
      if player state is playing or player state is paused then
        set t to current track
        return "{" & ¬
          "\\"name\\":\\"" & name of t & "\\"," & ¬
          "\\"artist\\":\\"" & artist of t & "\\"," & ¬
          "\\"album\\":\\"" & album of t & "\\"," & ¬
          "\\"state\\":\\"" & (player state as text) & "\\"}"
      else
        return "{\\"state\\":\\"stopped\\"}"
      end if
    end tell
  `,

  play_track: (args) => {
    const name = sanitize(args?.name);
    const artist = sanitize(args?.artist ?? "");
    const artistFilter = artist ? ` and artist contains "${artist}"` : "";
    return `
      tell application "Music"
        set results to (every track of playlist "Library" whose name contains "${name}"${artistFilter})
        if length of results > 0 then
          play item 1 of results
          return "Playing " & name of item 1 of results & " by " & artist of item 1 of results
        else
          return "Track not found: ${name}"
        end if
      end tell
    `;
  },

  play_playlist: (args) => {
    const name = sanitize(args?.name);
    return `
      tell application "Music"
        try
          set p to first playlist whose name is "${name}"
          play p
          return "Playing playlist: " & name of p
        on error
          return "Playlist not found: ${name}"
        end try
      end tell
    `;
  },

  play_album: (args) => {
    const name = sanitize(args?.name);
    const artist = sanitize(args?.artist ?? "");
    const artistFilter = artist ? ` and artist contains "${artist}"` : "";
    return `
      tell application "Music"
        set results to (every track of playlist "Library" whose album contains "${name}"${artistFilter})
        if length of results > 0 then
          play item 1 of results
          return "Playing album: " & album of item 1 of results
        else
          return "Album not found: ${name}"
        end if
      end tell
    `;
  },
};

// Library sync — returns JSON-serialisable track + playlist data
async function getLibraryData() {
  const trackScript = `
    tell application "Music"
      set output to ""
      set allTracks to every track of playlist "Library"
      repeat with t in allTracks
        set output to output & (get database ID of t as text) & "\\t" & ¬
          (name of t) & "\\t" & (artist of t) & "\\t" & ¬
          (album of t) & "\\t" & (genre of t) & "\\n"
      end repeat
      return output
    end tell
  `;

  const playlistScript = `
    tell application "Music"
      set output to ""
      set userPlaylists to (every playlist whose special kind is none)
      repeat with p in userPlaylists
        set output to output & (get database ID of p as text) & "\\t" & ¬
          (name of p) & "\\t" & (count of tracks of p as text) & "\\n"
      end repeat
      return output
    end tell
  `;

  const [trackRaw, playlistRaw] = await Promise.all([
    runAppleScript(trackScript),
    runAppleScript(playlistScript),
  ]);

  const tracks = trackRaw
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [id, name, artist, album, genre] = line.split("\t");
      return { id, name, artist, album, genre, playlist_ids: [] as string[] };
    });

  const playlists = playlistRaw
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [id, name, track_count] = line.split("\t");
      return { id, name, track_count: Number(track_count) };
    });

  return { tracks, playlists };
}

function cors(res: Response): Response {
  res.headers.set("Access-Control-Allow-Origin", "*");
  return res;
}

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (req.method === "POST" && url.pathname === "/execute") {
      const { command, args } = (await req.json()) as {
        command: string;
        args?: Record<string, unknown>;
      };
      const handler = commands[command];
      if (!handler) {
        return cors(Response.json({ error: `Unknown command: ${command}` }, { status: 400 }));
      }
      const result = await runAppleScript(handler(args));
      return cors(Response.json({ result }));
    }

    if (req.method === "GET" && url.pathname === "/library") {
      const data = await getLibraryData();
      return cors(Response.json(data));
    }

    return cors(new Response("Not found", { status: 404 }));
  },
});

console.log(`Host bridge listening on :${PORT}`);
