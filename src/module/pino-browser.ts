// ブラウザ環境用のpinoダミー実装
// rivetkitがクライアント側で使用される際のpino依存を回避

const noop = () => {};

export const pino = () => ({
  info: noop,
  warn: noop,
  error: noop,
  debug: noop,
  trace: noop,
  fatal: noop,
  child: () => pino(),
});

// stdTimeFunctions をエクスポート（rivetkitが使用）
export const stdTimeFunctions = {
  epochTime: () => Date.now(),
  slowTime: () => Date.now(),
};

export default pino;
