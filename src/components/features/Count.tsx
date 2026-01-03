import { useAtom } from 'jotai';
import { atomWithStorage, RESET } from 'jotai/utils';

const countAtom = atomWithStorage('count', 123);

export const Count = () => {
  const [count, setCount] = useAtom(countAtom);
  return (
    <div className="join">
      <button
        type="button"
        onClick={() => setCount(count + 1)}
        className="btn btn-square btn-primary join-item text-2xl"
      >
        +
      </button>
      <div className="btn join-item text-2xl font-mono">{count}</div>
      <button
        type="button"
        onClick={() => setCount(count - 1)}
        className="btn btn-square btn-secondary join-item text-2xl"
      >
        -
      </button>
      <button
        type="button"
        onClick={() => setCount(RESET)}
        className="btn  btn-error join-item text-lg"
      >
        RESET
      </button>
    </div>
  );
};
