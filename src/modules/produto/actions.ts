"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { uploadProdutoImage } from "@/lib/cloudinary";
import { ProdutoService } from "./produto.service";
import type {
  ProdutoImagem,
  ProdutoImagemInput,
  ProdutoImportAdjustment,
  ProdutoImportPreview,
  ProdutoStatus,
  ProdutoTipo,
} from "./produto.types";

export type ProdutoActionState = {
  ok: boolean;
  message: string;
};

export type ProdutoImportActionState =
  ProdutoActionState & {
    preview?: ProdutoImportPreview;
    importados?: number;
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

function getFile(
  formData: FormData,
  key: string
) {
  const file =
    formData.get(key);

  if (!(file instanceof File)) {
    throw new Error("Selecione uma planilha para importar.");
  }

  return file;
}

function getImportAdjustments(
  formData: FormData
): ProdutoImportAdjustment[] {
  const raw =
    getText(formData, "ajustes");

  if (!raw) {
    return [];
  }

  const parsed =
    JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error("Ajustes da importacao invalidos.");
  }

  return parsed as ProdutoImportAdjustment[];
}


async function uploadFiles(
  formData: FormData,
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
          uploaded.length,
      });
    }
  }

  return uploaded;
}

async function buildProdutoPayload(
  formData: FormData
) {
  const urls =
    formData.getAll(
      "imagemExistente"
    );

  const publicIds =
    formData.getAll(
      "imagemExistentePublicId"
    );

  const imagensExistentes =
    urls.map(
      (url, index) => ({
        url: String(url),
        publicId: String(
          publicIds[index]
        ),
        ordem: index,
      })
    );

  const novasImagens =
    await uploadFiles(
      formData
    );

  return {
    nome: getText(
      formData,
      "nome"
    ),
    descricao:
      getText(
        formData,
        "descricao"
      ),
    marca: getText(
      formData,
      "marca"
    ),

    cor: getText(
      formData,
      "cor"
    ),

    referencia: getText(
      formData,
      "referencia"
    ),

    tamanho: getText(
      formData,
      "tamanho"
    ),
    preco: Number(
      getText(
        formData,
        "preco"
      )
    ),
    estoque: Number(
      getText(
        formData,
        "estoque"
      )
    ),
    categoriaId:
      getText(
        formData,
        "categoriaId"
      ),
    tipo:
      getTipo(formData),
    status:
      getStatus(formData),

    imagens: [
      ...imagensExistentes,
      ...novasImagens.map(
        (
          imagem,
          index
        ) => ({
          ...imagem,
          ordem:
            imagensExistentes.length +
            index,
        })
      ),
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
    revalidatePath("/admin/categorias");

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
    revalidatePath("/admin/categorias");

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
    revalidatePath("/admin/categorias");

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
    revalidatePath("/admin/categorias");

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
    await uploadFiles(data);

    return {
      ...initialSuccess,
      message: "Imagem enviada com sucesso.",
    };
  } catch (error) {
    return handleError("uploadImagemProduto", error);
  }
}

export async function salvarEnquadramentoFotos(
  imagens: ProdutoImagem[]
): Promise<ProdutoActionState> {
  try {
    await requireAdmin();

    await produtoService.salvarEnquadramentoFotos(
      imagens
    );

    revalidatePath("/admin/produtos");

    return {
      ok: true,
      message:
        "Enquadramento salvo com sucesso.",
    };
  } catch (error) {
    return handleError(
      "salvarEnquadramentoFotos",
      error
    );
  }
}

export async function reordenarProdutos(
  produtos: {
    id: string;
    ordem: number;
  }[]
): Promise<ProdutoActionState> {
  try {
    await requireAdmin();

    await produtoService.atualizarOrdemProdutos(
      produtos
    );

    revalidatePath("/admin/produtos");

    return {
      ...initialSuccess,
      message:
        "Ordem atualizada com sucesso.",
    };
  } catch (error) {
    return handleError(
      "reordenarProdutos",
      error
    );
  }
}

export async function atualizarEnquadramentoImagem(
  imagemId: string,
  crop: {
    zoom: number;
    offsetX: number;
    offsetY: number;
  }
): Promise<ProdutoActionState> {
  try {
    await requireAdmin();

    await produtoService.atualizarEnquadramentoImagem(
      imagemId,
      crop
    );

    revalidatePath("/admin/produtos");

    return {
      ...initialSuccess,
      message: "Enquadramento salvo com sucesso.",
    };
  } catch (error) {
    return handleError(
      "atualizarEnquadramentoImagem",
      error
    );
  }
}

export async function preVisualizarImportacaoProdutos(
  formData: FormData
): Promise<ProdutoImportActionState> {
  try {
    await requireAdmin();

    const preview =
      await produtoService.preVisualizarImportacao(
        getFile(formData, "planilha")
      );

    return {
      ok: true,
      message: "Planilha validada com sucesso.",
      preview,
    };
  } catch (error) {
    return handleError(
      "preVisualizarImportacaoProdutos",
      error
    );
  }
}

export async function confirmarImportacaoProdutos(
  formData: FormData
): Promise<ProdutoImportActionState> {
  try {
    await requireAdmin();

    const resultado =
      await produtoService.importarProdutosPorPlanilha(
        getFile(formData, "planilha"),
        getImportAdjustments(formData)
      );

    revalidatePath("/admin/produtos");
    revalidatePath("/admin/produtos/importar");
    revalidatePath("/admin/categorias");

    return {
      ok: true,
      message: `${resultado.importados} produto(s) importado(s) com sucesso.`,
      importados: resultado.importados,
      preview: resultado.preview,
    };
  } catch (error) {
    return handleError(
      "confirmarImportacaoProdutos",
      error
    );
  }
}
