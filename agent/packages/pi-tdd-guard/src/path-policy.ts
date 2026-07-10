import { extname } from "node:path";

const BEHAVIOR_CODE_EXTENSIONS = new Set([
  ".c",
  ".cc",
  ".cpp",
  ".cs",
  ".ex",
  ".exs",
  ".go",
  ".h",
  ".hpp",
  ".java",
  ".js",
  ".jsx",
  ".kt",
  ".kts",
  ".mjs",
  ".cjs",
  ".php",
  ".py",
  ".pyi",
  ".rb",
  ".rs",
  ".sh",
  ".bash",
  ".zsh",
  ".svelte",
  ".swift",
  ".ts",
  ".tsx",
  ".vue",
]);

const EXCLUDED_DIRECTORY_NAMES = new Set([
  ".git",
  ".next",
  ".nuxt",
  ".venv",
  "__pycache__",
  "build",
  "coverage",
  "dist",
  "generated",
  "node_modules",
  "out",
  "target",
  "vendor",
  "venv",
]);

export function isBehaviorCodePath(filePath: string): boolean {
  if (filePath.length === 0) {
    return false;
  }

  const segments = filePath.replaceAll("\\", "/").split("/");
  if (segments.some((segment) => EXCLUDED_DIRECTORY_NAMES.has(segment.toLowerCase()))) {
    return false;
  }

  const extension = extname(filePath).toLowerCase();
  return BEHAVIOR_CODE_EXTENSIONS.has(extension);
}
