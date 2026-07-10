/**
 * Slop Guard extension for pi.
 *
 * Pi does not ship with built-in MCP support, so this extension wraps the
 * `slop-guard` CLI directly while preserving the upstream MCP tool names.
 */

import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { constants as fileConstants } from "node:fs";
import { access, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, extname, join, resolve } from "node:path";

const CONFIG_ENVIRONMENT_NAME = "PI_SLOP_GUARD_CONFIG";
const INLINE_FILE_BASENAME = "inline-prose.md";
const RUNNER_PROBE_TIMEOUT_MS = 15_000;
const TOOL_TIMEOUT_MS = 120_000;
const AUTO_LINT_THRESHOLD = 80;
const AUTO_REWRITE_LIMIT = 2;
const MINIMUM_AUTO_LINT_WORD_COUNT = 10;
const PROSE_FILE_EXTENSIONS = new Set([".adoc", ".asciidoc", ".markdown", ".md", ".mdx", ".rst", ".txt"]);
const PROSE_FILE_BASENAMES = new Set(["agents", "changelog", "claude", "contributing", "onboarding", "readme", "system"]);

type SlopGuardRunner = {
	command: string;
	baseArguments: string[];
	displayName: string;
};

type SlopGuardReport = {
	score: number;
	band: string;
	word_count: number;
	violations: unknown[];
	counts: Record<string, number>;
	total_penalty: number;
	weighted_sum: number;
	density: number;
	advice: string[];
};

type SlopGuardOutcome = {
	report: SlopGuardReport;
	runner: string;
	config_path: string | null;
};

type ToolResult = {
	content: Array<{ type: "text"; text: string }>;
	details?: Record<string, unknown>;
	isError?: boolean;
};

class ValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ValidationError";
	}
}

class SlopGuardExecutionError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "SlopGuardExecutionError";
	}
}

let cachedRunner: SlopGuardRunner | undefined;
const lowScoreCountsByTarget = new Map<string, number>();

const TextParameters = Type.Object({
	text: Type.String({ description: "Text to analyze for formulaic AI-writing patterns." }),
});

const FileParameters = Type.Object({
	file_path: Type.String({ description: "Path to a text file on disk to analyze." }),
});

function isRecord(value: unknown): value is Record<string, unknown> {
	if (typeof value !== "object") {
		return false;
	}
	if (value === null) {
		return false;
	}
	if (Array.isArray(value)) {
		return false;
	}
	return true;
}

function ensureNonEmptyString(value: unknown, fieldName: string): string {
	if (typeof value !== "string") {
		throw new ValidationError(`${fieldName} must be a string.`);
	}
	const trimmedValue = value.trim();
	if (trimmedValue.length === 0) {
		throw new ValidationError(`${fieldName} must not be empty.`);
	}
	return trimmedValue;
}

function ensureFiniteNumber(value: unknown, fieldName: string): number {
	if (typeof value !== "number") {
		throw new ValidationError(`${fieldName} must be a number.`);
	}
	if (!Number.isFinite(value)) {
		throw new ValidationError(`${fieldName} must be finite.`);
	}
	return value;
}

function ensureIntegerInRange(
	value: unknown,
	fieldName: string,
	minimumValue: number,
	maximumValue: number,
): number {
	const numericValue = ensureFiniteNumber(value, fieldName);
	if (!Number.isInteger(numericValue)) {
		throw new ValidationError(`${fieldName} must be an integer.`);
	}
	if (numericValue < minimumValue) {
		throw new ValidationError(`${fieldName} must be at least ${minimumValue}.`);
	}
	if (numericValue > maximumValue) {
		throw new ValidationError(`${fieldName} must be at most ${maximumValue}.`);
	}
	return numericValue;
}

function ensureArray(value: unknown, fieldName: string): unknown[] {
	if (!Array.isArray(value)) {
		throw new ValidationError(`${fieldName} must be an array.`);
	}
	return value;
}

function ensureStringArray(value: unknown, fieldName: string): string[] {
	const arrayValue = ensureArray(value, fieldName);
	const normalizedValues: string[] = [];
	for (const item of arrayValue) {
		if (typeof item !== "string") {
			throw new ValidationError(`${fieldName} must contain only strings.`);
		}
		normalizedValues.push(item);
	}
	return normalizedValues;
}

function ensureBand(value: unknown): string {
	const normalizedValue = ensureNonEmptyString(value, "band").toLowerCase();
	const validBands = new Set(["clean", "light", "moderate", "heavy", "saturated"]);
	if (!validBands.has(normalizedValue)) {
		throw new ValidationError(`band must be one of: ${Array.from(validBands).join(", ")}.`);
	}
	return normalizedValue;
}

function ensureCounts(value: unknown): Record<string, number> {
	if (!isRecord(value)) {
		throw new ValidationError("counts must be an object.");
	}
	const normalizedCounts: Record<string, number> = {};
	for (const [countName, countValue] of Object.entries(value)) {
		normalizedCounts[countName] = ensureIntegerInRange(
			countValue,
			`counts.${countName}`,
			0,
			Number.MAX_SAFE_INTEGER,
		);
	}
	return normalizedCounts;
}

function countWords(text: string): number {
	const trimmedText = text.trim();
	if (trimmedText.length === 0) {
		return 0;
	}
	return trimmedText.split(/\s+/).filter(Boolean).length;
}

function isProseFilePath(filePath: string): boolean {
	const normalizedPath = filePath.trim();
	if (normalizedPath.length === 0) {
		return false;
	}
	const lowercaseBasename = basename(normalizedPath).toLowerCase();
	if (PROSE_FILE_BASENAMES.has(lowercaseBasename)) {
		return true;
	}
	const lowercaseExtension = extname(lowercaseBasename);
	if (PROSE_FILE_EXTENSIONS.has(lowercaseExtension)) {
		return true;
	}
	return false;
}

function stripFileReferencePrefix(filePathText: string): string {
	if (!filePathText.startsWith("@")) {
		return filePathText;
	}
	const normalizedPath = filePathText.slice(1).trim();
	if (normalizedPath.length === 0) {
		throw new ValidationError("file_path must not be only '@'.");
	}
	return normalizedPath;
}

async function resolveReadableFilePath(filePathText: string, cwd: string): Promise<string> {
	const normalizedInput = ensureNonEmptyString(filePathText, "file_path");
	const strippedInput = stripFileReferencePrefix(normalizedInput);
	const resolvedPath = resolve(cwd, strippedInput);
	let fileStats;
	try {
		fileStats = await stat(resolvedPath);
		await access(resolvedPath, fileConstants.R_OK);
	} catch (error) {
		if (error instanceof Error) {
			throw new ValidationError(`file_path is not readable: ${error.message}`);
		}
		throw new ValidationError("file_path is not readable.");
	}
	if (!fileStats.isFile()) {
		throw new ValidationError("file_path must point to a regular file.");
	}
	if (fileStats.size < 1) {
		throw new ValidationError("file_path must not point to an empty file.");
	}
	return resolvedPath;
}

async function resolveConfiguredRulePath(cwd: string): Promise<string | undefined> {
	const configuredValue = process.env[CONFIG_ENVIRONMENT_NAME];
	if (configuredValue === undefined) {
		return undefined;
	}
	const trimmedValue = ensureNonEmptyString(configuredValue, CONFIG_ENVIRONMENT_NAME);
	const resolvedPath = resolve(cwd, trimmedValue);
	let fileStats;
	try {
		fileStats = await stat(resolvedPath);
		await access(resolvedPath, fileConstants.R_OK);
	} catch (error) {
		if (error instanceof Error) {
			throw new ValidationError(`${CONFIG_ENVIRONMENT_NAME} is not readable: ${error.message}`);
		}
		throw new ValidationError(`${CONFIG_ENVIRONMENT_NAME} is not readable.`);
	}
	if (!fileStats.isFile()) {
		throw new ValidationError(`${CONFIG_ENVIRONMENT_NAME} must point to a regular file.`);
	}
	return resolvedPath;
}

async function probeRunner(pi: ExtensionAPI, runner: SlopGuardRunner, signal: AbortSignal): Promise<string | undefined> {
	try {
		const result = await pi.exec(runner.command, [...runner.baseArguments, "--version"], {
			signal,
			timeout: RUNNER_PROBE_TIMEOUT_MS,
		});
		if (result.code === 0) {
			return undefined;
		}
		const errorText = result.stderr.trim();
		if (errorText.length > 0) {
			return errorText;
		}
		return `exit code ${result.code}`;
	} catch (error) {
		if (error instanceof Error) {
			return `${error.name}: ${error.message}`;
		}
		return "unknown runner error";
	}
}

async function resolveRunner(pi: ExtensionAPI, signal: AbortSignal): Promise<SlopGuardRunner> {
	if (cachedRunner !== undefined) {
		return cachedRunner;
	}
	const candidateRunners: SlopGuardRunner[] = [
		{ command: "sg", baseArguments: [], displayName: "sg" },
		{
			command: "uvx",
			baseArguments: ["--from", "slop-guard", "sg"],
			displayName: "uvx --from slop-guard sg",
		},
	];
	const failureMessages: string[] = [];
	for (const candidateRunner of candidateRunners) {
		const failureMessage = await probeRunner(pi, candidateRunner, signal);
		if (failureMessage === undefined) {
			cachedRunner = candidateRunner;
			return candidateRunner;
		}
		failureMessages.push(`${candidateRunner.displayName}: ${failureMessage}`);
	}
	throw new SlopGuardExecutionError(
		`Could not find a working slop-guard runner. ${failureMessages.join("; ")}`,
	);
}

function parseReport(stdout: string): SlopGuardReport {
	const trimmedOutput = stdout.trim();
	if (trimmedOutput.length === 0) {
		throw new SlopGuardExecutionError("slop-guard returned empty output.");
	}
	let parsedOutput: unknown;
	try {
		parsedOutput = JSON.parse(trimmedOutput) as unknown;
	} catch (error) {
		if (error instanceof Error) {
			throw new SlopGuardExecutionError(`slop-guard returned invalid JSON: ${error.message}`);
		}
		throw new SlopGuardExecutionError("slop-guard returned invalid JSON.");
	}
	if (!isRecord(parsedOutput)) {
		throw new SlopGuardExecutionError("slop-guard JSON payload must be an object.");
	}
	const report: SlopGuardReport = {
		score: ensureIntegerInRange(parsedOutput.score, "score", 0, 100),
		band: ensureBand(parsedOutput.band),
		word_count: ensureIntegerInRange(parsedOutput.word_count, "word_count", 0, Number.MAX_SAFE_INTEGER),
		violations: ensureArray(parsedOutput.violations, "violations"),
		counts: ensureCounts(parsedOutput.counts),
		total_penalty: ensureFiniteNumber(parsedOutput.total_penalty, "total_penalty"),
		weighted_sum: ensureFiniteNumber(parsedOutput.weighted_sum, "weighted_sum"),
		density: ensureFiniteNumber(parsedOutput.density, "density"),
		advice: ensureStringArray(parsedOutput.advice, "advice"),
	};
	return report;
}

function buildSummary(report: SlopGuardReport): string {
	const positiveCounts = Object.entries(report.counts)
		.filter(([, countValue]) => countValue > 0)
		.sort((leftEntry, rightEntry) => rightEntry[1] - leftEntry[1]);
	const violationCount = report.violations.length;
	const categoryCount = positiveCounts.length;
	let summaryText = `Score ${report.score}/100 [${report.band}]. ${report.word_count} words. ${violationCount} violations across ${categoryCount} rule buckets.`;
	if (positiveCounts.length > 0) {
		const topCategories = positiveCounts
			.slice(0, 3)
			.map(([categoryName, countValue]) => `${categoryName}=${countValue}`)
			.join(", ");
		summaryText = `${summaryText}\nTop categories: ${topCategories}.`;
	}
	if (report.advice.length > 0) {
		const advicePreview = report.advice.slice(0, 3).map((item) => `- ${item}`).join("\n");
		summaryText = `${summaryText}\nAdvice:\n${advicePreview}`;
	}
	return summaryText;
}

async function createInlineInputFile(text: string): Promise<{ directoryPath: string; filePath: string }> {
	const normalizedText = ensureNonEmptyString(text, "text");
	const directoryPath = await mkdtemp(join(tmpdir(), "pi-slop-guard-"));
	const filePath = join(directoryPath, INLINE_FILE_BASENAME);
	await writeFile(filePath, normalizedText, { encoding: "utf8" });
	const persistedText = await readFile(filePath, { encoding: "utf8" });
	if (persistedText !== normalizedText) {
		throw new SlopGuardExecutionError("Failed to persist inline text for analysis.");
	}
	return { directoryPath, filePath };
}

async function removeTemporaryDirectory(directoryPath: string | undefined): Promise<void> {
	if (directoryPath === undefined) {
		return;
	}
	if (directoryPath.length === 0) {
		throw new ValidationError("Temporary directory path must not be empty.");
	}
	await rm(directoryPath, { force: true, recursive: true });
}

async function runSlopGuard(
	pi: ExtensionAPI,
	ctx: ExtensionContext,
	filePath: string,
	signal: AbortSignal,
): Promise<SlopGuardOutcome> {
	const resolvedRunner = await resolveRunner(pi, signal);
	const configuredRulePath = await resolveConfiguredRulePath(ctx.cwd);
	const commandArguments = [...resolvedRunner.baseArguments, "-j"];
	if (configuredRulePath !== undefined) {
		commandArguments.push("-c", configuredRulePath);
	}
	commandArguments.push(filePath);
	const result = await pi.exec(resolvedRunner.command, commandArguments, {
		cwd: ctx.cwd,
		signal,
		timeout: TOOL_TIMEOUT_MS,
	});
	if (result.code !== 0) {
		const errorText = result.stderr.trim();
		if (errorText.length > 0) {
			throw new SlopGuardExecutionError(errorText);
		}
		throw new SlopGuardExecutionError(`slop-guard exited with code ${result.code}.`);
	}
	return {
		report: parseReport(result.stdout),
		runner: resolvedRunner.displayName,
		config_path: configuredRulePath ?? null,
	};
}

function makeSuccessResult(outcome: SlopGuardOutcome): ToolResult {
	return {
		content: [{ type: "text", text: buildSummary(outcome.report) }],
		details: {
			...outcome.report,
			runner: outcome.runner,
			config_path: outcome.config_path,
		},
	};
}

function sendAutoLintMessage(pi: ExtensionAPI, content: string, details: Record<string, unknown>): void {
	pi.sendMessage(
		{
			customType: "slop-guard-auto-lint",
			content,
			display: true,
			details,
		},
		{ deliverAs: "steer" },
	);
}

function getToolInputPath(input: Record<string, unknown>): string | undefined {
	const rawPath = input.path;
	if (typeof rawPath !== "string") {
		return undefined;
	}
	const normalizedPath = rawPath.trim();
	if (normalizedPath.length === 0) {
		return undefined;
	}
	return normalizedPath;
}

function queueAutoLintForProseFile(pi: ExtensionAPI, input: Record<string, unknown>): void {
	const filePath = getToolInputPath(input);
	if (filePath === undefined) {
		return;
	}
	if (!isProseFilePath(filePath)) {
		return;
	}
	const contentValue = input.content;
	if (typeof contentValue === "string") {
		if (countWords(contentValue) < MINIMUM_AUTO_LINT_WORD_COUNT) {
			return;
		}
	}
	sendAutoLintMessage(pi, `Prose file updated: ${filePath}. Run check_slop_file on it before finishing. If score is below ${AUTO_LINT_THRESHOLD}, tighten prose and rerun once.`, {
		action: "check-file",
		file_path: filePath,
		threshold: AUTO_LINT_THRESHOLD,
	});
}

function queueLowScoreFollowUp(pi: ExtensionAPI, event: { toolName: string; input: Record<string, unknown>; details: unknown }): void {
	if (!isRecord(event.details)) {
		return;
	}
	const scoreValue = event.details.score;
	if (typeof scoreValue !== "number") {
		return;
	}
	if (!Number.isInteger(scoreValue)) {
		return;
	}
	if (scoreValue >= AUTO_LINT_THRESHOLD) {
		const filePath = typeof event.input.file_path === "string" ? event.input.file_path.trim() : undefined;
		if (filePath && filePath.length > 0) {
			lowScoreCountsByTarget.delete(filePath);
		}
		return;
	}
	const filePath = typeof event.input.file_path === "string" ? event.input.file_path.trim() : undefined;
	if (filePath && filePath.length > 0) {
		const previousCount = lowScoreCountsByTarget.get(filePath) ?? 0;
		const nextCount = previousCount + 1;
		lowScoreCountsByTarget.set(filePath, nextCount);
		if (nextCount > AUTO_REWRITE_LIMIT) {
			return;
		}
		sendAutoLintMessage(pi, `slop-guard scored ${scoreValue}/100 on ${filePath}. Tighten stock phrasing, keep meaning intact, then run check_slop_file again.`, {
			action: "revise-file",
			file_path: filePath,
			score: scoreValue,
			threshold: AUTO_LINT_THRESHOLD,
			attempt: nextCount,
		});
		return;
	}
	sendAutoLintMessage(pi, `slop-guard scored ${scoreValue}/100 on drafted prose. Tighten stock phrasing and run check_slop again once.`, {
		action: "revise-inline",
		score: scoreValue,
		threshold: AUTO_LINT_THRESHOLD,
	});
}

function makeErrorResult(error: unknown): ToolResult {
	if (error instanceof ValidationError) {
		return {
			content: [{ type: "text", text: `Validation error: ${error.message}` }],
			isError: true,
		};
	}
	if (error instanceof SlopGuardExecutionError) {
		return {
			content: [{ type: "text", text: `slop-guard error: ${error.message}` }],
			isError: true,
		};
	}
	if (error instanceof Error) {
		return {
			content: [{ type: "text", text: `Unexpected error: ${error.name}: ${error.message}` }],
			isError: true,
		};
	}
	return {
		content: [{ type: "text", text: "Unexpected error while running slop-guard." }],
		isError: true,
	};
}

async function executeCheckSlop(
	pi: ExtensionAPI,
	params: { text: string },
	signal: AbortSignal,
	ctx: ExtensionContext,
): Promise<ToolResult> {
	let temporaryDirectoryPath: string | undefined;
	try {
		const temporaryInput = await createInlineInputFile(params.text);
		temporaryDirectoryPath = temporaryInput.directoryPath;
		const outcome = await runSlopGuard(pi, ctx, temporaryInput.filePath, signal);
		return makeSuccessResult(outcome);
	} catch (error) {
		return makeErrorResult(error);
	} finally {
		try {
			await removeTemporaryDirectory(temporaryDirectoryPath);
		} catch {
			// Best-effort cleanup. A stale temp directory is less harmful than hiding a valid report.
		}
	}
}

async function executeCheckSlopFile(
	pi: ExtensionAPI,
	params: { file_path: string },
	signal: AbortSignal,
	ctx: ExtensionContext,
): Promise<ToolResult> {
	try {
		const resolvedPath = await resolveReadableFilePath(params.file_path, ctx.cwd);
		const outcome = await runSlopGuard(pi, ctx, resolvedPath, signal);
		return makeSuccessResult(outcome);
	} catch (error) {
		return makeErrorResult(error);
	}
}

export default function slopGuardExtension(pi: ExtensionAPI): void {
	pi.on("tool_result", async (event) => {
		if (event.isError) {
			return undefined;
		}
		if (event.toolName === "write") {
			queueAutoLintForProseFile(pi, event.input);
			return undefined;
		}
		if (event.toolName === "edit") {
			queueAutoLintForProseFile(pi, event.input);
			return undefined;
		}
		if (event.toolName === "check_slop") {
			queueLowScoreFollowUp(pi, event);
			return undefined;
		}
		if (event.toolName === "check_slop_file") {
			queueLowScoreFollowUp(pi, event);
			return undefined;
		}
		return undefined;
	});

	pi.registerTool({
		name: "check_slop",
		label: "Check Slop",
		description: "Analyze prose for formulaic AI-writing patterns with slop-guard.",
		promptSnippet: "Lint prose for formulaic AI-writing patterns and weak stock phrasing",
		promptGuidelines: [
			"Use check_slop after drafting or revising user-facing prose such as README files, docs, changelog entries, release notes, PR descriptions, or long status updates.",
			"Use check_slop_file for markdown, text, rst, adoc, or note files that already exist on disk.",
			"Do not use check_slop or check_slop_file for code, JSON, YAML, logs, or very short strings.",
			"If check_slop or check_slop_file returns a weak score, revise the prose and rerun once to confirm the improvement.",
		],
		parameters: TextParameters,
		async execute(_toolCallId, params, signal, _onUpdate, ctx) {
			return executeCheckSlop(pi, params, signal, ctx);
		},
	});

	pi.registerTool({
		name: "check_slop_file",
		label: "Check Slop File",
		description: "Analyze a prose file on disk for formulaic AI-writing patterns with slop-guard.",
		parameters: FileParameters,
		async execute(_toolCallId, params, signal, _onUpdate, ctx) {
			return executeCheckSlopFile(pi, params, signal, ctx);
		},
	});
}
