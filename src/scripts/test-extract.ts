// src/scripts/test-extract.ts
import { config } from "dotenv";
config({ path: ".env.local" });

import { extractExperiment } from "../lib/gemini";

async function main() {
  const question = process.argv[2] ?? "Does buying NIFTY after a sharp fall work?";
  console.log("Question:", question);

  const result = await extractExperiment(question);
  console.log(JSON.stringify(result, null, 2));
}

main();