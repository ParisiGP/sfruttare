"use client";

import { ReactNode, useEffect, useRef } from "react";
import styles from "./Modal.module.css";

type ModalProps = {
  aberto: boolean;
  onClose: () => void;
  children: ReactNode;
};


export function Modal({
  aberto,
  onClose,
  children,
}: ModalProps) {
  const closeButtonRef =
    useRef<HTMLButtonElement>(null);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!aberto) {
      document.body.style.overflow = "";

      return;
    }

    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCloseRef.current();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [aberto]);

  if (!aberto) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className={styles.content}>
         <button
          ref={closeButtonRef}
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Fechar modal"
        >
          ×
        </button>
          {children}

        </div>
      </div>
    </div>
  );
}