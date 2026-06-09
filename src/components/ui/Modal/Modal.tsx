"use client";

import { ReactNode } from "react";
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