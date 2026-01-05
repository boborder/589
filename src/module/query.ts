import { hc } from "hono/client";
import { atom, useAtom } from "jotai";
import { atomWithMutation, atomWithQuery } from "jotai-tanstack-query";
import { Client } from "xrpl";
import type { AppType } from "../index";

const rpc = hc<AppType>("/");

const networkAtom = atom("wss://xrpl.ws");
export const useNetwork = () => useAtom(networkAtom);

const wsAtom = atom(async (get) => {
  const ws = new Client(get(networkAtom));
  if (!ws.isConnected()) {
    await ws.connect();
  }
  return ws;
});

export const feeQuery = atomWithQuery((get) => ({
  queryKey: ["fee", get(wsAtom)],
  queryFn: async () => {
    const ws = await get(wsAtom);
    return ws.request({ command: "fee" });
  },
  refetchInterval: 3333,
}));

export const serverQuery = atomWithQuery((get) => ({
  queryKey: ["server", get(wsAtom)],
  queryFn: async () => {
    const ws = await get(wsAtom);
    return ws.request({ command: "server_info" });
  },
  refetchInterval: 10000,
}));

export const priceQuery = atomWithQuery((get) => ({
  queryKey: ["price", get(wsAtom)],
  queryFn: async () => {
    const ws = await get(wsAtom);
    return ws
      .request({
        command: "book_offers",
        taker_gets: { currency: "XRP" },
        taker_pays: {
          currency: "524C555344000000000000000000000000000000",
          issuer: "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De",
        },
        limit: 1,
      })
      .then((res) => Number(res.result.offers[0].quality) * 1000000);
  },
  refetchInterval: 60000,
}));

const typeAtom = atom("VerifiableCredential");

export const credentialQuery = atomWithMutation((get) => ({
  mutationFn: () =>
    rpc.api.cred.create[":type?"]
      .$get({ param: { type: get(typeAtom) } })
      .then((res) => res.json()),
}));

export const acceptQuery = atomWithMutation(() => ({
  mutationFn: () => rpc.api.cred.accept.$get().then((res) => res.json()),
}));

const hubAtom = atom("https://hub.distributedagreement.com:51235/health");

export const hubQuery = atomWithQuery((get) => ({
  queryKey: ["hub", get(hubAtom)],
  queryFn: async () => {
    const response = await fetch(get(hubAtom));
    return response.json();
  },
}));
