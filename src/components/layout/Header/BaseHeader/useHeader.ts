"use client";

import {
    useCallback,
    useEffect,
    useState,
} from "react";

type UseHeaderOptions = {
    /**
     * Mantém o header visível mesmo sem o menu lateral aberto, por
     * exemplo enquanto um painel ancorado no próprio header está aberto.
     */
    keepVisible?: boolean;
};

export function useHeader({
    keepVisible = false,
}: UseHeaderOptions = {}) {
    const [visible, setVisible] =
        useState(true);

    const [menuAberto, setMenuAberto] =
        useState(false);

    const closeMenu = useCallback(() => {
        setMenuAberto(false);
    }, []);

    const openMenu = useCallback(() => {
        setMenuAberto(true);
    }, []);

    const toggleMenu = useCallback(() => {
        setMenuAberto((aberto) => !aberto);
    }, []);

    // Esconde o header ao descer
    useEffect(() => {
        let lastScrollY =
            window.scrollY;

        const handleScroll = () => {
            // nunca esconda com menu aberto
            if (menuAberto || keepVisible) {
                return;
            }

            const currentScrollY =
                window.scrollY;

            if (
                currentScrollY >
                lastScrollY &&
                currentScrollY > 150
            ) {
                setVisible(false);
            } else {
                setVisible(true);
            }

            lastScrollY =
                currentScrollY;
        };

        window.addEventListener(
            "scroll",
            handleScroll,
            {
                passive: true,
            }
        );

        return () => {
            window.removeEventListener(
                "scroll",
                handleScroll
            );
        };
    }, [menuAberto, keepVisible]);

    useEffect(() => {
        if (!menuAberto) {
            document.body.style.overflow = "";
            return;
        }

        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = "";
        };
    }, [menuAberto]);

    useEffect(() => {
        const handleEscape = (
            event: KeyboardEvent
        ) => {
            if (
                event.key === "Escape"
            ) {
                closeMenu();
            }
        };

        window.addEventListener(
            "keydown",
            handleEscape
        );

        return () => {
            window.removeEventListener(
                "keydown",
                handleEscape
            );
        };
    }, [closeMenu]);

    // garante que o header
    // nunca fique escondido
    // enquanto o menu estiver aberto
    useEffect(() => {
        if (menuAberto || keepVisible) {
            setVisible(true);
        }
    }, [menuAberto, keepVisible]);

    return {
        visible,
        menuAberto,
        setMenuAberto,
        openMenu,
        closeMenu,
        toggleMenu,
    };
}