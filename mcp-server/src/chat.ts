import Anthropic from "@anthropic-ai/sdk";
import { playbackTools, handlePlayback } from "./tools/playback.js";
import { musickitTools, handleMusickit } from "./tools/musickit.js";
import { libraryTools, handleLibrary } from "./tools/library.js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a voice controller for Apple Music. Interpret the user's voice commands and use the available tools to control playback, search the library, and find music. Be concise — one short sentence in your final response. If you're playing something, confirm what you're playing.`;

const allTools = [...playbackTools, ...musickitTools, ...libraryTools];

const anthropicTools: Anthropic.Tool[] = allTools.map((t) => ({
  name: t.name,
  description: t.description ?? "",
  input_schema: t.inputSchema as Anthropic.Tool["input_schema"],
}));

export type DebugEntry = {
  tool: string;
  input: unknown;
  output: unknown;
  durationMs: number;
};

export async function chat(text: string): Promise<{ response: string; debug: DebugEntry[] }> {
  const debug: DebugEntry[] = [];
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: text }];

  let response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    tools: anthropicTools.map((t, i) =>
      i === anthropicTools.length - 1 ? { ...t, cache_control: { type: "ephemeral" } } : t
    ),
    messages,
  });

  while (response.stop_reason === "tool_use") {
    const toolUseBlocks = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const block of toolUseBlocks) {
      const start = Date.now();
      const args = block.input as Record<string, unknown>;
      const result =
        (await handlePlayback(block.name, args)) ??
        (await handleMusickit(block.name, args)) ??
        (await handleLibrary(block.name, args));

      const output = result ?? { error: `Unknown tool: ${block.name}` };
      debug.push({ tool: block.name, input: args, output, durationMs: Date.now() - start });

      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: result?.content[0].text ?? JSON.stringify(output),
      });
    }

    messages.push({ role: "assistant", content: response.content });
    messages.push({ role: "user", content: toolResults });

    response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      tools: anthropicTools.map((t, i) =>
        i === anthropicTools.length - 1 ? { ...t, cache_control: { type: "ephemeral" } } : t
      ),
      messages,
    });
  }

  const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  return { response: textBlock?.text ?? "", debug };
}
