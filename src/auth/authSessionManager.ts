import { access, mkdir } from "node:fs/promises";
import path from "node:path";
import type { Shell } from "../utils/shell.js";

export interface AuthSessionManagerOptions {
  sessionPath?: string;
}

export class AuthSessionManager {
  private readonly shell: Shell;
  private readonly sessionPath: string;

  constructor(shell: Shell, options: AuthSessionManagerOptions = {}) {
    this.shell = shell;
    this.sessionPath = path.resolve(options.sessionPath ?? "auth/session.bin");
  }

  async pullSession(): Promise<string> {
    await mkdir(path.dirname(this.sessionPath), { recursive: true });
    const cmd =
      `adb exec-out run-as com.android.chrome ` +
      `tar -cf - app_chrome > "${this.sessionPath}"`;
    await this.shell.run(cmd);
    return this.sessionPath;
  }

  async pushSession(): Promise<void> {
    // TODO: Chromeプロファイルの事前初期化が必要ならここで対応する
    await access(this.sessionPath);
    const cmd =
      `adb push "${this.sessionPath}" ` +
      `/data/user/0/com.android.chrome/app_chrome`;
    await this.shell.run(cmd);
  }

  async pushSessionIfExists(): Promise<boolean> {
    try {
      await access(this.sessionPath);
    } catch (error) {
      return false;
    }
    await this.pushSession();
    return true;
  }
}
