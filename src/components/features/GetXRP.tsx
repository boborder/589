import { createClient } from "@rivetkit/react";
import { atom, useAtom } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";
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
    // XRP の手数料を取得
    await client.getFee(get(endpointAtom)[0]);
    // XRP/RLUSD の価格を取得
    await client.getPrice(get(endpointAtom)[0]);
    // XRP のサーバー時間を取得
    await client.getServerInfo(get(endpointAtom)[0]);
    return get(endpointAtom)[0];
  },
  enabled: !!get(clientAtom).getInfo,
}));

// RivetKit state の current を取得するクエリ
const currentQuery = atomWithQuery((get) => ({
  // /rivet/getInfo/my-schedule へリクエスト
  queryKey: ["current", get(clientAtom)],
  queryFn: async () => {
    // /rivet/getInfo/my-schedule へリクエスト
    const client = get(clientAtom).getInfo.getOrCreate("my-schedule");
    return client.getCurrent();
  },
  refetchInterval: 3456,
  enabled: !!get(clientAtom).getInfo,
}));

export const GetXRP = () => {
  const [{ data: getInfo }] = useAtom(getInfoQuery);
  const [{ data: current }] = useAtom(currentQuery);

  return (
    <div className="stats stats-vertical md:stats-horizontal">
      <div className="stat">
        <div className="stat-title">Time</div>
        <div className="stat-value text-xs  font-mono">
          {current?.time.result.info.time}
        </div>
        <div className="stat-desc">{getInfo}</div>
      </div>
      <div className="stat">
        <div className="stat-title">Ledger Index</div>
        <div className="stat-value font-mono">
          {current?.ledgerIndex.result.ledger_current_index}
        </div>
      </div>
      <div className="stat">
        <div className="stat-title">XRP/RLUSD</div>
        <div className="stat-value font-mono">
          $
          {(Number(current?.price.result.offers[0].quality) * 1000000).toFixed(
            4,
          )}
        </div>
      </div>
    </div>
  );
};
