import Link from "next/link";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { BiService } from "@/modules/bi/bi.service";
import type {
  FiltroPeriodoBI,
  ResultadoBI,
} from "@/modules/bi/bi.types";
import { formatarPreco } from "@/lib/formatarPreco";

import styles from "./page.module.css";

type PageProps = {
  searchParams?: Promise<
    Record<string, string | string[] | undefined>
  >;
};

function getParam(
  value: string | string[] | undefined
) {
  return Array.isArray(value) ? value[0] : value;
}

function formatarDataISO(data: Date) {
  const ano = data.getFullYear();
  const mes = String(
    data.getMonth() + 1
  ).padStart(2, "0");
  const dia = String(data.getDate()).padStart(
    2,
    "0"
  );
  return `${ano}-${mes}-${dia}`;
}

function calcularAtalhos() {
  const hoje = new Date();

  const inicioMesAtual = new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    1
  );

  const inicioMesPassado = new Date(
    hoje.getFullYear(),
    hoje.getMonth() - 1,
    1
  );

  const fimMesPassado = new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    0
  );

  const inicio30Dias = new Date(hoje);
  inicio30Dias.setDate(
    inicio30Dias.getDate() - 29
  );

  return [
    {
      label: "Mês atual",
      dataInicial: formatarDataISO(
        inicioMesAtual
      ),
      dataFinal: formatarDataISO(hoje),
    },
    {
      label: "Mês passado",
      dataInicial: formatarDataISO(
        inicioMesPassado
      ),
      dataFinal: formatarDataISO(
        fimMesPassado
      ),
    },
    {
      label: "Últimos 30 dias",
      dataInicial: formatarDataISO(
        inicio30Dias
      ),
      dataFinal: formatarDataISO(hoje),
    },
  ];
}

function CardMetrica({
  label,
  valor,
  destaque,
}: {
  label: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div
      className={
        destaque
          ? `${styles.card} ${styles.cardDestaque}`
          : styles.card
      }
    >
      <span>{label}</span>
      <strong>{valor}</strong>
    </div>
  );
}

function BlocoCanal({
  titulo,
  metricas,
}: {
  titulo: string;
  metricas: ResultadoBI["balcao"];
}) {
  return (
    <div className={styles.canalBloco}>
      <h3>{titulo}</h3>
      <div className={styles.cardsGridPequeno}>
        <CardMetrica
          label="Faturamento"
          valor={formatarPreco(
            metricas.faturamento
          )}
        />
        <CardMetrica
          label="Vendas"
          valor={String(metricas.numeroVendas)}
        />
        <CardMetrica
          label="Ticket médio"
          valor={formatarPreco(
            metricas.ticketMedio
          )}
        />
      </div>
    </div>
  );
}

function CardComparativo({
  titulo,
  dados,
}: {
  titulo: string;
  dados: ResultadoBI["consignado"];
}) {
  return (
    <div className={styles.comparativoCard}>
      <h3>{titulo}</h3>
      <div className={styles.comparativoLinha}>
        <span>Peças vendidas</span>
        <strong>{dados.quantidade}</strong>
      </div>
      <div className={styles.comparativoLinha}>
        <span>Faturamento</span>
        <strong>
          {formatarPreco(dados.faturamento)}
        </strong>
      </div>
      <div className={styles.comparativoLinha}>
        <span>Ticket médio</span>
        <strong>
          {formatarPreco(dados.ticketMedio)}
        </strong>
      </div>
    </div>
  );
}

export default async function DesempenhoPage({
  searchParams,
}: PageProps) {
  await requireAdmin();

  const params = (await searchParams) ?? {};

  const filtro: FiltroPeriodoBI = {
    dataInicial:
      getParam(params.dataInicial) || undefined,
    dataFinal:
      getParam(params.dataFinal) || undefined,
  };

  const filtroAtivo =
    !!filtro.dataInicial || !!filtro.dataFinal;

  const atalhos = calcularAtalhos();

  let resultado: ResultadoBI | null = null;
  let erro = "";

  try {
    const biService = new BiService();
    resultado = await biService.obterDesempenho(
      filtro
    );
  } catch (error) {
    console.error(
      "[admin/desempenho]",
      error
    );
    erro =
      "Não foi possível calcular o desempenho agora. Tente novamente em instantes.";
  }

  return (
    <main>
      <div className={styles.wrapper}>
        <header className={styles.header}>
          <h1>Desempenho</h1>
        </header>

        <form
          method="GET"
          className={styles.filtros}
        >
          <label className={styles.filtroCampo}>
            <span>De</span>
            <input
              type="date"
              name="dataInicial"
              defaultValue={
                filtro.dataInicial ?? ""
              }
            />
          </label>

          <label className={styles.filtroCampo}>
            <span>Até</span>
            <input
              type="date"
              name="dataFinal"
              defaultValue={
                filtro.dataFinal ?? ""
              }
            />
          </label>

          <button
            type="submit"
            className={styles.filtrarButton}
          >
            Filtrar
          </button>

          {filtroAtivo && (
            <Link
              href="/admin/desempenho"
              className={styles.limparLink}
            >
              Limpar filtros
            </Link>
          )}
        </form>

        <div className={styles.atalhos}>
          {atalhos.map((atalho) => (
            <Link
              key={atalho.label}
              href={`/admin/desempenho?dataInicial=${atalho.dataInicial}&dataFinal=${atalho.dataFinal}`}
              className={styles.atalhoLink}
            >
              {atalho.label}
            </Link>
          ))}
        </div>

        {erro && (
          <p className={styles.erro}>{erro}</p>
        )}

        {!erro &&
          resultado &&
          resultado.geral.numeroVendas ===
            0 && (
            <p className={styles.vazio}>
              Nenhuma venda encontrada nesse
              período.
            </p>
          )}

        {!erro &&
          resultado &&
          resultado.geral.numeroVendas > 0 && (
            <>
              <section
                className={styles.secao}
              >
                <h2>
                  Geral (Balcão + Site)
                </h2>

                <div
                  className={
                    styles.cardsGrid
                  }
                >
                  <CardMetrica
                    label="Faturamento"
                    valor={formatarPreco(
                      resultado.geral
                        .faturamento
                    )}
                    destaque
                  />
                  <CardMetrica
                    label="Vendas"
                    valor={String(
                      resultado.geral
                        .numeroVendas
                    )}
                    destaque
                  />
                  <CardMetrica
                    label="Ticket médio"
                    valor={formatarPreco(
                      resultado.geral
                        .ticketMedio
                    )}
                    destaque
                  />
                </div>
              </section>

              <section
                className={
                  styles.metricasPorCanal
                }
              >
                <BlocoCanal
                  titulo="Balcão"
                  metricas={
                    resultado.balcao
                  }
                />
                <BlocoCanal
                  titulo="Site"
                  metricas={resultado.site}
                />
              </section>

              <section
                className={styles.secao}
              >
                <h2>
                  Tipos de peça mais
                  vendidos
                </h2>

                <ol
                  className={
                    styles.rankingLista
                  }
                >
                  {resultado.rankingTipos.map(
                    (item, index) => (
                      <li
                        key={item.tipo}
                        className={
                          styles.rankingItem
                        }
                      >
                        <span
                          className={
                            styles.rankingPosicao
                          }
                        >
                          {index + 1}º
                        </span>

                        <span
                          className={
                            styles.rankingTipo
                          }
                        >
                          {item.tipo}
                        </span>

                        <span
                          className={
                            styles.rankingQuantidade
                          }
                        >
                          {item.quantidade}{" "}
                          peça
                          {item.quantidade ===
                          1
                            ? ""
                            : "s"}
                        </span>

                        <span
                          className={
                            styles.rankingFaturamento
                          }
                        >
                          {formatarPreco(
                            item.faturamento
                          )}
                        </span>
                      </li>
                    )
                  )}
                </ol>
              </section>

              <section
                className={styles.secao}
              >
                <h2>
                  Consignado × Próprio
                </h2>

                <div
                  className={
                    styles.comparativoGrid
                  }
                >
                  <CardComparativo
                    titulo="Consignado"
                    dados={
                      resultado.consignado
                    }
                  />
                  <CardComparativo
                    titulo="Próprio"
                    dados={
                      resultado.proprio
                    }
                  />
                </div>
              </section>
            </>
          )}
      </div>
    </main>
  );
}
