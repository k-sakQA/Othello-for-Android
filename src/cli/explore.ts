import "../utils/env.js";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { Explorer } from "../core/explorer.js";
import { AdbAndroidDevice } from "../device/androidDevice.js";
import { LocalShell } from "../utils/shell.js";
import { AuthSessionManager } from "../auth/authSessionManager.js";
import { ManualPlanner } from "../llm/manualPlanner.js";
import { NoOpVisionClient } from "../llm/noOpVisionClient.js";
import { OpenAIVisionClient } from "../llm/openAIVisionClient.js";
import { OpenAIPlanner } from "../llm/openAIPlanner.js";

interface Args {
  url?: string;
  intent?: string;
  maxSteps?: number;
  out?: string;
}

const parseArgs = (argv: string[]): Args => {
  const args: Args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === "--url") {
      args.url = argv[i + 1];
      i += 1;
    } else if (value === "--intent") {
      args.intent = argv[i + 1];
      i += 1;
    } else if (value === "--max-steps") {
      const parsed = Number.parseInt(argv[i + 1] ?? "", 10);
      if (!Number.isNaN(parsed)) {
        args.maxSteps = parsed;
      }
      i += 1;
    } else if (value === "--out") {
      args.out = argv[i + 1];
      i += 1;
    }
  }
  return args;
};

const resolveOutputPath = (out?: string) => {
  if (out) return out;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `routes/route-${timestamp}.json`;
};

export const main = async () => {
  const { url, intent, maxSteps = 10, out } = parseArgs(process.argv.slice(2));
  if (!url || !intent) {
    console.error(
      "Usage: explore --url \"https://example.com\" --intent \"ログインして一覧を確認\" [--max-steps 10] [--out routes/route.json]",
    );
    process.exit(1);
  }

  const shell = new LocalShell();
  const device = new AdbAndroidDevice(shell);
  const sessionManager = new AuthSessionManager(shell);
  const apiKey = process.env.OPENAI_API_KEY ?? "";
  const useOpenAI = apiKey.length > 0;
  const vision = useOpenAI ? new OpenAIVisionClient({ apiKey }) : new NoOpVisionClient();
  const planner = useOpenAI ? new OpenAIPlanner({ apiKey }) : new ManualPlanner();
  if (!useOpenAI) {
    console.warn("OPENAI_API_KEY が未設定のため、手動プランナー/NoOp Vision を使用します。");
  }
  const explorer = new Explorer({ device, vision, planner, authSessionManager: sessionManager });

  const route = await explorer.run({ url, intent, maxSteps });
  const outPath = resolveOutputPath(out);
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(route, null, 2), "utf-8");
  console.log(`✅ ルートを保存しました: ${outPath}`);
};

const isDirectRun =
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? "");
if (isDirectRun) {
  main().catch((error) => {
    console.error("explore に失敗しました", error);
    process.exit(1);
  });
}
