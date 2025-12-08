# Othello-for-Android

Android 実機上のモバイル Web アプリを、Vision + LLM を用いた探索（explore）とシナリオ再実行（replay）でテストするためのツールです。ログイン状態を再利用するための auth-setup も含みます。

## 前提条件
- macOS + Node.js (>= 18)
- adb で接続済みの Android 実機（`adb devices` で確認）
- Chrome が端末にインストール済み
- Vision/LLM 用の API キー（Explorer/Planner 実装時に利用）

## セットアップ
```bash
npm install
```

## 認証状態の事前取得（auth-setup）
1 回だけ手動ログインして Chrome プロファイルを保存します。以降の explore/replay 実行前に自動で端末へ復元され、ログイン済み状態から開始できます。

```bash
# ログイン画面URLを指定
npm run auth-setup -- --url "https://example.com/login"
```

フロー:
1. 端末の Chrome で URL を開く
2. ユーザーが手動でログイン（MFA 含む）
3. Enter 押下で Chrome プロファイルを adb で pull し `auth/session.bin` に保存

## 探索/再実行への適用
Explorer / Replayer は起動時に `auth/session.bin` が存在すれば自動で adb push します。ログイン画面をスキップしてテストを開始できます。

現在 CLI エントリは auth-setup のみですが、今後 `explore` / `replay` コマンドを追加予定です（実装は `src/core` を参照）。

## スクリプト
- `npm test` : ユニットテスト（Vitest）
- `npm run auth-setup -- --url <URL>` : 認証状態の取得

## ディレクトリ構成（抜粋）
- `src/core/` : Explorer / Replayer / 型定義
- `src/auth/` : 認証セッション保存・復元、auth-setup ロジック
- `src/device/` : adb による Android デバイス操作
- `src/utils/` : シェルラッパーなど
- `tests/` : 各モジュールのテスト

## 制限・注意点
- adb run-as/tar に依存するため、端末や Chrome の設定によっては権限で失敗する場合があります。
- `input text` の特殊文字エスケープは簡易的です。必要に応じて強化してください。
- Vision/LLM 連携や CLI (explore/replay) は今後拡張予定です。既存コードを参考に組み込んでください。
