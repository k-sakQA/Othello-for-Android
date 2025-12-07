# 要件定義書（Othello-for-Android）

## 1. プロジェクト概要
- **プロジェクト名**: Othello-for-Android  
- **目的**  
  Android 実機上の **モバイル Web アプリ** を対象に、  
  - Vision（LLM）による UI 解析  
  - 自然言語 / テスト観点ドリブンな探索  
  - 探索結果を JSON の「テストルート」としてシナリオ化  
  - シナリオの再実行  
  - 観点ループによる改善  
  を行うテスト自動化ツールを提供する。

---

## 2. 想定環境 / 前提条件
- **ホスト環境**: macOS + Node.js + TypeScript  
- **接続環境**: `adb devices` で Android 実機が接続されている  
- **Vision API**: LLM（画像解析）を利用できる状態（例: OPENAI_API_KEY）

---

## 3. スコープ（MVP）

### 3.1 MVPで実装する機能
1. **CLI コマンド**
   - `explore`: 自然言語意図に基づいて探索し、テストルートを生成  
   - `replay`: 既存ルート JSON を読み込んで実機で再実行  

2. **Android 実機制御レイヤ**
   - URL を開く  
   - スクショ取得  
   - タップ / テキスト入力 / スクロール / 戻る  

3. **Vision + LLM 解析**
   - スクショから UI 要素を抽出  
   - ラベル、役割、中心座標を返す  

4. **探索ロジック（Explorer）**
   - Intent + Screen → 次アクションをLLMで決定  
   - 全ステップを Route として保存  

5. **JSON ルート スキーマ**
   - 各 RouteStep が Action, Target, Notes を持つ  

---

## 4. 非スコープ（MVP）
- iOS 非対応  
- 複数デバイス同時実行  
- WebView DOM取得  
- CI連携  

---

## 5. CLI 設計

### explore
```
npx othello-android explore   --url "https://example.com"   --intent "ログインして一覧が表示されること"   --max-steps 10   --out routes/login.json
```

### replay
```
npx othello-android replay --route routes/login.json
```

---

## 6. モジュール構造（推奨）

```
src/
  cli/
    explore.ts
    replay.ts
  core/
    explorer.ts
    replayer.ts
    types.ts
  device/
    androidDevice.ts
  llm/
    visionClient.ts
    planner.ts
  utils/
    logger.ts
    fileStore.ts
    shell.ts
```

---

## 7. 型定義（抜粋）

```ts
export interface Route {
  id: string;
  createdAt: string;
  steps: RouteStep[];
}

export interface RouteStep {
  index: number;
  action: "tap" | "input" | "scroll" | "back";
  target?: {
    label?: string;
    kind?: string;
    x?: number;
    y?: number;
  };
  inputText?: string;
  screenshotPath?: string;
}
```

---

## 8. 探索アルゴリズム（MVP）

1. URL を開く  
2. スクショ取得  
3. Vision解析で UI 要素リスト化  
4. Planner（LLM）が次アクションを決定  
5. 実機で操作  
6. RouteStep 追加  
7. maxSteps or Plannerが終了判定するまでループ  

---

## 9. 成果物
- `routes/*.json`: 探索で生成されたテストルート  
- `screenshots/*.png`: 全ステップのスクショ  

---

## 10. 将来拡張
- 観点ドリブン改善ループ  
- 画面遷移グラフ可視化  
- Androidネイティブ対応  
- CI統合

