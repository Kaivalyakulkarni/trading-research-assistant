// src/app/page.tsx
"use client";

import { useState } from "react";
import { ChatTurn } from "@/lib/types";
import { ExperimentCard } from "@/components/ExperimentCard";

export default function Home() {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [originalQuestion, setOriginalQuestion] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!input.trim() || loading) return;
    setError(null);
    setLoading(true);

    const userText = input.trim();
    setInput("");
    setTurns((prev) => [...prev, { role: "user", text: userText }]);

    const isFirstQuestion = originalQuestion === null;
    const baseQuestion = isFirstQuestion ? userText : originalQuestion;

    const clarifications = isFirstQuestion
      ? []
      : [
          ...turns.filter((t) => t.role === "user").slice(1).map((t) => t.text),
          userText,
        ];

    const combinedQuestion = isFirstQuestion
      ? userText
      : `${baseQuestion}. Clarifications so far: ${clarifications.join("; ")}`;

    if (isFirstQuestion) setOriginalQuestion(userText);

    try {
      const res = await fetch("/api/experiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: combinedQuestion }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setTurns((prev) => [...prev, { role: "assistant", experiment: data.experiment }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-4">
      <header className="border-b border-line py-8">
        <h1 className="text-lg font-semibold tracking-tight text-ink">
          AI Trading Research Assistant
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Ask a trading question in plain English. It becomes a structured, testable experiment —
          every assumption shown, nothing hidden.
        </p>
      </header>

      <div className="flex flex-1 flex-col gap-5 py-6">
        {turns.length === 0 && !loading && (
          <div className="py-8 text-sm text-ink-muted">
            Try: <span className="font-mono text-ink">Does buying NIFTY after a sharp fall work?</span>
          </div>
        )}

        {turns.map((turn, i) =>
          turn.role === "user" ? (
            <div key={i} className="self-end bg-ink px-4 py-2 text-sm text-paper">
              {turn.text}
            </div>
          ) : (
            <ExperimentCard key={i} experiment={turn.experiment} />
          )
        )}

        {loading && <div className="font-mono text-xs text-ink-muted">Analyzing…</div>}
        {error && <div className="text-sm text-critical">{error}</div>}
      </div>

      <div className="sticky bottom-0 flex items-center gap-2 border-t border-line bg-paper py-4">
        <span className="font-mono text-ink-muted">›</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder={turns.length === 0 ? "Ask a question…" : "Add a clarification…"}
          className="flex-1 bg-transparent py-2 font-mono text-sm text-ink outline-none placeholder:text-ink-muted"
        />
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="border border-ink px-3 py-1.5 text-sm text-ink transition-colors hover:bg-ink hover:text-paper disabled:opacity-30"
        >
          {turns.length === 0 ? "Analyze" : "Send"}
        </button>
      </div>
    </main>
  );
}