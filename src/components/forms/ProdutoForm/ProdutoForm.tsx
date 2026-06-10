"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";

import {
  criarProduto,
  editarProduto,
  type ProdutoActionState,
} from "@/modules/produto/actions";
import type { ProdutoAdminItem } from "@/modules/produto/produto.types";

import styles from "./ProdutoForm.module.css";

type Categoria = {
  id: string;
  nome: string;
};

type ProdutoFormProps = {
  categorias: Categoria[];
  produto?: ProdutoAdminItem;
  onSaved?: () => void;
};

type ImageRow = {
  key: string;
  url: string;
  ordem: number;
};

const initialState: ProdutoActionState = {
  ok: false,
  message: "",
};

export function ProdutoForm({
  categorias,
  produto,
  onSaved,
}: ProdutoFormProps) {
  const action =
    produto ? editarProduto : criarProduto;

  const [state, formAction, pending] =
    useActionState(action, initialState);

  const initialImages =
    useMemo(
      () =>
        produto?.imagens.map((imagem) => ({
          key: imagem.id,
          url: imagem.url,
          ordem: imagem.ordem,
        })) ?? [],
      [produto]
    );

  const [imageRows, setImageRows] =
    useState<ImageRow[]>(() => initialImages);

  const [filePreviews, setFilePreviews] =
    useState<string[]>([]);

  useEffect(() => {
    if (state.ok && state.message && onSaved) {
      onSaved();
    }
  }, [state, onSaved]);

  function addImageRow() {
    setImageRows((rows) => [
      ...rows,
      {
        key: crypto.randomUUID(),
        url: "",
        ordem: rows.length,
      },
    ]);
  }

  function updateImageRow(
    key: string,
    field: "url" | "ordem",
    value: string
  ) {
    setImageRows((rows) =>
      rows.map((row) =>
        row.key === key
          ? {
              ...row,
              [field]:
                field === "ordem"
                  ? Number(value)
                  : value,
            }
          : row
      )
    );
  }

  function removeImageRow(key: string) {
    setImageRows((rows) =>
      rows.filter((row) => row.key !== key)
    );
  }

  function handleFilePreview(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const files =
      Array.from(event.target.files ?? []);

    setFilePreviews((current) => {
      current.forEach((url) =>
        URL.revokeObjectURL(url)
      );

      return files.map((file) =>
        URL.createObjectURL(file)
      );
    });
  }

  return (
    <form
      className={styles.form}
      action={formAction}
      encType="multipart/form-data"
    >
      <div className={styles.heading}>
        <div>
          <h2>
            {produto
              ? "Editar produto"
              : "Novo produto"}
          </h2>
          <p>
            Dados comerciais, estoque, imagens e
            publicacao do item.
          </p>
        </div>
      </div>

      {produto && (
        <input
          type="hidden"
          name="id"
          value={produto.id}
        />
      )}

      {state.message && (
        <p
          className={
            state.ok
              ? styles.success
              : styles.error
          }
        >
          {state.message}
        </p>
      )}

      <section className={styles.section}>
        <h3>Dados</h3>

        <div className={styles.grid}>
          <Field label="Nome" required>
            <input
              name="nome"
              type="text"
              defaultValue={produto?.nome}
              required
            />
          </Field>

          <Field label="Marca">
            <input
              name="marca"
              type="text"
              defaultValue={produto?.marca}
            />
          </Field>

          <Field label="Tamanho">
            <input
              name="tamanho"
              type="text"
              defaultValue={produto?.tamanho}
            />
          </Field>

          <Field label="Categoria" required>
            <select
              name="categoriaId"
              defaultValue={produto?.categoriaId}
              required
            >
              <option value="" disabled>
                Selecione
              </option>
              {categorias.map((categoria) => (
                <option
                  key={categoria.id}
                  value={categoria.id}
                >
                  {categoria.nome}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Descricao">
          <textarea
            name="descricao"
            defaultValue={produto?.descricao}
          />
        </Field>
      </section>

      <section className={styles.section}>
        <h3>Preco e estoque</h3>

        <div className={styles.grid}>
          <Field label="Preco" required>
            <input
              name="preco"
              type="number"
              min="0"
              step="0.01"
              defaultValue={produto?.preco}
              required
            />
          </Field>

          <Field label="Estoque" required>
            <input
              name="estoque"
              type="number"
              min="0"
              defaultValue={produto?.estoque ?? 1}
              required
            />
          </Field>

          <Field label="Tipo" required>
            <select
              name="tipo"
              defaultValue={produto?.tipo ?? "BRECHO"}
              required
            >
              <option value="BRECHO">Brecho</option>
              <option value="NA_ETIQUETA">
                Na etiqueta
              </option>
            </select>
          </Field>

          <Field label="Status" required>
            <select
              name="status"
              defaultValue={
                produto?.status ?? "DISPONIVEL"
              }
              required
            >
              <option value="DISPONIVEL">
                Disponivel
              </option>
              <option value="RESERVADO">
                Reservado
              </option>
              <option value="VENDIDO">
                Vendido
              </option>
            </select>
          </Field>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>Imagens</h3>

          <button
            type="button"
            className={styles.secondaryButton}
            onClick={addImageRow}
          >
            Adicionar URL
          </button>
        </div>

        <Field label="Upload Cloudinary">
          <input
            name="imagemArquivo"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilePreview}
          />
        </Field>

        {filePreviews.length > 0 && (
          <div className={styles.previewGrid}>
            {filePreviews.map((url) => (
              <img
                key={url}
                src={url}
                alt="Preview do upload"
              />
            ))}
          </div>
        )}

        {imageRows.map((row) => (
          <div
            key={row.key}
            className={styles.imageRow}
          >
            <input
              name="imagemUrl"
              type="url"
              value={row.url}
              placeholder="https://res.cloudinary.com/..."
              onChange={(event) =>
                updateImageRow(
                  row.key,
                  "url",
                  event.target.value
                )
              }
            />

            <input
              name="imagemOrdem"
              type="number"
              min="0"
              value={row.ordem}
              aria-label="Ordem da imagem"
              onChange={(event) =>
                updateImageRow(
                  row.key,
                  "ordem",
                  event.target.value
                )
              }
            />

            <button
              type="button"
              onClick={() =>
                removeImageRow(row.key)
              }
            >
              Remover
            </button>
          </div>
        ))}
      </section>

      <div className={styles.actions}>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={pending}
        >
          {pending
            ? "Salvando..."
            : "Salvar produto"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className={styles.field}>
      <span>
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}
