"use client";

import { ReactNode } from "react";

import styles from "./BaseHeader.module.css";

import { useHeader } from "./useHeader";
import { HeaderSidebar } from "./HeaderSidebar";

type BaseHeaderProps = {
  topBar?: ReactNode;
  logo: ReactNode;
  actions?: ReactNode;
  navContent?: ReactNode;
  navLabel?: string;
  mobileExtra?: ReactNode;
  mobileTitle?: ReactNode;
  /** Conteúdo do menu lateral do celular, quando difere do `navContent`. */
  mobileNavContent?: ReactNode;
  /** Mantém o header visível mesmo ao rolar para baixo. */
  keepVisible?: boolean;
};

export function BaseHeader({
  topBar,
  logo,
  actions,
  navContent,
  mobileTitle,
  mobileExtra,
  navLabel,
  mobileNavContent,
  keepVisible = false,
}: BaseHeaderProps) {
  const {
    visible,
    menuAberto,
    toggleMenu,
    closeMenu,
  } = useHeader({ keepVisible });

  return (
    <>
      <header
        className={`${styles.header} ${visible ? styles.visible : styles.hidden} ${menuAberto || keepVisible ? styles.menuOpen : ""}`}
      >
        {topBar && (
          <div className={styles.topBar}>
            {topBar}
          </div>
        )}

        <div className={styles.inner}>
          <button
            type="button"
            className={`${styles.menuButton} ${menuAberto ? styles.menuButtonHidden : ""}`}
            onClick={toggleMenu}
            aria-label="Abrir menu"
            aria-expanded={menuAberto}
          >
            ☰
          </button>

          <nav
            className={styles.desktopNav}
            aria-label={navLabel}
          >
            {navContent}
          </nav>

          <div className={styles.logo}>
            {logo}
          </div>

          <div className={styles.actions}>
            {actions}
          </div>
        </div>
      </header>

      <div
        className={`${styles.headerSpacer} ${
          topBar
            ? styles.headerSpacerLarge
            : ""
        }`}
      />

      <HeaderSidebar
        aberto={menuAberto}
        onClose={closeMenu}
        navLabel={navLabel}
        navContent={mobileNavContent ?? navContent}
        mobileTitle={mobileTitle}
        mobileExtra={mobileExtra}
      />
    </>
  );
}
