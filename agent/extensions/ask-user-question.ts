/**
 * AskUserQuestion Tool Extension
 *
 * Replicates Claude Code's AskUserQuestion tool.
 * Asks the user questions during execution with multiple choice options.
 *
 * Features:
 * - Single question with multiple options
 * - Multi-select support for multiple answers
 * - "Other" option always available for custom text input
 * - Recommended option highlighting
 * - Beautiful keyboard-navigable TUI
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Editor, type EditorTheme, Key, matchesKey, Text, truncateToWidth } from "@mariozechner/pi-tui";
import { Type } from "@sinclair/typebox";

interface QuestionOption {
	label: string;
	description?: string;
}

type DisplayOption = QuestionOption & { isOther?: boolean; isRecommended?: boolean };

interface QuestionDetails {
	question: string;
	options: string[];
	multiSelect: boolean;
	answer: string | string[] | null;
	wasCustom: boolean;
}

export default function askUserQuestion(pi: ExtensionAPI): void {
	pi.registerTool({
		name: "ask_user_question",
		label: "Ask User Question",
		description: `Ask the user questions during execution. Use for:
1. Gathering user preferences or requirements
2. Clarifying ambiguous instructions
3. Getting decisions on implementation choices
4. Offering choices about what direction to take

Usage notes:
- Users can always select "Other" to provide custom text input
- Use multiSelect to allow multiple answers to be selected
- If recommending a specific option, make it the first option and add "(Recommended)" to its label
- In plan mode, use this tool to clarify requirements BEFORE finalizing your plan`,
		parameters: Type.Object({
			question: Type.String({ description: "The question to ask the user" }),
			options: Type.Array(
				Type.Object({
					label: Type.String({ description: "Display label for the option" }),
					description: Type.Optional(Type.String({ description: "Optional description shown below the option" })),
				}),
				{ description: "Options for the user to choose from" },
			),
			multiSelect: Type.Optional(
				Type.Boolean({ description: "Allow multiple answers to be selected (default: false)" }),
			),
			recommendedOptionIndex: Type.Optional(
				Type.Number({ description: "Index of the recommended option (0-based). The label will have (Recommended) appended." }),
			),
		}),

		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			if (!ctx.hasUI) {
				return {
					content: [{ type: "text", text: "Error: UI not available (running in non-interactive mode)" }],
					details: {
						question: params.question,
						options: params.options.map((o) => o.label),
						multiSelect: params.multiSelect ?? false,
						answer: null,
						wasCustom: false,
					} as QuestionDetails,
				};
			}

			if (params.options.length === 0) {
				return {
					content: [{ type: "text", text: "Error: No options provided" }],
					details: {
						question: params.question,
						options: [],
						multiSelect: params.multiSelect ?? false,
						answer: null,
						wasCustom: false,
					} as QuestionDetails,
				};
			}

			const multiSelect = params.multiSelect ?? false;
			const recommendedIndex = params.recommendedOptionIndex ?? -1;

			// Build display options with "Other" always at the end
			const baseOptions: DisplayOption[] = params.options.map((opt, i) => ({
				...opt,
				isRecommended: i === recommendedIndex,
				isOther: false,
			}));

			const allOptions: DisplayOption[] = [...baseOptions, { label: "Other", isOther: true }];

			const result = await ctx.ui.custom<{
				answer: string | string[];
				wasCustom: boolean;
			} | null>((tui, theme, _kb, done) => {
				let selectedIndices: Set<number> = new Set();
				if (recommendedIndex >= 0 && recommendedIndex < baseOptions.length) {
					selectedIndices.add(recommendedIndex);
				}
				let optionIndex = 0;
				let editMode = false;
				let cachedLines: string[] | undefined;

				const editorTheme: EditorTheme = {
					borderColor: (s) => theme.fg("accent", s),
					selectList: {
						selectedPrefix: (t) => theme.fg("accent", t),
						selectedText: (t) => theme.fg("accent", t),
						description: (t) => theme.fg("muted", t),
						scrollInfo: (t) => theme.fg("dim", t),
						noMatch: (t) => theme.fg("warning", t),
					},
				};
				const editor = new Editor(tui, editorTheme);

				editor.onSubmit = (value) => {
					const trimmed = value.trim();
					if (trimmed) {
						done({ answer: trimmed, wasCustom: true });
					} else {
						editMode = false;
						editor.setText("");
						refresh();
					}
				};

				function refresh() {
					cachedLines = undefined;
					tui.requestRender();
				}

				function toggleSelection(index: number) {
					if (multiSelect) {
						if (selectedIndices.has(index)) {
							selectedIndices.delete(index);
						} else {
							selectedIndices.add(index);
						}
					} else {
						selectedIndices.clear();
						selectedIndices.add(index);
					}
				}

				function getSelectedAnswers(): string[] {
					const answers: string[] = [];
					for (const idx of selectedIndices) {
						const opt = allOptions[idx];
						if (opt) {
							answers.push(opt.label);
						}
					}
					return answers;
				}

				function handleInput(data: string) {
					if (editMode) {
						if (matchesKey(data, Key.escape)) {
							editMode = false;
							editor.setText("");
							refresh();
							return;
						}
						editor.handleInput(data);
						refresh();
						return;
					}

					// Navigation
					if (matchesKey(data, Key.up)) {
						optionIndex = Math.max(0, optionIndex - 1);
						refresh();
						return;
					}
					if (matchesKey(data, Key.down)) {
						optionIndex = Math.min(allOptions.length - 1, optionIndex + 1);
						refresh();
						return;
					}

					// Toggle selection on Enter or Space
					if (matchesKey(data, Key.enter) || (multiSelect && matchesKey(data, Key.space))) {
						const opt = allOptions[optionIndex];
						if (opt.isOther) {
							editMode = true;
							refresh();
						} else {
							toggleSelection(optionIndex);
							// In single select, also submit
							if (!multiSelect) {
								const answers = getSelectedAnswers();
								done({ answer: answers[0] || "", wasCustom: false });
							} else {
								refresh();
							}
						}
						return;
					}

					// Space for multi-select
					if (matchesKey(data, Key.space) && multiSelect) {
						const opt = allOptions[optionIndex];
						if (!opt.isOther) {
							toggleSelection(optionIndex);
							refresh();
						}
						return;
					}

					// Cancel on Escape
					if (matchesKey(data, Key.escape)) {
						done(null);
					}
				}

				function render(width: number): string[] {
					if (cachedLines) return cachedLines;

					const lines: string[] = [];
					const add = (s: string) => lines.push(truncateToWidth(s, width));

					add(theme.fg("accent", "─".repeat(width)));
					add(theme.fg("text", ` ${params.question}`));
					lines.push("");

					for (let i = 0; i < allOptions.length; i++) {
						const opt = allOptions[i];
						const selected = selectedIndices.has(i);
						const isOther = opt.isOther === true;
						const isRecommended = opt.isRecommended === true;

						let prefix: string;
						let labelText: string;

						if (multiSelect) {
							prefix = selected ? theme.fg("success", "☑ ") : theme.fg("muted", "☐ ");
						} else {
							prefix = selected ? theme.fg("accent", "> ") : "  ";
						}

						if (isOther && editMode) {
							labelText = theme.fg("accent", `${opt.label} ✎`);
						} else if (isOther) {
							labelText = theme.fg("muted", opt.label);
						} else if (isRecommended && !selected) {
							labelText = theme.fg("text", `${opt.label} ${theme.fg("success", "(Recommended)")}`);
						} else if (selected) {
							labelText = theme.fg("accent", opt.label);
						} else {
							labelText = theme.fg("text", opt.label);
						}

						add(prefix + theme.fg("text", `${i + 1}. `) + labelText);

						// Show description if present
						if (opt.description && !isOther) {
							add(`     ${theme.fg("muted", opt.description)}`);
						}
					}

					if (editMode) {
						lines.push("");
						add(theme.fg("muted", " Type your answer:"));
						for (const line of editor.render(width - 2)) {
							add(` ${line}`);
						}
					}

					lines.push("");
					if (multiSelect) {
						const count = selectedIndices.size;
						if (editMode) {
							add(theme.fg("dim", " Enter to submit • Esc to go back"));
						} else {
							add(theme.fg("dim", " ↑↓ navigate • Space toggle • Enter submit • Esc cancel"));
						}
						if (count > 0) {
							add(theme.fg("success", ` ${count} selected`));
						}
					} else {
						if (editMode) {
							add(theme.fg("dim", " Enter to submit • Esc to go back"));
						} else {
							add(theme.fg("dim", " ↑↓ navigate • Enter select • Esc cancel"));
						}
					}
					add(theme.fg("accent", "─".repeat(width)));

					cachedLines = lines;
					return lines;
				}

				return {
					render,
					invalidate: () => {
						cachedLines = undefined;
					},
					handleInput,
				};
			});

			// Build simple options list for details
			const simpleOptions = params.options.map((o) => o.label);

			if (!result) {
				return {
					content: [{ type: "text", text: "User cancelled the selection" }],
					details: {
						question: params.question,
						options: simpleOptions,
						multiSelect,
						answer: null,
						wasCustom: false,
					} as QuestionDetails,
				};
			}

			if (result.wasCustom) {
				return {
					content: [{ type: "text", text: `User wrote: ${result.answer}` }],
					details: {
						question: params.question,
						options: simpleOptions,
						multiSelect,
						answer: result.answer as string,
						wasCustom: true,
					} as QuestionDetails,
				};
			}

			const answerText = Array.isArray(result.answer) ? result.answer.join(", ") : result.answer;
			return {
				content: [{ type: "text", text: `User selected: ${answerText}` }],
				details: {
					question: params.question,
					options: simpleOptions,
					multiSelect,
					answer: result.answer,
					wasCustom: false,
				} as QuestionDetails,
			};
		},

		renderCall(args, theme) {
			let text = theme.fg("toolTitle", theme.bold("ask_user_question ")) + theme.fg("muted", truncateToWidth(args.question, 50));
			const opts = Array.isArray(args.options) ? args.options : [];
			if (opts.length) {
				const labels = opts.map((o: QuestionOption) => o.label);
				const displayLabels = [...labels];
				if (args.recommendedOptionIndex !== undefined && args.recommendedOptionIndex >= 0) {
					displayLabels[args.recommendedOptionIndex] += " (Recommended)";
				}
				const numbered = [...displayLabels, "Other"].map((o, i) => `${i + 1}. ${truncateToWidth(o, 30)}`);
				text += `\n${theme.fg("dim", `  Options: ${numbered.join(", ")}`)}`;
			}
			if (args.multiSelect) {
				text += theme.fg("dim", " [multi]");
			}
			return new Text(text, 0, 0);
		},

		renderResult(result, _options, theme) {
			const details = result.details as QuestionDetails | undefined;
			if (!details) {
				const text = result.content[0];
				return new Text(text?.type === "text" ? text.text : "", 0, 0);
			}

			if (details.answer === null) {
				return new Text(theme.fg("warning", "Cancelled"), 0, 0);
			}

			if (details.wasCustom) {
				return new Text(
					theme.fg("success", "✓ ") + theme.fg("muted", "(custom) ") + theme.fg("accent", String(details.answer)),
					0,
					0,
				);
			}

			if (details.multiSelect && Array.isArray(details.answer)) {
				const display = details.answer.join(", ");
				return new Text(
					theme.fg("success", "✓ ") + theme.fg("accent", display) + theme.fg("muted", ` (${details.answer.length})`),
					0,
					0,
				);
			}

			const answerText = Array.isArray(details.answer) ? details.answer[0] : details.answer;
			const idx = details.options.indexOf(answerText);
			const display = idx >= 0 ? `${idx + 1}. ${answerText}` : answerText;
			return new Text(theme.fg("success", "✓ ") + theme.fg("accent", display), 0, 0);
		},
	});
}
