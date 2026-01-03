export const Loading = () => {
  return (
    <>
      {/* <Progress /> */}
      <div className="fixed inset-0 flex items-center justify-center z-10">
        <div className="p-8 rounded-box bg-base-200/40">
          <p className="text-xl animate-pulse">読み込み中...</p>
          <div className="flex items-center justify-center">
            <span className="loading loading-infinity loading-xl" />
            <span className="loading loading-infinity loading-xl" />
            <span className="loading loading-infinity loading-xl" />
            <span className="loading loading-infinity loading-xl" />
            <span className="loading loading-infinity loading-xl" />
          </div>
        </div>
      </div>
    </>
  );
};

export const Spinner = () => {
  return <span className="loading loading-spinner loading-lg" />;
};

export const Progress = () => {
  return <progress className="progress progress-primary" />;
};
