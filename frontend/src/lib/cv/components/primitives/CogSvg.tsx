export function CogSvg() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden>
      <g fill="currentColor">
        {Array.from({ length: 12 }, (_, i) => (
          <rect
            key={i}
            x="44"
            y="1"
            width="12"
            height="22"
            rx="2"
            transform={`rotate(${i * 30} 50 50)`}
          />
        ))}
      </g>
      <circle cx="50" cy="50" r="33" fill="currentColor" />
      <circle cx="50" cy="50" r="14" fill="#140f09" />
    </svg>
  );
}
