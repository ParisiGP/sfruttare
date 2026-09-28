import { converterPeriodo } from "@/lib/periodo";

import { ReservaRepository } from "./reserva.repository";
import type { ReservaListFilters } from "./reserva.repository";
import { criarReservaSchema } from "./reserva.schema";
import type {
  CanalReserva,
  CriarReservaInput,
  FiltroReservas,
  ReservaResumo,
  StatusReserva,
} from "./reserva.types";

export class ReservaService {
  constructor(
    private reservaRepository = new ReservaRepository()
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

  async listarReservas(
    filtros: FiltroReservas = {}
  ): Promise<ReservaResumo[]> {
    const reservas =
      await this.reservaRepository.findAll(
        this.montarFiltro(filtros)
      );

    return reservas.map((reserva) =>
      this.serializeReserva(reserva)
    );
  }

  async contarAtivas(): Promise<number> {
    return this.reservaRepository.contarAtivas();
  }

  private montarFiltro(
    filtros: FiltroReservas
  ): ReservaListFilters {
    const resultado: ReservaListFilters =
      converterPeriodo(filtros);

    if (filtros.status) {
      resultado.status = filtros.status;
    }

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
    };
  }): ReservaResumo {
    return {
      id: reserva.id,
      produtoId: reserva.produtoId,
      nomeProduto: reserva.produto.nome,
      referenciaProduto:
        reserva.produto.referencia ?? "",
      nomeCliente: reserva.nomeCliente,
      telefoneCliente:
        reserva.telefoneCliente ?? "",
      canal: reserva.canal as CanalReserva,
      status: reserva.status as StatusReserva,
      createdAt: reserva.createdAt,
    };
  }
}
