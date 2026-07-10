import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { registerReviewerSkillCommand } from "./reviewer-skill-support/shared.js";

export default function pythonReviewerExtension(pi: ExtensionAPI): void {
  registerReviewerSkillCommand(pi, {
    commandName: "python-reviewer",
    skillName: "python-reviewer",
    marker: "python-reviewer-extension",
    description: "Run the Python reviewer skill without spawning a subagent.",
    reviewTask: "Review the target Python code for typing, readability, error handling, imports, tests, and project conventions.",
    legacyAgentName: "python-reviewer",
  });
}
