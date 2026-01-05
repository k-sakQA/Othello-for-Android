# Othello Core Integration Design Doc

## 🎯 Purpose

本ドキュメントは、`Othello-for-Android` プロジェクトにおいて、Playwrightに依存しないモジュール群（Planner, Explorer, Orchestrator, Routeなど）を再利用可能な形で `Othello` 本体から分離・統合するための設計書である。既存のOthelloコードベースを `othello-core` としてnpmパッケージ化し、Android実機上での自動探索・再生処理に活用することを目的とする。

## 🧩 Target Modules for Reuse

以下のモジュールを `othello-core` パッケージに含める：

- `Planner`: テスト観点設計 / ステップ選択ロジック
- `Explorer`: Visionベースの画面認識と観点抽出
- `Route`: ステップ列を保持・再利用するモデル
- `Orchestrator`: 観点とステップを統合的に管理
- `logger`, `prompt`, `utils`, `types`, `schemas`

除外するもの：

- `PlaywrightDriver`、`BrowserContext` など Playwright 固有コード

## 📦 Package Structure Plan: `othello-core`

```
othello-core/
├── src/
│   ├── explorer/
│   ├── planner/
│   ├── route/
│   ├── orchestrator/
│   ├── utils/
│   ├── types/
│   ├── index.ts
├── package.json
├── tsconfig.json
```

## 🛠️ Packaging Steps

### tsconfig.json

`baseUrl` や `paths` を明確に分離。共有configを置く場合は monorepo前提で `tsconfig.base.json` を利用。

### package.json

```json
{
  "name": "othello-core",
  "version": "0.1.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc"
  },
  "peerDependencies": {
    "playwright": "*"
  }
}
```

※ Playwright への直接依存は避け、peerとして宣言

### build

```bash
tsc --project tsconfig.json
```

出力物は `dist/` に配置し、Android 側プロジェクトから import 可能にする。

## 🔗 External Dependencies Handling

- `VisionClient`, `LLMClient` などは抽象インタフェースとして残し、依存注入で切り替え可能に設計
- `promptTemplate`, `jsonSchema` は `othello-core` に残す

## 📥 Import Instructions (Othello-for-Android側)

```ts
import { Explorer, Planner, Orchestrator } from 'othello-core';
```

独自の Driver や VisionClient を注入する形で利用。

## 🔁 Custom Driver Binding

```ts
const explorer = new Explorer({
  driver: new AndroidAdbDriver(),
  vision: new LocalVisionClient()
});
```

`PlaywrightDriver` の代替として `AndroidAdbDriver` を Android 用に実装する。

## 🗃️ Monorepo vs Separate Repo

### Monorepo（推奨）

```
othello/
├── packages/
│   ├── othello-core/
│   ├── othello-for-android/
│   ├── othello-web/
```

- 共通config・依存管理が容易
- CI/CDで連動しやすい

### Separate Repo

- `othello-core` を独立でnpmに公開
- `othello-for-android` 側で `npm install` して利用
- 管理は分かれるが疎結合性は高い

## ⚠️ Notes

- `othello-core` は Playwright を internal import しないように設計
- `peerDependencies` にして、必要に応じて consumer側で追加
- `LLM`, `Vision` なども抽象層で設計し、Android側で差し替えしやすくする
- `.env` や config の注入方法は明確に規定（環境ごとに切り替え可能に）

---

この設計により、Codex での自動統合が容易となり、Othello のコア観点設計・探索・再現ロジックを Android テストでも再利用可能になる。