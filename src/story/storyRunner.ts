import type { AndroidDevice, VisionClient } from "../core/types.js";
import { StoryActionExecutor } from "./actionExecutor.js";
import type { ResultEvaluator, StoryPlanner, StoryResult, UserStory } from "./types.js";

export interface StoryRunnerDependencies {
  device: AndroidDevice;
  vision: VisionClient;
  planner: StoryPlanner;
  evaluator: ResultEvaluator;
  executor?: StoryActionExecutor;
}

export class StoryRunner {
  private readonly device: AndroidDevice;
  private readonly vision: VisionClient;
  private readonly planner: StoryPlanner;
  private readonly evaluator: ResultEvaluator;
  private readonly executor: StoryActionExecutor;

  constructor(deps: StoryRunnerDependencies) {
    this.device = deps.device;
    this.vision = deps.vision;
    this.planner = deps.planner;
    this.evaluator = deps.evaluator;
    this.executor = deps.executor ?? new StoryActionExecutor(this.device);
  }

  async run(stories: UserStory[]): Promise<StoryResult[]> {
    const results: StoryResult[] = [];
    for (const story of stories) {
      const result: StoryResult = { id: story.id, story: story.story };
      try {
        const beforeScreenshot = await this.device.captureScreenshot();
        const beforeElements = await this.vision.analyze(beforeScreenshot);
        const action = await this.planner.decide({
          story: story.story,
          elements: beforeElements,
          stepIndex: 0,
        });
        result.action = action;
        if (action.action !== "finish") {
          await this.executor.execute(action);
        }
        const afterScreenshot = await this.device.captureScreenshot();
        const afterElements = await this.vision.analyze(afterScreenshot);
        const evaluation = await this.evaluator.evaluate({
          story: story.story,
          beforeElements,
          afterElements,
        });
        result.evaluation = evaluation;
      } catch (error) {
        result.error = error instanceof Error ? error.message : String(error);
      }
      results.push(result);
    }
    return results;
  }
}
