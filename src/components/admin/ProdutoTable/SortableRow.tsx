"use client";

import type {
  ReactNode,
} from "react";

import {
  useSortable,
} from "@dnd-kit/sortable";

import {
  CSS,
} from "@dnd-kit/utilities";

import styles from "./ProdutoTable.module.css";

type SortableRowProps = {
  id: string;
  children: (
    props: {
      attributes: ReturnType<
        typeof useSortable
      >["attributes"];
      listeners?: ReturnType<
        typeof useSortable
      >["listeners"];
    }
  ) => ReactNode;
};

export function SortableRow({
  id,
  children,
}: SortableRowProps) {
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
    transform:
      CSS.Transform.toString(
        transform
      ),
    transition,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={
        isDragging
          ? styles.dragging
          : undefined
      }
    >
      {children({
        attributes,
        listeners,
      })}
    </tr>
  );
}