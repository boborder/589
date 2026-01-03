import { useAtom } from 'jotai';
import { feeQuery, priceQuery, serverQuery } from '../../module/query';

export const GetXRP = () => {
  const [{ data: server }] = useAtom(serverQuery);
  const [{ data: fee }] = useAtom(feeQuery);
  const [{ data: price }] = useAtom(priceQuery);
  return (
    <div className="stats stats-vertical md:stats-horizontal">
      <div className="stat">
        <div className="stat-title">Time</div>
        <div className="stat-value text-xs  font-mono">
          {server?.result.info.time}
        </div>
      </div>
      <div className="stat">
        <div className="stat-title">Ledger Index</div>
        <div className="stat-value font-mono">
          {fee?.result.ledger_current_index}
        </div>
      </div>
      <div className="stat">
        <div className="stat-title">XRP/RLUSD</div>
        <div className="stat-value font-mono">${price?.toFixed(4)}</div>
      </div>
    </div>
  );
};
