import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export interface ShellResult {
  stdout: string;
  stderr: string;
}

export interface Shell {
  run(command: string): Promise<ShellResult>;
}

export class LocalShell implements Shell {
  async run(command: string): Promise<ShellResult> {
    const result = await execAsync(command, { shell: true, maxBuffer: 10 * 1024 * 1024 });
    return { stdout: result.stdout, stderr: result.stderr };
  }
}
