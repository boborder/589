import { memo, useEffect, useRef } from "hono/jsx/dom";
import { atom, useAtom } from "jotai";

const symbolAtom = atom("BITSTAMP:XRPUSD");

export const TradingView = memo(() => {
  const container = useRef<HTMLDivElement>(null);
  const [symbol] = useAtom(symbolAtom);

  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = `
        {
          "allow_symbol_change": true,
          "calendar": false,
          "details": false,
          "hide_side_toolbar": true,
          "hide_top_toolbar": false,
          "hide_legend": false,
          "hide_volume": false,
          "hotlist": false,
          "interval": "M",
          "locale": "en",
          "save_image": true,
          "style": "1",
          "symbol": "${symbol}",
          "range": "YTD",
          "theme": "dark",
          "timezone": "Etc/UTC",
          "backgroundColor": "#0F0F0F",
          "gridColor": "rgba(242, 242, 242, 0.06)",
          "watchlist": [],
          "withdateranges": false,
          "compareSymbols": [],
          "studies": [],
          "autosize": true
        }`;
    container.current?.appendChild(script);
  }, [symbol]);

  return (
    <div className="h-160 w-full">
      <div
        className="tradingview-widget-container"
        ref={container}
        style={{ height: "100%", width: "100%" }}
      >
        <div
          className="tradingview-widget-container__widget"
          style={{ height: "calc(100% - 32px)", width: "100%" }}
        />
        <div className="tradingview-widget-copyright">
          <a
            href={`https://www.tradingview.com/symbols/${symbol}/`}
            rel="noopener nofollow"
            target="_blank"
          >
            <span className="blue-text">{symbol} chart</span>
          </a>
          <span className="trademark"> by TradingView</span>
        </div>
      </div>
    </div>
  );
});

export const CryptoHeatmap = memo(() => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-crypto-coins-heatmap.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = `
        {
          "dataSource": "Crypto",
          "blockSize": "market_cap_calc",
          "blockColor": "24h_close_change|5",
          "locale": "en",
          "symbolUrl": "",
          "colorTheme": "dark",
          "hasTopBar": false,
          "isDataSetEnabled": false,
          "isZoomEnabled": true,
          "hasSymbolTooltip": true,
          "isMonoSize": false,
          "width": "100%",
          "height": "100%"
        }`;
    container.current?.appendChild(script);
  }, []);

  return (
    <div className="h-120 w-full">
      <div className="tradingview-widget-container" ref={container}>
        <div className="tradingview-widget-container__widget"></div>
        <div className="tradingview-widget-copyright">
          <a
            href="https://www.tradingview.com/heatmap/crypto/"
            rel="noopener nofollow"
            target="_blank"
          >
            <span className="blue-text">Crypto Heatmap</span>
          </a>
          <span className="trademark"> by TradingView</span>
        </div>
      </div>
    </div>
  );
});

export const Ticker = memo(() => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = `
        {
          "symbols": [
            {
              "proName": "FOREXCOM:SPXUSD",
              "title": "S&P 500 Index"
            },
            {
              "proName": "FOREXCOM:NSXUSD",
              "title": "US 100 Cash CFD"
            },
            {
              "proName": "BITSTAMP:BTCUSD",
              "title": "Bitcoin"
            },
            {
              "proName": "BITSTAMP:ETHUSD",
              "title": "Ethereum"
            },
            {
              "proName": "BITSTAMP:XRPUSD",
              "title": "XRP"
            },
            {
              "proName": "FOREXCOM:USDJPY",
              "title": "USD JPY"
            }
          ],
          "colorTheme": "dark",
          "locale": "en",
          "largeChartUrl": "",
          "isTransparent": false,
          "showSymbolLogo": true,
          "displayMode": "adaptive"
        }`;
    container.current?.appendChild(script);
  }, []);

  return (
    <div className="w-full">
      <div className="tradingview-widget-container" ref={container}>
        <div className="tradingview-widget-container__widget"></div>
        <div className="tradingview-widget-copyright">
          {/* <a href="https://www.tradingview.com/markets/" rel="noopener nofollow" target="_blank">
          <span className="blue-text">Ticker tape</span>
        </a>
        <span className="trademark"> by TradingView</span> */}
        </div>
      </div>
    </div>
  );
});
