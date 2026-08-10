"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  DndContext,
  PointerSensor,
  TouchSensor,
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

import { editarAba, reordenarAbas } from "@/modules/vitrineAba/actions";
import type { VitrineAbaAdminItem } from "@/modules/vitrineAba/vitrineAba.types";

import { SortableAbaRow } from "./SortableAbaRow";
import { VitrineAbaModal } from "@/components/admin/VitrineAbaModal/VitrineAbaModal";
import { VitrineAbaDeleteModal } from "@/components/admin/VitrineAbaDeleteModal/VitrineAbaDeleteModal";
import { VitrineAbaProdutosModal } from "@/components/admin/VitrineAbaProdutosModal/VitrineAbaProdutosModal";

import styles from "./VitrineAbaAdmin.module.css";

type VitrineAbaAdminProps = {
  abas: VitrineAbaAdminItem[];
};

export function VitrineAbaAdmin({
  abas,
}: VitrineAbaAdminProps) {
  const router = useRouter();

  const [itens, setItens] =
    useState(abas);

  useEffect(() => {
    setItens(abas);
  }, [abas]);

  const [modalAberto, setModalAberto] =
    useState(false);

  const [abaEmEdicao, setAbaEmEdicao] =
    useState<VitrineAbaAdminItem | null>(null);

  const [abaParaExcluir, setAbaParaExcluir] =
    useState<VitrineAbaAdminItem | null>(null);

  const [abaProdutos, setAbaProdutos] =
    useState<VitrineAbaAdminItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    })
  );

  function abrirNovaAba() {
    setAbaEmEdicao(null);
    setModalAberto(true);
  }

  function abrirEdicao(aba: VitrineAbaAdminItem) {
    setAbaEmEdicao(aba);
    setModalAberto(true);
  }

  async function alternarAtivo(
    aba: VitrineAbaAdminItem
  ) {
    const formData = new FormData();

    formData.set("id", aba.id);
    formData.set("nome", aba.nome);

    if (!aba.ativo) {
      formData.set("ativo", "on");
    }

    const resultado = await editarAba(
      {
        ok: true,
        message: "",
      },
      formData
    );

    if (!resultado.ok) {
      alert(resultado.message);
      return;
    }

    router.refresh();
  }

  async function handleDragEnd(
    event: DragEndEvent
  ) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = itens.findIndex(
      (item) => item.id === active.id
    );

    const newIndex = itens.findIndex(
      (item) => item.id === over.id
    );

    const novosItens = arrayMove(
      itens,
      oldIndex,
      newIndex
    );

    setItens(novosItens);

    const resultado = await reordenarAbas(
      novosItens.map((item, index) => ({
        id: item.id,
        ordem: index,
      }))
    );

    if (!resultado.ok) {
      alert(resultado.message);
      setItens(itens);
      return;
    }

    router.refresh();
  }

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Vitrine</p>

          <h1>Abas da loja</h1>

          <p className={styles.description}>
            Organize as abas exibidas na loja pública e
            escolha quais produtos aparecem em cada uma.
          </p>
        </div>

        <button
          type="button"
          className={styles.newButton}
          onClick={abrirNovaAba}
        >
          Nova aba
        </button>
      </header>

      {itens.length === 0 ? (
        <div className={styles.empty}>
          <strong>Nenhuma aba cadastrada</strong>
          <span>
            Crie a primeira aba para começar a montar a
            vitrine pública.
          </span>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={itens.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className={styles.list}>
              {itens.map((aba) => (
                <SortableAbaRow key={aba.id} id={aba.id}>
                  {({ attributes, listeners }) => (
                    <>
                      <span
                        className={styles.dragHandle}
                        {...attributes}
                        {...listeners}
                      >
                        ☰
                      </span>

                      <span className={styles.nome}>
                        {aba.nome}
                      </span>

                      <span className={styles.total}>
                        {aba.totalProdutos} produto(s)
                      </span>

                      <button
                        type="button"
                        className={`${styles.statusBadge} ${
                          aba.ativo
                            ? styles.ativo
                            : styles.inativo
                        }`}
                        onClick={() =>
                          alternarAtivo(aba)
                        }
                      >
                        {aba.ativo ? "Ativa" : "Inativa"}
                      </button>

                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          onClick={() =>
                            setAbaProdutos(aba)
                          }
                        >
                          Produtos
                        </button>

                        <button
                          type="button"
                          className={styles.secondaryButton}
                          onClick={() =>
                            abrirEdicao(aba)
                          }
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className={styles.deleteButton}
                          onClick={() =>
                            setAbaParaExcluir(aba)
                          }
                        >
                          Excluir
                        </button>
                      </div>
                    </>
                  )}
                </SortableAbaRow>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <VitrineAbaModal
        aberto={modalAberto}
        aba={abaEmEdicao}
        onClose={() => setModalAberto(false)}
      />

      <VitrineAbaDeleteModal
        aba={abaParaExcluir}
        aberto={abaParaExcluir !== null}
        onClose={() => setAbaParaExcluir(null)}
      />

      <VitrineAbaProdutosModal
        aba={abaProdutos}
        aberto={abaProdutos !== null}
        onClose={() => setAbaProdutos(null)}
      />
    </div>
  );
}
