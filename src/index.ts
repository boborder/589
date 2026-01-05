import { createHandler } from '@rivetkit/cloudflare-workers';
import { Hono } from 'hono';
import { showRoutes } from 'hono/dev';
import middleware from './middleware';
import { registry } from './registry';
import { renderer } from './renderer';
import routes from './routes';
import { root } from './routes/root';

const app = new Hono<Env>()
  //ミドルウェアを適用
  .route('/', middleware)
  // SSR レンダラー ミドルウェア
  .use(renderer)
  // api routes
  .route('/', routes)
  // Client ページ
  .route('/', root);

if (import.meta.env.DEV) {
  showRoutes(app);
}

// RPC クライアント用の型エクスポート
export type AppType = typeof app;

// PartyServer のエクスポート
export { WebSocketServer } from './party';

// ここで RivetKit のハンドラーを作成 hono をラップ
// /rivet エンドポイント が作成される
const { handler, ActorHandler } = createHandler(
  registry,
  { fetch: app.fetch }
);
// RivetKit のハンドラーをエクスポート
export default handler;
// RivetKit のDurable Object クラスをエクスポート
export { ActorHandler };
