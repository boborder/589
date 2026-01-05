import { createClient } from '@rivetkit/react';
import { atom, useAtom } from 'jotai';
import { atomWithQuery } from 'jotai-tanstack-query';
import type { registry } from '../../registry';

const endpoint = import.meta.env.PROD
  ? "https://app.589.workers.dev/rivet"
  : 'http://localhost:3000/rivet';

const clientAtom = atom(createClient<typeof registry>(endpoint));

const url = "https://xrpl.ws";

const getInfoQuery = atomWithQuery((get) => ({
  queryKey: ["getInfo", get(clientAtom)],
  queryFn: async () => {
    const client = get(clientAtom).getInfo.getOrCreate("my-schedule");
    await client.getLedgerIndex(url);
    await client.getPrice(url);
    await client.getTime(url);
    return url;
  },
}));

const currentQuery = atomWithQuery((get) => ({
  queryKey: ["current", get(clientAtom)],
  queryFn: async () => {
    const client = get(clientAtom).getInfo.getOrCreate("my-schedule");
    return client.getCurrent();
  },
  refetchInterval: 3000,
}));

export const GetXRP = () => {
  const [{ data: getInfo }] = useAtom(getInfoQuery);
  const [{ data: current }] = useAtom(currentQuery);

  return (
    <div className="stats stats-vertical md:stats-horizontal">
      <div className="stat">
        <div className="stat-title">Time</div>
        <div className="stat-value text-xs  font-mono">
          {current?.time}
        </div>
        <div className="stat-desc">{getInfo}</div>
      </div>
      <div className="stat">
        <div className="stat-title">Ledger Index</div>
        <div className="stat-value font-mono">
          {current?.ledgerIndex}
        </div>
      </div>
      <div className="stat">
        <div className="stat-title">XRP/RLUSD</div>
        <div className="stat-value font-mono">${current?.price?.toFixed(4)}</div>
      </div>
    </div>
  );
};
