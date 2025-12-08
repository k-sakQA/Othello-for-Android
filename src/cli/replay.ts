import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { Replayer } from "../core/replayer.js";
import { AdbAndroidDevice } from "../device/androidDevice.js";
import { LocalShell } from "../utils/shell.js";
import { AuthSessionManager } from "../auth/authSessionManager.js";
import type { Route } from "../core/types.js";

interface Args {
  route?: string;
  url?: string;
}

const parseArgs = (argv: string[]): Args => {
  const args: Args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === "--route") {
      args.route = argv[i + 1];
      i += 1;
    } else if (value === "--url") {
      args.url = argv[i + 1];
      i += 1;
    }
  }
  return args;
};

export const main = async () => {
  const { route: routePath, url } = parseArgs(process.argv.slice(2));
  if (!routePath) {
    console.error("Usage: replay --route routes/route.json [--url https://example.com]");
    process.exit(1);
  }

  const shell = new LocalShell();
  const device = new AdbAndroidDevice(shell);
  const sessionManager = new AuthSessionManager(shell);
  const replayer = new Replayer({ device, authSessionManager: sessionManager });

  const routeJson = await readFile(routePath, "utf-8");
  const route = JSON.parse(routeJson) as Route;
  await replayer.run({ route, url });
  console.log("✅ ルートの再生が完了しました");
};

const isDirectRun =
  fileURLToPath(import.meta.url) === fileURLToPath(process.argv[1] ?? "");
if (isDirectRun) {
  main().catch((error) => {
    console.error("replay に失敗しました", error);
    process.exit(1);
  });
}
