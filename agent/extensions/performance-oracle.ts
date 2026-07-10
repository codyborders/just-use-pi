import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { registerReviewerSkillCommand } from "./reviewer-skill-support/shared.js";

export default function performanceOracleExtension(pi: ExtensionAPI): void {
  registerReviewerSkillCommand(pi, {
    commandName: "performance-oracle",
    skillName: "performance-oracle",
    marker: "performance-oracle-extension",
    description: "Run the performance review skill without spawning a subagent.",
    reviewTask: "Review the target code for algorithmic cost, I/O patterns, database work, caching, memory use, concurrency, and resource handling.",
    legacyAgentName: "performance-oracle",
  });
}
