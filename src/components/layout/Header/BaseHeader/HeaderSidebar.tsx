"use client";

import {
  ReactNode,
  type MouseEvent,
} from "react";

import styles from "./BaseHeader.module.css";

type HeaderSidebarProps = {
  aberto: boolean;
  onClose: () => void;
  navLabel?: string;
  navContent?: ReactNode;
  mobileTitle?: ReactNode;
  mobileExtra?: ReactNode;
};

export function HeaderSidebar({
  aberto,
  onClose,
  navLabel,
  navContent,
  mobileTitle,
  mobileExtra,
}: HeaderSidebarProps) {
  if (!aberto) {
    return null;
  }

  function handleNavClick(
    event: MouseEvent<HTMLElement>
  ) {
    const target =
      event.target;

    if (
      target instanceof Element &&
      target.closest("a")
    ) {
      onClose();
    }
  }

  return (
    <>
      <div
        className={styles.overlay}
        onClick={onClose}
      />

      <nav
        className={`${styles.nav} ${styles.navOpen}`}
        aria-label={navLabel}
        onClick={handleNavClick}
      >
        <button
          type="button"
          className={
            styles.closeMenuButton
          }
          onClick={onClose}
          aria-label="Fechar menu"
        >
          ✕
        </button>

        {navContent}

        {mobileExtra && (
          <div
            className={
              styles.mobileExtra
            }
          >
            {mobileTitle && (
              <span
                className={
                  styles.mobileTitle
                }
              >
                {mobileTitle}
              </span>
            )}

            {mobileExtra}
          </div>
        )}
      </nav>
    </>
  );
}
