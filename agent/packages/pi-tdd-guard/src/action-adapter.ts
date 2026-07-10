import type { Action } from "@nizos/probity/types";
import { readFile } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";

export type PendingWriteEvent = {
  toolName: "write" | "edit";
  input: Record<string, unknown>;
};

export type PendingWriteResult =
  | { ok: true; action: Extract<Action, { kind: "write" }> }
  | { ok: false; reason: string };

type Replacement = {
  start: number;
  end: number;
  newText: string;
};

export async function toPendingWrite(
  event: PendingWriteEvent,
  cwd: string,
): Promise<PendingWriteResult> {
  if (cwd.length === 0) {
    return { ok: false, reason: "TDD Guard received an empty working directory." };
  }

  const filePath = event.input.path;
  if (typeof filePath !== "string" || filePath.length === 0) {
    return { ok: false, reason: "TDD Guard requires a non-empty write path." };
  }
  const absolutePath = isAbsolute(filePath) ? resolve(filePath) : resolve(cwd, filePath);

  if (event.toolName === "write") {
    return normalizeWrite(event.input, absolutePath);
  }
  if (event.toolName === "edit") {
    return normalizeEdit(event.input, absolutePath);
  }
  return { ok: false, reason: `TDD Guard does not support tool ${String(event.toolName)}.` };
}

function normalizeWrite(input: Record<string, unknown>, absolutePath: string): PendingWriteResult {
  const content = input.content;
  if (typeof content !== "string") {
    return { ok: false, reason: "TDD Guard requires string content for write calls." };
  }
  return { ok: true, action: { kind: "write", path: absolutePath, content } };
}

async function normalizeEdit(
  input: Record<string, unknown>,
  absolutePath: string,
): Promise<PendingWriteResult> {
  const edits = input.edits;
  if (!Array.isArray(edits) || edits.length === 0) {
    return { ok: false, reason: "TDD Guard requires at least one edit replacement." };
  }

  let rawContent: string;
  try {
    rawContent = await readFile(absolutePath, { encoding: "utf8" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, reason: `TDD Guard could not read ${absolutePath}: ${message}` };
  }

  return applyExactEdits(rawContent, edits, absolutePath);
}

function applyExactEdits(
  rawContent: string,
  edits: unknown[],
  absolutePath: string,
): PendingWriteResult {
  const hasByteOrderMark = rawContent.startsWith("\uFEFF");
  const contentWithoutMark = hasByteOrderMark ? rawContent.slice(1) : rawContent;
  const lineEnding = contentWithoutMark.includes("\r\n") ? "\r\n" : "\n";
  const normalizedContent = normalizeLineEndings(contentWithoutMark);
  const replacements: Replacement[] = [];

  for (const edit of edits) {
    const parsed = parseEdit(edit, normalizedContent, absolutePath);
    if (!parsed.ok) {
      return parsed;
    }
    replacements.push(parsed.replacement);
  }

  replacements.sort((left, right) => left.start - right.start);
  for (let index = 1; index < replacements.length; index += 1) {
    const previous = replacements[index - 1];
    const current = replacements[index];
    if (previous === undefined || current === undefined) {
      return { ok: false, reason: "TDD Guard could not compare edit ranges." };
    }
    if (current.start < previous.end) {
      return { ok: false, reason: `TDD Guard rejected overlapping edits for ${absolutePath}.` };
    }
  }

  let pendingContent = normalizedContent;
  for (const replacement of replacements.toReversed()) {
    pendingContent =
      pendingContent.slice(0, replacement.start) +
      replacement.newText +
      pendingContent.slice(replacement.end);
  }

  if (lineEnding === "\r\n") {
    pendingContent = pendingContent.replaceAll("\n", "\r\n");
  }
  if (hasByteOrderMark) {
    pendingContent = `\uFEFF${pendingContent}`;
  }

  return {
    ok: true,
    action: { kind: "write", path: absolutePath, content: pendingContent },
  };
}

function parseEdit(
  edit: unknown,
  normalizedContent: string,
  absolutePath: string,
): { ok: true; replacement: Replacement } | { ok: false; reason: string } {
  if (typeof edit !== "object" || edit === null) {
    return { ok: false, reason: "TDD Guard received a malformed edit replacement." };
  }

  const candidate = edit as Record<string, unknown>;
  if (typeof candidate.oldText !== "string" || typeof candidate.newText !== "string") {
    return { ok: false, reason: "TDD Guard requires string oldText and newText values." };
  }

  const oldText = normalizeLineEndings(candidate.oldText);
  const newText = normalizeLineEndings(candidate.newText);
  if (oldText.length === 0) {
    return { ok: false, reason: "TDD Guard rejects empty oldText replacements." };
  }

  const starts = findOccurrences(normalizedContent, oldText);
  if (starts.length === 0) {
    return { ok: false, reason: `TDD Guard could not find oldText in ${absolutePath}.` };
  }
  if (starts.length > 1) {
    return {
      ok: false,
      reason: `TDD Guard found oldText matches ${starts.length} locations in ${absolutePath}.`,
    };
  }

  const start = starts[0];
  if (start === undefined) {
    return { ok: false, reason: `TDD Guard could not locate the edit range in ${absolutePath}.` };
  }
  return { ok: true, replacement: { start, end: start + oldText.length, newText } };
}

function findOccurrences(content: string, search: string): number[] {
  const starts: number[] = [];
  let offset = 0;
  while (offset <= content.length - search.length) {
    const found = content.indexOf(search, offset);
    if (found === -1) {
      break;
    }
    starts.push(found);
    offset = found + search.length;
  }
  return starts;
}

function normalizeLineEndings(content: string): string {
  return content.replaceAll("\r\n", "\n");
}
