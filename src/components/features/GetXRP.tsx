import { createClient, createRivetKit } from "@rivetkit/react";
import { atom, useAtom } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";
import type { BookOffersResponse, FeeResponse, ServerInfoResponse } from "xrpl";
import type { registry } from "../../registry";

// RivetKit のエンドポイント 本番環境 or 開発環境
const endpoint = import.meta.env.PROD
  ? "https://app.589.workers.dev/rivet"
  : "http://localhost:3000/rivet";

// RivetKit のクライアント
const clientAtom = atom(createClient<typeof registry>(endpoint));

// XRP の RPC エンドポイント
const endpointAtom = atom(["https://xrpl.ws", "wss://xrpl.ws"]);

// XRP の情報を取得するクエリ
const getInfoQuery = atomWithQuery((get) => ({
  queryKey: ["getInfo", get(clientAtom), get(endpointAtom)],
  queryFn: async () => {
    // /rivet/getInfo/my-schedule へリクエスト
    const client = get(clientAtom).getInfo.getOrCreate("my-schedule");
    // const current = await client.getCurrent();
    // XRP の手数料を取得
    const fee = await client.getFee(get(endpointAtom)[0]);
    // XRP/RLUSD の価格を取得
    const price = await client.getPrice(get(endpointAtom)[0]);
    // XRP のサーバー時間を取得
    const serverInfo = await client.getServerInfo(get(endpointAtom)[0]);
    return {
      fee: fee.result.ledger_current_index,
      price: Number(price.result.offers[0].quality) * 1000000,
      serverInfo: serverInfo.result.info.time,
      endpoint: get(endpointAtom)[0],
    };
  },
  enabled: !!get(clientAtom).getInfo,
}));

const feeAtom = atom(0);
const priceAtom = atom(0.0);
const serverInfoAtom = atom("");

const { useActor } = createRivetKit<typeof registry>({
  endpoint,
});

export const GetXRP = () => {
  const [{ data: getInfo }] = useAtom(getInfoQuery);
  const [fee, setFee] = useAtom(feeAtom);
  const [price, setPrice] = useAtom(priceAtom);
  const [serverInfo, setServerInfo] = useAtom(serverInfoAtom);

  const client = useActor({
    name: "getInfo",
    key: ["my-schedule"],
  });

  client.useEvent("newFee", async (fee: FeeResponse) => {
    setFee(fee.result.ledger_current_index);
  });
  client.useEvent("newPrice", async (price: BookOffersResponse) => {
    setPrice(Number(price.result.offers[0].quality) * 1000000);
  });
  client.useEvent("newServerInfo", async (serverInfo: ServerInfoResponse) => {
    setServerInfo(serverInfo.result.info.time);
  });

  return (
    <div className="stats stats-vertical md:stats-horizontal">
      <div className="stat">
        <div className="stat-title">Time</div>
        <div className="stat-value text-xs  font-mono">
          {serverInfo ?? getInfo?.serverInfo}
        </div>
        <div className="stat-desc">{getInfo?.endpoint}</div>
      </div>
      <div className="stat">
        <div className="stat-title">Ledger Index</div>
        <div className="stat-value font-mono">{fee ?? getInfo?.fee}</div>
      </div>
      <div className="stat">
        <div className="stat-title">XRP/RLUSD</div>
        <div className="stat-value font-mono">
          ${(price ?? getInfo?.price)!.toFixed(4)}
        </div>
      </div>
    </div>
  );
};
