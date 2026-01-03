import { Challenge } from '../components/features/Challenge';
import { GetXRP } from '../components/features/GetXRP';
import { Globe } from '../components/features/Globe';
import {
  CryptoHeatmap,
  Ticker,
  TradingView,
} from '../components/features/TradingView';

export function App() {
  return (
    <>
      <GetXRP />
      <Globe />
      <Challenge />
      <Ticker />
      <CryptoHeatmap />
      <TradingView />
    </>
  );
}
