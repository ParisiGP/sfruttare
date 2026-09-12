import Link from "next/link";

import styles from "./page.module.css";

type RetornoPageProps = {
  searchParams?: Promise<
    Record<string, string | string[] | undefined>
  >;
};

type Estado = "aprovado" | "pendente" | "rejeitado" | "indefinido";

function getParam(
  params: Record<
    string,
    string | string[] | undefined
  >,
  key: string
) {
  const value = params[key];

  return Array.isArray(value) ? value[0] : value;
}

function resolverEstado(
  status: string | undefined
): Estado {
  if (!status) {
    return "indefinido";
  }

  if (status === "approved") {
    return "aprovado";
  }

  if (
    status === "pending" ||
    status === "in_process" ||
    status === "authorized"
  ) {
    return "pendente";
  }

  if (
    status === "rejected" ||
    status === "cancelled"
  ) {
    return "rejeitado";
  }

  return "indefinido";
}

const conteudoPorEstado: Record<
  Estado,
  { titulo: string; mensagem: string }
> = {
  aprovado: {
    titulo: "Pagamento aprovado!",
    mensagem:
      "Seu pedido foi confirmado e já está sendo preparado. Você pode acompanhar tudo na sua área de pedidos.",
  },
  pendente: {
    titulo: "Pagamento em análise",
    mensagem:
      "Recebemos seu pagamento e estamos aguardando a confirmação — isso é comum no PIX e costuma levar só alguns instantes. Assim que for aprovado, seu pedido é criado automaticamente.",
  },
  rejeitado: {
    titulo: "Pagamento não aprovado",
    mensagem:
      "Não conseguimos confirmar esse pagamento. Nada foi cobrado e seu carrinho continua intacto — você pode tentar novamente.",
  },
  indefinido: {
    titulo: "Retorno do pagamento",
    mensagem:
      "Não conseguimos identificar o status desse pagamento por aqui. Se você concluiu o pagamento, confira sua área de pedidos em alguns instantes.",
  },
};

export default async function CheckoutRetornoPage({
  searchParams,
}: RetornoPageProps) {
  const params = (await searchParams) ?? {};

  const status =
    getParam(params, "status") ??
    getParam(params, "collection_status");

  const paymentId =
    getParam(params, "payment_id") ??
    getParam(params, "collection_id");

  const estado = resolverEstado(status);
  const conteudo = conteudoPorEstado[estado];

  return (
    <main>
      <div
        className={`${styles.wrapper} ${
          styles[estado]
        }`}
      >
        <span className={styles.icone} aria-hidden="true">
          {estado === "aprovado" && "✓"}
          {estado === "pendente" && "…"}
          {estado === "rejeitado" && "✕"}
          {estado === "indefinido" && "?"}
        </span>

        <h1>{conteudo.titulo}</h1>

        <p className={styles.mensagem}>
          {conteudo.mensagem}
        </p>

        {paymentId && (
          <p className={styles.referencia}>
            Referência do pagamento: {paymentId}
          </p>
        )}

        <div className={styles.acoes}>
          {estado === "rejeitado" ? (
            <>
              <Link
                href="/checkout"
                className={styles.botaoPrimario}
              >
                Tentar novamente
              </Link>

              <Link
                href="/pecas"
                className={styles.botaoSecundario}
              >
                Voltar à loja
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/pecas"
                className={styles.botaoPrimario}
              >
                Continuar comprando
              </Link>

              <Link
                href="/perfil"
                className={styles.botaoSecundario}
              >
                Minha conta
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
