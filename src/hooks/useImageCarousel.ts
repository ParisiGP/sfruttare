"use client";

import {
  useEffect,
  useRef,
  useState,
  type TouchEvent,
} from "react";

const MIN_SWIPE_DISTANCE = 50;

export function useImageCarousel(
  totalImagens: number,
  options?: {
    autoPlayMs?: number;
  }
) {
  const [imagemAtual, setImagemAtual] =
    useState(0);

  const touchStart =
    useRef<number | null>(null);

  const touchEnd =
    useRef<number | null>(null);

  function proximaImagem() {
    setImagemAtual((current) =>
      current + 1 >= totalImagens
        ? 0
        : current + 1
    );
  }

  function imagemAnterior() {
    setImagemAtual((current) =>
      current === 0
        ? totalImagens - 1
        : current - 1
    );
  }

  function handleTouchStart(
    event: TouchEvent
  ) {
    touchStart.current =
      event.targetTouches[0].clientX;
  }

  function handleTouchMove(
    event: TouchEvent
  ) {
    touchEnd.current =
      event.targetTouches[0].clientX;
  }

  function handleTouchEnd() {
    if (
      touchStart.current === null ||
      touchEnd.current === null
    ) {
      return;
    }

    const distance =
      touchStart.current - touchEnd.current;

    if (distance > MIN_SWIPE_DISTANCE) {
      proximaImagem();
    }

    if (distance < -MIN_SWIPE_DISTANCE) {
      imagemAnterior();
    }

    touchStart.current = null;
    touchEnd.current = null;
  }

  useEffect(() => {
    if (
      !options?.autoPlayMs ||
      totalImagens <= 1
    ) {
      return;
    }

    const interval = setInterval(() => {
      proximaImagem();
    }, options.autoPlayMs);

    return () => clearInterval(interval);
  }, [totalImagens, options?.autoPlayMs]);

  return {
    imagemAtual,
    setImagemAtual,
    proximaImagem,
    imagemAnterior,
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}
