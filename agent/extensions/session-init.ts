/**
 * Session initialization extension.
 *
 * Detects Python work and nudges the model to load the `python-practices`
 * skill instead of injecting large Python guidance into every turn.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const PYTHON_MARKER_FILES = [
  "pyproject.toml",
  "requirements.txt",
  "requirements-dev.txt",
  "requirements-test.txt",
  "setup.py",
  "setup.cfg",
  "Pipfile",
  "poetry.lock",
  "uv.lock",
  "pytest.ini",
  "tox.ini",
  ".python-version",
  "manage.py",
];

const PYTHON_PROMPT_PATTERN =
  /\b(python|pytest|pyproject|pydantic|fastapi|django|flask|sqlalchemy|alembic|mypy|ruff|poetry|uvicorn|uv|pip|virtualenv|venv|ipython|jupyter)\b|(?:^|\s)[\w./-]+\.pyi?\b|(?:^|\s)[\w./-]+\.ipynb\b/i;

function isPythonProject(cwd: string): boolean {
  for (const marker of PYTHON_MARKER_FILES) {
    if (existsSync(join(cwd, marker))) {
      return true;
    }
  }

  try {
    return readdirSync(cwd, { withFileTypes: true }).some(
      (entry) => entry.isFile() && /\.(py|pyi|ipynb)$/i.test(entry.name),
    );
  } catch {
    return false;
  }
}

function isPythonPrompt(prompt: string): boolean {
  return PYTHON_PROMPT_PATTERN.test(prompt);
}

export default function (pi: ExtensionAPI) {
  pi.on("before_agent_start", async (event) => {
    const cwd = event.systemPromptOptions.cwd ?? process.cwd();
    const pythonDetected = isPythonPrompt(event.prompt) || isPythonProject(cwd);

    if (!pythonDetected) {
      return undefined;
    }

    return {
      systemPrompt:
        event.systemPrompt +
        "\n\nPython task detected. Read and follow the `python-practices` skill before making changes. Prefer repo-specific Python conventions in AGENTS.md, README.md, pyproject.toml, setup.cfg, and existing code over generic defaults.",
    };
  });
}
