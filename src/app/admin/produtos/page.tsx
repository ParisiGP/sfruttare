import { requireAdmin } from "@/lib/auth/requireAdmin";
import { CategoriaService } from "@/modules/categoria/categoria.service";
import { ConsignacaoService } from "@/modules/consignacao/consignacao.service";
import { ProdutoService } from "@/modules/produto/produto.service";
import { ProdutosAdmin } from "@/components/admin/ProdutosAdmin/ProdutosAdmin";
import type { ProdutoListFilters } from "@/modules/produto/produto.types";

type ProdutosPageProps = {
  searchParams?: Promise<
    Record<string, string | string[] | undefined>
  >;
};

function getParam(
  params: Record<
    string,
    string | string[] | undefined
  >,
  key: string
) {
  const value =
    params[key];

  return Array.isArray(value)
    ? value[0]
    : value;
}

function buildFilters(
  params: Record<
    string,
    string | string[] | undefined
  >
): ProdutoListFilters {
  return {
    busca: getParam(params, "busca") ?? "",
    categoriaId:
      getParam(params, "categoriaId") ?? "",
    referencia:
      getParam(params, "referencia") ?? "",
    status:
      (getParam(params, "status") as
        | ProdutoListFilters["status"]
        | undefined) ?? "TODOS",
    tipo:
      (getParam(params, "tipo") as
        | ProdutoListFilters["tipo"]
        | undefined) ?? "TODOS",
    estoque:
      (getParam(params, "estoque") as
        | ProdutoListFilters["estoque"]
        | undefined) ?? "TODOS",
    ordem:
      (getParam(params, "ordem") as
        | ProdutoListFilters["ordem"]
        | undefined) ?? "vitrine",
    apenasReferenciasDuplicadas:
      getParam(
        params,
        "apenasReferenciasDuplicadas"
      ) === "true",
    consignante:
      getParam(params, "consignante") ?? "",
  };
}

export default async function ProdutosPage({
  searchParams,
}: ProdutosPageProps) {
  await requireAdmin();

  const params =
    (await searchParams) ?? {};

  const categoriaService =
    new CategoriaService();

  const produtoService =
    new ProdutoService();

  const filters =
    buildFilters(params);

  const [
    categorias,
    resultado,
    metricas,
    consignantes,
  ] = await Promise.all([
    categoriaService.listarCategorias(),
    produtoService.listarProdutos(filters),
    produtoService.obterMetricas(),
    produtoService.listarConsignantes(),
  ]);

  // Valor a repassar das consignadas vendidas (base da venda × %):
  // uma consulta só, e só pras poucas peças a que isso se aplica.
  const repassesAPagar =
    await new ConsignacaoService().resolverRepassesAPagar(
      resultado.produtos
    );

  const produtos =
    resultado.produtos.map((produto) => ({
      ...produtoService.serializeProduto(produto),
      repasseAPagar: repassesAPagar.get(produto.id) ?? null,
    }));

  return (
    <div>
      <ProdutosAdmin
        produtos={produtos}
        categorias={categorias.map((categoria) => ({
          id: categoria.id,
          nome: categoria.nome,
        }))}
        metricas={metricas}
        filtros={{
          busca: filters.busca ?? "",
          categoriaId: filters.categoriaId ?? "",
          referencia: filters.referencia ?? "",
          status: filters.status ?? "TODOS",
          tipo: filters.tipo ?? "TODOS",
          estoque: filters.estoque ?? "TODOS",
          ordem: filters.ordem ?? "vitrine",
          apenasReferenciasDuplicadas:
            filters.apenasReferenciasDuplicadas ??
            false,
          consignante: filters.consignante ?? "",
        }}
        consignantes={consignantes}
        total={resultado.total}
      />
    </div>
  );
}
