/**
 * GitHub Router Extension for pi
 *
 * Transforms GitHub URLs in user input to use gh CLI commands.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import type { InputEvent, ToolCallEvent, BashToolCallEvent } from "@mariozechner/pi-coding-agent";

const GITHUB_URL_PATTERN = /https?:\/\/github\.com\/[^\s]+/gi;

function convertUrlToGhCommand(url: string): string | null {
 const cleanUrl = url.replace(/[)\]}>]+$/, '').trim();
 
 let parsed: URL;
 try {
 parsed = new URL(cleanUrl);
 } catch {
 return null;
 }
 
 if (parsed.hostname !== 'github.com') return null;
 
 const pathParts = parsed.pathname.split('/').filter(Boolean);
 if (pathParts.length < 2) return null;
 
 const owner = pathParts[0];
 const repo = pathParts[1];
 const rest = pathParts.slice(2);
 
 if (rest.length === 0) {
 return `gh repo clone ${owner}/${repo}`;
 }
 
 if (rest[0] === 'blob' || rest[0] === 'tree') {
 const ref = rest[1] || 'main';
 const filePath = rest.slice(2).join('/');
 if (filePath) {
 return `gh api repos/${owner}/${repo}/contents/${filePath}?ref=${ref} --jq .content | base64 -d`;
 }
 return `gh repo view ${owner}/${repo}`;
 }
 
 if (rest[0] === 'pull') {
 return `gh pr view --repo ${owner}/${repo} ${rest[1] || ''}`;
 }
 
 if (rest[0] === 'issues') {
 return `gh issue view --repo ${owner}/${repo} ${rest[1] || ''}`;
 }
 
 return `gh repo view ${owner}/${repo}`;
}

export default function ghRouter(pi: ExtensionAPI) {
 
 // Inject system prompt to guide model toward gh CLI
 pi.on("before_agent_start", async (event) => {
 return {
 systemPrompt: event.systemPrompt + `

## GitHub URL Handling

When the user provides a GitHub URL, use the Bash tool with \`gh\` CLI.

DO NOT use webfetch for GitHub URLs.
`
 };
 });
 
 // Transform user input
 pi.on('input', (event) => {
 const urls = event.text.match(GITHUB_URL_PATTERN) || [];
 if (urls.length === 0) return;
 
 let transformed = event.text;
 
 for (const url of urls) {
 const cmd = convertUrlToGhCommand(url);
 if (cmd) {
 // Replace URL with explicit bash command instruction
 transformed = transformed.replace(url, `\n\nUse bash with this exact command:\n${cmd}\n`);
 }
 }
 
 event.text = transformed;
 });
 
 // Intercept bash tool calls that use curl/wget with GitHub URLs
 pi.on('tool_call', (event) => {
 if (event.toolName !== 'bash') return;
 
 const bashEvent = event as BashToolCallEvent;
 const command: string = bashEvent.input.command;
 if (!command) return;
 
 const isWebFetch = /curl|wget|git\s+clone/i.test(command);
 if (!isWebFetch) return;
 
 const urls = command.match(GITHUB_URL_PATTERN);
 if (!urls) return;
 
 let transformed = command;
 for (const url of urls) {
 const cmd = convertUrlToGhCommand(url);
 if (cmd) {
 transformed = transformed.replace(url, cmd);
 }
 }
 
 bashEvent.input.command = transformed;
 });
 
 console.log('[gh-router] GitHub URL routing extension loaded');
}
