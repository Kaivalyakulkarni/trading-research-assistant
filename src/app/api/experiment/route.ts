// src/app/api/experiment/route.ts
import { NextRequest, NextResponse } from "next/server";
import { extractExperiment } from "@/lib/gemini";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { question } = await req.json();

  if (!question || typeof question !== "string" || question.trim().length < 5) {
    return NextResponse.json(
      { error: "Please enter a more complete question." },
      { status: 400 },
    );
  }

  try {
    const experiment = await extractExperiment(question.trim());

    const { error: dbError } = await supabase
      .from("experiments")
      .insert({ raw_question: question.trim(), experiment });

    if (dbError) {
      console.error("Supabase insert failed:", dbError);
      // don't fail the whole request over a logging failure — still return the experiment
    }

    return NextResponse.json({ experiment });
  } catch (err) {
    console.error("extractExperiment failed:", err);
    return NextResponse.json(
      { error: "Something went wrong while analyzing your question." },
      { status: 500 },
    );
  }
}
