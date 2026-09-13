// src/lib/gemini.ts
import { GoogleGenAI, Type } from "@google/genai";
import { Experiment } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const fieldSchema = {
  type: Type.OBJECT,
  properties: {
    value: { type: Type.STRING, nullable: true },
    status: { type: Type.STRING, enum: ["stated", "missing", "assumed"] },
    note: { type: Type.STRING, nullable: true },
    riskLevel: { type: Type.STRING, enum: ["safe-default", "flagged-assumption"] },
  },
  required: ["value", "status", "riskLevel"],
};

const experimentSchema = {
  type: Type.OBJECT,
  properties: {
    instrument: fieldSchema,
    timeframe: fieldSchema,
    entryCondition: fieldSchema,
    exitCondition: fieldSchema,
    holdingPeriod: fieldSchema,
    filters: fieldSchema,
    researchQuestion: { type: Type.STRING },
  },
  required: [
    "instrument",
    "timeframe",
    "entryCondition",
    "exitCondition",
    "holdingPeriod",
    "filters",
    "researchQuestion",
  ],
};



const SYSTEM_PROMPT = `You are a trading research assistant that converts a user's informal trading question into a structured, testable experiment.

For each field (instrument, timeframe, entryCondition, exitCondition, holdingPeriod, filters), determine:

- "value": your best interpretation, in plain concrete terms. Null only if truly ungeneratable.
- "status":
  - "stated" — the user explicitly said this
  - "assumed" — the user did not say this, so you filled in a reasonable market-research default
  - "missing" — you cannot reasonably guess this (rare — prefer a sensible assumption over "missing" whenever possible)
- "note": if status is "assumed", briefly explain WHY you chose that default. If "missing", phrase it as a question to ask the user.
- "riskLevel":
  - "flagged-assumption" for: instrument, entryCondition, exitCondition, holdingPeriod — these define the core trading idea, so any assumption here must be surfaced to the user for confirmation.
  - "safe-default" for: timeframe, filters — low-stakes, an assumption here rarely changes the spirit of the question.

Guidelines for assumptions:
- "sharp fall" / "a fall" with no number → assume "falls by 1% or more in a single day", note: "no threshold given, used 1% as a common definition of a notable single-day move"
- No exit condition given → assume "hold for a fixed period matching the holding period" rather than inventing an unrelated exit rule
- No holding period given → assume "5 trading days", note: "no holding period specified, used 5 trading days as a short-term default"
- No timeframe given → assume "Daily"
- No instrument given → do NOT assume one. Set status "missing", riskLevel "flagged-assumption", note as a question like "Which instrument or stock are you asking about?"

Also return "researchQuestion": a single clear restatement of what the user is fundamentally trying to find out (e.g. "Does buying after a sharp fall produce a positive average return over the following days?").

Be concise. Do not add hedging language outside the JSON structure.`;

export async function extractExperiment(rawQuestion: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: [{ role: "user", parts: [{ text: rawQuestion }] }],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: experimentSchema,
    },
  });

  const parsed = JSON.parse(response.text ?? "{}");

  const hasFlaggedAssumptions = [
    parsed.instrument,
    parsed.entryCondition,
    parsed.exitCondition,
    parsed.holdingPeriod,
  ].some((f) => f.riskLevel === "flagged-assumption" && f.status !== "stated");

  return {
    ...parsed,
    rawQuestion,
    hasFlaggedAssumptions,
  } as Experiment;
}