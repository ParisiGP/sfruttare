"use client";

import { useEffect, useMemo, useState } from "react";
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

import { Modal } from "@/components/ui/Modal/Modal";
import { Button } from "@/components/ui/Button/Button";
import { Input } from "@/components/ui/Input/Input";

import {
  atualizarProdutosDaAba,
  carregarProdutosParaSelecao,
} from "@/modules/vitrineAba/actions";
import type { VitrineAbaAdminItem } from "@/modules/vitrineAba/vitrineAba.types";
import type { ProdutoAdminItem } from "@/modules/produto/produto.types";

import { SortableProdutoItem } from "./SortableProdutoItem";

import styles from "./VitrineAbaProdutosModal.module.css";

type VitrineAbaProdutosModalProps = {
  aberto: boolean;
  aba: VitrineAbaAdminItem | null;
  onClose: () => void;
};

export function VitrineAbaProdutosModal({
  aberto,
  aba,
  onClose,
}: VitrineAbaProdutosModalProps) {
  const router = useRouter();

  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [produtos, setProdutos] = useState<ProdutoAdminItem[]>([]);
  const [ordemSelecionados, setOrdemSelecionados] = useState<string[]>([]);

  useEffect(() => {
    if (!aberto || !aba) {
      return;
    }

    let cancelado = false;

    setCarregando(true);
    setErro("");
    setBusca("");

    carregarProdutosParaSelecao(aba.id).then((resultado) => {
      if (cancelado) {
        return;
      }

      if (!resultado.ok) {
        setErro(resultado.message);
        setCarregando(false);
        return;
      }

      setProdutos(resultado.produtos);
      setOrdemSelecionados(resultado.selecionados);
      setCarregando(false);
    });

    return () => {
      cancelado = true;
    };
  }, [aberto, aba]);

  const produtosPorId = useMemo(() => {
    const mapa = new Map<string, ProdutoAdminItem>();

    produtos.forEach((produto) =>
      mapa.set(produto.id, produto)
    );

    return mapa;
  }, [produtos]);

  const selecionadosSet = useMemo(
    () => new Set(ordemSelecionados),
    [ordemSelecionados]
  );

  const produtosNaAba = useMemo(
    () =>
      ordemSelecionados
        .map((id) => produtosPorId.get(id))
        .filter(
          (produto): produto is ProdutoAdminItem =>
            Boolean(produto)
        ),
    [ordemSelecionados, produtosPorId]
  );

  const produtosDisponiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return produtos.filter((produto) => {
      if (selecionadosSet.has(produto.id)) {
        return false;
      }

      if (!termo) {
        return true;
      }

      return `${produto.nome} ${produto.referencia}`
        .toLowerCase()
        .includes(termo);
    });
  }, [produtos, selecionadosSet, busca]);

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

  function adicionarProduto(produtoId: string) {
    setOrdemSelecionados((atual) => [
      ...atual,
      produtoId,
    ]);
  }

  function removerProduto(produtoId: string) {
    setOrdemSelecionados((atual) =>
      atual.filter((id) => id !== produtoId)
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setOrdemSelecionados((atual) => {
      const oldIndex = atual.indexOf(String(active.id));
      const newIndex = atual.indexOf(String(over.id));

      if (oldIndex === -1 || newIndex === -1) {
        return atual;
      }

      return arrayMove(atual, oldIndex, newIndex);
    });
  }

  async function salvar() {
    if (!aba) {
      return;
    }

    setSalvando(true);

    const resultado = await atualizarProdutosDaAba(
      aba.id,
      ordemSelecionados
    );

    setSalvando(false);

    if (!resultado.ok) {
      setErro(resultado.message);
      return;
    }

    router.refresh();
    onClose();
  }

  if (!aba) {
    return null;
  }

  return (
    <Modal aberto={aberto} onClose={onClose}>
      <div className={styles.content}>
        <h2 className={styles.title}>
          Produtos em &quot;{aba.nome}&quot;
        </h2>

        <p className={styles.description}>
          Arraste para definir a ordem de exibição na
          loja. Use a busca abaixo para adicionar ou
          remover produtos da aba.
        </p>

        {erro && <p className={styles.error}>{erro}</p>}

        {carregando ? (
          <p className={styles.description}>
            Carregando produtos...
          </p>
        ) : (
          <>
            <div className={styles.ordenarSection}>
              <p className={styles.contador}>
                {produtosNaAba.length} produto(s) na aba
              </p>

              {produtosNaAba.length === 0 ? (
                <p className={styles.description}>
                  Nenhum produto adicionado ainda.
                </p>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={ordemSelecionados}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className={styles.ordenarLista}>
                      {produtosNaAba.map((produto) => (
                        <SortableProdutoItem
                          key={produto.id}
                          id={produto.id}
                        >
                          {({ attributes, listeners }) => (
                            <>
                              <span
                                className={styles.dragHandle}
                                {...attributes}
                                {...listeners}
                              >
                                ☰
                              </span>

                              <span className={styles.itemNome}>
                                {produto.nome}
                              </span>

                              <button
                                type="button"
                                className={styles.removeButton}
                                onClick={() =>
                                  removerProduto(produto.id)
                                }
                                aria-label={`Remover ${produto.nome} da aba`}
                              >
                                ✕
                              </button>
                            </>
                          )}
                        </SortableProdutoItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>

            <Input
              type="search"
              placeholder="Buscar por nome ou referência"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
            />

            {produtosDisponiveis.length === 0 ? (
              <p className={styles.description}>
                Nenhum produto disponível para adicionar.
              </p>
            ) : (
              <div className={styles.lista}>
                {produtosDisponiveis.map((produto) => (
                  <button
                    type="button"
                    key={produto.id}
                    className={styles.item}
                    onClick={() =>
                      adicionarProduto(produto.id)
                    }
                  >
                    <span className={styles.addIcon}>+</span>

                    <span className={styles.itemNome}>
                      {produto.nome}
                    </span>

                    {produto.referencia && (
                      <span className={styles.itemReferencia}>
                        {produto.referencia}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        <div className={styles.actions}>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={salvar}
            disabled={salvando || carregando}
          >
            {salvando ? "Salvando..." : "Salvar produtos"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
