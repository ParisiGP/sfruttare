"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import { buscarClientesParaBalcao } from "@/modules/vendaBalcao/actions";
import type { ClienteBalcaoResumo } from "@/modules/vendaBalcao/vendaBalcao.types";

import styles from "./ClienteAutocomplete.module.css";

const DEBOUNCE_MS = 300;
const MINIMO_CARACTERES = 2;

type ClienteAutocompleteProps = {
  /** Nome digitado — quem usa guarda o estado. */
  value: string;
  onChange: (nome: string) => void;
  /** Escolheu uma sugestão: quem usa preenche nome, celular (e e-mail, se tiver o campo). */
  onSelecionar: (cliente: ClienteBalcaoResumo) => void;
  /** Se vier, o campo é renderizado como `<label><span>rótulo</span><input/></label>`. */
  rotulo?: string;
  /** Classe do `<label>` — o visual do campo é de quem usa. */
  classeCampo?: string;
  placeholder?: string;
  disabled?: boolean;
  /**
   * `flutuante`: a lista abre por cima do que vem abaixo.
   * `embutida`: a lista ocupa espaço no fluxo — use dentro de cartões e
   * listas com rolagem, que cortariam uma lista flutuante.
   */
  variante?: "flutuante" | "embutida";
};

/**
 * Campo de nome de cliente com sugestões: a partir de 2 caracteres
 * busca clientes (vendas e reservas) por nome. Setas navegam, Enter
 * escolhe, Esc fecha, clicar fora fecha. Sem resultado não mostra nada
 * (é cliente novo, não é erro) e uma falha na consulta é silenciosa.
 */
export function ClienteAutocomplete({
  value,
  onChange,
  onSelecionar,
  rotulo,
  classeCampo,
  placeholder,
  disabled,
  variante = "flutuante",
}: ClienteAutocompleteProps) {
  const wrapRef = useRef<HTMLDivElement>(null);

  // Escolher uma sugestão muda `value`; sem isso o efeito abaixo
  // buscaria de novo pelo nome completo e reabriria a lista.
  const suprimirBuscaRef = useRef(false);

  // Só sugere depois que a pessoa digitou. Um nome que já chega
  // preenchido (ex.: conversão de reserva em venda) não abre lista.
  const digitouRef = useRef(false);

  const [sugestoes, setSugestoes] = useState<
    ClienteBalcaoResumo[]
  >([]);
  const [indiceDestacado, setIndiceDestacado] =
    useState(-1);

  const termoCurto =
    value.trim().length < MINIMO_CARACTERES;

  // Termo curto esconde a lista sem precisar limpar estado no efeito.
  const visiveis = termoCurto ? [] : sugestoes;

  useEffect(() => {
    if (suprimirBuscaRef.current) {
      suprimirBuscaRef.current = false;
      return;
    }

    if (!digitouRef.current) {
      return;
    }

    const termo = value.trim();

    if (termo.length < MINIMO_CARACTERES) {
      return;
    }

    let cancelado = false;

    const timer = setTimeout(async () => {
      const resultado =
        await buscarClientesParaBalcao(termo);

      if (cancelado) {
        return;
      }

      setSugestoes(
        resultado.ok ? resultado.clientes : []
      );
      setIndiceDestacado(-1);
    }, DEBOUNCE_MS);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [value]);

  useEffect(() => {
    function handleClickFora(event: MouseEvent) {
      if (
        wrapRef.current &&
        !wrapRef.current.contains(
          event.target as Node
        )
      ) {
        setSugestoes([]);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickFora
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickFora
      );
    };
  }, []);

  function selecionar(cliente: ClienteBalcaoResumo) {
    // Se o nome escolhido é igual ao que já estava digitado, `value`
    // não muda e o efeito não roda — a trava ficaria armada e engoliria
    // a próxima digitação.
    suprimirBuscaRef.current =
      cliente.nomeCliente !== value;

    setSugestoes([]);
    setIndiceDestacado(-1);
    onSelecionar(cliente);
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLInputElement>
  ) {
    if (visiveis.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIndiceDestacado(
        (atual) => (atual + 1) % visiveis.length
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setIndiceDestacado((atual) =>
        atual <= 0 ? visiveis.length - 1 : atual - 1
      );
    } else if (event.key === "Enter") {
      if (indiceDestacado >= 0) {
        event.preventDefault();
        selecionar(visiveis[indiceDestacado]);
      }
    } else if (event.key === "Escape") {
      setSugestoes([]);
      setIndiceDestacado(-1);
    }
  }

  const campo = (
    <input
      type="text"
      autoComplete="off"
      aria-autocomplete="list"
      placeholder={placeholder}
      disabled={disabled}
      value={value}
      onChange={(event) => {
        digitouRef.current = true;
        onChange(event.target.value);
      }}
      onKeyDown={handleKeyDown}
    />
  );

  return (
    <div className={styles.wrap} ref={wrapRef}>
      {rotulo ? (
        <label className={classeCampo}>
          <span>{rotulo}</span>
          {campo}
        </label>
      ) : (
        campo
      )}

      {visiveis.length > 0 && (
        <ul
          className={
            variante === "embutida"
              ? `${styles.lista} ${styles.listaEmbutida}`
              : styles.lista
          }
        >
          {visiveis.map((cliente, index) => (
            <li key={cliente.nomeCliente + index}>
              <button
                type="button"
                className={
                  index === indiceDestacado
                    ? `${styles.item} ${styles.itemAtivo}`
                    : styles.item
                }
                onClick={() => selecionar(cliente)}
                onMouseEnter={() =>
                  setIndiceDestacado(index)
                }
              >
                <strong>{cliente.nomeCliente}</strong>

                {cliente.telefoneCliente && (
                  <small>
                    {cliente.telefoneCliente}
                  </small>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
