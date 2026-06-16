import styles from "./Button.module.css";

type ButtonProps = {
  children: React.ReactNode;
  type?: "button" | "submit";
  variant?: "primary" | "outline" | "danger";
  onClick?: () => void;
  disabled?: boolean;
};

export function Button({
  children,
  type = "button",
  variant = "primary",
  onClick,
  disabled,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${styles.button}
        ${styles[variant]}
      `}
    >
      {children}
    </button>
  );
}