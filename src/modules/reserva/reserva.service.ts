import { z } from "zod";

import { converterPeriodo } from "@/lib/periodo";
import { chaveDoCliente } from "@/modules/vendaBalcao/clientes";
import { paraProdutoBalcaoResumo } from "@/modules/vendaBalcao/produtoBalcao.mapper";
import { VendaBalcaoService } from "@/modules/vendaBalcao/vendaBalcao.service";

import { ReservaRepository } from "./reserva.repository";
import type { ReservaListFilters } from "./reserva.repository";
import { criarReservaSchema } from "./reserva.schema";
import {
  agruparReservasPorCliente,
  calcularTotaisReservas,
} from "./reserva.agrupamento";
import type {
  CanalReserva,
  ConversaoReservas,
  CriarReservaInput,
  FiltroReservas,
  PainelReservas,
  ReservaResumo,
  StatusReserva,
} from "./reserva.types";

/** Teto de reservas por conversão — protege contra uma URL gigante. */
const MAXIMO_RESERVAS_CONVERSAO = 20;

const idDeReservaSchema = z.string().cuid();

export class ReservaService {
  constructor(
    private reservaRepository = new ReservaRepository(),
    private vendaBalcaoService = new VendaBalcaoService()
  ) { }

  async criarReserva(
    input: CriarReservaInput
  ): Promise<ReservaResumo> {
    const dadosValidados =
      criarReservaSchema.parse(input);

    const reserva =
      await this.reservaRepository.create({
        produtoId: dadosValidados.produtoId,
        nomeCliente: dadosValidados.nomeCliente,
        telefoneCliente:
          dadosValidados.telefoneCliente ||
          undefined,
        canal: dadosValidados.canal,
      });

    return this.serializeReserva(reserva);
  }

  async cancelarReserva(
    id: string
  ): Promise<ReservaResumo> {
    const reserva =
      await this.reservaRepository.cancelar(id);

    return this.serializeReserva(reserva);
  }

  async cancelarReservaAtivaDoProduto(
    produtoId: string
  ): Promise<ReservaResumo> {
    const reserva =
      await this.reservaRepository.findAtivaPorProdutoId(
        produtoId
      );

    if (!reserva) {
      throw new Error(
        "Não há reserva ativa para essa peça."
      );
    }

    return this.cancelarReserva(reserva.id);
  }

  /**
   * Tela de Reservas. O volume é pequeno, então busca por canal e
   * período, calcula os totais em memória e só depois aplica o filtro
   * de status à lista — por isso "Reservas ativas" continua mostrando
   * as ativas mesmo com o filtro em "Canceladas".
   */
  async obterPainelReservas(
    filtros: FiltroReservas = {}
  ): Promise<PainelReservas> {
    const reservas = (
      await this.reservaRepository.findAll(
        this.montarFiltro(filtros)
      )
    ).map((reserva) => this.serializeReserva(reserva));

    const visiveis = filtros.status
      ? reservas.filter(
          (reserva) => reserva.status === filtros.status
        )
      : reservas;

    return {
      totais: calcularTotaisReservas(reservas),
      grupos: agruparReservasPorCliente(visiveis),
    };
  }

  /**
   * Prepara o Balcão pra converter reservas em venda: só entram as que
   * ainda estão ATIVAS e, entre elas, as do mesmo cliente da primeira
   * (nome normalizado) — o resto conta como "não carregada". A reserva
   * em si só vira CONVERTIDA quando a venda é confirmada, pelo fluxo de
   * venda que já existe.
   */
  async obterAtivasParaConversao(
    ids: string[]
  ): Promise<ConversaoReservas> {
    const pedidos = [
      ...new Set(
        ids.map((id) => id.trim()).filter(Boolean)
      ),
    ];

    const idsValidos = pedidos
      .filter(
        (id) => idDeReservaSchema.safeParse(id).success
      )
      .slice(0, MAXIMO_RESERVAS_CONVERSAO);

    const ativas =
      await this.reservaRepository.findAtivasPorIds(
        idsValidos
      );

    // Mantém a ordem em que os ids foram pedidos: "a primeira" é a
    // primeira ativa da URL.
    const porId = new Map(
      ativas.map((reserva) => [reserva.id, reserva])
    );

    const naOrdemPedida = idsValidos.flatMap((id) => {
      const reserva = porId.get(id);

      return reserva ? [reserva] : [];
    });

    const primeira = naOrdemPedida[0];

    if (!primeira) {
      return {
        cliente: null,
        produtos: [],
        naoCarregadas: pedidos.length,
      };
    }

    const chave = chaveDoCliente(primeira.nomeCliente);

    const doMesmoCliente = naOrdemPedida.filter(
      (reserva) =>
        chaveDoCliente(reserva.nomeCliente) === chave
    );

    // O e-mail não existe na reserva: vem do cadastro de clientes
    // (vendas + reservas), quando há alguém com esse nome.
    const cadastro =
      await this.vendaBalcaoService.obterClientePorNome(
        primeira.nomeCliente
      );

    return {
      cliente: {
        nomeCliente: primeira.nomeCliente,
        telefoneCliente: primeira.telefoneCliente ?? "",
        emailCliente: cadastro?.emailCliente ?? "",
      },
      produtos: doMesmoCliente.map((reserva) =>
        paraProdutoBalcaoResumo({
          ...reserva.produto,
          reservas: [
            { nomeCliente: reserva.nomeCliente },
          ],
        })
      ),
      naoCarregadas:
        pedidos.length - doMesmoCliente.length,
    };
  }

  async contarAtivas(): Promise<number> {
    return this.reservaRepository.contarAtivas();
  }

  /** Só canal e período: o status é aplicado depois, em memória. */
  private montarFiltro(
    filtros: FiltroReservas
  ): ReservaListFilters {
    const resultado: ReservaListFilters =
      converterPeriodo(filtros);

    if (filtros.canal) {
      resultado.canal = filtros.canal;
    }

    return resultado;
  }

  private serializeReserva(reserva: {
    id: string;
    produtoId: string;
    nomeCliente: string;
    telefoneCliente: string | null;
    canal: string;
    status: string;
    createdAt: Date;
    produto: {
      nome: string;
      referencia: string | null;
      preco: unknown;
    };
  }): ReservaResumo {
    return {
      id: reserva.id,
      produtoId: reserva.produtoId,
      nomeProduto: reserva.produto.nome,
      referenciaProduto:
        reserva.produto.referencia ?? "",
      valorProduto: Number(reserva.produto.preco),
      nomeCliente: reserva.nomeCliente,
      telefoneCliente:
        reserva.telefoneCliente ?? "",
      canal: reserva.canal as CanalReserva,
      status: reserva.status as StatusReserva,
      createdAt: reserva.createdAt,
    };
  }
}
