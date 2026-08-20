import styles from "./Ornamento.module.css";

type OrnamentoProps = {
  className?: string;
  width?: number;
  height?: number;
};

export function Ornamento({
  className,
  width,
  height,
}: OrnamentoProps) {
  return (
    <svg
      className={`${styles.ornamento} ${className ?? ""}`}
      style={
        width || height
          ? { width, height }
          : undefined
      }
      viewBox="0 0 120 24"
      fill="none"
      aria-hidden="true"
    >
      <line
        x1="0"
        y1="12"
        x2="42"
        y2="12"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path
        d="M60 2 L70 12 L60 22 L50 12 Z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <circle
        cx="60"
        cy="12"
        r="2.5"
        fill="currentColor"
      />
      <line
        x1="78"
        y1="12"
        x2="120"
        y2="12"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}
