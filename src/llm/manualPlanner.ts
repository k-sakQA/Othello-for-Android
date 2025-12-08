import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import type { Planner, PlannerContext, PlannerDecision } from "../core/types.js";

/**
 * LLM プランナーの代替として、ユーザー入力で次のアクションを指示する簡易プランナー。
 */
export class ManualPlanner implements Planner {
  private readonly rl = readline.createInterface({ input, output });

  async decide(context: PlannerContext): Promise<PlannerDecision> {
    console.log("------------------------------");
    console.log(`Step ${context.stepIndex}`);
    console.log(`Intent: ${context.intent}`);
    console.log(`直前のスクショ: ${context.lastScreenshotPath}`);
    console.log("前ステップの履歴:", context.history.length);

    const action = await this.rl.question(
      "次のアクションを入力してください (tap/input/scroll/back/finish): ",
    );

    if (action === "finish") {
      return { action: "finish" };
    }

    if (action === "tap" || action === "input") {
      const x = Number.parseInt(await this.rl.question("tap/input の x 座標: "), 10);
      const y = Number.parseInt(await this.rl.question("tap/input の y 座標: "), 10);
      if (Number.isNaN(x) || Number.isNaN(y)) {
        throw new Error("x, y を数値で入力してください");
      }
      const inputText = action === "input" ? await this.rl.question("入力文字列 (input のみ): ") : undefined;
      const notes = await this.rl.question("メモ (任意): ");
      return {
        action,
        target: { x, y },
        inputText,
        notes,
      };
    }

    if (action === "scroll") {
      const direction = await this.rl.question("scroll 方向を入力してください (up/down) [default: down]: ");
      const normalized = direction === "up" ? "up" : "down";
      const notes = await this.rl.question("メモ (任意): ");
      return { action, target: { direction: normalized }, notes };
    }

    if (action === "back") {
      const notes = await this.rl.question("メモ (任意): ");
      return { action, notes };
    }

    throw new Error(`Unknown action: ${action}`);
  }
}
