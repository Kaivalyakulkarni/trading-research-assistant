# AI Trading Research Assistant

A small web prototype that takes an informal trading question in plain English and converts it into a structured, testable experiment — flagging assumptions rather than making them silently.

**Live demo:** [add your Vercel URL here]
**Repo:** [add your GitHub URL here]

---

## The problem this solves

A user might ask something like *"Does buying NIFTY after a sharp fall work?"* — but that question is missing almost everything a real experiment needs: what counts as "sharp," when to exit, how long to hold. Most AI demos either (a) ignore the ambiguity and just answer confidently, or (b) block the user with a wall of required form fields before they can do anything.

This prototype takes a third path: **always produce a best-guess structured experiment, but make every assumption visible and easy to correct.** Nothing is hidden, nothing is a hard blocker.

---

## Architecture

```
User question (chat input)
        │
        ▼
POST /api/experiment  ──────►  Gemini API (structured JSON output)
        │                              │
        │                   returns Experiment object,
        │                   every field tagged with
        │                   status + riskLevel
        ▼
Save to Supabase (experiments table)
        │
        ▼
Render as a ledger-style experiment card in the UI
        │
        ▼
User sends a clarification (chat-style) ──► loops back to the SAME /api/experiment route,
                                              with the clarification appended to the
                                              original question
```

**One endpoint handles both the first question and every follow-up clarification.** Rather than building a separate `/api/clarify` route with its own state machine, a clarification is just the original question plus an appended clarification string, re-run through the identical extraction pipeline. This kept the backend simple and meant less code to get right under a tight deadline — the trade-off is documented below.

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | One framework for UI + API routes; deploys natively on Vercel; types catch mismatches between what the LLM returns and what the UI expects |
| Styling | Tailwind CSS | Fast to build a clean, deliberate UI without hand-rolling CSS |
| LLM | Google Gemini API (`gemini-3.6-flash`) | Free tier with no credit card required, and native support for `responseSchema` — structured JSON output constrained at generation time, not just prompted for |
| Database | Supabase (Postgres) | Free tier, minimal setup, stores the question → experiment history |
| Deployment | Vercel | Zero-config Next.js hosting, auto-deploys from GitHub on push |

---

## Key decisions

### 1. Assumption-based, not block-based
When information is missing, the system doesn't stop and demand an answer before showing anything. It makes a reasonable assumption, clearly labels it, and lets the user correct it conversationally. Only when a field is *truly* ungeneratable (e.g. no instrument mentioned at all) does it fall back to an explicit "needs an answer" state with a clarifying question.

Every field carries two independent signals:
- **`status`**: `stated` / `assumed` / `missing` — what actually happened during extraction
- **`riskLevel`**: `safe-default` / `flagged-assumption` — whether an incorrect assumption here would meaningfully change the experiment

`timeframe` and `filters` are safe defaults (assumed silently). `instrument`, `entryCondition`, `exitCondition`, and `holdingPeriod` are flagged for confirmation, since getting these wrong changes what's actually being tested.

### 2. Computed logic stays in TypeScript, not the LLM
`hasFlaggedAssumptions` (whether any high-risk field needs the user's attention) is computed in application code by checking the returned fields — not asked of the model. The LLM is only responsible for genuine language understanding (what did the user mean, what's a reasonable default); deterministic boolean logic is handled deterministically. This is more reliable and cheaper than asking the model to self-report something we can compute exactly.

### 3. Supabase schema: one JSON blob, not a normalized table
The `experiments` table has just `id`, `raw_question`, `experiment` (jsonb), `created_at`. The whole structured experiment is stored as one JSON blob rather than broken into individual relational columns. For a prototype where nothing queries individual fields yet (no "show me all experiments where instrument = NIFTY" feature), a rigid relational schema would have been premature complexity. This is a deliberate simplicity choice for prototype scope, not an oversight — a production version would likely normalize this once real query patterns emerged.

Row Level Security is enabled with permissive public read/write policies, since there's no auth system in scope for this assignment. A production version would scope rows to authenticated users.

### 4. A known, accepted trade-off: linguistic flexibility over strict determinism
The system prompt gives the model fallback defaults (e.g. "assume 1% for an undefined 'fall'"), but the model doesn't apply these perfectly rigidly — it was observed using a slightly different implicit threshold for "dip" (~2%) versus "sharp fall" (~1%), reading nuance into the phrasing rather than mechanically applying one fixed number. This was a deliberate choice to leave alone: a hardcoded, forcibly deterministic prompt would be more reproducible but less linguistically intelligent. For a research tool where consistency across repeated runs matters more (e.g. a production backtesting pipeline), this would be worth locking down further.

---

## What I'd improve with more time

- **Inline editing of assumed fields**, not just chat-style re-asking — click a value, edit it directly, rather than typing a clarification sentence
- **A history/browse view** backed by the existing Supabase table, so users can revisit past experiments instead of only seeing the current session
- **Stricter determinism** in the assumption prompt (see trade-off above) if reproducibility becomes a priority
- **The bonus stretch goal**: passing the structured `Experiment` object into a mock backtesting step, since the shape is already designed to support it
- **Authenticated, per-user rows** in Supabase instead of fully public RLS policies

---

## Running locally

```bash
npm install
```

Create `.env.local` with:
```
GEMINI_API_KEY=your_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Then:
```bash
npm run dev
```

Open `http://localhost:3000`.

To test the extraction logic in isolation (without the UI):
```bash
npm run test-extract -- "Does buying NIFTY after a sharp fall work?"
```

---

## AI tools used

See `AI_USAGE.md` for the detailed note on which AI tools were used, what for, and what I decided independently.