import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import type { AndroidDevice } from "../core/types.js";
import type { AuthSessionManager } from "./authSessionManager.js";

export interface AuthSetupDeps {
  device: AndroidDevice;
  sessionManager: AuthSessionManager;
  prompt?: Prompt;
}

export interface Prompt {
  waitForEnter(message: string): Promise<void>;
}

export class ConsolePrompt implements Prompt {
  async waitForEnter(message: string): Promise<void> {
    const rl = createInterface({ input, output });
    await rl.question(`${message}\n`);
    rl.close();
  }
}

export interface AuthSetupOptions {
  url: string;
}

export class AuthSetup {
  private readonly device: AndroidDevice;
  private readonly sessionManager: AuthSessionManager;
  private readonly prompt: Prompt;

  constructor(deps: AuthSetupDeps) {
    this.device = deps.device;
    this.sessionManager = deps.sessionManager;
    this.prompt = deps.prompt ?? new ConsolePrompt();
  }

  async run(options: AuthSetupOptions): Promise<string> {
    await this.device.openUrl(options.url);
    await this.prompt.waitForEnter(
      "ログイン/MFAが完了したら Enter を押してください。Chrome のプロファイルを保存します。",
    );
    const sessionPath = await this.sessionManager.pullSession();
    return sessionPath;
  }
}
