import { describe, expect, it, vi } from "vitest";
import { StoryRunner } from "../src/story/storyRunner.js";
import type { AndroidDevice } from "../src/core/types.js";
import type { ResultEvaluator, StoryPlanner } from "../src/story/types.js";

const createDeviceMock = (): AndroidDevice => ({
  openUrl: vi.fn(),
  captureScreenshot: vi.fn().mockResolvedValue("/tmp/screen.png"),
  tap: vi.fn(),
  inputText: vi.fn(),
  scroll: vi.fn(),
  back: vi.fn(),
  getScreenSize: vi.fn().mockResolvedValue({ width: 1000, height: 2000 }),
});

describe("StoryRunner", () => {
  it("ストーリーを順番に実行し、結果を返す", async () => {
    const device = createDeviceMock();
    const vision = { analyze: vi.fn().mockResolvedValue([]) };
    const planner: StoryPlanner = {
      decide: vi.fn().mockResolvedValue({
        action: "tap",
        target: { x_ratio: 0.5, y_ratio: 0.5 },
        inputText: null,
        notes: null,
      }),
    };
    const evaluator: ResultEvaluator = {
      evaluate: vi.fn().mockResolvedValue({
        assertion: "confirmation_dialog_visible",
        result: true,
        confidence: 0.9,
      }),
    };

    const runner = new StoryRunner({ device, vision, planner, evaluator });
    const results = await runner.run([
      { id: "story_001", story: "10枚引くボタンを押すと確認ダイアログが表示される" },
      { id: "story_002", story: "キャンセルを押すとダイアログが閉じる" },
    ]);

    expect(results).toHaveLength(2);
    expect(results[0]?.evaluation?.result).toBe(true);
    expect((planner.decide as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(2);
  });

  it("失敗しても次のストーリーに進む", async () => {
    const device = createDeviceMock();
    const vision = { analyze: vi.fn().mockResolvedValue([]) };
    const planner: StoryPlanner = {
      decide: vi
        .fn()
        .mockRejectedValueOnce(new Error("planner error"))
        .mockResolvedValueOnce({
          action: "finish",
          target: null,
          inputText: null,
          notes: null,
        }),
    };
    const evaluator: ResultEvaluator = {
      evaluate: vi.fn().mockResolvedValue({
        assertion: "noop",
        result: false,
        confidence: 0.1,
      }),
    };

    const runner = new StoryRunner({ device, vision, planner, evaluator });
    const results = await runner.run([
      { id: "story_001", story: "1つ目" },
      { id: "story_002", story: "2つ目" },
    ]);

    expect(results).toHaveLength(2);
    expect(results[0]?.error).toContain("planner error");
    expect(results[1]?.error).toBeUndefined();
  });
});
