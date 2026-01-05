import { describe, expect, it, vi } from "vitest";
import { StoryActionExecutor } from "../src/story/actionExecutor.js";
import type { AndroidDevice } from "../src/core/types.js";
import type { StoryAction } from "../src/story/types.js";

const createDeviceMock = (): AndroidDevice => ({
  openUrl: vi.fn(),
  captureScreenshot: vi.fn(),
  tap: vi.fn(),
  inputText: vi.fn(),
  scroll: vi.fn(),
  back: vi.fn(),
  getScreenSize: vi.fn().mockResolvedValue({ width: 1000, height: 2000 }),
});

describe("StoryActionExecutor", () => {
  it("x_ratio/y_ratio を画面サイズに変換して tap する", async () => {
    const device = createDeviceMock();
    const executor = new StoryActionExecutor(device);
    const action: StoryAction = {
      action: "tap",
      target: { x_ratio: 0.5, y_ratio: 0.25 },
    };

    await executor.execute(action);

    expect(device.getScreenSize).toHaveBeenCalled();
    expect(device.tap).toHaveBeenCalledWith(500, 500);
  });

  it("input の場合は inputText を渡して入力する", async () => {
    const device = createDeviceMock();
    const executor = new StoryActionExecutor(device);
    const action: StoryAction = {
      action: "input",
      target: { x_ratio: 0.1, y_ratio: 0.2 },
      inputText: "hello",
    };

    await executor.execute(action);

    expect(device.inputText).toHaveBeenCalledWith(100, 400, "hello");
  });

  it("tap に必要な ratio が無い場合はエラー", async () => {
    const device = createDeviceMock();
    const executor = new StoryActionExecutor(device);
    const action: StoryAction = { action: "tap", target: { x_ratio: null, y_ratio: null } };

    await expect(executor.execute(action)).rejects.toThrow("tap には target.x_ratio, target.y_ratio が必要です");
  });
});
