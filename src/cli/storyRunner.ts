import "../utils/env.js";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { AdbAndroidDevice } from "../device/androidDevice.js";
import { LocalShell } from "../utils/shell.js";
import { AuthSessionManager } from "../auth/authSessionManager.js";
import { OpenAIVisionClient } from "../llm/openAIVisionClient.js";
import { OpenAIStoryPlanner } from "../llm/openAIStoryPlanner.js";
import { OpenAIResultEvaluator } from "../llm/openAIResultEvaluator.js";
import { StoryRunner } from "../story/storyRunner.js";
import type { UserStory } from "../story/types.js";

interface Args {
  stories?: string;
  url?: string;
  out?: string;
}

const parseArgs = (argv: string[]): Args => {
  const args: Args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === "--stories") {
      args.stories = argv[i + 1];
      i += 1;
    } else if (value === "--url") {
      args.url = argv[i + 1];
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
  return `results/story-results-${timestamp}.json`;
};

export const main = async () => {
  const { stories: storiesPath, url, out } = parseArgs(process.argv.slice(2));
  if (!storiesPath) {
    console.error(
      "Usage: run-stories --stories stories.json [--url https://example.com] [--out results/story-results.json]",
    );
    process.exit(1);
  }

  const apiKey = process.env.OPENAI_API_KEY ?? "";
  if (!apiKey) {
    console.error("OPENAI_API_KEY が未設定です。");
    process.exit(1);
  }

  const storiesJson = await readFile(storiesPath, "utf-8");
  const stories = JSON.parse(storiesJson) as UserStory[];
  if (!Array.isArray(stories)) {
    throw new Error("stories.json は配列形式である必要があります。");
  }

  const shell = new LocalShell();
  const device = new AdbAndroidDevice(shell);
  const sessionManager = new AuthSessionManager(shell);
  await sessionManager.pushSessionIfExists();
  if (url) {
    await device.openUrl(url);
  }

  const vision = new OpenAIVisionClient({ apiKey });
  const planner = new OpenAIStoryPlanner({ apiKey });
  const evaluator = new OpenAIResultEvaluator({ apiKey });
  const runner = new StoryRunner({ device, vision, planner, evaluator });

  const results = await runner.run(stories);
  const outPath = resolveOutputPath(out);
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(results, null, 2), "utf-8");
  console.log(`✅ Story Runner の結果を保存しました: ${outPath}`);
};

const isDirectRun = fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? "");
if (isDirectRun) {
  main().catch((error) => {
    console.error("run-stories に失敗しました", error);
    process.exit(1);
  });
}
