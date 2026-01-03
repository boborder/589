// <Collapse content={data} />

type CollapseProps = {
  title?: string;
  content: object | string;
  className?: string;
};

export const Collapse = ({
  title = 'Data',
  content,
  className = '',
}: CollapseProps) => {
  const data =
    typeof content === 'object' ? JSON.stringify(content, null, 2) : content;
  return (
    <div className={`mx-auto my-3 ${className}`}>
      <details className="collapse collapse-arrow min-w-72 max-w-72 sm:max-w-108 lg:max-w-130 border border-neutral bg-base-200">
        <summary className="collapse-title text-accent">{title}</summary>
        <pre className="collapse-content min-w-68 max-w-68 sm:max-w-104 lg:max-w-122 p-2 m-2 bg-neutral overflow-x-scroll rounded-box text-xs text-success text-left">
          <code>{data}</code>
        </pre>
      </details>
    </div>
  );
};
