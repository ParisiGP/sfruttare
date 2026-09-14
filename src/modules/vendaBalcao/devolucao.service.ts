import { VendaBalcaoRepository } from "./vendaBalcao.repository";
import { DevolucaoBalcaoRepository } from "./devolucao.repository";
import { registrarDevolucaoSchema } from "./devolucao.schema";
import type {
  DevolucaoResumo,
  RegistrarDevolucaoInput,
} from "./vendaBalcao.types";

export class DevolucaoBalcaoService {
  constructor(
    private devolucaoRepository =
      new DevolucaoBalcaoRepository(),
    private vendaBalcaoRepository =
      new VendaBalcaoRepository()
  ) { }

  async registrarDevolucao(
    input: RegistrarDevolucaoInput
  ): Promise<DevolucaoResumo> {
    const dadosValidados =
      registrarDevolucaoSchema.parse(input);

    const item =
      await this.vendaBalcaoRepository.findItemById(
        dadosValidados.vendaBalcaoItemId
      );

    if (!item) {
      throw new Error(
        "Item da venda não encontrado."
      );
    }

    const existente =
      await this.devolucaoRepository.findByItemId(
        item.id
      );

    if (existente) {
      throw new Error(
        "Esta peça já teve uma devolução ou troca registrada."
      );
    }

    const valorDevolvido = Number(
      item.precoUnitario
    );

    let diferencaValor: number | undefined;

    if (dadosValidados.tipo === "TROCA") {
      const vendaTroca =
        await this.vendaBalcaoRepository.findById(
          dadosValidados.vendaTrocaId!
        );

      if (!vendaTroca) {
        throw new Error(
          "A venda escolhida pra troca não foi encontrada."
        );
      }

      if (vendaTroca.id === item.vendaBalcaoId) {
        throw new Error(
          "A venda de troca não pode ser a mesma venda da peça devolvida."
        );
      }

      const vendaJaUsada =
        await this.devolucaoRepository.findByVendaTrocaId(
          vendaTroca.id
        );

      if (vendaJaUsada) {
        throw new Error(
          "Essa venda já foi usada como troca de outra peça."
        );
      }

      diferencaValor =
        Number(vendaTroca.total) - valorDevolvido;
    }

    const devolucao =
      await this.devolucaoRepository.create({
        vendaBalcaoItemId: item.id,
        produtoOriginalId: item.produtoId,
        tipo: dadosValidados.tipo,
        valorDevolvido,
        vendaTrocaId:
          dadosValidados.tipo === "TROCA"
            ? dadosValidados.vendaTrocaId
            : undefined,
        diferencaValor,
        motivo:
          dadosValidados.motivo || undefined,
      });

    return this.serializeDevolucao(devolucao);
  }

  private serializeDevolucao(devolucao: {
    id: string;
    tipo: string;
    valorDevolvido: unknown;
    vendaTrocaId: string | null;
    vendaTroca: {
      nomeCliente: string;
      total: unknown;
      createdAt: Date;
    } | null;
    diferencaValor: unknown;
    motivo: string | null;
    createdAt: Date;
  }): DevolucaoResumo {
    return {
      id: devolucao.id,
      tipo: devolucao.tipo as
        | "DEVOLUCAO"
        | "TROCA",
      valorDevolvido: Number(
        devolucao.valorDevolvido
      ),
      vendaTrocaId: devolucao.vendaTrocaId,
      vendaTrocaResumo: devolucao.vendaTroca
        ? {
            nomeCliente:
              devolucao.vendaTroca.nomeCliente,
            total: Number(
              devolucao.vendaTroca.total
            ),
            createdAt:
              devolucao.vendaTroca.createdAt,
          }
        : null,
      diferencaValor:
        devolucao.diferencaValor === null
          ? null
          : Number(devolucao.diferencaValor),
      motivo: devolucao.motivo,
      createdAt: devolucao.createdAt,
    };
  }
}
