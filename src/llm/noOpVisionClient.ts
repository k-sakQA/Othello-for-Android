import type { UIElement, VisionClient } from "../core/types.js";

/**
 * Vision API が未接続でも CLI を試せるようにするダミー実装。
 * 解析結果は空配列を返すだけで、スクショパスをコンソールに表示する。
 */
export class NoOpVisionClient implements VisionClient {
  async analyze(screenshotPath: string): Promise<UIElement[]> {
    console.log(`🖼️  Vision スタブ: ${screenshotPath} を解析（実際の解析は未実装）`);
    return [];
  }
}
