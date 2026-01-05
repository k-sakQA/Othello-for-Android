import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import type { Planner, PlannerContext, PlannerDecision } from "../core/types.js";
import type { ActionType } from "../core/types.js";

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

    let rawAction = "";
    let parsed: { action: ActionType | "finish"; fromPhrase: boolean; label?: string } | undefined;
    while (!parsed) {
      rawAction = await this.rl.question(
        "次のアクションを入力してください (tap/input/scroll/back/finish): ",
      );
      parsed = this.parseAction(rawAction);
      if (!parsed) {
        console.log("入力が認識できませんでした。例: tap / scroll / finish / 「ログイン」をタップ");
      }
    }

    if (parsed.action === "finish") {
      return { action: "finish" };
    }

    if (parsed.action === "tap" || parsed.action === "input") {
      const x = Number.parseInt(await this.rl.question("tap/input の x 座標: "), 10);
      const y = Number.parseInt(await this.rl.question("tap/input の y 座標: "), 10);
      if (Number.isNaN(x) || Number.isNaN(y)) {
        throw new Error("x, y を数値で入力してください");
      }
      const inputText =
        parsed.action === "input" ? await this.rl.question("入力文字列 (input のみ): ") : undefined;
      const notes = parsed.fromPhrase ? rawAction.trim() : await this.rl.question("メモ (任意): ");
      return {
        action: parsed.action,
        target: { x, y, label: parsed.label },
        inputText,
        notes,
      };
    }

    if (parsed.action === "scroll") {
      let direction = "";
      if (parsed.fromPhrase) {
        direction = rawAction.includes("上") ? "up" : rawAction.includes("下") ? "down" : "";
      }
      if (!direction) {
        direction = await this.rl.question("scroll 方向を入力してください (up/down) [default: down]: ");
      }
      const normalized = direction === "up" ? "up" : "down";
      const notes = parsed.fromPhrase ? rawAction.trim() : await this.rl.question("メモ (任意): ");
      return { action: parsed.action, target: { direction: normalized }, notes };
    }

    if (parsed.action === "back") {
      const notes = parsed.fromPhrase ? rawAction.trim() : await this.rl.question("メモ (任意): ");
      return { action: parsed.action, notes };
    }

    throw new Error(`Unknown action: ${rawAction}`);
  }

  private parseAction(
    inputText: string,
  ): { action: ActionType | "finish"; fromPhrase: boolean; label?: string } | undefined {
    const raw = inputText.trim();
    if (!raw) return undefined;
    const lower = raw.toLowerCase();
    if (lower === "finish" || raw === "終了" || raw === "完了" || raw === "終わり") {
      return { action: "finish", fromPhrase: false };
    }
    if (lower === "tap") return { action: "tap", fromPhrase: false };
    if (lower === "input") return { action: "input", fromPhrase: false };
    if (lower === "scroll") return { action: "scroll", fromPhrase: false };
    if (lower === "back") return { action: "back", fromPhrase: false };

    const label = this.extractLabel(raw);

    if (raw.includes("入力") || raw.includes("タイプ") || raw.includes("書き込")) {
      return { action: "input", fromPhrase: true, label };
    }
    if (raw.includes("スクロール") || raw.includes("スワイプ")) {
      return { action: "scroll", fromPhrase: true };
    }
    if (raw.includes("戻") || raw.includes("バック")) {
      return { action: "back", fromPhrase: true };
    }
    if (raw.includes("タップ") || raw.includes("押") || raw.includes("クリック")) {
      return { action: "tap", fromPhrase: true, label };
    }

    return undefined;
  }

  private extractLabel(raw: string): string | undefined {
    const match = raw.match(/「([^」]+)」/);
    if (match?.[1]) return match[1];
    const quoteMatch = raw.match(/"([^"]+)"/);
    if (quoteMatch?.[1]) return quoteMatch[1];
    return undefined;
  }
}
