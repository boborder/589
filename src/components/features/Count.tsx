import { createRivetKit } from '@rivetkit/react';
import { atom, useAtom } from 'jotai';
import { atomWithQuery } from 'jotai-tanstack-query';
import type { registry } from '../../registry';

const countAtom = atom<number | undefined>(undefined);

const countQuery = atomWithQuery((get) => ({
  queryKey: ["count", get(countAtom)],
  queryFn: async () => {
    const socket = useActor({
      name: "counter",
      key: ["getCount"],
    });
    return socket.connection?.getCount();
  },
}));

const endpoint = import.meta.env.PROD
  ? "https://app.589.workers.dev/rivet"
  : 'http://localhost:3000/rivet';
const { useActor } = createRivetKit<typeof registry>({
  endpoint,
});

export const Count = () => {
  const [{ data: initialCount }] = useAtom(countQuery);
  const [count, setCount] = useAtom(countAtom);

  const socket = useActor({
    name: "counter",
    key: ["getCount"],
  });
  socket.useEvent("newCount", (count: number) => {
    setCount(count);
  });
  const increment = () => {
    socket.connection?.increment(1);
  };
  const decrement = () => {
    socket.connection?.decrement(1);
  };

  return (
    <div className="join">
      <button
        type="button"
        onClick={increment}
        className="btn btn-square btn-primary join-item text-2xl"
      >
        +
      </button>
      <div className="w-42 btn join-item text-2xl font-mono">{count ?? initialCount}</div>
      <button
        type="button"
        onClick={decrement}
        className="btn btn-square btn-secondary join-item text-2xl"
      >
        -
      </button>
      {/* <button
        type="button"
        onClick={() => setCount(589)}
        className="btn  btn-error join-item text-lg"
      >
        RESET
      </button> */}
    </div>
  );
};
