/**
 * SearXNG search extension.
 *
 * Provides a Pi-native `searxng_search` tool that queries a SearXNG
 * instance and returns ranked web results with titles, URLs, and
 * snippets.
 *
 * Configuration: set the `SEARXNG_URL` environment variable to the
 * base URL of your SearXNG instance (e.g. http://localhost:8080).
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "typebox";

const DEFAULT_NUM_RESULTS = 10;
const MAX_NUM_RESULTS = 50;
const TIMEOUT_MS_DEFAULT = 30_000;
const TIMEOUT_MS_MAX = 120_000;

class ValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ValidationError";
	}
}

class RequestError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "RequestError";
	}
}

function ensureTextValue(value: unknown, fieldName: string): string {
	if (typeof value !== "string") {
		throw new ValidationError(`${fieldName} must be a string.`);
	}
	const trimmed = value.trim();
	if (trimmed.length === 0) {
		throw new ValidationError(`${fieldName} must not be empty.`);
	}
	return trimmed;
}

function ensureIntegerInRange(
	value: unknown,
	fieldName: string,
	min: number,
	max: number,
	defaultValue: number,
): number {
	if (value === undefined) {
		return defaultValue;
	}
	if (typeof value !== "number") {
		throw new ValidationError(`${fieldName} must be a number.`);
	}
	if (!Number.isInteger(value)) {
		throw new ValidationError(`${fieldName} must be an integer.`);
	}
	if (value < min) {
		throw new ValidationError(`${fieldName} must be at least ${min}.`);
	}
	if (value > max) {
		throw new ValidationError(`${fieldName} must be at most ${max}.`);
	}
	return value;
}

function buildRequestSignal(timeoutMs: number, outerSignal: AbortSignal | undefined): AbortSignal {
	const timeoutSignal = AbortSignal.timeout(timeoutMs);
	if (outerSignal === undefined) {
		return timeoutSignal;
	}

	return AbortSignal.any([outerSignal, timeoutSignal]);
}

function getSearxngUrl(): string {
	const url = process.env.SEARXNG_URL;
	if (!url) {
		throw new ValidationError(
			"SEARXNG_URL environment variable is not set. Configure it to point to your SearXNG instance (e.g. http://localhost:8080).",
		);
	}
	return url.replace(/\/+$/, "");
}

interface SearxngResult {
	url?: string;
	title?: string;
	content?: string;
}

interface SearxngResponse {
	query?: string;
	number_of_results?: number;
	results?: SearxngResult[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function callSearxng(
	baseUrl: string,
	query: string,
	numResults: number,
	language: string | undefined,
	categories: string | undefined,
	timeoutMs: number,
	signal: AbortSignal | undefined,
): Promise<string> {
	const searchUrl = new URL(`${baseUrl}/search`);
	searchUrl.searchParams.set("q", query);
	searchUrl.searchParams.set("format", "json");
	if (language) {
		searchUrl.searchParams.set("language", language);
	}
	if (categories) {
		searchUrl.searchParams.set("categories", categories);
	}

	const response = await fetch(searchUrl.toString(), {
		method: "GET",
		headers: {
			Accept: "application/json",
			"User-Agent": "pi-searxng-extension/1.0",
		},
		signal: buildRequestSignal(timeoutMs, signal),
	});

	if (!response.ok) {
		throw new RequestError(`SearXNG request failed with status ${response.status} ${response.statusText}.`);
	}

	const data = (await response.json()) as unknown;
	if (!isRecord(data)) {
		throw new RequestError("SearXNG returned an unexpected response format.");
	}

	const payload = data as SearxngResponse;
	const results = payload.results ?? [];

	if (results.length === 0) {
		return "No results found.";
	}

	const lines: string[] = [];
	lines.push(`Query: ${payload.query ?? query}`);
	lines.push(`Results: ${Math.min(results.length, numResults)} / ${payload.number_of_results ?? results.length}`);
	lines.push("");

	for (let index = 0; index < Math.min(results.length, numResults); index++) {
		const result = results[index];
		if (!result) continue;

		const title = result.title ?? "Untitled";
		const url = result.url ?? "No URL";
		const snippet = result.content ?? "";

		lines.push(`${index + 1}. ${title}`);
		lines.push(`   URL: ${url}`);
		if (snippet) {
			lines.push(`   ${snippet.replace(/\n+/g, " ")}`);
		}
		lines.push("");
	}

	return lines.join("\n").trim();
}

function makeErrorResult(error: unknown): { content: Array<{ type: "text"; text: string }>; isError: boolean } {
	if (error instanceof ValidationError) {
		return { content: [{ type: "text", text: `Validation error: ${error.message}` }], isError: true };
	}
	if (error instanceof RequestError) {
		return { content: [{ type: "text", text: `Request error: ${error.message}` }], isError: true };
	}
	if (error instanceof Error) {
		return { content: [{ type: "text", text: `Unexpected error: ${error.name}: ${error.message}` }], isError: true };
	}
	return { content: [{ type: "text", text: "Unexpected error while running the tool." }], isError: true };
}

const SearxngSearchParams = Type.Object({
	query: Type.String({ description: "Search query text." }),
	numResults: Type.Optional(
		Type.Integer({
			description: `How many results to return. Range: 1-${MAX_NUM_RESULTS}. Default: ${DEFAULT_NUM_RESULTS}.`,
			minimum: 1,
			maximum: MAX_NUM_RESULTS,
			default: DEFAULT_NUM_RESULTS,
		}),
	),
	language: Type.Optional(
		Type.String({
			description: 'Optional language code (e.g. "en", "en-US", "de").',
		}),
	),
	categories: Type.Optional(
		Type.String({
			description: 'Optional SearXNG categories (e.g. "general", "images", "news").',
		}),
	),
	timeoutSeconds: Type.Optional(
		Type.Integer({
			description: "Request timeout in seconds. Range: 1-120. Default: 30.",
			minimum: 1,
			maximum: TIMEOUT_MS_MAX / 1000,
			default: TIMEOUT_MS_DEFAULT / 1000,
		}),
	),
});

export default function (pi: ExtensionAPI) {
	let searxngUrl: string | undefined;
	try {
		searxngUrl = getSearxngUrl();
	} catch {
		// Defer error to tool execution so the user sees it in context.
	}

	pi.on("session_start", async (_event, ctx) => {
		if (searxngUrl) {
			ctx.ui.notify(`SearXNG extension loaded. Instance: ${searxngUrl}`, "info");
		} else {
			ctx.ui.notify("SearXNG extension loaded, but SEARXNG_URL is not set.", "warning");
		}
	});

	pi.registerTool({
		name: "searxng_search",
		label: "SearXNG Search",
		description:
			"Searches the web using a SearXNG instance and returns ranked results with titles, URLs, and snippets. Configure via the SEARXNG_URL environment variable.",
		parameters: SearxngSearchParams,
		async execute(_toolCallId, params, signal) {
			try {
				const baseUrl = searxngUrl ?? getSearxngUrl();
				const query = ensureTextValue(params.query, "query");
				const numResults = ensureIntegerInRange(
					params.numResults,
					"numResults",
					1,
					MAX_NUM_RESULTS,
					DEFAULT_NUM_RESULTS,
				);
				const timeoutSeconds = ensureIntegerInRange(
					params.timeoutSeconds,
					"timeoutSeconds",
					1,
					TIMEOUT_MS_MAX / 1000,
					TIMEOUT_MS_DEFAULT / 1000,
				);
				const language = params.language?.trim() || undefined;
				const categories = params.categories?.trim() || undefined;
				const timeoutMs = timeoutSeconds * 1000;

				const resultText = await callSearxng(
					baseUrl,
					query,
					numResults,
					language,
					categories,
					timeoutMs,
					signal,
				);

				return {
					content: [{ type: "text", text: resultText }],
					details: { query, numResults, language, categories },
				};
			} catch (error) {
				return makeErrorResult(error);
			}
		},
	});
}
