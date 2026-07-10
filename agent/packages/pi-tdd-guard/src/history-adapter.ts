import type { RawSessionEvent } from "@nizos/probity/types";

type ToolCall = {
  tool: string;
  input: unknown;
};

export function toRawHistory(entries: readonly unknown[]): RawSessionEvent[] {
  const toolCalls = new Map<string, ToolCall>();
  const history: RawSessionEvent[] = [];

  for (const entry of entries) {
    const message = sessionMessage(entry);
    if (message === undefined) {
      continue;
    }

    const role = message.role;
    if (role === "user") {
      const text = textContent(message.content);
      if (text.length > 0) {
        history.push({ kind: "prompt", text });
      }
      continue;
    }

    if (role === "assistant") {
      collectToolCalls(message.content, toolCalls);
      continue;
    }

    if (role === "toolResult") {
      const action = completedToolCall(message, toolCalls);
      if (action !== undefined) {
        history.push(action);
      }
    }
  }

  return history;
}

function sessionMessage(entry: unknown): Record<string, unknown> | undefined {
  if (!isRecord(entry) || entry.type !== "message") {
    return undefined;
  }
  if (!isRecord(entry.message) || typeof entry.message.role !== "string") {
    return undefined;
  }
  return entry.message;
}

function collectToolCalls(content: unknown, toolCalls: Map<string, ToolCall>): void {
  if (!Array.isArray(content)) {
    return;
  }

  for (const block of content) {
    if (!isRecord(block) || block.type !== "toolCall") {
      continue;
    }
    if (typeof block.id !== "string" || typeof block.name !== "string") {
      continue;
    }
    const input = block.arguments === undefined ? {} : block.arguments;
    toolCalls.set(block.id, { tool: block.name, input });
  }
}

function completedToolCall(
  message: Record<string, unknown>,
  toolCalls: ReadonlyMap<string, ToolCall>,
): Extract<RawSessionEvent, { kind: "action" }> | undefined {
  if (typeof message.toolCallId !== "string" || typeof message.toolName !== "string") {
    return undefined;
  }

  const pending = toolCalls.get(message.toolCallId);
  return {
    kind: "action",
    tool: pending?.tool ?? message.toolName,
    input: pending?.input ?? {},
    output: textContent(message.content),
    toolUseId: message.toolCallId,
  };
}

function textContent(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }
  if (!Array.isArray(content)) {
    return "";
  }

  const textBlocks: string[] = [];
  for (const block of content) {
    if (!isRecord(block) || block.type !== "text" || typeof block.text !== "string") {
      continue;
    }
    textBlocks.push(block.text);
  }
  return textBlocks.join("\n");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
