import { describe, expect, it, vi } from "vitest";
import { AuthSetup } from "../src/auth/authSetup.js";
import type { AndroidDevice } from "../src/core/types.js";
import type { AuthSessionManager } from "../src/auth/authSessionManager.js";
import type { Prompt } from "../src/auth/authSetup.js";

const createMocks = () => {
  const device: AndroidDevice = {
    openUrl: vi.fn(),
    captureScreenshot: vi.fn(),
    tap: vi.fn(),
    inputText: vi.fn(),
    scroll: vi.fn(),
    back: vi.fn(),
    getScreenSize: vi.fn().mockResolvedValue({ width: 1000, height: 2000 }),
  };

  const sessionManager: AuthSessionManager = {
    pullSession: vi.fn().mockResolvedValue("/tmp/session.bin"),
    pushSession: vi.fn(),
    pushSessionIfExists: vi.fn(),
  };

  const prompt: Prompt = {
    waitForEnter: vi.fn().mockResolvedValue(undefined),
  };

  return { device, sessionManager, prompt };
};

describe("AuthSetup", () => {
  it("URLを開き、プロンプトを経由してセッションを保存する", async () => {
    const { device, sessionManager, prompt } = createMocks();
    const setup = new AuthSetup({ device, sessionManager, prompt });

    const saved = await setup.run({ url: "https://example.com/login" });

    expect(device.openUrl).toHaveBeenCalledWith("https://example.com/login");
    expect(prompt.waitForEnter).toHaveBeenCalled();
    expect(sessionManager.pullSession).toHaveBeenCalled();
    expect(saved).toBe("/tmp/session.bin");
  });
});
