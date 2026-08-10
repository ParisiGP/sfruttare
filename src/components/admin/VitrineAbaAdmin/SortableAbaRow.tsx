"use client";

import type { ReactNode } from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import styles from "./VitrineAbaAdmin.module.css";

type SortableAbaRowProps = {
  id: string;
  children: (props: {
    attributes: ReturnType<typeof useSortable>["attributes"];
    listeners?: ReturnType<typeof useSortable>["listeners"];
  }) => ReactNode;
};

export function SortableAbaRow({
  id,
  children,
}: SortableAbaRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.row} ${
        isDragging ? styles.dragging : ""
      }`}
    >
      {children({ attributes, listeners })}
    </div>
  );
}
