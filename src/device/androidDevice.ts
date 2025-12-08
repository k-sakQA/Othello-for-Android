import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { AndroidDevice } from "../core/types.js";
import type { Shell } from "../utils/shell.js";

export class AdbAndroidDevice implements AndroidDevice {
  private readonly shell: Shell;

  constructor(shell: Shell) {
    this.shell = shell;
  }

  async openUrl(url: string): Promise<void> {
    const cmd =
      `adb shell am start -n com.android.chrome/com.google.android.apps.chrome.Main ` +
      `-d "${url}"`;
    await this.shell.run(cmd);
  }

  async captureScreenshot(): Promise<string> {
    await mkdir("screenshots", { recursive: true });
    const filepath = path.resolve("screenshots", `screen-${Date.now()}.png`);
    const cmd = `adb exec-out screencap -p > "${filepath}"`;
    await this.shell.run(cmd);
    return filepath;
  }

  async tap(x: number, y: number): Promise<void> {
    await this.shell.run(`adb shell input tap ${x} ${y}`);
  }

  async inputText(x: number, y: number, text: string): Promise<void> {
    await this.tap(x, y);
    // TODO: quote処理を強化（空白や特殊文字の扱い）
    const sanitized = text.replace(/ /g, "%s");
    await this.shell.run(`adb shell input text "${sanitized}"`);
  }

  async scroll(direction: "up" | "down"): Promise<void> {
    const startY = direction === "up" ? 300 : 1000;
    const endY = direction === "up" ? 1000 : 300;
    await this.shell.run(`adb shell input swipe 500 ${startY} 500 ${endY} 300`);
  }

  async back(): Promise<void> {
    await this.shell.run("adb shell input keyevent 4");
  }
}
