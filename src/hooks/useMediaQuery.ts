"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * `true` enquanto a media query casa. No servidor (e na hidratação) vale
 * `false`; o cliente corrige logo em seguida.
 */
export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (notificar: () => void) => {
      const lista = window.matchMedia(query);

      lista.addEventListener("change", notificar);

      return () =>
        lista.removeEventListener("change", notificar);
    },
    [query]
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  );
}
