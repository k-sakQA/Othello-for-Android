import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { AdbAndroidDevice } from "../device/androidDevice.js";
import { LocalShell } from "../utils/shell.js";
import { AuthSessionManager } from "../auth/authSessionManager.js";
import { AuthSetup } from "../auth/authSetup.js";

interface Args {
  url?: string;
}

const parseArgs = (argv: string[]): Args => {
  const args: Args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === "--url") {
      args.url = argv[i + 1];
      i += 1;
    }
  }
  return args;
};

export const main = async () => {
  const { url } = parseArgs(process.argv.slice(2));
  if (!url) {
    console.error("Usage: auth-setup --url \"https://example.com/login\"");
    process.exit(1);
  }

  const shell = new LocalShell();
  const device = new AdbAndroidDevice(shell);
  const sessionManager = new AuthSessionManager(shell);
  const setup = new AuthSetup({ device, sessionManager });

  const savedPath = await setup.run({ url });
  console.log(`✅ セッションを保存しました: ${savedPath}`);
};

const isDirectRun =
  fileURLToPath(import.meta.url) === fileURLToPath(process.argv[1] ?? "");
if (isDirectRun) {
  main().catch((error) => {
    console.error("auth-setup に失敗しました", error);
    process.exit(1);
  });
}
