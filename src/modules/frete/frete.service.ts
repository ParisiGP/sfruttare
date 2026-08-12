import type { CarrinhoItemResumo } from "@/modules/carrinho/carrinho.types";
import type { OpcaoFrete } from "./frete.types";

const MELHOR_ENVIO_BASE_URL =
  "https://www.melhorenvio.com.br/api/v2";

const PACOTE_PADRAO = {
  pesoGramas: 300,
  alturaCm: 5,
  larguraCm: 15,
  comprimentoCm: 20,
};

type MelhorEnvioProduto = {
  id: string;
  width: number;
  height: number;
  length: number;
  weight: number;
  insurance_value: number;
  quantity: number;
};

type MelhorEnvioOpcaoResposta = {
  id: number;
  name: string;
  price?: string;
  delivery_time?: number;
  error?: string;
};

export class FreteService {
  async calcularOpcoes(
    cepDestino: string,
    itens: CarrinhoItemResumo[]
  ): Promise<OpcaoFrete[]> {
    if (itens.length === 0) {
      return [];
    }

    const token = process.env.MELHOR_ENVIO_TOKEN;
    const cepOrigem =
      process.env.MELHOR_ENVIO_CEP_ORIGEM;

    if (!token || !cepOrigem) {
      throw new Error(
        "Cálculo de frete indisponível no momento. Tente novamente mais tarde."
      );
    }

    const produtos: MelhorEnvioProduto[] =
      itens.map((item) => ({
        id: item.produto.id,
        width:
          item.produto.larguraCm ??
          PACOTE_PADRAO.larguraCm,
        height:
          item.produto.alturaCm ??
          PACOTE_PADRAO.alturaCm,
        length:
          item.produto.comprimentoCm ??
          PACOTE_PADRAO.comprimentoCm,
        weight:
          (item.produto.pesoGramas ??
            PACOTE_PADRAO.pesoGramas) / 1000,
        insurance_value: item.precoUnitario,
        quantity: item.quantidade,
      }));

    let resposta: Response;

    try {
      resposta = await fetch(
        `${MELHOR_ENVIO_BASE_URL}/me/shipment/calculate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "User-Agent": "Sfruttare (contato@sfruttare.com.br)",
          },
          body: JSON.stringify({
            from: {
              postal_code: cepOrigem,
            },
            to: {
              postal_code: cepDestino,
            },
            products: produtos,
          }),
        }
      );
    } catch {
      throw new Error(
        "Não foi possível calcular o frete agora. Verifique sua conexão e tente novamente."
      );
    }

    if (!resposta.ok) {
      throw new Error(
        "Não foi possível calcular o frete agora. Tente novamente em instantes."
      );
    }

    const dados =
      (await resposta.json()) as MelhorEnvioOpcaoResposta[];

    return dados
      .filter(
        (opcao) => !opcao.error && opcao.price
      )
      .map((opcao) => ({
        id: String(opcao.id),
        nome: opcao.name,
        preco: Number(opcao.price),
        prazoDias: opcao.delivery_time ?? 0,
      }));
  }
}
