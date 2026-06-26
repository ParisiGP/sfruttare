"use client";

import { useEffect, useState } from "react";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";

import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

import { SortableRow } from "./SortableRow";

import styles from "./ProdutoTable.module.css";

type ProdutoTableItem = {
  id: string;
  nome: string;
  descricao?: string | null;
  categoria: {
    nome: string;
  };
  tamanho?: string | null;
  preco: number;
  marca?: string | null;
  cor?: string | null;
  referencia?: string | null;
  estoque?: number | null;
  tipo: string;
};

type ProdutoTableProps = {
  produtos: ProdutoTableItem[];
  modoOrdenacao?: boolean;
};

export function ProdutoTable({
  produtos,
  modoOrdenacao = false,
}: ProdutoTableProps) {
  const [itens, setItens] =
    useState<ProdutoTableItem[]>(
      produtos
    );

  useEffect(() => {
    setItens(produtos);
  }, [produtos]);

  const sensors = useSensors(
    useSensor(PointerSensor)
  );

  function handleDragEnd(
    event: DragEndEvent
  ) {
    const { active, over } = event;

    if (!over) {
      return;
    }

    if (active.id === over.id) {
      return;
    }

    setItens((items) => {
      const oldIndex =
        items.findIndex(
          (item) =>
            item.id === active.id
        );

      const newIndex =
        items.findIndex(
          (item) =>
            item.id === over.id
        );

      return arrayMove(
        items,
        oldIndex,
        newIndex
      );
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={
        closestCenter
      }
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={itens.map(
          (item) => item.id
        )}
        strategy={
          verticalListSortingStrategy
        }
      >
        <div className={styles.tableWrap}>
          <table
            className={styles.table}
          >
            <thead>
              <tr>
                {modoOrdenacao && (
                  <>
                    <th
                      className={
                        styles.dragColumn
                      }
                    />

                    <th
                      className={
                        styles.orderColumn
                      }
                    >
                      Ordem
                    </th>
                  </>
                )}

                <th>Nome</th>
                <th>Categoria</th>
                <th>Tamanho</th>
                <th>Preço</th>
                <th>Marca</th>
                <th>Referência</th>
                <th>Estoque</th>
                <th>Tipo</th>
              </tr>
            </thead>

            <tbody>
              {itens.map((produto, index) => (
                <SortableRow
                  key={produto.id}
                  id={produto.id}
                >
                  {({
                    attributes,
                    listeners,
                  }) => (
                    <>
                      {modoOrdenacao && (
                        <>
                          <td
                            className={
                              styles.dragHandle
                            }
                            {...attributes}
                            {...listeners}
                          >
                            ☰
                          </td>

                          <td>
                            <input
                              type="number"
                              min={1}
                              max={itens.length}
                              value={index + 1}
                              className={
                                styles.orderInput
                              }
                              readOnly
                            />
                          </td>
                        </>
                      )}

                      <td>{produto.nome}</td>

                      <td>
                        {produto.categoria.nome}
                      </td>

                      <td>
                        {produto.tamanho ?? "-"}
                      </td>

                      <td
                        className={
                          styles.price
                        }
                      >
                        {Number(
                          produto.preco
                        ).toLocaleString(
                          "pt-BR",
                          {
                            style: "currency",
                            currency: "BRL",
                          }
                        )}
                      </td>

                      <td>
                        {produto.marca ?? "-"}
                      </td>

                      <td>
                        {produto.referencia ??
                          "-"}
                      </td>

                      <td
                        className={
                          styles.stock
                        }
                      >
                        {produto.estoque ?? 0}
                      </td>

                      <td>{produto.tipo}</td>
                    </>
                  )}
                </SortableRow>
              ))}
            </tbody>
          </table>
        </div>
      </SortableContext>
    </DndContext >
  );
}