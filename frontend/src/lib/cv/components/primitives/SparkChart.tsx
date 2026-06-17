interface SparkChartProps {
  values: number[];
  className?: string;
  variant?: 'default' | 'tox';
}

export function SparkChart({ values, className = '', variant = 'default' }: SparkChartProps) {
  return (
    <div className={`cv-spark ${className}`.trim()} aria-hidden="true">
      {values.map((h, i) => (
        <i
          key={i}
          style={{
            height: `${h}%`,
            ...(variant === 'tox'
              ? { background: 'linear-gradient(180deg,#aef0c0,#2f9a55)' }
              : {}),
          }}
        />
      ))}
    </div>
  );
}
