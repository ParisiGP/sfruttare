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
  cor?: string | null;
  referencia?: string | null;
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
          <th>Categoria</th>
          <th>Tamanho</th>
          <th>Preço</th>
          <th>Marca</th>
          <th>referência</th>
          <th>Estoque</th>
          <th>Tipo</th>
        </tr>
      </thead>

      <tbody>
        {produtos.map((produto) => (
          <tr key={produto.id}>
            <td>{produto.nome}</td>

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

            <td>{produto.referencia}</td>

            <td className={styles.stock}>
              {produto.estoque}
            </td>

            <td>{produto.tipo}</td>

          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}
