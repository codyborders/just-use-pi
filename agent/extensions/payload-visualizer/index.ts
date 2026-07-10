import type { ExtensionAPI, ExtensionCommandContext } from "@mariozechner/pi-coding-agent";
import * as http from "node:http";
import * as fs from "node:fs";
import * as path from "node:path";
import { exec } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execAsync = promisify(exec);

// ============================================================================
// Storage
// ============================================================================

const EXT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PAYLOADS_MAX = 100;

interface CapturedPayload {
	id: string;
	timestamp: string;
	provider: string;
	model: string;
	api?: string;
	turnIndex: number;
	payload: unknown;
}

let isCaptureEnabled = false;
let payloads: CapturedPayload[] = [];
let turnIndex = 0;

function capturePayload(payload: CapturedPayload): void {
	payloads.push(payload);
	if (payloads.length > PAYLOADS_MAX) {
		payloads = payloads.slice(-PAYLOADS_MAX);
	}
}

function clearPayloads(): void {
	payloads = [];
}

// ============================================================================
// HTTP Server
// ============================================================================

let server: http.Server | null = null;
let serverPort = 0;
let serverStartPromise: Promise<number> | null = null;

function getHtmlPath(): string {
	return path.join(EXT_DIR, "visualizer.html");
}

async function startServer(): Promise<number> {
	if (serverPort > 0) {
		return serverPort;
	}

	if (serverStartPromise) {
		return serverStartPromise;
	}

	const nextServer = createServer();
	server = nextServer;
	serverStartPromise = new Promise<number>((resolve, reject) => {
		nextServer.once("error", (error) => {
			server = null;
			serverPort = 0;
			serverStartPromise = null;
			reject(error);
		});

		nextServer.listen(0, "127.0.0.1", () => {
			const address = nextServer.address();
			if (!address || typeof address === "string") {
				server = null;
				serverPort = 0;
				serverStartPromise = null;
				reject(new Error("Payload visualizer server did not expose a TCP port"));
				return;
			}

			serverPort = address.port;
			resolve(serverPort);
		});
	});

	return serverStartPromise;
}

function createServer(): http.Server {
	return http.createServer((req, res) => {
		res.setHeader("Access-Control-Allow-Origin", "*");
		res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
		res.setHeader("Access-Control-Allow-Headers", "Content-Type");

		if (req.method === "OPTIONS") {
			res.writeHead(204);
			res.end();
			return;
		}

		if (req.url === "/api/payloads" && req.method === "GET") {
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify(payloads));
			return;
		}

		if (req.url === "/api/clear" && req.method === "POST") {
			clearPayloads();
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ ok: true }));
			return;
		}

		if (req.url === "/" || req.url === "/index.html") {
			const htmlPath = getHtmlPath();
			if (fs.existsSync(htmlPath)) {
				res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
				res.end(fs.readFileSync(htmlPath, "utf-8"));
			} else {
				res.writeHead(500);
				res.end("visualizer.html not found");
			}
			return;
		}

		res.writeHead(404);
		res.end("Not found");
	});
}

function stopServer(): void {
	if (server) {
		server.close();
		server = null;
		serverPort = 0;
		serverStartPromise = null;
	}
}

async function openBrowser(port: number): Promise<void> {
	const url = `http://127.0.0.1:${port}`;
	const platform = process.platform;
	try {
		if (platform === "darwin") {
			await execAsync(`open "${url}"`);
		} else if (platform === "win32") {
			await execAsync(`start "" "${url}"`);
		} else {
			await execAsync(`xdg-open "${url}"`);
		}
	} catch {
		// Ignore open failures
	}
}

// ============================================================================
// Extension Factory
// ============================================================================

export default function (pi: ExtensionAPI) {
	pi.on("agent_start", async () => {
		turnIndex++;
	});

	pi.on("before_provider_request", async (event, ctx) => {
		if (!isCaptureEnabled) {
			return;
		}

		const model = ctx.model;
		const payload: CapturedPayload = {
			id: Math.random().toString(36).slice(2, 10),
			timestamp: new Date().toISOString(),
			provider: model?.provider ?? "unknown",
			model: model?.id ?? "unknown",
			api: model?.api ?? undefined,
			turnIndex,
			payload: event.payload,
		};
		capturePayload(payload);
	});

	const openPayloadVisualizer = async (_args: string, ctx: ExtensionCommandContext) => {
		isCaptureEnabled = true;
		try {
			const port = await startServer();
			await openBrowser(port);
			ctx.ui.notify(`Payload visualizer enabled for this session at http://127.0.0.1:${port}`, "info");
		} catch (error) {
			isCaptureEnabled = false;
			const message = error instanceof Error ? error.message : String(error);
			ctx.ui.notify(`Failed to start payload visualizer server: ${message}`, "error");
		}
	};

	pi.registerCommand("payload-visualizer", {
		description: "Enable LLM payload capture for this session and open the visualizer",
		handler: openPayloadVisualizer,
	});

	pi.registerCommand("payloads", {
		description: "Alias for /payload-visualizer",
		handler: openPayloadVisualizer,
	});

	pi.on("session_shutdown", async () => {
		isCaptureEnabled = false;
		clearPayloads();
		stopServer();
	});
}
