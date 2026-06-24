import styles from "./ProdutoTable.module.css";
import { ModalExcluirProduto } from "@/components/ui/Modal/ConfirmDeleteModal";

type ProdutoTableItem = {
  id: string;
  nome: string;
  descricao?: string | null;
  categoria: {
    nome: string;
  };
  tamanho?: string | null;
  preco: number;
  marca?: string | null;
  estoque?: number | null;
  tipo: string;
};

type ProdutoTableProps = {
  produtos: ProdutoTableItem[];
};

export function ProdutoTable({
  produtos,
}: ProdutoTableProps) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
      <thead>
        <tr>
          <th>Nome</th>
          <th>Descrição</th>
          <th>Categoria</th>
          <th>Tamanho</th>
          <th>Preço</th>
          <th>Marca</th>
          <th>Estoque</th>
          <th>Tipo</th>
          <th>Ações</th>
        </tr>
      </thead>

      <tbody>
        {produtos.map((produto) => (
          <tr key={produto.id}>
            <td>{produto.nome}</td>

            <td className={styles.description}>
              {produto.descricao}
            </td>

            <td>
              {produto.categoria.nome}
            </td>

            <td>{produto.tamanho}</td>

            <td className={styles.price}>
              R$ {Number(produto.preco).toLocaleString(
                "pt-BR",
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }
              )}
            </td>

            <td>{produto.marca}</td>

            <td className={styles.stock}>
              {produto.estoque}
            </td>

            <td>{produto.tipo}</td>

            <td>
              <ModalExcluirProduto produto={produto} />
            </td>

          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}
