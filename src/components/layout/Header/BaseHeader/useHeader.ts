"use client";

import {
    useCallback,
    useEffect,
    useState,
} from "react";

export function useHeader() {
    const [visible, setVisible] =
        useState(true);

    const [menuAberto, setMenuAberto] =
        useState(false);

    const closeMenu = useCallback(() => {
        console.log("Close Menu");
        setMenuAberto(false);
    }, []);

    const openMenu = useCallback(() => {
        setMenuAberto(true);
    }, []);

    const toggleMenu = useCallback(() => {
        console.log("toggle menu");
        setMenuAberto((aberto) => !aberto);
    }, []);

    // Esconde o header ao descer
    useEffect(() => {
        let lastScrollY =
            window.scrollY;

        const handleScroll = () => {
            // nunca esconda com menu aberto
            if (menuAberto) {
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
    }, [menuAberto]);

    useEffect(() => {
  document.documentElement.classList.toggle(
    "menu-open",
    menuAberto
  );

  document.body.classList.toggle(
    "menu-open",
    menuAberto
  );

  return () => {
    document.documentElement.classList.remove(
      "menu-open"
    );

    document.body.classList.remove(
      "menu-open"
    );
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
        if (menuAberto) {
            setVisible(true);
        }
    }, [menuAberto]);

    return {
        visible,
        menuAberto,
        setMenuAberto,
        openMenu,
        closeMenu,
        toggleMenu,
    };
}