/**
 * Extração do tipo de peça a partir do nome do produto, por palavra-chave
 * — não existe campo estruturado pra isso hoje (categoria está tudo como
 * "Feminina", upload feito com pressa). Mesmo espírito isolado/editável do
 * `TAXA_JUROS_PARCELA` do balcão.
 *
 * A ordem importa: percorre a lista nessa ordem, o primeiro item cuja
 * palavra-chave aparecer no nome (case-insensitive, em qualquer parte)
 * define o tipo — ex.: "vestido" vem antes de "chemise" pra "Vestido
 * Chemise com botões" cair em Vestido (o tipo de base), não em Chemise.
 */
const TIPOS_PECA: {
  tipo: string;
  palavrasChave: string[];
}[] = [
  { tipo: "Vestido", palavrasChave: ["vestido"] },
  {
    tipo: "Macaquinho",
    palavrasChave: ["macaquinho"],
  },
  {
    tipo: "Macacão",
    palavrasChave: ["macacao", "macacão"],
  },
  {
    tipo: "Jardineira",
    palavrasChave: ["jardineira"],
  },
  { tipo: "Jaqueta", palavrasChave: ["jaqueta"] },
  { tipo: "Blazer", palavrasChave: ["blazer"] },
  {
    tipo: "Casaco",
    palavrasChave: [
      "casaco",
      "casaqueto",
      "parka",
    ],
  },
  { tipo: "Colete", palavrasChave: ["colete"] },
  {
    tipo: "Moletom",
    palavrasChave: ["moletom"],
  },
  {
    tipo: "Chemise",
    palavrasChave: ["chemise"],
  },
  {
    tipo: "Cropped",
    palavrasChave: ["cropped"],
  },
  { tipo: "Body", palavrasChave: ["body"] },
  { tipo: "Regata", palavrasChave: ["regata"] },
  {
    tipo: "Camiseta",
    palavrasChave: ["camiseta"],
  },
  { tipo: "Camisa", palavrasChave: ["camisa"] },
  { tipo: "Blusa", palavrasChave: ["blusa"] },
  {
    tipo: "Túnica",
    palavrasChave: ["bata", "tunica", "túnica"],
  },
  {
    tipo: "Calça",
    palavrasChave: ["calca", "calça"],
  },
  {
    tipo: "Short/Bermuda",
    palavrasChave: ["short", "bermuda"],
  },
  { tipo: "Saia", palavrasChave: ["saia"] },
  {
    tipo: "Biquini",
    palavrasChave: ["biquini"],
  },
];

export const TIPO_PECA_PADRAO = "Outros";

export function identificarTipoPeca(
  nome: string
): string {
  const nomeNormalizado = nome.toLowerCase();

  for (const entrada of TIPOS_PECA) {
    if (
      entrada.palavrasChave.some((palavra) =>
        nomeNormalizado.includes(palavra)
      )
    ) {
      return entrada.tipo;
    }
  }

  return TIPO_PECA_PADRAO;
}
