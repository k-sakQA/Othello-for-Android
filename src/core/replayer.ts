import type { AuthSessionManager } from "../auth/authSessionManager.js";
import type { AndroidDevice, ReplayerOptions, RouteStep } from "./types.js";

export interface ReplayerDependencies {
  device: AndroidDevice;
  authSessionManager?: AuthSessionManager;
}

export class Replayer {
  private readonly device: AndroidDevice;
  private readonly authSessionManager?: AuthSessionManager;

  constructor(deps: ReplayerDependencies) {
    this.device = deps.device;
    this.authSessionManager = deps.authSessionManager;
  }

  async run(options: ReplayerOptions): Promise<void> {
    const { route, url } = options;
    if (this.authSessionManager) {
      await this.authSessionManager.pushSessionIfExists();
    }
    if (url) {
      await this.device.openUrl(url);
    }

    const steps = [...route.steps].sort((a, b) => a.index - b.index);
    for (const step of steps) {
      await this.executeStep(step);
    }
  }

  private async executeStep(step: RouteStep): Promise<void> {
    if (step.action === "tap") {
      if (typeof step.target?.x !== "number" || typeof step.target?.y !== "number") {
        throw new Error("tap には target.x, target.y が必要です");
      }
      await this.device.tap(step.target.x, step.target.y);
      return;
    }

    if (step.action === "input") {
      if (typeof step.target?.x !== "number" || typeof step.target?.y !== "number") {
        throw new Error("input には target.x, target.y が必要です");
      }
      if (typeof step.inputText !== "string") {
        throw new Error("input には inputText が必要です");
      }
      await this.device.inputText(step.target.x, step.target.y, step.inputText);
      return;
    }

    if (step.action === "scroll") {
      const direction = step.target?.direction ?? "down";
      await this.device.scroll(direction);
      return;
    }

    if (step.action === "back") {
      await this.device.back();
      return;
    }

    const neverAction: never = step.action;
    throw new Error(`Unsupported action: ${String(neverAction)}`);
  }
}
