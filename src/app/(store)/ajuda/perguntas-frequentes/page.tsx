import { PaginaInstitucional } from "@/components/store/PaginaInstitucional/PaginaInstitucional";

export default function PerguntasFrequentesPage() {
  return (
    <PaginaInstitucional titulo="Perguntas frequentes">
      <h2>Como funciona o brechó?</h2>
      <p>
        Cada peça do nosso catálogo é única e
        selecionada individualmente — por isso,
        assim que uma peça é vendida, ela sai da
        vitrine.
      </p>

      <h2>Quais formas de pagamento vocês aceitam?</h2>
      <p>
        Trabalhamos com cartão de crédito e PIX,
        processados de forma segura no checkout.
      </p>

      <h2>Quanto tempo leva para o pedido chegar?</h2>
      <p>
        O prazo de entrega varia conforme o seu
        CEP e a modalidade de frete escolhida no
        checkout.
      </p>

      <p>
        Este conteúdo é um ponto de partida e pode
        ser substituído a qualquer momento.
      </p>
    </PaginaInstitucional>
  );
}
