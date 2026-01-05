import { randomUUID } from "node:crypto";
import type {
  AndroidDevice,
  ExplorerOptions,
  Planner,
  PlannerDecision,
  PlannerContext,
  Route,
  RouteStep,
  VisionClient,
} from "./types.js";
import type { AuthSessionManager } from "../auth/authSessionManager.js";

export interface ExplorerDependencies {
  device: AndroidDevice;
  vision: VisionClient;
  planner: Planner;
  authSessionManager?: AuthSessionManager;
}

export class Explorer {
  private readonly device: AndroidDevice;
  private readonly vision: VisionClient;
  private readonly planner: Planner;
  private readonly authSessionManager?: AuthSessionManager;

  constructor(deps: ExplorerDependencies) {
    this.device = deps.device;
    this.vision = deps.vision;
    this.planner = deps.planner;
    this.authSessionManager = deps.authSessionManager;
  }

  async run(options: ExplorerOptions): Promise<Route> {
    if (this.authSessionManager) {
      await this.authSessionManager.pushSessionIfExists();
    }
    await this.device.openUrl(options.url);

    const route: Route = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      steps: [],
    };

    for (let stepIndex = 0; stepIndex < options.maxSteps; stepIndex += 1) {
      const screenshotPath = await this.device.captureScreenshot();
      const elements = await this.vision.analyze(screenshotPath);
      const context: PlannerContext = {
        intent: options.intent,
        stepIndex,
        elements,
        history: route.steps,
        lastScreenshotPath: screenshotPath,
      };

      const decision = await this.planner.decide(context);
      if (decision.action === "finish") {
        break;
      }

      const step = await this.executeAction(decision, screenshotPath, stepIndex);
      route.steps.push(step);
    }

    return route;
  }

  private async executeAction(
    decision: PlannerDecision,
    screenshotPath: string,
    stepIndex: number,
  ): Promise<RouteStep> {
    const { action, target, inputText, notes } = decision;
    if (action === "tap") {
      const coords = this.resolveTargetCoords(target);
      if (!coords) {
        throw new Error("tap には target.x, target.y が必要です");
      }
      await this.device.tap(coords.x, coords.y);
    } else if (action === "input") {
      const coords = this.resolveTargetCoords(target);
      if (!coords) {
        throw new Error("input には target.x, target.y が必要です");
      }
      if (typeof inputText !== "string") {
        throw new Error("input には inputText が必要です");
      }
      await this.device.inputText(coords.x, coords.y, inputText);
    } else if (action === "scroll") {
      const direction = target?.direction ?? "down";
      await this.device.scroll(direction);
    } else if (action === "back") {
      await this.device.back();
    } else {
      const neverAction: never = action;
      throw new Error(`Unsupported action: ${String(neverAction)}`);
    }

    const step: RouteStep = {
      index: stepIndex,
      action,
      target: target ?? undefined,
      inputText: typeof inputText === "string" ? inputText : undefined,
      screenshotPath,
      notes: typeof notes === "string" ? notes : undefined,
    };
    return step;
  }

  private resolveTargetCoords(
    target: PlannerDecision["target"],
  ): { x: number; y: number } | null {
    if (typeof target?.x === "number" && typeof target?.y === "number") {
      return { x: target.x, y: target.y };
    }
    if (target?.bounds) {
      return {
        x: Math.round(target.bounds.x + target.bounds.w / 2),
        y: Math.round(target.bounds.y + target.bounds.h / 2),
      };
    }
    return null;
  }
}
