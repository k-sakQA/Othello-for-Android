import { access, mkdir } from "node:fs/promises";
import path from "node:path";
import type { Shell } from "../utils/shell.js";

export interface AuthSessionManagerOptions {
  sessionPath?: string;
}

export class AuthSessionManager {
  private readonly shell: Shell;
  private readonly sessionPath: string;
  private readonly packageName: string;

  constructor(shell: Shell, options: AuthSessionManagerOptions = {}) {
    this.shell = shell;
    this.sessionPath = path.resolve(options.sessionPath ?? "auth/session.bin");
    this.packageName = "com.android.chrome";
  }

  async pullSession(): Promise<string> {
    await this.ensureRunAsAvailable();
    await mkdir(path.dirname(this.sessionPath), { recursive: true });
    const cmd =
      `adb exec-out run-as ${this.packageName} ` +
      `tar -cf - app_chrome > "${this.sessionPath}"`;
    await this.shell.run(cmd);
    return this.sessionPath;
  }

  async pushSession(): Promise<void> {
    await access(this.sessionPath);
    await this.ensureRunAsAvailable();
    await this.shell.run("adb shell am force-stop com.android.chrome");
    const cmd =
      `adb shell run-as ${this.packageName} sh -c ` +
      `'rm -rf app_chrome && tar -xf -' < "${this.sessionPath}"`;
    await this.shell.run(cmd);
  }

  async pushSessionIfExists(): Promise<boolean> {
    try {
      await access(this.sessionPath);
    } catch (error) {
      return false;
    }
    const canRunAs = await this.canRunAs();
    if (!canRunAs) {
      console.warn(
        "auth/session.bin を検出しましたが、Chrome が debuggable でないため復元をスキップします。",
      );
      return false;
    }
    await this.pushSession();
    return true;
  }

  private async canRunAs(): Promise<boolean> {
    const cmd = `adb shell run-as ${this.packageName} ls`;
    try {
      await this.shell.run(cmd);
      return true;
    } catch (error) {
      return false;
    }
  }

  private async ensureRunAsAvailable(): Promise<void> {
    const ok = await this.canRunAs();
    if (!ok) {
      throw new Error(
        "run-as が許可されていないためセッション操作ができません。root化端末、もしくは debuggable な Chrome/Chromium が必要です。",
      );
    }
  }
}
