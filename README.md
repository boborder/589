# hono proxy + AI

```sh
bun i
bun run dev
```

```sh
bun run deploy
```

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```sh
bun run cf-typegen
```

Pass the `CloudflareEnv` as generics when instantiation `Hono`:

```ts
//src/emv.d.ts
declare global {
  interface Env {
    Bindings: CloudflareEnv;
    Variables: {
      ...
    };
  }
}
```

```ts
// src/index.ts
const app = new Hono<Env>()
```

workers secret put `wrangler secret bulk .env`

```sh
bun run secret
```
