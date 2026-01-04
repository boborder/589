// import { useAtom } from 'jotai';
// import { feeQuery, priceQuery, serverQuery } from '../../module/query';

import { createRivetKit } from '@rivetkit/react';
import { useEffect, useState } from 'hono/jsx/dom';
import type { registry } from '../../registry';

const endpoint = import.meta.env.PROD
  ? "https://app.589.workers.dev/rivet"
  : 'http://localhost:3000/rivet';

const { useActor } = createRivetKit<typeof registry>({
  endpoint,
});

export const GetXRP = () => {
  // const [{ data: server }] = useAtom(serverQuery);
  // const [{ data: fee }] = useAtom(feeQuery);
  // const [{ data: price }] = useAtom(priceQuery);
  const [ price, setPrice ] = useState(0);
  const [ server, setTime ] = useState(0);
  const [ fee, setFee ] = useState(0);

  const socket = useActor({
    name: "getInfo",
    key: ["my-schedule"]
  });

  socket.useEvent("newPrice", async (message) => {
    setPrice(await message.price);
  });
  socket.useEvent("newTime", async (message) => {
    setTime(await message.time);
  });
  socket.useEvent("newLedgerIndex", async (message) => {
    setFee(await message.fee);
  });

  useEffect(() => {
    socket.connection?.setReminder().then((res) => {
      console.log(res);
    });
  }, []);

  return (
    <div className="stats stats-vertical md:stats-horizontal">
      <div className="stat">
        <div className="stat-title">Time</div>
        <div className="stat-value text-xs  font-mono">
          {/* {server?.result.info.time} */}
          {server}
        </div>
      </div>
      <div className="stat">
        <div className="stat-title">Ledger Index</div>
        <div className="stat-value font-mono">
          {/* {fee?.result.ledger_current_index} */}
          {fee}
        </div>
      </div>
      <div className="stat">
        <div className="stat-title">XRP/RLUSD</div>
        <div className="stat-value font-mono">${price?.toFixed(4)}</div>
      </div>
    </div>
  );
};
