/**
 * No Emoji Extension
 *
 * Deterministic emoji blocker - removes ALL emoji from assistant messages
 * and injects a strong system prompt rule to prevent their use.
 *
 * Installation: Copy to ~/.pi/agent/extensions/ or .pi/extensions/
 */

import type { ExtensionAPI, AssistantMessage } from "@mariozechner/pi-coding-agent";

// Emoji regex pattern - matches all emoji characters using Unicode code points
// This covers most emoji in common use
const EMOJI_REGEX = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu;

/**
 * Remove all emoji from a string
 */
function stripEmoji(text: string): string {
  // First do the Unicode range sweep
  let result = text.replace(EMOJI_REGEX, "");

  // Character-by-character pass to catch any remaining emoji
  result = [...result]
    .filter((char) => {
      const code = char.codePointAt(0)!;
      // Check if character is in emoji ranges
      const isEmoji =
        (code >= 0x1f300 && code <= 0x1f9ff) ||
        (code >= 0x1fa00 && code <= 0x1ffff) ||
        (code >= 0x2600 && code <= 0x26ff) ||
        (code >= 0x2700 && code <= 0x27bf) ||
        (code >= 0x1f600 && code <= 0x1f64f) ||
        (code === 0x231a || code === 0x231b || code === 0x23f0 || code === 0x23f3 ||
          code === 0x25fd || code === 0x26fa || code === 0x270a || code === 0x270b ||
          code === 0x270c || code === 0x270d || code === 0x2728 || code === 0x2744 ||
          code === 0x2753 || code === 0x2754 || code === 0x2755 || code === 0x2757 ||
          code === 0x2b50 || code === 0x1f1e6);
      return !isEmoji;
    })
    .join("");

  // Clean up double spaces created by emoji removal
  result = result.replace(/  +/g, " ");

  return result;
}

export default function noEmojiExtension(pi: ExtensionAPI) {
  let emojiBlocked = 0;
  let totalMessages = 0;

  // Inject a strong system prompt rule
  pi.on("before_agent_start", async (event) => {
    return {
      systemPrompt:
        event.systemPrompt +
        `

## CRITICAL: NO EMOJI RULE

NEVER use emoji characters under any circumstances. This is a hard rule.

- Do NOT use emoji in responses
- Do NOT use emoji in code comments
- Do NOT use emoji in any output

Use plain text alternatives instead.

Failure to comply will result in incorrect output.
`,
    };
  });

  // Block emoji in streaming messages
  pi.on("message_update", async (event) => {
    const message = event.message;
    if (message.role !== "assistant") return;

    const assistantMsg = message as AssistantMessage;
    for (const block of assistantMsg.content) {
      if (block.type === "text") {
        const originalText = block.text;
        const strippedText = stripEmoji(originalText);
        if (strippedText !== originalText) {
          emojiBlocked++;
          block.text = strippedText;
        }
      }
    }
  });

  // Final cleanup when message is complete
  pi.on("message_end", async (event, ctx) => {
    const message = event.message;
    if (message.role !== "assistant") return;

    totalMessages++;
    const assistantMsg = message as AssistantMessage;
    for (const block of assistantMsg.content) {
      if (block.type === "text") {
        const originalText = block.text;
        const strippedText = stripEmoji(originalText);
        if (strippedText !== originalText) {
          block.text = strippedText;
          emojiBlocked++;
        }
      }
    }

    // Periodically show status
    if (totalMessages % 10 === 0 && emojiBlocked > 0) {
      ctx.ui.setStatus("no-emoji", `Emoji blocked: ${emojiBlocked}`);
    }
  });

  // Show on session start
  pi.on("session_start", async (_event, _ctx) => {
    emojiBlocked = 0;
    totalMessages = 0;
  });
}
