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
      const coords = this.resolveTargetCoords(step);
      if (!coords) {
        throw new Error("tap には target.x, target.y が必要です");
      }
      await this.device.tap(coords.x, coords.y);
      return;
    }

    if (step.action === "input") {
      const coords = this.resolveTargetCoords(step);
      if (!coords) {
        throw new Error("input には target.x, target.y が必要です");
      }
      if (typeof step.inputText !== "string") {
        throw new Error("input には inputText が必要です");
      }
      await this.device.inputText(coords.x, coords.y, step.inputText);
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

  private resolveTargetCoords(step: RouteStep): { x: number; y: number } | null {
    if (typeof step.target?.x === "number" && typeof step.target?.y === "number") {
      return { x: step.target.x, y: step.target.y };
    }
    if (step.target?.bounds) {
      return {
        x: Math.round(step.target.bounds.x + step.target.bounds.w / 2),
        y: Math.round(step.target.bounds.y + step.target.bounds.h / 2),
      };
    }
    return null;
  }
}
