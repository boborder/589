import { createHandler } from '@rivetkit/cloudflare-workers';
import { Hono } from 'hono';
import { showRoutes } from 'hono/dev';
import middleware from './middleware';
import { registry } from './registry';
import { renderer } from './renderer';
import routes from './routes';
import { root } from './routes/root';

// PartyServer ミドルウェアを最初に適用（WebSocket リクエストを他のミドルウェアより先に処理）
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

// export default {
//   fetch: app.fetch,
// } satisfies ExportedHandler<Cloudflare.Env>;

export { WebSocketServer } from './party';

const { handler, ActorHandler } = createHandler(registry, { fetch: app.fetch });

export default handler;
export { ActorHandler };
