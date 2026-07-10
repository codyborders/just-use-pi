const CODE_EXTENSION =
  "(?:bash|c|cc|cpp|cs|ex|exs|go|h|hpp|java|js|jsx|kt|kts|mjs|cjs|php|py|pyi|rb|rs|sh|swift|ts|tsx|vue|svelte|zsh)";
const CODE_PATH = new RegExp(`(?:^|[\\s'\"=:/])[^\\s'\";&|]*\\.${CODE_EXTENSION}\\b`, "i");

const MUTATING_COMMAND = /(?:^|[;&|]\s*|\b)(?:cp|install|mv|rm|touch|truncate)\b/i;
const IN_PLACE_EDITOR = /\b(?:perl\b[^\n;&|]*\s-[A-Za-z]*i|sed\b[^\n;&|]*\s-i(?:\s|$|['"]))/i;
const SOURCE_REDIRECTION = new RegExp(
  `(?:^|[;&|]\\s*|\\s)(?:[0-9])?>>?\\s*['\"]?[^\\s'\";&|]*\\.${CODE_EXTENSION}\\b`,
  "i",
);
const SOURCE_TEE = new RegExp(
  `\\btee\\b[^\\n;&|]*?(?:^|\\s)['\"]?[^\\s'\";&|]*\\.${CODE_EXTENSION}\\b`,
  "i",
);
const GIT_WORKTREE_MUTATION =
  /\bgit\s+(?:checkout\b|switch\b|restore\b|reset\s+--hard\b|clean\b[^\n;&|]*-[A-Za-z]*f)/i;
const PATCH_APPLICATION = /(?:^|[;&|]\s*|\s)(?:apply_patch|patch)\b|\bgit\s+apply\b/i;
const INLINE_FILE_WRITER =
  /\b(?:writeFileSync|writeFile|write_text|write_bytes|open\s*\([^)]*,\s*['"][wax+])/i;

export function shellMutationReason(command: string): string | undefined {
  if (command.length === 0 || !looksLikeMutation(command)) {
    return undefined;
  }

  return "TDD Guard blocked a shell-based source mutation. Use the edit or write tool so Probity can validate the change.";
}

function looksLikeMutation(command: string): boolean {
  if (PATCH_APPLICATION.test(command) || GIT_WORKTREE_MUTATION.test(command)) {
    return true;
  }
  if (SOURCE_REDIRECTION.test(command) || SOURCE_TEE.test(command)) {
    return true;
  }
  if (!CODE_PATH.test(command)) {
    return false;
  }
  if (MUTATING_COMMAND.test(command) || IN_PLACE_EDITOR.test(command)) {
    return true;
  }
  if (INLINE_FILE_WRITER.test(command)) {
    return true;
  }
  return false;
}
