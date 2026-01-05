import type { DriverContext } from "@rivetkit/cloudflare-workers";
import { actor, type InitContext, setup } from "rivetkit";
import type { BookOffersResponse, FeeResponse, ServerInfoResponse } from "xrpl";

// counter sample
export const counter = actor({
  options: {
    canHibernateWebSocket: true,
  },
  state: { count: 589 },
  actions: {
    getCount: (c, x?: number) => {
      return x ?? c.state.count;
    },
    increment: (c, x: number) => {
      c.state.count += x;
      c.broadcast("newCount", c.state.count);
      return c.state.count;
    },
    decrement: (c, x: number) => {
      c.state.count -= x;
      c.broadcast("newCount", c.state.count);
      return c.state.count;
    },
    reset: (c) => {
      c.state.count = 589;
      c.broadcast("newCount", c.state.count);
      return c.state.count;
    },
  },
});

// scheduler
export const getInfo = actor({
  options: {
    canHibernateWebSocket: true,
  },
  state: { price: 0, time: "", ledgerIndex: 0 },
  onSleep: (_c) => {
    console.log("onSleep");
  },
  actions: {
    // XRP/RLUSD 30秒ごとに取得
    getPrice: async (c, url: string) => {
      console.log(url);
      const price = await fetch(url, {
        method: "POST",
        body: JSON.stringify({
          method: "book_offers",
          params: [
            {
              taker_gets: { currency: "XRP" },
              taker_pays: {
                currency: "524C555344000000000000000000000000000000",
                issuer: "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De",
              },
              limit: 1,
            },
          ],
        }),
      }).then((res) => res.json()) as BookOffersResponse;
      c.state.price = Number(price.result.offers[0].quality) * 1000000;
      console.log(c.state.price);
      c.broadcast("newPrice");
      c.schedule.after(30000, "getPrice", url);
      return c.state.price;
    },
    // サーバー時間 60秒ごとに取得
    getTime: async (c, url: string) => {
      console.log(url);
      const info = await fetch(url, {
        method: "POST",
        body: JSON.stringify({
          method: "server_info",
        }),
      }).then((res) => res.json()) as ServerInfoResponse;
      c.state.time = info.result.info.time;
      // ブロードキャストの意味ない？
      c.broadcast("newTime", c.state.time);
      c.schedule.after(60000, "getTime", url);
      return c.state.time;
    },
    // 手数料 3秒ごとに取得
    getLedgerIndex: async (c, url: string) => {
      console.log(url);
      const fee = await fetch(url, {
        method: "POST",
        body: JSON.stringify({
          method: "fee",
        }),
      }).then((res) => res.json()) as FeeResponse;
      c.state.ledgerIndex = Number(fee.result.ledger_current_index);
      // ブロードキャストの意味ない？
      c.broadcast("newLedgerIndex", c.state.ledgerIndex);
      c.schedule.after(3333, "getLedgerIndex", url);
      return c.state.ledgerIndex;
    },
    getCurrent: async (c) => {
      return {
        price: c.state.price,
        time: c.state.time,
        ledgerIndex: c.state.ledgerIndex,
      };
    },
  },
});

const location = actor({
  options: {
    canHibernateWebSocket: true,
  },
  createVars: (_ctx: InitContext, driver: DriverContext) => ({ driver }),
  state: { location: { lat: 0, lng: 0, Region: "" }, count: 0 },
  onRequest: (c, request) => {
    console.log(request.cf?.latitude, request.cf?.longitude, request.cf?.region);
    c.state.location = {
      lat: parseFloat(request.cf?.latitude as string),
      lng: parseFloat(request.cf?.longitude as string),
      Region: request.cf?.region as string,
    };
    c.state.count++;
    return new Response(JSON.stringify({ location: c.state.location, count: c.state.count }), {
      headers: { "Content-Type": "application/json" },
    });
  },
  onDisconnect: (c) => {
    // ユーザーが離れたら位置情報を削除
    c.state.location = { lat: 0, lng: 0, Region: "" };
    c.state.count--;
  },
  actions: {},
});

export const registry = setup({
  use: { counter, getInfo },
});
