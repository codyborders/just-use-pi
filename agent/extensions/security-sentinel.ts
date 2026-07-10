import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { registerReviewerSkillCommand } from "./reviewer-skill-support/shared.js";

export default function securitySentinelExtension(pi: ExtensionAPI): void {
  registerReviewerSkillCommand(pi, {
    commandName: "security-sentinel",
    skillName: "security-sentinel",
    marker: "security-sentinel-extension",
    description: "Run the security review skill without spawning a subagent.",
    reviewTask: "Review the target code for exploitable security issues, weak trust boundaries, secret exposure, and missing validation.",
    legacyAgentName: "security-sentinel",
  });
}
