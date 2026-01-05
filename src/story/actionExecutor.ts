import type { AndroidDevice } from "../core/types.js";
import type { StoryAction, StoryActionTarget } from "./types.js";

export class StoryActionExecutor {
  private readonly device: AndroidDevice;
  private screenSize?: { width: number; height: number };

  constructor(device: AndroidDevice) {
    this.device = device;
  }

  async execute(action: StoryAction): Promise<void> {
    if (action.action === "finish") {
      return;
    }

    if (action.action === "tap") {
      const coords = await this.resolveTargetCoords(action.target);
      if (!coords) {
        throw new Error("tap には target.x_ratio, target.y_ratio が必要です");
      }
      await this.device.tap(coords.x, coords.y);
      return;
    }

    if (action.action === "input") {
      const coords = await this.resolveTargetCoords(action.target);
      if (!coords) {
        throw new Error("input には target.x_ratio, target.y_ratio が必要です");
      }
      if (typeof action.inputText !== "string") {
        throw new Error("input には inputText が必要です");
      }
      await this.device.inputText(coords.x, coords.y, action.inputText);
      return;
    }

    if (action.action === "scroll") {
      const direction = action.target?.direction ?? "down";
      await this.device.scroll(direction);
      return;
    }

    if (action.action === "back") {
      await this.device.back();
      return;
    }

    const neverAction: never = action.action;
    throw new Error(`Unsupported action: ${String(neverAction)}`);
  }

  private async resolveTargetCoords(
    target?: StoryActionTarget | null,
  ): Promise<{ x: number; y: number } | null> {
    if (!target || typeof target.x_ratio !== "number" || typeof target.y_ratio !== "number") {
      return null;
    }
    const screenSize = await this.getScreenSize();
    return {
      x: Math.round(screenSize.width * target.x_ratio),
      y: Math.round(screenSize.height * target.y_ratio),
    };
  }

  private async getScreenSize(): Promise<{ width: number; height: number }> {
    if (!this.screenSize) {
      this.screenSize = await this.device.getScreenSize();
    }
    return this.screenSize;
  }
}
