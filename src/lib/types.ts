// src/lib/types.ts

export type RiskLevel = "safe-default" | "flagged-assumption";

export type ExtractedField = {
  value: string | null;
  status: "stated" | "missing" | "assumed";
  note?: string;           // clarifying question OR reason for the assumption
  riskLevel: RiskLevel;    // whether the UI should flag this for confirmation
};

export type Experiment = {
  instrument: ExtractedField;
  timeframe: ExtractedField;
  entryCondition: ExtractedField;
  exitCondition: ExtractedField;
  holdingPeriod: ExtractedField;
  filters: ExtractedField;
  researchQuestion: string;   // user's question, restated clearly by the LLM

  rawQuestion: string;
  hasFlaggedAssumptions: boolean; // true if any flagged-assumption field isn't "stated"
};

export type ChatTurn =
  | { role: "user"; text: string }
  | { role: "assistant"; experiment: Experiment };