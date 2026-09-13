# AI Usage Note

## Which AI tools I used
Claude (Anthropic), used conversationally throughout the build — architecture discussion, code generation, debugging, and UI design.

## What I used it for
- Scaffolding the Next.js project and deciding the tech stack (Next.js + TypeScript + Gemini + Supabase + Vercel)
- Designing the core `Experiment` / `ExtractedField` data model
- Writing the Gemini extraction prompt and structured output schema
- Writing the API route, React components, and Tailwind styling
- Debugging real issues as they came up during testing (see below)
- Drafting this documentation

## What I decided myself
- **Chose Option 1** over Option 2, based on scope fit for a 2-3 day timeline
- **Open-ended instrument field** rather than hardcoding NIFTY-only — decided this was worth the (small) extra generality since it shows the system generalizes rather than being hand-fitted to the brief's example
- **Assumption-based UX over hard-blocking**: when the brief says "ask rather than blindly assume," I interpreted that as "show the assumption and let the user correct it," not "refuse to proceed until every field is answered." I think a forced Q&A wall would have been worse UX for a research tool.
- **Which fields count as "critical" vs safe to default silently**: I decided entry condition, exit condition, holding period, and instrument are the ones where a wrong assumption changes the actual experiment, so those get flagged; timeframe and filters don't.
- **Chat-style re-asking over inline field editing**: given the timeline, I chose the simpler interaction pattern (reply with a clarification) over building inline-editable fields, which would have been more polished but riskier to get right in the time available.
- **Kept the light theme** over the dark theme we built, based on how it actually looked once rendered — the ruled-ledger look reads well in light mode.

## Did I reject or modify any AI-generated suggestions?
Yes — a specific example: partway through, I noticed the extraction was assuming a different implicit percentage threshold for "dip" (~2%) versus "sharp fall" (~1%), even though the prompt hardcoded one fallback number. Claude flagged this as a genuine trade-off (more linguistically intelligent vs. less reproducible) and gave me the choice to either tighten the prompt for strict determinism or accept the nuance. **I chose to accept it as-is** rather than over-engineer a fix, since the assignment brief explicitly said they're grading judgment and problem-solving over polish, and a more rigid prompt wasn't going to meaningfully improve the demo.

I also caught and directed fixes for two real bugs during testing rather than accepting broken behavior:
1. **A clarification-compounding bug** — early on, follow-up clarifications were appending onto an already-appended string, so by the third turn the raw question text had nested "clarification: clarification:" text and even picked up a stray test message as a real answer. I noticed this by inspecting the actual rows saved in Supabase, not just the UI, and asked for a fix that tracked the original question separately from the list of clarifications.
2. **A double-counting bug in that same fix's first pass** — the original question was appearing twice (once as the base, once again inside the clarifications list). I re-tested the exact same scenario after the fix and caught that it wasn't fully resolved, which led to a second, smaller correction (`.slice(1)` to skip the first user turn when building the clarifications list).

## What part am I most proud of
The two-tier assumption system (`status` + `riskLevel` on every field) — it's a small design decision, but it's what actually lets the UI show *only* the assumptions worth a user's attention (amber "please confirm" badges) while staying quiet about low-stakes ones (timeframe defaulting to Daily), instead of either drowning the user in warnings or hiding everything. I think that balance is closer to what the assignment brief is actually asking for than either extreme would have been.