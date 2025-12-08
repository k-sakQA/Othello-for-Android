import { describe, expect, it, vi } from "vitest";
import { Replayer } from "../src/core/replayer.js";
import type { AndroidDevice, Route } from "../src/core/types.js";
import type { AuthSessionManager } from "../src/auth/authSessionManager.js";

const createDeviceMock = (): AndroidDevice => ({
  openUrl: vi.fn(),
  captureScreenshot: vi.fn(),
  tap: vi.fn(),
  inputText: vi.fn(),
  scroll: vi.fn(),
  back: vi.fn(),
});

const createAuthSessionManager = (): AuthSessionManager => ({
  pullSession: vi.fn(),
  pushSession: vi.fn(),
  pushSessionIfExists: vi.fn(),
});

const createRoute = (): Route => ({
  id: "route-1",
  createdAt: "2024-01-01T00:00:00.000Z",
  steps: [
    { index: 0, action: "tap", target: { x: 10, y: 20 } },
    { index: 1, action: "input", target: { x: 30, y: 40 }, inputText: "hello" },
    { index: 2, action: "scroll", target: { direction: "up" } },
    { index: 3, action: "back" },
  ],
});

describe("Replayer", () => {
  it("URLを開いたあと、Routeのステップを順に実行する", async () => {
    const device = createDeviceMock();
    const authSessionManager = createAuthSessionManager();
    const replayer = new Replayer({ device, authSessionManager });
    const route = createRoute();

    await replayer.run({ route, url: "https://example.com/replay" });

    expect(authSessionManager.pushSessionIfExists).toHaveBeenCalled();
    expect(device.openUrl).toHaveBeenCalledWith("https://example.com/replay");
    expect(device.tap).toHaveBeenCalledWith(10, 20);
    expect(device.inputText).toHaveBeenCalledWith(30, 40, "hello");
    expect(device.scroll).toHaveBeenCalledWith("up");
    expect(device.back).toHaveBeenCalled();
  });

  it("inputステップに座標がない場合はエラーにする", async () => {
    const device = createDeviceMock();
    const replayer = new Replayer({ device });
    const route: Route = {
      id: "bad-route",
      createdAt: "2024-01-01T00:00:00.000Z",
      steps: [{ index: 0, action: "input", inputText: "abc" }],
    };

    await expect(() => replayer.run({ route })).rejects.toThrow("input には target.x, target.y が必要です");
  });
});
