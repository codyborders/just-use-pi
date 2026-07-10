/**
 * Plan Mode Extension - Claude Code Style
 *
 * Read-only exploration mode for safe code analysis and architecture planning.
 * Replicates Claude Code's /plan mode behavior.
 *
 * Features:
 * - /plan command or Ctrl+Shift+P to toggle
 * - Read-only tools only (read, bash, grep, find, ls)
 * - Bash restricted to allowlisted read-only commands
 * - Plan extraction from "Plan:" sections
 * - Critical files list from agent responses
 * - [DONE:n] markers for progress tracking
 * - Progress widget during execution
 */

import type { AgentMessage } from "@mariozechner/pi-agent-core";
import type { AssistantMessage, TextContent } from "@mariozechner/pi-ai";
import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { Key } from "@mariozechner/pi-tui";
import { extractPlanSteps, extractCriticalFiles, isSafeCommand, markCompletedSteps, type PlanStep } from "./utils.js";

// Tools available in plan mode (read-only)
const PLAN_MODE_TOOLS = ["read", "bash", "grep", "find", "ls"];

// Tools restored when exiting plan mode
const NORMAL_MODE_TOOLS = ["read", "bash", "edit", "write"];

// Type guard for assistant messages
function isAssistantMessage(m: AgentMessage): m is AssistantMessage {
	return m.role === "assistant" && Array.isArray(m.content);
}

// Extract text content from an assistant message
function getTextContent(message: AssistantMessage): string {
	return message.content
		.filter((block): block is TextContent => block.type === "text")
		.map((block) => block.text)
		.join("\n");
}

// System prompt injected when entering plan mode
const PLAN_MODE_SYSTEM_PROMPT = `[PLAN MODE ACTIVE] - READ-ONLY EXPLORATION MODE

You are in plan mode - a read-only exploration mode for safe code analysis and architecture planning.

=== CRITICAL: READ-ONLY MODE - NO FILE MODIFICATIONS ===
You are STRICTLY PROHIBITED from:
- Creating new files (no Write, touch, or file creation of any kind)
- Modifying existing files (no Edit operations)
- Deleting files (no rm or deletion)
- Moving or copying files (no mv or cp)
- Running ANY commands that change system state

Your role is EXCLUSIVELY to explore the codebase and design implementation plans.

=== AVAILABLE TOOLS ===
You can only use: read, bash, grep, find, ls

Bash is restricted to an allowlist of read-only commands. Commands like rm, mv, cp, mkdir, git add, npm install, etc. are BLOCKED.

=== YOUR PROCESS ===

1. **Understand Requirements**: Focus on the user's request and explore the codebase thoroughly.

2. **Explore Thoroughly**:
   - Read relevant files to understand the architecture
   - Find existing patterns using grep, find, and read tools
   - Understand current implementation
   - Identify similar features as reference
   - Use bash ONLY for: ls, git status, git log, git diff, cat, head, tail, find, grep, rg

3. **Design Solution**:
   - Create implementation approach based on your analysis
   - Consider trade-offs and architectural decisions
   - Follow existing patterns where appropriate

4. **Detail the Plan**:
   - Provide step-by-step implementation strategy under a "Plan:" header
   - Identify dependencies and sequencing
   - Anticipate potential challenges

=== REQUIRED OUTPUT FORMAT ===

Your response MUST end with:

### Plan:
1. First step description
2. Second step description
3. Third step description
...

### Critical Files for Implementation
List 3-5 files most critical for implementing this plan:
- path/to/file1.ts
- path/to/file2.ts
- path/to/file3.ts

=== IMPORTANT ===
- Do NOT attempt to make changes - just describe what you would do
- Use numbered steps in your plan (1., 2., 3., etc.)
- Be specific about which files need to be modified and in what order
- Consider edge cases and error handling`;

export default function planModeExtension(pi: ExtensionAPI): void {
	let planModeEnabled = false;
	let executionMode = false;
	let planSteps: PlanStep[] = [];
	let criticalFiles: string[] = [];

	function updateStatus(ctx: ExtensionContext): void {
		// Footer status
		if (executionMode && planSteps.length > 0) {
			const completed = planSteps.filter((t) => t.completed).length;
			ctx.ui.setStatus(
				"plan-mode",
				ctx.ui.theme.fg("accent", `📋 ${completed}/${planSteps.length}`),
			);
		} else if (planModeEnabled) {
			ctx.ui.setStatus("plan-mode", ctx.ui.theme.fg("warning", "⏸ plan"));
		} else {
			ctx.ui.setStatus("plan-mode", undefined);
		}

		// Widget showing todo list
		if (executionMode && planSteps.length > 0) {
			const lines = planSteps.map((item) => {
				if (item.completed) {
					return (
						ctx.ui.theme.fg("success", "☑ ") +
						ctx.ui.theme.fg("muted", ctx.ui.theme.strikethrough(item.text))
					);
				}
				return `${ctx.ui.theme.fg("muted", "☐ ")}${item.text}`;
			});
			ctx.ui.setWidget("plan-todos", lines);
		} else if (planModeEnabled && planSteps.length > 0) {
			const lines = planSteps.map((item) => `${ctx.ui.theme.fg("muted", "○ ")}${item.text}`);
			ctx.ui.setWidget("plan-todos", lines);
		} else {
			ctx.ui.setWidget("plan-todos", undefined);
		}
	}

	function togglePlanMode(ctx: ExtensionContext): void {
		planModeEnabled = !planModeEnabled;
		executionMode = false;
		planSteps = [];
		criticalFiles = [];

		if (planModeEnabled) {
			pi.setActiveTools(PLAN_MODE_TOOLS);
			ctx.ui.notify("Plan mode enabled (read-only)", "info");
		} else {
			pi.setActiveTools(NORMAL_MODE_TOOLS);
			ctx.ui.notify("Plan mode disabled. Full access restored.", "info");
		}
		updateStatus(ctx);
	}

	function persistState(): void {
		pi.appendEntry("plan-mode", {
			enabled: planModeEnabled,
			steps: planSteps,
			files: criticalFiles,
			executing: executionMode,
		});
	}

	// Register the /plan command
	pi.registerCommand("plan", {
		description: "Toggle plan mode (read-only exploration for architecture planning)",
		handler: async (_args, ctx) => togglePlanMode(ctx),
	});

	// Register Ctrl+Shift+P shortcut
	pi.registerShortcut(Key.ctrlShift("p"), {
		description: "Toggle plan mode",
		handler: async (ctx) => togglePlanMode(ctx),
	});

	// Block destructive bash commands in plan mode
	pi.on("tool_call", async (event) => {
		if (!planModeEnabled || event.toolName !== "bash") return;

		const command = event.input.command as string;
		if (!isSafeCommand(command)) {
			return {
				block: true,
				reason: `Plan mode: command blocked (not in allowlist).\nCommand: ${command}\n\nUse /plan to disable plan mode first.`,
			};
		}
	});

	// Filter out plan mode context when not in plan mode
	pi.on("context", async (event) => {
		if (planModeEnabled) return;

		return {
			messages: event.messages.filter((m) => {
				const msg = m as AgentMessage & { customType?: string };
				if (msg.customType === "plan-mode-context") return false;
				return true;
			}),
		};
	});

	// Inject plan mode context before agent starts
	pi.on("before_agent_start", async () => {
		if (planModeEnabled) {
			return {
				message: {
					customType: "plan-mode-context",
					content: PLAN_MODE_SYSTEM_PROMPT,
					display: false,
				},
			};
		}

		if (executionMode && planSteps.length > 0) {
			const remaining = planSteps.filter((t) => !t.completed);
			const todoList = remaining.map((t) => `${t.step}. ${t.text}`).join("\n");
			return {
				message: {
					customType: "plan-execution-context",
					content: `[EXECUTING PLAN - Full tool access enabled]

Remaining steps:
${todoList}

Critical files to modify:
${criticalFiles.map((f) => `- ${f}`).join("\n")}

Execute each step in order.
After completing a step, include a [DONE:n] tag in your response where n is the step number.`,
					display: false,
				},
			};
		}
	});

	// Track progress after each turn
	pi.on("turn_end", async (event, ctx) => {
		if (!executionMode || planSteps.length === 0) return;
		if (!isAssistantMessage(event.message)) return;

		const text = getTextContent(event.message);
		if (markCompletedSteps(text, planSteps) > 0) {
			updateStatus(ctx);
		}
		persistState();
	});

	// Handle plan completion and plan mode UI
	pi.on("agent_end", async (event, ctx) => {
		// Check if execution is complete
		if (executionMode && planSteps.length > 0) {
			if (planSteps.every((t) => t.completed)) {
				const completedList = planSteps.map((t) => `~~${t.text}~~`).join("\n");
				pi.sendMessage(
					{
						customType: "plan-complete",
						content: `**Plan Complete!** ✓\n\n${completedList}`,
						display: true,
					},
					{ triggerTurn: false },
				);
				executionMode = false;
				planSteps = [];
				criticalFiles = [];
				pi.setActiveTools(NORMAL_MODE_TOOLS);
				updateStatus(ctx);
				persistState();
			}
			return;
		}

		if (!planModeEnabled || !ctx.hasUI) return;

		// Extract plan and critical files from last assistant message
		const lastAssistant = [...event.messages].reverse().find(isAssistantMessage);
		if (lastAssistant) {
			const text = getTextContent(lastAssistant);
			const extracted = extractPlanSteps(text);
			if (extracted.length > 0) {
				planSteps = extracted;
			}
			const files = extractCriticalFiles(text);
			if (files.length > 0) {
				criticalFiles = files;
			}
		}

		// Show plan steps and prompt for next action
		if (planSteps.length > 0) {
			const stepListText = planSteps.map((t, i) => `${i + 1}. ☐ ${t.text}`).join("\n");
			let content = `**Plan Steps (${planSteps.length}):**\n\n${stepListText}`;
			if (criticalFiles.length > 0) {
				content += `\n\n**Critical Files:**\n${criticalFiles.map((f) => `- \`${f}\``).join("\n")}`;
			}
			pi.sendMessage(
				{
					customType: "plan-summary",
					content,
					display: true,
				},
				{ triggerTurn: false },
			);
		}

		const choice = await ctx.ui.select("Plan mode - what next?", [
			planSteps.length > 0 ? "Execute the plan (track progress)" : "Execute the plan",
			"Stay in plan mode",
			"Refine the plan",
		]);

		if (choice?.startsWith("Execute")) {
			planModeEnabled = false;
			executionMode = planSteps.length > 0;
			pi.setActiveTools(NORMAL_MODE_TOOLS);
			updateStatus(ctx);

			const execMessage =
				planSteps.length > 0
					? `Execute the plan. Start with: ${planSteps[0].text}\n\nCritical files:\n${criticalFiles.map((f) => `- ${f}`).join("\n")}`
					: "Execute the plan you just created.";
			pi.sendMessage(
				{ customType: "plan-mode-execute", content: execMessage, display: true },
				{ triggerTurn: true },
			);
		} else if (choice === "Refine the plan") {
			const refinement = await ctx.ui.editor("Refine the plan:", "");
			if (refinement?.trim()) {
				pi.sendUserMessage(refinement.trim());
			}
		}
	});

	// Restore state on session start/resume
	pi.on("session_start", async (_event, ctx) => {
		if (pi.getFlag("plan") === true) {
			planModeEnabled = true;
		}

		const entries = ctx.sessionManager.getEntries();

		// Restore persisted state
		const planModeEntry = entries
			.filter((e: { type: string; customType?: string }) => e.type === "custom" && e.customType === "plan-mode")
			.pop() as { data?: { enabled: boolean; steps?: PlanStep[]; files?: string[]; executing?: boolean } } | undefined;

		if (planModeEntry?.data) {
			planModeEnabled = planModeEntry.data.enabled ?? planModeEnabled;
			planSteps = planModeEntry.data.steps ?? planSteps;
			criticalFiles = planModeEntry.data.files ?? criticalFiles;
			executionMode = planModeEntry.data.executing ?? executionMode;
		}

		// On resume: re-scan messages to rebuild completion state
		const isResume = planModeEntry !== undefined;
		if (isResume && executionMode && planSteps.length > 0) {
			// Find the index of the last "plan-mode-execute" entry
			let executeIndex = -1;
			for (let i = entries.length - 1; i >= 0; i--) {
				const entry = entries[i] as { type: string; customType?: string };
				if (entry.customType === "plan-mode-execute") {
					executeIndex = i;
					break;
				}
			}

			// Only scan messages after the execute marker
			const messages: AssistantMessage[] = [];
			for (let i = executeIndex + 1; i < entries.length; i++) {
				const entry = entries[i];
				if (entry.type === "message" && "message" in entry && isAssistantMessage(entry.message as AgentMessage)) {
					messages.push(entry.message as AssistantMessage);
				}
			}
			const allText = messages.map(getTextContent).join("\n");
			markCompletedSteps(allText, planSteps);
		}

		if (planModeEnabled) {
			pi.setActiveTools(PLAN_MODE_TOOLS);
		}
		updateStatus(ctx);
	});
}
