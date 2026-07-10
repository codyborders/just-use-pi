---
name: writing-great-skills
description: Reference for writing and editing skills well; the vocabulary and principles that make a skill predictable.
disable-model-invocation: true
---

A skill turns stochastic behaviour into a predictable process. `Predictability` means following the same process across runs even when the output changes. Every principle below serves that goal.

Terms formatted as code are defined in [`GLOSSARY.md`](GLOSSARY.md).

## Invocation

A model-invoked skill keeps a `description`. The agent can discover it autonomously, another skill can reach it, and a user can still type its name. Its description stays in the context window on every turn, which creates `context load`. Omit `disable-model-invocation` and write the description for the model, using trigger phrases such as "Use when the user wants...".

A user-invoked skill remains hidden from the agent. Only a user who types its name can invoke it, so other skills cannot reach it. This removes context load but creates `cognitive load` because the user must remember when the skill applies. Set `disable-model-invocation: true`; the description then becomes a short, human-facing summary without trigger lists.

Choose model invocation when the agent must find the skill by itself or another skill must reach it. Use user invocation for skills that always fire by hand.

If the user-invoked set becomes hard to remember, add a `router skill`. It gives the user one entry point that names each related skill and explains when to choose it.

## Writing the description

A model-invoked `description` identifies the skill and names its trigger `branches`. Every word adds context load, so prune the description more strictly than the body.

- Start with the skill's `leading word`, where it can guide invocation.
- Give each distinct branch one trigger. Collapse synonyms that describe the same branch because they create `duplication`.
- Remove identity already established in the body. Keep triggers and any clause that lets another skill reach this one.

## Information hierarchy

Skills contain `steps`, `reference`, or a combination of both. Place each item according to how soon the agent needs it.

1. An `in-skill step` is an ordered action in `SKILL.md`. Each step ends with a `completion criterion` that tells the agent when the action is done. Make the criterion checkable. When coverage matters, make it exhaustive. A vague criterion invites `premature completion`.
2. `In-skill reference` supplies a definition, rule, or fact in `SKILL.md` for consultation during work. A flat set of peer rules is valid. This skill consists entirely of reference.
3. `External reference` moves material into another file and loads it through a `context pointer`. Disclosed reference, such as `GLOSSARY.md`, remains part of the skill. Fully external reference lives outside the skill system and can serve multiple skills.

A demanding completion criterion drives thorough `legwork` even in a skill without steps. "Every rule applied" binds flat reference as strongly as "every step done" binds a sequence.

Put material high enough that the agent sees it when needed, but low enough that the top stays legible. `Progressive disclosure` moves reference from `SKILL.md` into a linked file. Name that file for its contents.

`Branching` provides the clearest disclosure test. Keep material inline when every branch needs it. Put branch-specific material behind a pointer. The pointer's wording controls when the agent follows it and how reliably the material loads.

The hierarchy decides where material sits. `Co-location` keeps everything about one concept under the same heading so the agent sees related guidance together.

## When to split

`Granularity` describes how finely skills are divided. Each split spends context load or cognitive load, so require a clear benefit.

- Split by invocation when a model-invoked skill has its own leading word or another skill must reach it. The new description adds permanent context load.
- Split by sequence when visible `post-completion steps` cause the agent to rush its current step. Hiding later steps lets the agent focus its legwork on the current task.

## Pruning

Give each meaning a `single source of truth` so behavioural changes require one edit.

Check every line for `relevance`. Keep only material that still affects what the skill does.

Evaluate `no-ops` one sentence at a time. Delete any sentence that does not change the model's behaviour. Rewriting usually preserves the unnecessary idea, so prefer removal.

## Leading words

A `leading word` is a compact concept already present in the model's pretraining, such as _lesson_ or _fog of war_. It gives the agent a stable concept to think with while running the skill. Repetition can build a distributed definition, though a strong word may need only one use. Existing concepts carry useful priors without extra explanation.

In the body, a leading word anchors execution by calling up the same behaviour each time. In the description, it anchors invocation by linking the language used to discuss the work with the skill's trigger.

Look for repeated explanations that one leading word can replace. A repeated cluster or a sentence that gestures at one idea can often collapse into a single pretrained term.

- `tight` can replace a repeated cluster such as "fast and deterministic with low overhead" when describing a loop.
- `red` can turn "a loop you believe in" into an observable gate. The loop reproduces the bug, or it fails the gate.

This reduces tokens while giving the agent a sharper mental hook. Assume each skill contains restatements that a well-chosen leading word can retire, then find them.

## Failure modes

Use these terms to diagnose skill behaviour.

- `Premature completion`. The agent ends a step before the completion criterion is met because its attention shifts toward later work. First sharpen the criterion. If it must remain fuzzy and the rush is observable, split the sequence to hide later steps.
- `Duplication`. One meaning appears in several places. It raises maintenance cost, wastes tokens, and gives that meaning more prominence than it deserves.
- `Sediment`. Stale layers accumulate because additions feel safer than removals. Regular pruning prevents this default decline.

Length and steering produce three more common failures.

- `Sprawl`. The skill becomes too long even though each line remains useful and unique. Move reference behind pointers, then split by branch or sequence so each path loads only what it needs.
- `No-op`. An instruction repeats behaviour the model already follows. Test whether it changes the default. Replace a weak leading word with a stronger one when the concept matters; otherwise delete the instruction.
- `Negation`. A prohibition puts the banned behaviour into context and makes it more available. State the desired behaviour directly. Reserve prohibitions for hard guardrails that cannot be phrased positively, and pair each one with its positive target.
