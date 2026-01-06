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
  state: {
    price: {} as BookOffersResponse,
    serverInfo: {} as ServerInfoResponse,
    fee: {} as FeeResponse,
  },
  onSleep: (_c) => {
    console.log("onSleep");
  },
  // onConnect: (c) => {
  //   const url = "https://xrpl.ws";
  //   c.schedule.after(60000, "getServerInfo", url);
  //   c.schedule.after(30000, "getPrice", url);
  //   c.schedule.after(3333, "getFee", url);
  // },
  actions: {
    // XRP/RLUSD 30秒ごとに取得
    getPrice: async (c, url: string) => {
      const res = (await fetch(url, {
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
      }).then((res) => res.json())) as BookOffersResponse;
      c.state.price = res;
      c.broadcast("newPrice", c.state.price);
      c.schedule.after(30000, "getPrice", url);
      return c.state.price;
    },
    // サーバー時間 60秒ごとに取得
    getServerInfo: async (c, url: string) => {
      const res = (await fetch(url, {
        method: "POST",
        body: JSON.stringify({
          method: "server_info",
        }),
      }).then((res) => res.json())) as ServerInfoResponse;
      c.state.serverInfo = res;
      c.broadcast("newServerInfo", c.state.serverInfo);
      c.schedule.after(60000, "getServerInfo", url);
      return c.state.serverInfo;
    },
    // 手数料 3秒ごとに取得
    getFee: async (c, url: string) => {
      const res = (await fetch(url, {
        method: "POST",
        body: JSON.stringify({
          method: "fee",
        }),
      }).then((res) => res.json())) as FeeResponse;
      c.state.fee = res;
      c.broadcast("newFee", c.state.fee);
      c.schedule.after(3333, "getFee", url);
      return c.state.fee;
    },
    getCurrent: async (c) => {
      return {
        price: c.state.price,
        serverInfo: c.state.serverInfo,
        fee: c.state.fee,
      };
    },
  },
});

const location = actor({
  options: {
    canHibernateWebSocket: true,
  },
  // driver から cf へアクセスできる
  createVars: (_ctx: InitContext, driver: DriverContext) => ({ driver }),
  state: { location: { lat: 0, lng: 0, Region: "" }, count: 0 },
  // request から cf へアクセスできる
  onRequest: (c, request) => {
    console.log(
      request.cf?.latitude,
      request.cf?.longitude,
      request.cf?.region,
    );
    c.state.location = {
      lat: parseFloat(request.cf?.latitude as string),
      lng: parseFloat(request.cf?.longitude as string),
      Region: request.cf?.region as string,
    };
    c.state.count++;
    return new Response(
      JSON.stringify({
        location: c.state.location,
        count: c.state.count,
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  },
  onDisconnect: (c) => {
    // ユーザーが離れたら位置情報を削除
    c.state.location = { lat: 0, lng: 0, Region: "" };
    c.state.count--;
  },
  actions: {
    getLocation: (c) => {
      console.log(c.vars.driver.state.id);
      return c.state.location;
    },
  },
});

export const registry = setup({
  use: { counter, getInfo, location },
});
