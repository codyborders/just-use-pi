import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import { enforceTdd, type RuleResult } from "@nizos/probity/rules";
import type { Agent } from "@nizos/probity/types";
import { readFile, stat } from "node:fs/promises";

import type { WriteEvaluator } from "./guard-engine.js";
import { toRawHistory } from "./history-adapter.js";
import { TDD_RULES } from "./tdd-policy.js";
import { createPiValidatorAgent } from "./validator-agent.js";

const FILE_SIZE_BYTES_MAX = 1_000_000;
const enforceTddRule = enforceTdd({
  instructions: TDD_RULES,
  maxEvents: 16,
  maxContentChars: 8_000,
  fastPath: false,
});

type AgentFactory = (context: ExtensionContext) => Agent;

export function createProbityWriteEvaluator(
  createAgent: AgentFactory = (context) => createPiValidatorAgent(context, context.signal),
): WriteEvaluator {
  return async (action, context): Promise<RuleResult> => {
    if (action.path.length === 0) {
      throw new Error("TDD Guard cannot evaluate a source write without a path.");
    }

    return enforceTddRule(action, {
      agent: createAgent(context),
      rawHistory: async () => toRawHistory(context.sessionManager.getBranch()),
      readFile: readFileForProbity,
    });
  };
}

async function readFileForProbity(filePath: string) {
  if (filePath.length === 0) {
    return { kind: "unknown" as const };
  }

  try {
    const metadata = await stat(filePath);
    if (!metadata.isFile() || metadata.size > FILE_SIZE_BYTES_MAX) {
      return { kind: "unknown" as const };
    }
    const content = await readFile(filePath, { encoding: "utf8" });
    return { kind: "present" as const, content };
  } catch (error: unknown) {
    if (isMissingFileError(error)) {
      return { kind: "absent" as const };
    }
    return { kind: "unknown" as const };
  }
}

function isMissingFileError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  return "code" in error && error.code === "ENOENT";
}
