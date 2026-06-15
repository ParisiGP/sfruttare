"use client";

import { useState } from "react";

import { Button } from "../../ui/Button/Button";
import { CategoriaDeleteModal } from "../CategoriaDeleteModal/CategoriaDeleteModal";
import { CategoriaEditModal } from "../CategoriaEditModal/CategoriaEditModal";

import styles from "./CategoriaCard.module.css";

type CategoriaCardProps = {
    categoria: {
        id: string;
        nome: string;

        produtos: {
            id: string;
            nome: string;
        }[];

        _count: {
            produtos: number;
        };
    };
};

export function CategoriaCard({
    categoria,
}: CategoriaCardProps) {
    const [deleteModalOpen,
        setDeleteModalOpen] =
        useState(false);

    const [editModalOpen,
        setEditModalOpen] =
        useState(false);

    return (
        <>
            <article className={styles.card}>
                <h3 className={styles.title}>
                    {categoria.nome}
                </h3>

                <div className={styles.preview}>
                    {categoria.produtos.map(
                        (produto) => (
                            <span key={produto.id}>
                                • {produto.nome}
                            </span>
                        )
                    )}

                    {categoria._count.produtos >
                        categoria.produtos.length && (
                            <small>
                                +
                                {categoria._count.produtos -
                                    categoria.produtos.length}
                                {" "}
                                produtos
                            </small>
                        )}
                </div>


                <div className={styles.actions}>
                    <Button
                        variant="primary"
                        onClick={() =>
                            setEditModalOpen(true)
                        }
                    >
                        Editar
                    </Button>

                    <Button
                        variant="danger"
                        onClick={() =>
                            setDeleteModalOpen(true)
                        }
                    >
                        Excluir
                    </Button>
                </div>
            </article>

            <CategoriaDeleteModal
                categoria={categoria}
                aberto={deleteModalOpen}
                onClose={() =>
                    setDeleteModalOpen(false)
                }
            />

            <CategoriaEditModal
                categoria={categoria}
                aberto={editModalOpen}
                onClose={() =>
                    setEditModalOpen(false)
                }
            />
        </>
    );
}