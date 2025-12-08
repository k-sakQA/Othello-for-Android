import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { AuthSessionManager } from "../src/auth/authSessionManager.js";
import type { Shell } from "../src/utils/shell.js";

const createShellMock = () => {
  const calls: string[] = [];
  const shell: Shell = {
    run: vi.fn().mockImplementation((cmd: string) => {
      calls.push(cmd);
      return Promise.resolve({ stdout: "", stderr: "" });
    }),
  };
  return { shell, calls };
};

describe("AuthSessionManager", () => {
  it("pullSessionでauthディレクトリ配下にsession.binを保存するコマンドを実行する", async () => {
    const { shell, calls } = createShellMock();
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), "auth-"));
    const sessionPath = path.join(tmpDir, "session.bin");
    const manager = new AuthSessionManager(shell, { sessionPath });

    const savedPath = await manager.pullSession();

    expect(savedPath).toBe(sessionPath);
    expect(calls[0]).toContain(`> "${sessionPath}"`);
    expect(calls[0]).toContain("adb exec-out run-as com.android.chrome");
  });

  it("pushSessionでsession.binを端末に書き戻す", async () => {
    const { shell, calls } = createShellMock();
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), "auth-"));
    const sessionPath = path.join(tmpDir, "session.bin");
    await writeFile(sessionPath, "dummy");
    const manager = new AuthSessionManager(shell, { sessionPath });

    await manager.pushSession();

    expect(calls[0]).toContain(`adb push "${sessionPath}"`);
  });

  it("pushSessionIfExistsはファイルが無ければ何もしない", async () => {
    const { shell, calls } = createShellMock();
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), "auth-"));
    const sessionPath = path.join(tmpDir, "missing.bin");
    const manager = new AuthSessionManager(shell, { sessionPath });

    const pushed = await manager.pushSessionIfExists();

    expect(pushed).toBe(false);
    expect(calls).toHaveLength(0);
  });
});
