"use client";

import Link from "next/link";

import {
    ReactNode,
} from "react";

import styles from "./BaseHeader.module.css";

import {
    useHeader,
} from "./useHeader";

type NavItem = {
    id: string;
    href: string;
    label: string;
};

type BaseHeaderProps = {
    topBar?: ReactNode;
    logo: ReactNode;
    actions?: ReactNode;
    navContent?: ReactNode;
    navLabel?: string;
    mobileExtra?: ReactNode;
    mobileTitle?: ReactNode;
};

export function BaseHeader({
    topBar,
    logo,
    actions,
    navContent,
    mobileTitle,
    mobileExtra,
    navLabel,
}: BaseHeaderProps) {
    const {
        visible,
        menuAberto,
        toggleMenu,
        closeMenu,
    } = useHeader();

    return (
        <>
            <header
                className={`${styles.header}${visible? styles.visible: styles.hidden}${menuAberto? styles.menuOpen: ""}`}>
                <div
                    className={
                        styles.inner
                    }
                >
                    <button
                        type="button"
                        className={
                            styles.menuButton
                        }
                        onClick={
                            toggleMenu
                        }
                        aria-label={
                            menuAberto
                                ? "Fechar menu"
                                : "Abrir menu"
                        }
                        aria-expanded={
                            menuAberto
                        }
                    >
                        {menuAberto
                            ? ""
                            : "☰"}
                    </button>

                    <nav
                        className={`${styles.nav} ${menuAberto
                            ? styles.navOpen
                            : ""
                            }`}
                        aria-label={navLabel}
                    >
                        <button
                            type="button"
                            className={
                                styles.closeMenuButton
                            }
                            onClick={closeMenu}
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

                    <div
                        className={
                            styles.logo
                        }
                    >
                        {logo}
                    </div>

                    <div
                        className={
                            styles.actions
                        }
                    >
                        {actions}
                    </div>
                </div>
            </header >

            {menuAberto && (
                <div
                    className={
                        styles.overlay
                    }
                    onClick={
                        closeMenu
                    }
                />
            )
            }
        </>
    );
}