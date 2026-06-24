"use client";

import { ReactNode, useEffect } from "react";
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

  useEffect(() => {
    if (!aberto) {
      document.body.style.overflow = "";

      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
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