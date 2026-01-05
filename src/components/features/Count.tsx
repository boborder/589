import { createClient, createRivetKit } from '@rivetkit/react';
import { atom, useAtom } from 'jotai';
import { atomWithQuery } from 'jotai-tanstack-query';
import type { registry } from '../../registry';

// count の状態
const countAtom = atom<number | undefined>(undefined);

// RivetKit のエンドポイント 本番環境 or 開発環境
const endpoint = import.meta.env.PROD
  ? 'https://app.589.workers.dev/rivet'
  : 'http://localhost:3000/rivet';

// RivetKit のクライアント
const clientAtom = atom(createClient<typeof registry>(endpoint));

// 現在の count を取得するクエリ 初期値に使う
const countQuery = atomWithQuery((get) => ({
  queryKey: ['count', get(clientAtom)],
  queryFn: async () => {
    // /rivet/counter/getCount へリクエスト
    const client = get(clientAtom).counter.getOrCreate('getCount');
    return client.getCount();
  },
  enabled: !!get(clientAtom).counter,
}));

// RivetKit の React 用 hook
const { useActor } = createRivetKit<typeof registry>({
  endpoint,
});

export const Count = () => {
  const [{ data: initialCount }] = useAtom(countQuery);
  const [count, setCount] = useAtom(countAtom);

  const socket = useActor({
    name: 'counter',
    key: ['getCount'],
  });

  socket.useEvent('newCount', (count: number) => {
    setCount(count);
  });

  const increment = async () => {
    await socket.connection?.increment(1);
  };

  const decrement = async () => {
    await socket.connection?.decrement(1);
  };
  const reset = async () => {
    await socket.connection?.reset();
  };

  return (
    <div className="join my-3">
      <button
        type="button"
        onClick={increment}
        className="btn btn-square btn-primary join-item text-2xl"
      >
        +
      </button>
      <div className="w-36 btn join-item text-2xl font-mono">
        {count ?? initialCount}
      </div>
      <button
        type="button"
        onClick={decrement}
        className="btn btn-square btn-secondary join-item text-2xl"
      >
        -
      </button>
      <button
        type="button"
        onClick={reset}
        className="btn btn-error join-item text-lg"
      >
        RESET
      </button>
    </div>
  );
};
