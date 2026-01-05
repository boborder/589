# 589

## [概要](docs/requirements.md)

このプロジェクトは、TypeScript を基盤とし、Cloudflare Workers のエッジコンピューティング環境で動作するように設計されています。 Hono による高速なルーティング、Durable Objects によるステートフルな管理、そして PartyKit によるリアルタイム同期を組み合わせ、スケーラブルで低遅延なユーザー体験を提供します。

## [技術スタック](docs/tech.md)

- ランタイム/パッケージマネージャー: Bun
- Web フレームワーク: Hono - Web 標準に準拠した超高速フレームワーク
- リアルタイム/状態管理:
  - Cloudflare Durable Objects: 強固な一貫性を持つステートフルなストレージ
  - PartyKit: リアルタイムコラボレーション機能
- データベース/ORM: Drizzle ORM
- 認証: Better Auth
- 開発ツール:
  - Biome: 高速なリンターおよびフォーマッター
  - Vite / Vitest: ビルドツールおよびテスト環境
  - Mise: 開発ツールのバージョン管理

## セットアップ

1. 依存関係のインストール

   ```:sh
   bun i
   ```

2. 環境変数の設定

   ```:sh
   # .env.example を参考に .env を作成
   cp .env.example .env
   $EDITOR .env
   ```

3. 型定義の生成
   Cloudflare Workers の設定（wrangler.jsonc）に基づいた型定義を生成します。

   ```:sh
   bun run cf:typegen
   ```

4. データベースの作成

   ```:sh
   bun run db:generate

   bun run db:migrate
   ```

5. 開発サーバーの起動

   ```:sh
   bun run dev
   ```

## デプロイ

[Cloudflare 無料アカウント必須](https://dash.cloudflare.com)
Cloudflare Workers へのデプロイは以下のコマンドで行います。

```:sh
bun run deploy
# 環境変数もデプロイ
bun run cf:secret
```

## 参考文献

- [Hono](https://hono.dev/docs/)
- [Durable Objects](https://developers.cloudflare.com/durable-objects/)
- [Rivetkit](https://www.rivet.dev/docs/)
- [Partykit](https://docs.partykit.dev/)
- [Drizzle](https://orm.drizzle.team/docs/overview/)
- [Better-Auth](https://www.better-auth.com/docs/)
- [Jotai](https://jotai.org/docs/)
- [DaisyUI](https://daisyui.com/components/)
- [vite-ssr-components](https://github.com/yusukebe/vite-ssr-components)
