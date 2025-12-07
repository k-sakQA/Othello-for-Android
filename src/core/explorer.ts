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

export interface ExplorerDependencies {
  device: AndroidDevice;
  vision: VisionClient;
  planner: Planner;
}

export class Explorer {
  private readonly device: AndroidDevice;
  private readonly vision: VisionClient;
  private readonly planner: Planner;

  constructor(deps: ExplorerDependencies) {
    this.device = deps.device;
    this.vision = deps.vision;
    this.planner = deps.planner;
  }

  async run(options: ExplorerOptions): Promise<Route> {
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
      if (typeof target?.x !== "number" || typeof target?.y !== "number") {
        throw new Error("tap には target.x, target.y が必要です");
      }
      await this.device.tap(target.x, target.y);
    } else if (action === "input") {
      if (typeof target?.x !== "number" || typeof target?.y !== "number") {
        throw new Error("input には target.x, target.y が必要です");
      }
      if (typeof inputText !== "string") {
        throw new Error("input には inputText が必要です");
      }
      await this.device.inputText(target.x, target.y, inputText);
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
      target,
      inputText,
      screenshotPath,
      notes,
    };
    return step;
  }
}
