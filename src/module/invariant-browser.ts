// ブラウザ環境用のinvariantダミー実装
// rivetkitがクライアント側で使用される際のinvariant依存を回避

function invariant(condition: unknown, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message || "Invariant failed");
  }
}

export default invariant;
export { invariant };


