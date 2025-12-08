import { describe, expect, it, vi } from "vitest";
import { Explorer } from "../src/core/explorer.js";
import type {
  AndroidDevice,
  Planner,
  PlannerDecision,
  VisionClient,
} from "../src/core/types.js";
import type { AuthSessionManager } from "../src/auth/authSessionManager.js";

const createMocks = () => {
  const device: AndroidDevice = {
    openUrl: vi.fn(),
    captureScreenshot: vi.fn(),
    tap: vi.fn(),
    inputText: vi.fn(),
    scroll: vi.fn(),
    back: vi.fn(),
  };

  const vision: VisionClient = {
    analyze: vi.fn(),
  };

  const plannerDecisions: PlannerDecision[] = [];
  const planner: Planner & { enqueue: (decision: PlannerDecision) => void } = {
    decide: vi.fn().mockImplementation(() => {
      const decision = plannerDecisions.shift();
      if (!decision) {
        throw new Error("Planner decision queue is empty");
      }
      return Promise.resolve(decision);
    }),
    enqueue(decision: PlannerDecision) {
      plannerDecisions.push(decision);
    },
  };

  const authSessionManager: AuthSessionManager = {
    pullSession: vi.fn(),
    pushSession: vi.fn(),
    pushSessionIfExists: vi.fn(),
  };

  return { device, vision, planner, authSessionManager };
};

describe("Explorer", () => {
  it("最初のステップを計画・実行し、Routeとして保存する", async () => {
    const { device, vision, planner } = createMocks();
    device.captureScreenshot = vi.fn().mockResolvedValue("/tmp/screen-0.png");
    vision.analyze = vi.fn().mockResolvedValue([
      { label: "ログイン", kind: "button", x: 10, y: 20 },
    ]);
    planner.enqueue({
      action: "tap",
      target: { x: 10, y: 20, label: "ログイン" },
      notes: "ログインボタンをタップ",
    });
    planner.enqueue({ action: "finish" });

    const explorer = new Explorer({ device, vision, planner });
    const route = await explorer.run({
      url: "https://example.com",
      intent: "ログインして一覧を表示する",
      maxSteps: 3,
    });

    expect(device.openUrl).toHaveBeenCalledWith("https://example.com");
    expect(vision.analyze).toHaveBeenCalledWith("/tmp/screen-0.png");
    expect(device.tap).toHaveBeenCalledWith(10, 20);

    expect(route.steps).toHaveLength(1);
    expect(route.steps[0]).toMatchObject({
      index: 0,
      action: "tap",
      target: { x: 10, y: 20, label: "ログイン" },
      screenshotPath: "/tmp/screen-0.png",
      notes: "ログインボタンをタップ",
    });

    expect(route.createdAt).toBeDefined();
    expect(route.id).toBeDefined();
  });

  it("maxStepsに達したら終了する", async () => {
    const { device, vision, planner } = createMocks();
    device.captureScreenshot = vi
      .fn()
      .mockResolvedValueOnce("/tmp/screen-0.png")
      .mockResolvedValueOnce("/tmp/screen-1.png")
      .mockResolvedValue("/tmp/screen-last.png");
    vision.analyze = vi.fn().mockResolvedValue([]);
    planner.enqueue({ action: "scroll", target: { direction: "down" }, notes: "スクロール" });
    planner.enqueue({ action: "scroll", target: { direction: "up" }, notes: "戻るスクロール" });
    planner.enqueue({ action: "scroll", target: { direction: "down" }, notes: "余剰" });

    const explorer = new Explorer({ device, vision, planner });
    const route = await explorer.run({
      url: "https://example.com/scroll",
      intent: "リストを2スクロール確認する",
      maxSteps: 2,
    });

    expect(route.steps).toHaveLength(2);
    expect(planner.decide).toHaveBeenCalledTimes(2);
    expect(device.scroll).toHaveBeenNthCalledWith(1, "down");
    expect(device.scroll).toHaveBeenNthCalledWith(2, "up");
    expect(route.steps[1]?.screenshotPath).toBe("/tmp/screen-1.png");
  });

  it("AuthSessionManagerが指定されていればpushSessionIfExistsを先に実行する", async () => {
    const { device, vision, planner, authSessionManager } = createMocks();
    device.captureScreenshot = vi.fn().mockResolvedValue("/tmp/screen-0.png");
    vision.analyze = vi.fn().mockResolvedValue([]);
    planner.enqueue({ action: "finish" });
    authSessionManager.pushSessionIfExists = vi.fn().mockResolvedValue(true);

    const explorer = new Explorer({ device, vision, planner, authSessionManager });
    await explorer.run({
      url: "https://example.com",
      intent: "テスト",
      maxSteps: 1,
    });

    expect(authSessionManager.pushSessionIfExists).toHaveBeenCalled();
    expect(device.openUrl).toHaveBeenCalled();
  });
});
