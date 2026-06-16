"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { uploadProdutoImage } from "@/lib/cloudinary";
import { ProdutoService } from "./produto.service";
import type {
  ProdutoImagemInput,
  ProdutoStatus,
  ProdutoTipo,
} from "./produto.types";

export type ProdutoActionState = {
  ok: boolean;
  message: string;
};

const initialSuccess: ProdutoActionState = {
  ok: true,
  message: "",
};

const produtoService =
  new ProdutoService();

const maxImageSizeInBytes =
  10 * 1024 * 1024;

function getText(
  formData: FormData,
  key: string
) {
  const value =
    formData.get(key);

  return typeof value === "string"
    ? value
    : "";
}

function getTipo(formData: FormData): ProdutoTipo {
  return getText(formData, "tipo") === "NA_ETIQUETA"
    ? "NA_ETIQUETA"
    : "BRECHO";
}

function getStatus(
  formData: FormData
): ProdutoStatus {
  const status =
    getText(formData, "status");

  if (
    status === "RESERVADO" ||
    status === "VENDIDO"
  ) {
    return status;
  }

  return "DISPONIVEL";
}

function parseImageRows(
  formData: FormData
): ProdutoImagemInput[] {
  const urls =
    formData.getAll("imagemUrl");

  const ordens =
    formData.getAll("imagemOrdem");

  return urls
    .map((url, index) => ({
      url: String(url).trim(),

      // imagens antigas não possuem publicId
      publicId: "",

      ordem: Number(ordens[index] ?? index),
    }))
    .filter((imagem) => imagem.url.length > 0);
}

async function uploadFiles(
  formData: FormData,
  startOrder: number
) {
  const files =
    formData.getAll("imagemArquivo");

  const uploaded: ProdutoImagemInput[] = [];

  for (const file of files) {
    if (
      !(file instanceof File) ||
      file.size === 0
    ) {
      continue;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      throw new Error(
        "Envie apenas arquivos de imagem."
      );
    }

    if (
      file.size >
      maxImageSizeInBytes
    ) {
      throw new Error(
        "Envie imagens com ate 10 MB."
      );
    }

    const image =
      await uploadProdutoImage(
        file
      );

    if (image) {
      uploaded.push({
        url: image.url,
        publicId:
          image.publicId,
        ordem:
          startOrder +
          uploaded.length,
      });
    }
  }

  return uploaded;
}

    async function buildProdutoPayload(
      formData: FormData
    ) {
      const imagens =
        parseImageRows(formData);

      const imagensUpload =
        await uploadFiles(
          formData,
          imagens.length
        );

      return {
        nome: getText(formData, "nome"),
        descricao: getText(formData, "descricao"),
        marca: getText(formData, "marca"),
        tamanho: getText(formData, "tamanho"),
        preco: Number(getText(formData, "preco")),
        estoque: Number(getText(formData, "estoque")),
        categoriaId: getText(formData, "categoriaId"),
        tipo: getTipo(formData),
        status: getStatus(formData),
        imagens: [
          ...imagens,
          ...imagensUpload,
        ],
      };
    }

    function formatError(error: unknown) {
      if (error instanceof z.ZodError) {
        return error.issues
          .map((issue) => issue.message)
          .join(" ");
      }

      if (error instanceof Error) {
        return error.message;
      }

      return "Nao foi possivel concluir a acao.";
    }

    function handleError(
      action: string,
      error: unknown
    ) {
      console.error(
        `[produto:${action}]`,
        error
      );

      return {
        ok: false,
        message: formatError(error),
      };
    }

    function resolveFormData(
      stateOrFormData: ProdutoActionState | FormData,
      formData?: FormData
    ) {
      if (formData) {
        return formData;
      }

      return stateOrFormData as FormData;
    }

    export async function criarProduto(
      stateOrFormData: ProdutoActionState | FormData,
      formData?: FormData
    ): Promise<ProdutoActionState> {
      try {
        const data =
          resolveFormData(stateOrFormData, formData);

        await requireAdmin();
        await produtoService.criarProduto(
          await buildProdutoPayload(data)
        );
        revalidatePath("/admin/produtos");

        return {
          ...initialSuccess,
          message: "Produto criado com sucesso.",
        };
      } catch (error) {
        return handleError("criarProduto", error);
      }
    }

    export async function editarProduto(
      stateOrFormData: ProdutoActionState | FormData,
      formData?: FormData
    ): Promise<ProdutoActionState> {
      try {
        const data =
          resolveFormData(stateOrFormData, formData);

        await requireAdmin();

        await produtoService.editarProduto({
          id: getText(data, "id"),
          ...(await buildProdutoPayload(data)),
        });
        revalidatePath("/admin/produtos");

        return {
          ...initialSuccess,
          message: "Produto atualizado com sucesso.",
        };
      } catch (error) {
        return handleError("editarProduto", error);
      }
    }

    export async function excluirProduto(
      stateOrFormData: ProdutoActionState | FormData,
      formData?: FormData
    ): Promise<ProdutoActionState> {
      try {
        const data =
          resolveFormData(stateOrFormData, formData);

        await requireAdmin();
        await produtoService.excluirProduto(
          getText(data, "id")
        );
        revalidatePath("/admin/produtos");

        return {
          ...initialSuccess,
          message: "Produto excluido com sucesso.",
        };
      } catch (error) {
        return handleError("excluirProduto", error);
      }
    }

    export async function excluirProdutoForm(
      formData: FormData
    ) {
      await excluirProduto(initialSuccess, formData);
    }

    export async function alterarStatusProduto(
      stateOrFormData: ProdutoActionState | FormData,
      formData?: FormData
    ): Promise<ProdutoActionState> {
      try {
        const data =
          resolveFormData(stateOrFormData, formData);

        await requireAdmin();
        await produtoService.alterarStatusProduto(
          getText(data, "id"),
          getStatus(data)
        );
        revalidatePath("/admin/produtos");

        return {
          ...initialSuccess,
          message: "Status atualizado com sucesso.",
        };
      } catch (error) {
        return handleError("alterarStatusProduto", error);
      }
    }

    export async function alterarStatusProdutoForm(
      formData: FormData
    ) {
      await alterarStatusProduto(
        initialSuccess,
        formData
      );
    }

    export async function uploadImagemProduto(
      stateOrFormData: ProdutoActionState | FormData,
      formData?: FormData
    ): Promise<ProdutoActionState> {
      try {
        const data =
          resolveFormData(stateOrFormData, formData);

        await requireAdmin();
        await uploadFiles(data, 0);

        return {
          ...initialSuccess,
          message: "Imagem enviada com sucesso.",
        };
      } catch (error) {
        return handleError("uploadImagemProduto", error);
      }
    }
