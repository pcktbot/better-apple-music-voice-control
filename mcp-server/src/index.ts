import http from "node:http";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { playbackTools, handlePlayback } from "./tools/playback.js";
import { musickitTools, handleMusickit } from "./tools/musickit.js";
import { libraryTools, handleLibrary } from "./tools/library.js";
import { chat } from "./chat.js";

const PORT = Number(process.env.PORT ?? 7777);
const allTools = [...playbackTools, ...musickitTools, ...libraryTools];

function createMcpServer() {
  const server = new Server(
    { name: "apple-music-controller", version: "0.1.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: allTools }));

  server.setRequestHandler(CallToolRequestSchema, async ({ params }) => {
    const { name, arguments: args = {} } = params;
    const result =
      (await handlePlayback(name, args as Record<string, unknown>)) ??
      (await handleMusickit(name, args as Record<string, unknown>)) ??
      (await handleLibrary(name, args as Record<string, unknown>));
    if (!result) throw new Error(`Unknown tool: ${name}`);
    return result;
  });

  return server;
}

const transports: Record<string, SSEServerTransport> = {};

const httpServer = http.createServer(async (req, res) => {
  const url = new URL(req.url!, `http://localhost:${PORT}`);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  // MCP SSE endpoint — used by Claude Desktop or other MCP clients
  if (req.method === "GET" && url.pathname === "/sse") {
    const server = createMcpServer();
    const transport = new SSEServerTransport("/messages", res);
    transports[transport.sessionId] = transport;
    res.on("close", () => delete transports[transport.sessionId]);
    await server.connect(transport);
    return;
  }

  if (req.method === "POST" && url.pathname === "/messages") {
    const sessionId = url.searchParams.get("sessionId");
    const transport = sessionId ? transports[sessionId] : null;
    if (!transport) {
      res.writeHead(404);
      res.end("Session not found");
      return;
    }
    await transport.handlePostMessage(req, res);
    return;
  }

  // REST endpoint used by the Tauri app
  if (req.method === "POST" && url.pathname === "/chat") {
    let body = "";
    for await (const chunk of req) body += chunk;
    const { text } = JSON.parse(body) as { text: string };
    const result = await chat(text);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result));
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

httpServer.listen(PORT, () => {
  console.log(`MCP server listening on :${PORT}`);
  console.log(`  /chat  — Tauri app REST endpoint`);
  console.log(`  /sse   — MCP SSE endpoint (Claude Desktop)`);
  console.log(`  /health — health check`);
});
