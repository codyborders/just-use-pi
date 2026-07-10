import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";

export interface ReviewerSkillCommandOptions {
  commandName: string;
  skillName: string;
  marker: string;
  description: string;
  reviewTask: string;
  legacyAgentName: string;
}

type Phase = "idle" | "queued" | "running";

interface ReviewerSkillState {
  phase: Phase;
}

function setPhase(
  state: ReviewerSkillState,
  options: ReviewerSkillCommandOptions,
  ctx: ExtensionContext,
  phase: Phase,
): void {
  state.phase = phase;

  const statusName = `${options.commandName}-skill`;
  if (phase === "idle") {
    ctx.ui.setStatus(statusName, undefined);
    return;
  }

  ctx.ui.setStatus(statusName, `${options.commandName} ${phase}`);
}

function textInvokesSkill(text: string, options: ReviewerSkillCommandOptions): boolean {
  const trimmedText = text.trim();
  if (trimmedText.length === 0) {
    return false;
  }

  if (trimmedText.includes(options.marker)) {
    return true;
  }

  return trimmedText.startsWith(`/skill:${options.skillName}`);
}

function buildTargetSection(args: string): string {
  const targetText = args.trim();
  if (targetText.length > 0) {
    return `Target files or instructions:\n${targetText}`;
  }

  return "No target files were supplied. Inspect the current git diff and review relevant files.";
}

function buildPrompt(options: ReviewerSkillCommandOptions, args: string): string {
  const targetSection = buildTargetSection(args);
  const instructions = [
    "Use repository state as the source of truth.",
    "Do not edit files.",
    "Return findings with file paths, line numbers, severity or impact, and concrete remediation.",
    "If no finding is worth reporting, say that the review found no issues.",
  ].join(" ");

  return `/skill:${options.skillName}\n\n<!-- ${options.marker} -->\n\n${options.reviewTask}\n\n${targetSection}\n\n${instructions}`;
}

function addAgentName(names: Set<string>, value: unknown): void {
  if (typeof value !== "string") {
    return;
  }

  const trimmedValue = value.trim();
  if (trimmedValue.length === 0) {
    return;
  }

  names.add(trimmedValue);
}

function addTaskAgentNames(names: Set<string>, value: unknown): void {
  if (!Array.isArray(value)) {
    return;
  }

  for (const item of value) {
    if (item === null) {
      continue;
    }

    if (typeof item !== "object") {
      continue;
    }

    addAgentName(names, (item as Record<string, unknown>).agent);
  }
}

function requestedAgentNames(input: Record<string, unknown>): Set<string> {
  const names = new Set<string>();
  addAgentName(names, input.agent);
  addTaskAgentNames(names, input.tasks);
  addTaskAgentNames(names, input.chain);
  return names;
}

function shouldBlockSubagentCall(input: unknown, options: ReviewerSkillCommandOptions): boolean {
  if (input === null) {
    return false;
  }

  if (typeof input !== "object") {
    return false;
  }

  const names = requestedAgentNames(input as Record<string, unknown>);
  return names.has(options.legacyAgentName);
}

export function registerReviewerSkillCommand(pi: ExtensionAPI, options: ReviewerSkillCommandOptions): void {
  const state: ReviewerSkillState = { phase: "idle" };

  pi.on("session_start", async (_event, ctx) => {
    setPhase(state, options, ctx, "idle");
  });

  pi.on("input", async (event, ctx) => {
    if (textInvokesSkill(event.text, options)) {
      setPhase(state, options, ctx, "running");
    }

    return { action: "continue" };
  });

  pi.on("before_agent_start", async (event, ctx) => {
    if (textInvokesSkill(event.prompt, options)) {
      setPhase(state, options, ctx, "running");
    }
  });

  pi.on("agent_end", async (_event, ctx) => {
    if (state.phase === "running") {
      setPhase(state, options, ctx, "idle");
    }
  });

  pi.on("tool_call", async (event) => {
    if (event.toolName !== "subagent") {
      return undefined;
    }

    if (!shouldBlockSubagentCall(event.input, options)) {
      return undefined;
    }

    return {
      block: true,
      reason: `Do not use the ${options.legacyAgentName} subagent. Use /skill:${options.skillName} or /${options.commandName} instead.`,
    };
  });

  pi.registerCommand(options.commandName, {
    description: options.description,
    handler: async (args, ctx) => {
      const prompt = buildPrompt(options, args);

      if (ctx.isIdle()) {
        setPhase(state, options, ctx, "running");
        pi.sendUserMessage(prompt);
        return;
      }

      setPhase(state, options, ctx, "queued");
      pi.sendUserMessage(prompt, { deliverAs: "followUp" });
      ctx.ui.notify(`Queued /skill:${options.skillName}.`, "info");
    },
  });
}
