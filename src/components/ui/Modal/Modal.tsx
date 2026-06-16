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
    <div
      className={styles.overlay}
      onClick={onClose}
    >
      <div
        className={styles.modal}
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        {children}
      </div>
    </div>
  );
}