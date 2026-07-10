/**
 * Web tools extension.
 *
 * Provides Pi-native `webfetch` and `websearch` tools without adding a
 * package dependency chain to the local runtime.
 */

import { StringEnum } from "@mariozechner/pi-ai";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

const EXA_SEARCH_URL = "https://mcp.exa.ai/mcp?tools=web_search_exa";
const FETCH_TIMEOUT_MS_DEFAULT = 30_000;
const FETCH_TIMEOUT_MS_MAX = 120_000;
const SEARCH_CONTEXT_CHARACTERS_DEFAULT = 10_000;
const SEARCH_CONTEXT_CHARACTERS_MAX = 50_000;
const SEARCH_RESULTS_DEFAULT = 8;
const SEARCH_RESULTS_MAX = 10;
const OUTPUT_CHARACTERS_MAX = 50_000;
const USER_AGENT_VALUE =
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36";
const HTML_COMMENT_PATTERN = /<!--[\s\S]*?-->/g;
const SCRIPT_PATTERN = /<script\b[^>]*>[\s\S]*?<\/script>/gi;
const STYLE_PATTERN = /<style\b[^>]*>[\s\S]*?<\/style>/gi;
const NOSCRIPT_PATTERN = /<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi;
const TEMPLATE_PATTERN = /<template\b[^>]*>[\s\S]*?<\/template>/gi;
const HTML_TAG_PATTERN = /<[^>]+>/g;
const DECIMAL_ENTITY_PATTERN = /&#(\d+);/g;
const HEX_ENTITY_PATTERN = /&#x([0-9a-fA-F]+);/g;
const ANCHOR_PATTERN = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
const HEADING_PATTERN = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
const LIST_ITEM_PATTERN = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
const BREAK_PATTERN = /<br\s*\/?>/gi;
const BLOCK_CLOSE_PATTERN = /<\/(p|div|section|article|header|footer|main|nav|aside|blockquote|ul|ol|pre|table|tr)>/gi;
const BLOCK_OPEN_PATTERN = /<(p|div|section|article|header|footer|main|nav|aside|blockquote|ul|ol|pre|table|tr)\b[^>]*>/gi;
const CELL_OPEN_PATTERN = /<(td|th)\b[^>]*>/gi;
const CELL_CLOSE_PATTERN = /<\/(td|th)>/gi;

class ValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ValidationError";
	}
}

class RemoteRequestError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "RemoteRequestError";
	}
}

class ResponseParseError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ResponseParseError";
	}
}

const FetchFormatSchema = StringEnum(["markdown", "text", "html"] as const, {
	description: 'Output format. Default: "markdown".',
	default: "markdown",
});

const SearchLivecrawlSchema = StringEnum(["fallback", "preferred"] as const, {
	description: 'Live crawl behavior. Default: "fallback".',
	default: "fallback",
});

const SearchTypeSchema = StringEnum(["auto", "fast", "deep"] as const, {
	description: 'Search depth. Default: "auto".',
	default: "auto",
});

const WebFetchParams = Type.Object({
	url: Type.String({ description: "HTTP or HTTPS URL to fetch." }),
	format: Type.Optional(FetchFormatSchema),
	timeoutSeconds: Type.Optional(
		Type.Integer({
			description: "Request timeout in seconds. Range: 1-120. Default: 30.",
			minimum: 1,
			maximum: 120,
			default: 30,
		}),
	),
	cookies: Type.Optional(
		Type.String({
			description: 'Optional cookies as JSON object text or "name=value; other=value" text.',
		}),
	),
});

const WebSearchParams = Type.Object({
	query: Type.String({ description: "Search query text." }),
	numResults: Type.Optional(
		Type.Integer({
			description: "How many results to request. Range: 1-10. Default: 8.",
			minimum: 1,
			maximum: 10,
			default: 8,
		}),
	),
	livecrawl: Type.Optional(SearchLivecrawlSchema),
	type: Type.Optional(SearchTypeSchema),
	contextMaxCharacters: Type.Optional(
		Type.Integer({
			description: "Maximum context characters to request. Range: 1000-50000. Default: 10000.",
			minimum: 1000,
			maximum: 50000,
			default: 10000,
		}),
	),
	timeoutSeconds: Type.Optional(
		Type.Integer({
			description: "Request timeout in seconds. Range: 1-120. Default: 30.",
			minimum: 1,
			maximum: 120,
			default: 30,
		}),
	),
});

type FetchFormat = "markdown" | "text" | "html";
type SearchLivecrawl = "fallback" | "preferred";
type SearchType = "auto" | "fast" | "deep";
type ReadableFormat = "markdown" | "text";

type ToolContent = {
	content: Array<{ type: "text"; text: string }>;
	details?: Record<string, unknown>;
	isError?: boolean;
};

function ensureTextValue(value: unknown, fieldName: string): string {
	if (typeof value !== "string") {
		throw new ValidationError(`${fieldName} must be a string.`);
	}
	const trimmedValue = value.trim();
	if (trimmedValue.length === 0) {
		throw new ValidationError(`${fieldName} must not be empty.`);
	}
	return trimmedValue;
}

function ensureIntegerInRange(
	value: unknown,
	fieldName: string,
	minimumValue: number,
	maximumValue: number,
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
	if (value < minimumValue) {
		throw new ValidationError(`${fieldName} must be at least ${minimumValue}.`);
	}
	if (value > maximumValue) {
		throw new ValidationError(`${fieldName} must be at most ${maximumValue}.`);
	}
	return value;
}

function parseHttpUrl(urlText: string): URL {
	const normalizedUrlText = ensureTextValue(urlText, "url");
	let parsedUrl: URL;
	try {
		parsedUrl = new URL(normalizedUrlText);
	} catch {
		throw new ValidationError("url must be a valid URL.");
	}
	if (parsedUrl.protocol === "http:") {
		return parsedUrl;
	}
	if (parsedUrl.protocol === "https:") {
		return parsedUrl;
	}
	throw new ValidationError("url must use http or https.");
}

function buildRequestSignal(timeoutMs: number, outerSignal: AbortSignal): AbortSignal {
	const timeoutSignal = AbortSignal.timeout(timeoutMs);
	return AbortSignal.any([outerSignal, timeoutSignal]);
}

function ensureCookieToken(cookieToken: string, fieldName: string): string {
	const trimmedValue = ensureTextValue(cookieToken, fieldName);
	if (trimmedValue.includes("\n")) {
		throw new ValidationError(`${fieldName} must not contain newlines.`);
	}
	if (trimmedValue.includes("\r")) {
		throw new ValidationError(`${fieldName} must not contain carriage returns.`);
	}
	return trimmedValue;
}

function appendCookiePair(cookiePairs: string[], cookieName: string, cookieValue: unknown): void {
	const safeCookieName = ensureCookieToken(cookieName, "cookie name");
	const safeCookieValue = ensureCookieToken(String(cookieValue), `cookie value for ${safeCookieName}`);
	cookiePairs.push(`${safeCookieName}=${safeCookieValue}`);
}

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

function serializeCookieObject(cookieValue: unknown): string {
	if (!isRecord(cookieValue)) {
		throw new ValidationError("cookies JSON must be an object.");
	}
	const cookiePairs: string[] = [];
	for (const [cookieName, cookieRawValue] of Object.entries(cookieValue)) {
		appendCookiePair(cookiePairs, cookieName, cookieRawValue);
	}
	if (cookiePairs.length === 0) {
		throw new ValidationError("cookies JSON must include at least one cookie.");
	}
	return cookiePairs.join("; ");
}

function serializeCookiePairs(cookieText: string): string {
	const segments = cookieText.split(";");
	const cookiePairs: string[] = [];
	for (const segment of segments) {
		const trimmedSegment = segment.trim();
		if (trimmedSegment.length === 0) {
			continue;
		}
		const delimiterIndex = trimmedSegment.indexOf("=");
		if (delimiterIndex < 1) {
			throw new ValidationError('cookies text must use "name=value" pairs.');
		}
		const cookieName = trimmedSegment.slice(0, delimiterIndex);
		const cookieValue = trimmedSegment.slice(delimiterIndex + 1);
		appendCookiePair(cookiePairs, cookieName, cookieValue);
	}
	if (cookiePairs.length === 0) {
		throw new ValidationError("cookies text must include at least one cookie.");
	}
	return cookiePairs.join("; ");
}

function normalizeCookieHeader(cookieText: string | undefined): string | undefined {
	if (cookieText === undefined) {
		return undefined;
	}
	const trimmedCookieText = ensureTextValue(cookieText, "cookies");
	try {
		const parsedValue = JSON.parse(trimmedCookieText);
		return serializeCookieObject(parsedValue);
	} catch (error) {
		if (error instanceof SyntaxError) {
			return serializeCookiePairs(trimmedCookieText);
		}
		throw error;
	}
}

function decodeHtmlEntities(value: string): string {
	const namedEntityMap: Record<string, string> = {
		"&amp;": "&",
		"&lt;": "<",
		"&gt;": ">",
		"&quot;": '"',
		"&#39;": "'",
		"&nbsp;": " ",
		"&mdash;": "—",
		"&ndash;": "–",
		"&hellip;": "…",
	};
	let decodedValue = value;
	for (const [entityName, entityValue] of Object.entries(namedEntityMap)) {
		decodedValue = decodedValue.split(entityName).join(entityValue);
	}
	decodedValue = decodedValue.replace(DECIMAL_ENTITY_PATTERN, (_match, numberText) => String.fromCodePoint(Number(numberText)));
	decodedValue = decodedValue.replace(HEX_ENTITY_PATTERN, (_match, numberText) =>
		String.fromCodePoint(Number.parseInt(numberText, 16)),
	);
	return decodedValue;
}

function stripTags(value: string): string {
	const withoutTags = value.replace(HTML_TAG_PATTERN, " ");
	return decodeHtmlEntities(withoutTags);
}

function normalizeInlineWhitespace(value: string): string {
	const withoutTabs = value.replace(/\t+/g, " ");
	const withoutRepeatedSpaces = withoutTabs.replace(/[^\S\r\n]+/g, " ");
	return withoutRepeatedSpaces.trim();
}

function normalizeBlockWhitespace(value: string): string {
	const normalizedNewlines = value.replace(/\r\n/g, "\n");
	const withoutTrailingSpaces = normalizedNewlines.replace(/[ \t]+\n/g, "\n");
	const withoutLargeGaps = withoutTrailingSpaces.replace(/\n{3,}/g, "\n\n");
	return withoutLargeGaps.trim();
}

function extractAttributeValue(attributesText: string, attributeName: string): string | undefined {
	const quotedAttributePattern = new RegExp(`\\b${attributeName}\\s*=\\s*([\"'])(.*?)\\1`, "i");
	const quotedMatch = attributesText.match(quotedAttributePattern);
	if (quotedMatch) {
		return quotedMatch[2];
	}
	const unquotedAttributePattern = new RegExp(`\\b${attributeName}\\s*=\\s*([^\\s>]+)`, "i");
	const unquotedMatch = attributesText.match(unquotedAttributePattern);
	if (unquotedMatch) {
		return unquotedMatch[1];
	}
	return undefined;
}

function resolveLinkUrl(baseUrl: URL, linkText: string | undefined): string | undefined {
	if (linkText === undefined) {
		return undefined;
	}
	const normalizedLinkText = linkText.trim();
	if (normalizedLinkText.length === 0) {
		return undefined;
	}
	try {
		return new URL(normalizedLinkText, baseUrl).toString();
	} catch {
		return undefined;
	}
}

function removeDocumentNoise(htmlText: string): string {
	let cleanedHtmlText = htmlText.replace(HTML_COMMENT_PATTERN, "");
	cleanedHtmlText = cleanedHtmlText.replace(SCRIPT_PATTERN, "");
	cleanedHtmlText = cleanedHtmlText.replace(STYLE_PATTERN, "");
	cleanedHtmlText = cleanedHtmlText.replace(NOSCRIPT_PATTERN, "");
	cleanedHtmlText = cleanedHtmlText.replace(TEMPLATE_PATTERN, "");
	return cleanedHtmlText;
}

function formatAnchorText(linkLabel: string, resolvedLinkUrl: string | undefined, readableFormat: ReadableFormat): string {
	if (linkLabel.length === 0) {
		if (resolvedLinkUrl === undefined) {
			return "";
		}
		return resolvedLinkUrl;
	}
	if (resolvedLinkUrl === undefined) {
		return linkLabel;
	}
	if (readableFormat === "markdown") {
		return `[${linkLabel}](${resolvedLinkUrl})`;
	}
	return `${linkLabel} (${resolvedLinkUrl})`;
}

function replaceAnchors(htmlText: string, baseUrl: URL, readableFormat: ReadableFormat): string {
	return htmlText.replace(ANCHOR_PATTERN, (_match, attributesText, innerHtml) => {
		const linkLabel = normalizeInlineWhitespace(stripTags(innerHtml));
		const hrefValue = extractAttributeValue(attributesText, "href");
		const resolvedLinkUrl = resolveLinkUrl(baseUrl, hrefValue);
		return formatAnchorText(linkLabel, resolvedLinkUrl, readableFormat);
	});
}

function replaceHeadings(htmlText: string, readableFormat: ReadableFormat): string {
	return htmlText.replace(HEADING_PATTERN, (_match, levelText, innerHtml) => {
		const headingLevel = Number.parseInt(levelText, 10);
		const headingText = normalizeInlineWhitespace(stripTags(innerHtml));
		if (headingText.length === 0) {
			return "\n";
		}
		if (readableFormat === "markdown") {
			return `\n${"#".repeat(headingLevel)} ${headingText}\n\n`;
		}
		return `\n${headingText}\n\n`;
	});
}

function replaceListItems(htmlText: string, bulletPrefix: string): string {
	return htmlText.replace(LIST_ITEM_PATTERN, (_match, innerHtml) => {
		const itemText = normalizeInlineWhitespace(stripTags(innerHtml));
		if (itemText.length === 0) {
			return "\n";
		}
		return `\n${bulletPrefix}${itemText}`;
	});
}

function replaceBlockTags(htmlText: string): string {
	let blockText = htmlText.replace(BREAK_PATTERN, "\n");
	blockText = blockText.replace(BLOCK_CLOSE_PATTERN, "\n\n");
	blockText = blockText.replace(BLOCK_OPEN_PATTERN, "\n");
	blockText = blockText.replace(CELL_OPEN_PATTERN, " ");
	blockText = blockText.replace(CELL_CLOSE_PATTERN, " | ");
	return blockText;
}

function convertHtmlToReadableText(htmlText: string, sourceUrl: URL, readableFormat: ReadableFormat): string {
	const withoutNoise = removeDocumentNoise(htmlText);
	let readableText = replaceAnchors(withoutNoise, sourceUrl, readableFormat);
	readableText = replaceHeadings(readableText, readableFormat);
	readableText = replaceListItems(readableText, "- ");
	readableText = replaceBlockTags(readableText);
	readableText = stripTags(readableText);
	readableText = normalizeBlockWhitespace(readableText);
	if (readableText.length === 0) {
		throw new ResponseParseError("Fetched HTML did not contain readable text.");
	}
	return readableText;
}

function convertHtmlToMarkdown(htmlText: string, sourceUrl: URL): string {
	return convertHtmlToReadableText(htmlText, sourceUrl, "markdown");
}

function convertHtmlToText(htmlText: string, sourceUrl: URL): string {
	return convertHtmlToReadableText(htmlText, sourceUrl, "text");
}

function looksLikeHtmlDocument(responseText: string, contentType: string): boolean {
	const normalizedContentType = contentType.toLowerCase();
	if (normalizedContentType.includes("text/html")) {
		return true;
	}
	const trimmedResponseText = responseText.trimStart().toLowerCase();
	if (trimmedResponseText.startsWith("<!doctype html")) {
		return true;
	}
	if (trimmedResponseText.startsWith("<html")) {
		return true;
	}
	if (trimmedResponseText.startsWith("<body")) {
		return true;
	}
	return false;
}

function truncateOutputText(text: string): string {
	if (text.length <= OUTPUT_CHARACTERS_MAX) {
		return text;
	}
	const truncatedText = text.slice(0, OUTPUT_CHARACTERS_MAX);
	return `${truncatedText}\n\n[Truncated to ${OUTPUT_CHARACTERS_MAX} characters.]`;
}

async function readResponseBody(response: Response): Promise<string> {
	const responseText = await response.text();
	if (responseText.length === 0) {
		throw new RemoteRequestError("The response body was empty.");
	}
	return responseText;
}

async function fetchWebContent(
	sourceUrl: URL,
	timeoutMs: number,
	cookieHeader: string | undefined,
	signal: AbortSignal,
): Promise<{ bodyText: string; contentType: string; finalUrl: URL }> {
	const headers = new Headers();
	headers.set("Accept", "text/html, text/plain;q=0.9, application/xhtml+xml;q=0.8, */*;q=0.1");
	headers.set("User-Agent", USER_AGENT_VALUE);
	if (cookieHeader !== undefined) {
		headers.set("Cookie", cookieHeader);
	}
	const response = await fetch(sourceUrl, {
		method: "GET",
		headers,
		redirect: "follow",
		signal: buildRequestSignal(timeoutMs, signal),
	});
	if (!response.ok) {
		throw new RemoteRequestError(`Request failed with status ${response.status} ${response.statusText}.`);
	}
	const responseText = await readResponseBody(response);
	const finalUrl = new URL(response.url);
	const contentType = response.headers.get("content-type") ?? "";
	return {
		bodyText: responseText,
		contentType,
		finalUrl,
	};
}

function formatFetchedContent(
	bodyText: string,
	contentType: string,
	finalUrl: URL,
	outputFormat: FetchFormat,
): string {
	const isHtmlDocument = looksLikeHtmlDocument(bodyText, contentType);
	if (outputFormat === "html") {
		return truncateOutputText(bodyText);
	}
	if (!isHtmlDocument) {
		return truncateOutputText(bodyText);
	}
	if (outputFormat === "text") {
		const textValue = convertHtmlToText(bodyText, finalUrl);
		return truncateOutputText(textValue);
	}
	const markdownText = convertHtmlToMarkdown(bodyText, finalUrl);
	return truncateOutputText(markdownText);
}

function extractMcpResultText(messageValue: unknown): string | undefined {
	if (!isRecord(messageValue)) {
		return undefined;
	}
	if ("error" in messageValue) {
		const errorValue = messageValue.error;
		if (isRecord(errorValue)) {
			const messageText = errorValue.message;
			if (typeof messageText === "string") {
				throw new RemoteRequestError(messageText);
			}
		}
		throw new RemoteRequestError("The remote MCP server reported an error.");
	}
	const resultValue = messageValue.result;
	if (!isRecord(resultValue)) {
		return undefined;
	}
	const contentValue = resultValue.content;
	if (!Array.isArray(contentValue)) {
		return undefined;
	}
	for (const itemValue of contentValue) {
		if (!isRecord(itemValue)) {
			continue;
		}
		const typeValue = itemValue.type;
		if (typeValue !== "text") {
			continue;
		}
		const textValue = itemValue.text;
		if (typeof textValue !== "string") {
			continue;
		}
		if (textValue.trim().length === 0) {
			continue;
		}
		return textValue;
	}
	return undefined;
}

function extractMcpTextFromResponse(responseText: string): string {
	const responseLines = responseText.split(/\r?\n/);
	for (const responseLine of responseLines) {
		if (!responseLine.startsWith("data: ")) {
			continue;
		}
		const payloadText = responseLine.slice(6).trim();
		if (payloadText.length === 0) {
			continue;
		}
		if (payloadText === "[DONE]") {
			continue;
		}
		const parsedPayload = JSON.parse(payloadText) as unknown;
		const resultText = extractMcpResultText(parsedPayload);
		if (resultText !== undefined) {
			return resultText;
		}
	}
	const parsedResponse = JSON.parse(responseText) as unknown;
	const resultText = extractMcpResultText(parsedResponse);
	if (resultText !== undefined) {
		return resultText;
	}
	throw new ResponseParseError("The MCP response did not contain any text content.");
}

async function callExaSearch(
	queryText: string,
	searchType: SearchType,
	searchLivecrawl: SearchLivecrawl,
	resultsCount: number,
	contextCharactersMax: number,
	timeoutMs: number,
	signal: AbortSignal,
): Promise<string> {
	const requestBody = {
		jsonrpc: "2.0",
		id: 1,
		method: "tools/call",
		params: {
			name: "web_search_exa",
			arguments: {
				query: queryText,
				type: searchType,
				numResults: resultsCount,
				livecrawl: searchLivecrawl,
				contextMaxCharacters: contextCharactersMax,
			},
		},
	};
	const response = await fetch(EXA_SEARCH_URL, {
		method: "POST",
		headers: {
			accept: "application/json, text/event-stream",
			"content-type": "application/json",
			"user-agent": USER_AGENT_VALUE,
		},
		body: JSON.stringify(requestBody),
		signal: buildRequestSignal(timeoutMs, signal),
	});
	if (!response.ok) {
		throw new RemoteRequestError(`Search request failed with status ${response.status} ${response.statusText}.`);
	}
	const responseText = await readResponseBody(response);
	try {
		return truncateOutputText(extractMcpTextFromResponse(responseText));
	} catch (error) {
		if (error instanceof RemoteRequestError) {
			throw error;
		}
		if (error instanceof ResponseParseError) {
			throw error;
		}
		throw new ResponseParseError("Search response parsing failed.");
	}
}

function makeTextResult(text: string, details?: Record<string, unknown>): ToolContent {
	return {
		content: [{ type: "text", text }],
		details,
	};
}

function makeErrorResult(error: unknown): ToolContent {
	if (error instanceof ValidationError) {
		return {
			content: [{ type: "text", text: `Validation error: ${error.message}` }],
			isError: true,
		};
	}
	if (error instanceof RemoteRequestError) {
		return {
			content: [{ type: "text", text: `Request error: ${error.message}` }],
			isError: true,
		};
	}
	if (error instanceof ResponseParseError) {
		return {
			content: [{ type: "text", text: `Parse error: ${error.message}` }],
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
		content: [{ type: "text", text: "Unexpected error while running the tool." }],
		isError: true,
	};
}

async function executeWebfetch(
	params: {
		url: string;
		format?: FetchFormat;
		timeoutSeconds?: number;
		cookies?: string;
	},
	signal: AbortSignal,
): Promise<ToolContent> {
	try {
		const sourceUrl = parseHttpUrl(params.url);
		const outputFormat = (params.format ?? "markdown") as FetchFormat;
		const timeoutSeconds = ensureIntegerInRange(
			params.timeoutSeconds,
			"timeoutSeconds",
			1,
			FETCH_TIMEOUT_MS_MAX / 1000,
			FETCH_TIMEOUT_MS_DEFAULT / 1000,
		);
		const cookieHeader = normalizeCookieHeader(params.cookies);
		const timeoutMs = timeoutSeconds * 1000;
		const fetchedContent = await fetchWebContent(sourceUrl, timeoutMs, cookieHeader, signal);
		const resultText = formatFetchedContent(
			fetchedContent.bodyText,
			fetchedContent.contentType,
			fetchedContent.finalUrl,
			outputFormat,
		);
		return makeTextResult(resultText, {
			url: fetchedContent.finalUrl.toString(),
			format: outputFormat,
			contentType: fetchedContent.contentType,
			usedCookies: cookieHeader !== undefined,
		});
	} catch (error) {
		return makeErrorResult(error);
	}
}

async function executeWebsearch(
	params: {
		query: string;
		numResults?: number;
		livecrawl?: SearchLivecrawl;
		type?: SearchType;
		contextMaxCharacters?: number;
		timeoutSeconds?: number;
	},
	signal: AbortSignal,
): Promise<ToolContent> {
	try {
		const queryText = ensureTextValue(params.query, "query");
		const resultsCount = ensureIntegerInRange(
			params.numResults,
			"numResults",
			1,
			SEARCH_RESULTS_MAX,
			SEARCH_RESULTS_DEFAULT,
		);
		const contextCharactersMax = ensureIntegerInRange(
			params.contextMaxCharacters,
			"contextMaxCharacters",
			1000,
			SEARCH_CONTEXT_CHARACTERS_MAX,
			SEARCH_CONTEXT_CHARACTERS_DEFAULT,
		);
		const timeoutSeconds = ensureIntegerInRange(
			params.timeoutSeconds,
			"timeoutSeconds",
			1,
			FETCH_TIMEOUT_MS_MAX / 1000,
			FETCH_TIMEOUT_MS_DEFAULT / 1000,
		);
		const searchType = (params.type ?? "auto") as SearchType;
		const searchLivecrawl = (params.livecrawl ?? "fallback") as SearchLivecrawl;
		const timeoutMs = timeoutSeconds * 1000;
		const resultText = await callExaSearch(
			queryText,
			searchType,
			searchLivecrawl,
			resultsCount,
			contextCharactersMax,
			timeoutMs,
			signal,
		);
		return makeTextResult(resultText, {
			query: queryText,
			type: searchType,
			livecrawl: searchLivecrawl,
			numResults: resultsCount,
			contextMaxCharacters: contextCharactersMax,
		});
	} catch (error) {
		return makeErrorResult(error);
	}
}

export default function (pi: ExtensionAPI) {
	pi.registerTool({
		name: "webfetch",
		label: "WebFetch",
		description:
			"Fetches a web page over HTTP or HTTPS and returns it as markdown, text, or raw HTML. Supports optional cookies for local authenticated sessions.",
		parameters: WebFetchParams,
		async execute(_toolCallId, params, signal) {
			return executeWebfetch(params, signal);
		},
	});

	pi.registerTool({
		name: "websearch",
		label: "WebSearch",
		description: "Searches the web with Exa MCP and returns the text results.",
		parameters: WebSearchParams,
		async execute(_toolCallId, params, signal) {
			return executeWebsearch(params, signal);
		},
	});
}
