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

import type {
  ProdutoAdminItem,
} from "@/modules/produto/produto.types"


type ProdutoTableProps = {
  produtos: ProdutoAdminItem[];
  modoOrdenacao?: boolean;
  onOrderChange?: (
    produtos: ProdutoAdminItem[]
  ) => void;
};



export function ProdutoTable({
  produtos,
  modoOrdenacao = false,
  onOrderChange,
}: ProdutoTableProps) {
  const [itens, setItens] =
    useState<ProdutoAdminItem[]>(
      produtos
    );

  const [
    ordensDigitadas,
    setOrdensDigitadas,
  ] = useState<
    Record<string, string>
  >({});

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

    const oldIndex =
      itens.findIndex(
        (item) =>
          item.id === active.id
      );

    const newIndex =
      itens.findIndex(
        (item) =>
          item.id === over.id
      );

    const novosItens =
      arrayMove(
        itens,
        oldIndex,
        newIndex
      );

    setItens(novosItens);

    onOrderChange?.(
      novosItens
    );
  }



  function moverParaPosicao(
    produtoId: string,
    novaPosicao: number
  ) {
    const novaIndex =
      novaPosicao - 1;

    const oldIndex =
      itens.findIndex(
        (item) =>
          item.id === produtoId
      );

    if (oldIndex === -1) {
      return;
    }

    const newIndex =
      Math.max(
        0,
        Math.min(
          novaPosicao - 1,
          itens.length - 1
        )
      );

    if (oldIndex === newIndex) {
      return;
    }

    const novosItens =
      arrayMove(
        itens,
        oldIndex,
        newIndex
      );

    setItens(novosItens);

    onOrderChange?.(
      novosItens
    );
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
                              className={styles.orderInput}
                              value={
                                ordensDigitadas[
                                produto.id
                                ] ??
                                String(index + 1)
                              }
                              onChange={(event) => {
                                const valor =
                                  event.target.value;

                                setOrdensDigitadas(
                                  (prev) => ({
                                    ...prev,
                                    [produto.id]: valor,
                                  })
                                );
                              }}
                              onBlur={(event) => {
                                const valor =
                                  Number(
                                    event.target.value
                                  );

                                if (
                                  Number.isNaN(valor)
                                ) {
                                  setOrdensDigitadas(
                                    {}
                                  );
                                  return;
                                }

                                moverParaPosicao(
                                  produto.id,
                                  valor
                                );

                                setOrdensDigitadas(
                                  {}
                                );
                              }}
                              onKeyDown={(event) => {
                                if (
                                  event.key === "Enter"
                                ) {
                                  event.currentTarget.blur();
                                }
                              }}
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