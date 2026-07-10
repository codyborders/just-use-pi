import type { GuardState } from "./guard-engine.js";

export const GUARD_STATE_ENTRY = "pi-tdd-guard-state";

export function loadGuardState(entries: readonly unknown[]): GuardState {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index];
    if (!isRecord(entry) || entry.type !== "custom") {
      continue;
    }
    if (entry.customType !== GUARD_STATE_ENTRY || !isRecord(entry.data)) {
      continue;
    }
    if (typeof entry.data.active === "boolean") {
      return { active: entry.data.active };
    }
  }

  return { active: true };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
