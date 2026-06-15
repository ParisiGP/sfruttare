"use client";

import { useState } from "react";

import { Modal } from "@/components/ui/Modal/Modal";

import { criarCategoria } from "@/modules/categoria/actions";
import { Button } from "@/components/ui/Button/Button";

export function CategoriaModal() {
    const [aberto, setAberto] =
        useState(false);

    return (
        <>
            <Button variant="primary"
                onClick={() =>
                    setAberto(true)
                }
            >
                Nova Categoria
            </Button>

            <Modal
                aberto={aberto}
                onClose={() =>
                    setAberto(false)
                }
            >
                <h2>
                    Nova Categoria
                </h2>

                <form action={criarCategoria}>
                    <input
                        type="text"
                        name="nome"
                        placeholder="Nome da categoria"
                    />

                    <div>

                        <Button variant="outline" onClick={() =>
                                setAberto(false)
                            }>
                            Cancelar
                        </Button>

                        <Button type="submit">
                            Confirmar
                        </Button>
                        
                    </div>
                </form>
            </Modal>
        </>
    );
}