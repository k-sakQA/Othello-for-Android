# Othello-for-Android

Android 実機上のモバイル Web アプリを、Vision + LLM で探索・再実行・評価するためのテスト支援ツールです。Chrome プロファイルを保存してログイン状態を再利用できます。

## できること
- Explorer: スクリーンショットを Vision で解析し、Planner が次アクションを決定して操作ルート(JSON)を自動生成
- Replayer: 保存したルートを順番に ADB 操作で再生し、シナリオを再現
- Auth Setup: 一度の手動ログインで Chrome プロファイルを取得し、以降の実行前に自動復元
- Story Runner: ユーザーストーリー配列を順に実行し、Before/After を Vision + LLM で評価
- OPENAI_API_KEY 未設定時は、Explorer が手動プランナー/NoOp Vision に自動フォールバックし、対話的に操作を指示可能

## 前提条件
- macOS + Node.js >= 18, npm
- adb で接続済みの Android 実機（`adb devices` で確認）かつ Chrome インストール済み
- `run-as com.android.chrome` が使える端末（root 化 or debuggable Chrome）※認証セッション保存時のみ必須
- OpenAI API キー（Vision/Planner/Evaluator に利用、モデル既定値は `gpt-5.2`）

## セットアップ
```bash
npm install
```

環境変数（例）:
```bash
export OPENAI_API_KEY="sk-..."  # 未設定でも Explorer は手動モードで動作
export OTHELLO_DEBUG=1         # OpenAI への入出力を標準出力に出す場合
```
`.env` に保存しても構いません（`.gitignore` 済み）。

## クイックスタート
1. `adb devices` で端末接続を確認
2. (任意) 認証セッション保存  
   `npm run auth-setup -- --url "https://example.com/login"`  
   端末で手動ログインし、指示に従って Enter を押すと `auth/session.bin` に保存
3. ルート探索  
   `npm run explore -- --url "https://example.com" --intent "○○を確認" --max-steps 5 --out routes/login.json`  
   `OPENAI_API_KEY` が無い場合はコンソールで操作指示を入力
4. ルート再生  
   `npm run replay -- --route routes/login.json --url "https://example.com"`  
   `auth/session.bin` があれば自動で端末に push してから開始
5. ユーザーストーリー実行  
   ストーリーファイル例:
   ```json
   [
     { "id": "story_001", "story": "10枚引くボタンを押すと確認ダイアログが表示される" },
     { "id": "story_002", "story": "キャンセルを押すとダイアログが閉じる" }
   ]
   ```
   実行: `npm run run-stories -- --stories stories.json --url "https://example.com" --out results/story-results.json`

## コマンド詳細
- `npm run auth-setup -- --url <URL>`  
  Chrome で URL を開き、手動ログイン後に Enter を押すと `auth/session.bin` としてプロファイルを保存。Explorer/Replayer/StoryRunner 起動時に自動復元。
- `npm run explore -- --url <URL> --intent "<意図>" --max-steps 5 --out routes/route.json`  
  スクリーンショットを解析し、最大ステップ数まで操作を記録したルート JSON を生成。OpenAI 未設定時は対話的に手動入力。
- `npm run replay -- --route routes/route.json [--url <URL>]`  
  ルートのステップを index 順に再生。`--url` を指定すると再生前にページを開く。
- `npm run run-stories -- --stories stories.json [--url <URL>] --out results/story-results.json`  
  各ストーリーで 1 アクションを計画し実行後、Before/After を LLM が評価。OpenAI API キー必須。
- `npm test`  
  Vitest によるユニットテスト。

## 生成物とディレクトリ
- `auth/session.bin` : 保存済み Chrome プロファイル
- `routes/*.json` : Explorer が生成した操作ルート
- `results/*.json` : Story Runner の評価結果
- `screenshots/*.png` : 実行時に取得したスクリーンショット
- `src/` : コアロジック（core/auth/device/llm/story/utils など）
- `tests/` : 各モジュールのテスト

## 制限・注意点
- `run-as com.android.chrome` が利用できない環境では認証セッションの保存/復元に失敗します。
- `adb shell input text` のエスケープは簡易的です。特殊文字を多用する場合は強化してください。
- OpenAI 連携にはネットワークアクセスが必要です。プロキシや社内ネットワーク環境では適宜設定を調整してください。

## ライセンス
MIT License
作者：k-sakQA

