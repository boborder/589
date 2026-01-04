import type { DriverContext } from "@rivetkit/cloudflare-workers";
import { actor, setup } from "rivetkit";
import type { BookOffersResponse, FeeResponse, ServerInfoResponse } from "xrpl";

// counter sample
export const counter = actor({
  options: {
    canHibernateWebSocket: true,
  },
  // createVars(_ctx, driverCtx: DriverContext) {
  //   return {
  //     state: driverCtx.state,
  //   };
  // },
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
  },
});


// scheduler
export const getInfo = actor({
  options: {
    canHibernateWebSocket: true,
  },
  state: { price: 0, time: 0, ledgerIndex: 0 },
  actions: {
    setReminder: (c) => {
      const url = "https://xrpl.ws";
      c.schedule.after(3000, "getLedgerIndex", url);
      c.schedule.after(10000, "getPrice", url);
      c.schedule.after(100000, "getTime", url);
      return { url };
    },
    getPrice: async (c, url: string) => {
      console.log(url);
      const price = await fetch(url, {
        method: "POST",
        body: JSON.stringify({
          method: "book_offers",
          params: [{ taker_gets: { currency: "XRP" }, taker_pays: { currency: "524C555344000000000000000000000000000000", issuer: "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De" }, limit: 1 }],
        }),
      }).then(res => res.json()) as BookOffersResponse;
      c.state.price = Number(price.result.offers[0].quality) * 1000000;
      c.broadcast("newPrice", c.state.price);
      return c.state.price;
    },
    getTime: async (c, url: string) => {
      console.log(url);
      const info = await fetch(url, {
        method: "POST",
        body: JSON.stringify({
          method: "get_latest_validated_ledger",
        }),
      }).then(res => res.json()) as ServerInfoResponse;
      c.state.time = Number(info.result.info.time);
      c.broadcast("newTime", c.state.time);
      return c.state.time;
    },
    getLedgerIndex: async (c, url: string) => {
      console.log(url);
      const fee = await fetch(url, {
        method: "POST",
        body: JSON.stringify({
          method: "fee",
        }),
      }).then(res => res.json()) as FeeResponse;
      c.state.ledgerIndex = Number(fee.result.ledger_current_index);
      c.broadcast("newLedgerIndex", c.state.ledgerIndex);
      return c.state.ledgerIndex;
    },
  },
});


export const registry = setup({
  use: { counter, getInfo },
});
