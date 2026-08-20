import type { ReactNode } from "react";

import Link from "next/link";

import styles from "./LinkButton.module.css";

type LinkButtonProps = {
  children: ReactNode;
  href?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
};

export function LinkButton({
  children,
  href,
  type = "button",
  disabled,
  className,
}: LinkButtonProps) {
  const classes =
    `${styles.button} ${className ?? ""}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      className={classes}
    >
      {children}
    </button>
  );
}
