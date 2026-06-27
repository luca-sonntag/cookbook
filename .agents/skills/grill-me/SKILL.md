---
name: grill-me
description: Use when the user wants to be quizzed on implementation details of the cookbook project — AGENTS.md-documented features, recent git diffs, or architectural decisions. Trigger on phrases like "grill me", "quiz me", "test my knowledge", "ask me about the implementation", "interrogate me on X", or when `/grill-me` is invoked. Uses the `vscode_askQuestions` tool to deliver strict-examiner rounds (multiple-choice + short-answer), reveals the correct answer after each response, and loops until the user signals they have demonstrated sufficient command of the relevant decisions.
---

# Grill Me

A strict-examiner skill that probes the user on cookbook implementation details using the VS Code question tool (`vscode_askQuestions`). Designed for self-driven code review prep, onboarding, or sanity-checking mental models of the architecture.

## When to Use

- User says `/grill-me` or any of: "grill me", "quiz me", "test my knowledge", "ask me about the implementation", "interrogate me on X", "poke holes in my understanding".
- User wants to rehearse talking through a specific area (e.g. "grill me on the queue", "grill me on RLS", "grill me on the Gemini prompt").

## When NOT to Use

- User wants to actually understand a topic (use normal explanation, not quizzing).
- User is debugging an active issue — this skill is for knowledge recall, not troubleshooting.
- User asks a direct factual question — answer it directly; do not turn it into a quiz.

## Scope of Questions

Generate questions across three rotating pools, weighted by what is currently in flux:

1. **AGENTS.md-documented features** — scraping (Apify), processing (Gemini + Supabase), frontend hooks (`useRecipeExtraction`, `useShoppingList`, `useCachedImage`, `useTimerManager`, etc.), Remix flow, Shopping List aggregation, PWA Share Target, In-App Timer, client-side image cache.
2. **Recent code changes** — read `git diff HEAD~1` (or staged diff) and question the rationale, edge cases, and trade-offs.
3. **Architecture decisions** — why Supabase over custom DB, why `helmet` + `express-rate-limit`, why `helmet.crossOriginResourcePolicy: cross-origin`, why 100 req/15min, why Gemini 1.5/2.5/3.x Flash, why `hasExplicitNutritionalValues` flag, why client-side Canvas compression, why Web Share Target, why no native image storage.

If the user specifies a topic (e.g. "grill me on timers"), restrict to that pool for the entire session.

## Question Style — Strict Examiner

Each round is **one `vscode_askQuestions` call** with a small set of focused questions per topic. Per round:

1. **One multiple-choice question** (3–5 options, exactly one recommended-correct) covering a key decision or invariant.
2. **One short-answer question** (free-form) requiring the user to articulate *why* or *how*, not just *what*.
3. Optionally a second multiple-choice if the topic warrants it (cap at 3 questions per round to keep it tight).

**Forbidden patterns:**
- Do not ask trivia questions answerable by grep (e.g. "what is line 42 of `db.ts`?"). Test *understanding*, not recall.
- Do not ask yes/no questions — always force a choice.
- Do not repeat a question the user has already answered correctly in this session.

## Round Mechanics

1. **Open the round** with a single sentence: topic, difficulty (easy / medium / hard), and what the round probes.
2. **Call `vscode_askQuestions`** with the prepared questions. Each question needs:
   - `header` — short identifier (≤12 chars, e.g. "Queue", "RLS").
   - `question` — concise, imperative, one sentence.
   - `options` — array of `{ label, description?, recommended? }` for MC questions; omit for free-form.
   - `multiSelect: false` for single-correct MC questions.
   - Allow free-form input on MC questions (`allowFreeformInput: true` by default) so the user can challenge the options.
3. **Wait for the user's response.** The tool returns the selected option(s) and any free-form text.
4. **Reveal the verdict inline** — do not call a tool for this:
   - ✅ `Correct.` — brief explanation of why this is right.
   - ⚠️ `Partially correct.` — state which part, what was missed, what the right answer is.
   - ❌ `Incorrect.` — state the right answer and the one-sentence reason.
   - For free-form answers, judge on substance (was the mechanism understood?), not wording. Be charitable but firm.
5. **Brief follow-up tease** (1 sentence) hinting at the next round's angle, or signal transition to the next pool.

## Round Count

- **Default: loop until the user signals stop.** Between rounds, ask a single natural-language question in the chat (not via `vscode_askQuestions`): "Continue with another round, or wrap up?" — wait for the user to respond.
- If the user opened the skill with a specific count (e.g. "grill me 5 times"), respect that exactly and stop with a one-line summary.
- If the user opened the skill with a topic, stay on that topic and rotate through different angles of it (mechanism → failure mode → trade-off → extension).

## Difficulty Calibration

Start at **easy** (direct recall of documented decisions). After 2 correct answers in a row, escalate to **medium** (apply to a new scenario). After 2 more correct, escalate to **hard** (challenge the decision itself: "defend why we don't do X instead"). Reset to easy on the first incorrect answer.

## Example Rounds

**Easy (multiple-choice on documented fact):**
> Round 1 — easy. Testing the queue authorization model.
> "On the `/api/extract-recipe` route, which credential is used to run the Gemini processing step?"
> Options: `User JWT` / `Service-role key (admin)` / `Publishable key` / `Anonymous`

**Medium (free-form on mechanism):**
> Round 2 — medium. Testing the recipe nutrition fallback.
> "When `hasExplicitNutritionalValues` is false, how does the backend derive per-serving nutrition? Walk through the path from Gemini output to what the frontend renders."

**Hard (defend the decision):**
> Round 3 — hard. Testing trade-off reasoning.
> "Why is the recipe image cache stored client-side in IndexedDB instead of being proxied and cached on the server? Pick the strongest argument and defend it against the alternative."

## Anti-Patterns

- Do not bundle many small questions into one round — keep cognitive load per round tight.
- Do not ask questions whose answer is in the file the user just opened (test understanding, not copy-paste).
- Do not move to the next round before revealing the verdict of the current one.
- Do not invent features that don't exist in AGENTS.md — only quiz on documented behavior or actually-merged code.

## Closing

When the user signals stop:
1. One short paragraph: total rounds, breakdown by pool, overall difficulty reached, any concept that was missed twice (gap to revisit).
2. No markdown report file, no tool calls for the summary — plain chat text only.

If the user said "no final summary" upfront (per their explicit preference), skip even this — just acknowledge the end.