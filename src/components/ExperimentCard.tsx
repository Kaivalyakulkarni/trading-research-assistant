// src/components/ExperimentCard.tsx
import { Experiment, ExtractedField } from "@/lib/types";

function statusMeta(field: ExtractedField) {
  if (field.status === "missing") {
    return { border: "border-critical", label: "needs an answer", labelColor: "text-critical" };
  }
  if (field.status === "assumed" && field.riskLevel === "flagged-assumption") {
    return { border: "border-flagged", label: "assumed — reply below to confirm", labelColor: "text-flagged" };
  }
  if (field.status === "assumed") {
    return { border: "border-line", label: "assumed", labelColor: "text-ink-muted" };
  }
  return { border: "border-confirmed", label: "stated", labelColor: "text-confirmed" };
}

function FieldRow({ label, field }: { label: string; field: ExtractedField }) {
  const meta = statusMeta(field);

  return (
    <div className={`border-l-2 ${meta.border} py-2.5 pl-4`}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-ink-muted">{label}</span>
        <span className={`font-mono text-xs ${meta.labelColor}`}>{meta.label}</span>
      </div>
      <div className="mt-0.5 font-mono text-[15px] text-ink">
        {field.value ?? "—"}
      </div>
      {field.note && field.status !== "stated" && (
        <p className="mt-1 text-xs italic text-ink-muted">{field.note}</p>
      )}
    </div>
  );
}

export function ExperimentCard({ experiment }: { experiment: Experiment }) {
  return (
    <div className="w-full max-w-xl border border-line bg-surface">
      <div className="border-b border-line border-t-2 border-t-ink px-5 py-4">
        <div className="text-sm text-ink-muted">Research question</div>
        <p className="mt-0.5 text-[15px] leading-snug text-ink">{experiment.researchQuestion}</p>
      </div>

      <div className="flex flex-col gap-4 px-5 py-4">
        <FieldRow label="Instrument" field={experiment.instrument} />
        <FieldRow label="Timeframe" field={experiment.timeframe} />
        <FieldRow label="Entry condition" field={experiment.entryCondition} />
        <FieldRow label="Exit condition" field={experiment.exitCondition} />
        <FieldRow label="Holding period" field={experiment.holdingPeriod} />
        <FieldRow label="Filters" field={experiment.filters} />
      </div>

      {experiment.hasFlaggedAssumptions && (
        <div className="border-t border-line px-5 py-3">
          <p className="text-xs text-ink-muted">
            Fields marked in amber were assumed, not stated. Reply below to correct any of them.
          </p>
        </div>
      )}
    </div>
  );
}