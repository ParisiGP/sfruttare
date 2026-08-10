import { notFound } from "next/navigation";

import { ProdutoService } from "@/modules/produto/produto.service";
import { ProdutoDetalhe } from "@/components/store/ProdutoDetalhe/ProdutoDetalhe";

type ProdutoPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ProdutoPage({
  params,
}: ProdutoPageProps) {
  const { slug } = await params;

  const produtoService =
    new ProdutoService();

  const produto =
    await produtoService.obterDetalhePublico(
      slug
    );

  if (!produto) {
    notFound();
  }

  return (
    <main>
      <ProdutoDetalhe produto={produto} />
    </main>
  );
}
