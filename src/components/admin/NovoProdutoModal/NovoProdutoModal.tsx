"use client";

import { useState } from "react";

import { ProdutoForm } from "@/components/forms/ProdutoForm/ProdutoForm";
import { Modal } from "@/components/ui/Modal/Modal";
import type { ProdutoSalvoResumo } from "@/modules/produto/actions";

type Categoria = {
  id: string;
  nome: string;
};

type NovoProdutoModalProps = {
  categorias: Categoria[];
  /** Chamado depois de salvar (o modal já fechou), com o que foi salvo. */
  onSaved?: (produto?: ProdutoSalvoResumo) => void;
  /** Classe do botão — o visual é de quem usa (em Produtos, `newButton`). */
  className?: string;
};

/**
 * Botão "Novo produto" + o modal com o `ProdutoForm`, o mesmo cadastro
 * da aba Produtos. Existe como componente à parte pra Produtos e Balcão
 * abrirem exatamente o mesmo formulário.
 */
export function NovoProdutoModal({
  categorias,
  onSaved,
  className,
}: NovoProdutoModalProps) {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => setAberto(true)}
      >
        Novo produto
      </button>

      <Modal
        aberto={aberto}
        onClose={() => setAberto(false)}
      >
        <ProdutoForm
          key="novo-produto"
          categorias={categorias}
          onSaved={(produto) => {
            setAberto(false);
            onSaved?.(produto);
          }}
        />
      </Modal>
    </>
  );
}
