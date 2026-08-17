import type { CarrinhoItemResumo } from "@/modules/carrinho/carrinho.types";
import { FreteRepository } from "./frete.repository";
import type { OpcaoFrete } from "./frete.types";

const MELHOR_ENVIO_BASE_URL =
  "https://www.melhorenvio.com.br/api/v2";

const MELHOR_ENVIO_OAUTH_URL =
  "https://www.melhorenvio.com.br/oauth/token";

const UM_DIA_EM_MS =
  24 * 60 * 60 * 1000;

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

type MelhorEnvioTokenResposta = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

export class FreteService {
  constructor(
    private freteRepository =
      new FreteRepository()
  ) {}

  async calcularOpcoes(
    cepDestino: string,
    itens: CarrinhoItemResumo[]
  ): Promise<OpcaoFrete[]> {
    if (itens.length === 0) {
      return [];
    }

    const cepOrigem =
      process.env.MELHOR_ENVIO_CEP_ORIGEM;

    if (!cepOrigem) {
      throw new Error(
        "Cálculo de frete indisponível no momento. Tente novamente mais tarde."
      );
    }

    const token = await this.obterTokenValido();

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

    const opcoes = dados
      .filter(
        (opcao) => !opcao.error && opcao.price
      )
      .map((opcao) => ({
        id: String(opcao.id),
        nome: opcao.name,
        preco: Number(opcao.price),
        prazoDias: opcao.delivery_time ?? 0,
      }));

    return this.curarOpcoes(opcoes);
  }

  private async obterTokenValido(): Promise<string> {
    const integracao =
      await this.freteRepository.obterIntegracao();

    if (!integracao) {
      const tokenEstatico =
        process.env.MELHOR_ENVIO_TOKEN;

      if (!tokenEstatico) {
        throw new Error(
          "Cálculo de frete indisponível no momento. Tente novamente mais tarde."
        );
      }

      return tokenEstatico;
    }

    const expiraEmBreve =
      integracao.expiraEm.getTime() - Date.now() <
      UM_DIA_EM_MS;

    if (!expiraEmBreve) {
      return integracao.accessToken;
    }

    const clientId =
      process.env.MELHOR_ENVIO_CLIENT_ID;

    const clientSecret =
      process.env.MELHOR_ENVIO_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return integracao.accessToken;
    }

    let resposta: Response;

    try {
      resposta = await fetch(
        MELHOR_ENVIO_OAUTH_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            grant_type: "refresh_token",
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: integracao.refreshToken,
          }),
        }
      );
    } catch {
      return integracao.accessToken;
    }

    if (!resposta.ok) {
      return integracao.accessToken;
    }

    const dadosToken =
      (await resposta.json()) as MelhorEnvioTokenResposta;

    const expiraEm = new Date(
      Date.now() + dadosToken.expires_in * 1000
    );

    await this.freteRepository.atualizarToken(
      integracao.id,
      {
        accessToken: dadosToken.access_token,
        refreshToken: dadosToken.refresh_token,
        expiraEm,
      }
    );

    return dadosToken.access_token;
  }

  private curarOpcoes(
    opcoes: OpcaoFrete[]
  ): OpcaoFrete[] {
    const restantes = [...opcoes];
    const curadas: OpcaoFrete[] = [];

    const indiceSedex = restantes.findIndex(
      (opcao) =>
        opcao.nome.toLowerCase().includes("sedex")
    );

    if (indiceSedex !== -1) {
      const [sedex] = restantes.splice(
        indiceSedex,
        1
      );

      curadas.push({
        ...sedex,
        nome: "SEDEX",
      });
    }

    if (restantes.length > 0) {
      const indiceMaisBarata = restantes.reduce(
        (menorIndice, opcao, indice) =>
          opcao.preco <
          restantes[menorIndice].preco
            ? indice
            : menorIndice,
        0
      );

      const [economico] = restantes.splice(
        indiceMaisBarata,
        1
      );

      curadas.push({
        ...economico,
        nome: "Envio econômico",
      });
    }

    if (restantes.length > 0) {
      const indiceMaisRapida = restantes.reduce(
        (menorIndice, opcao, indice) =>
          opcao.prazoDias <
          restantes[menorIndice].prazoDias
            ? indice
            : menorIndice,
        0
      );

      const [expresso] = restantes.splice(
        indiceMaisRapida,
        1
      );

      curadas.push({
        ...expresso,
        nome: "Envio expresso",
      });
    }

    return curadas;
  }
}
