"use client";

import { useRouter } from "next/navigation";
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

const maxImageSizeInBytes =
  10 * 1024 * 1024;

export function ProdutoForm({
  categorias,
  produto,
  onSaved,
}: ProdutoFormProps) {
  const router =
    useRouter();

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

  const [clientError, setClientError] =
    useState("");

  const [formValues, setFormValues] =
    useState(() => ({
      nome: produto?.nome ?? "",
      marca: produto?.marca ?? "",
      tamanho: produto?.tamanho ?? "",
      descricao:
        produto?.descricao ?? "",
      categoriaId:
        produto?.categoriaId ?? "",
      preco:
        produto?.preco?.toString() ??
        "",
      estoque:
        String(
          produto?.estoque ?? 1
        ),
      tipo:
        produto?.tipo ??
        "BRECHO",
      status:
        produto?.status ??
        "DISPONIVEL",
    }));

  useEffect(() => {
    if (state.ok && state.message) {
      router.refresh();
      onSaved?.();
    }
  }, [state, onSaved, router]);

  useEffect(() => {
    return () => {
      filePreviews.forEach((url) =>
        URL.revokeObjectURL(url)
      );
    };
  }, [filePreviews]);

  function updateField(
    field: keyof typeof formValues,
    value: string
  ) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

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

    const invalidFile =
      files.find(
        (file) =>
          !file.type.startsWith("image/") ||
          file.size > maxImageSizeInBytes
      );

    if (invalidFile) {
      event.target.value = "";
      setClientError(
        "Envie apenas imagens com ate 10 MB."
      );
      setFilePreviews((current) => {
        current.forEach((url) =>
          URL.revokeObjectURL(url)
        );

        return [];
      });
      return;
    }

    setClientError("");

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

      {clientError && (
        <p className={styles.error}>
          {clientError}
        </p>
      )}

      <section className={styles.section}>
        <h3>Dados</h3>

        <div className={styles.grid}>
          <Field label="Nome" required>
            <input
              name="nome"
              type="text"
              value={formValues.nome}
              required
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  nome:
                    event.target.value,
                }))
              }
            />
          </Field>

          <Field label="Marca">
            <input
              name="marca"
              type="text"
              value={formValues.marca}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  marca:
                    event.target.value,
                }))
              }
            />
          </Field>

          <Field label="Tamanho">
            <input
              name="tamanho"
              type="text"
              value={formValues.tamanho}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  tamanho:
                    event.target.value,
                }))
              }
            />
          </Field>

          <Field label="Categoria" required>
            <select
              name="categoriaId"
              required
              value={formValues.categoriaId}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  categoriaId:
                    event.target.value,
                }))
              }
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
            value={
              formValues.descricao
            }
            onChange={(event) =>
              setFormValues(
                (current) => ({
                  ...current,
                  descricao:
                    event.target.value,
                })
              )
            }
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
              value={formValues.preco}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  preco:
                    event.target.value,
                }))
              }
              required
            />
          </Field>

          <Field label="Estoque" required>
            <input
              name="estoque"
              type="number"
              min="0"
              value={formValues.estoque}
              onChange={(event) =>
                updateField(
                  "estoque",
                  event.target.value
                )
              }
              required
            />
          </Field>

          <Field label="Tipo" required>
            <select
              name="tipo"
              value={formValues.tipo}
              onChange={(event) =>
                updateField(
                  "tipo",
                  event.target.value
                )
              }
              required
            >
              <option value="BRECHO">
                Brecho
              </option>
              <option value="NA_ETIQUETA">
                Na etiqueta
              </option>
            </select>
          </Field>

          <Field label="Status" required>
            <select
              name="status"
              value={formValues.status}
              onChange={(event) =>
                updateField(
                  "status",
                  event.target.value
                )
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
