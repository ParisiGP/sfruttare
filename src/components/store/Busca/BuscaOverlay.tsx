"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, X } from "lucide-react";

import type { ProdutoVitrineResumo } from "@/modules/produto/produto.types";
import { ProdutoVitrineCard } from "@/components/store/ProdutoVitrineCard/ProdutoVitrineCard";

import styles from "./BuscaOverlay.module.css";

const TAMANHO_MINIMO_BUSCA = 2;
const DEBOUNCE_MS = 300;

type EstadoBusca =
  | { tipo: "vazio" }
  | { tipo: "carregando" }
  | { tipo: "erro" }
  | {
      tipo: "resultados";
      produtos: ProdutoVitrineResumo[];
    };

export function BuscaOverlay() {
  const router = useRouter();

  const [aberto, setAberto] = useState(false);
  const [query, setQuery] = useState("");
  const [estado, setEstado] = useState<EstadoBusca>({
    tipo: "vazio",
  });

  const desktopInputRef =
    useRef<HTMLInputElement>(null);
  const mobileInputRef =
    useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mobileOverlayRef =
    useRef<HTMLDivElement>(null);

  function fechar() {
    setAberto(false);
  }

  useEffect(() => {
    if (!aberto) {
      document.body.style.overflow = "";
      return;
    }

    setQuery("");
    setEstado({ tipo: "vazio" });

    document.body.style.overflow = "hidden";

    const focusTimer = setTimeout(() => {
      const ehMobile = window.matchMedia(
        "(max-width: 768px)"
      ).matches;

      const alvo = ehMobile
        ? mobileInputRef.current
        : desktopInputRef.current;

      alvo?.focus();
    }, 10);

    function handleClickFora(event: MouseEvent) {
      const target = event.target as Node;

      const dentroDoWrapper =
        wrapperRef.current?.contains(target);

      const dentroDoOverlayMobile =
        mobileOverlayRef.current?.contains(
          target
        );

      if (!dentroDoWrapper && !dentroDoOverlayMobile) {
        fechar();
      }
    }

    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        fechar();
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickFora
    );
    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.body.style.overflow = "";
      clearTimeout(focusTimer);
      document.removeEventListener(
        "mousedown",
        handleClickFora
      );
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [aberto]);

  useEffect(() => {
    const busca = query.trim();

    if (busca.length < TAMANHO_MINIMO_BUSCA) {
      setEstado({ tipo: "vazio" });
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(() => {
      setEstado({ tipo: "carregando" });

      fetch(
        `/api/busca?q=${encodeURIComponent(busca)}`,
        { signal: controller.signal }
      )
        .then((resposta) => {
          if (!resposta.ok) {
            throw new Error("Falha na busca");
          }

          return resposta.json();
        })
        .then((dados) => {
          setEstado({
            tipo: "resultados",
            produtos: dados.produtos ?? [],
          });
        })
        .catch((error) => {
          if (
            error instanceof DOMException &&
            error.name === "AbortError"
          ) {
            return;
          }

          setEstado({ tipo: "erro" });
        });
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  function irParaResultados() {
    const busca = query.trim();

    if (busca.length < TAMANHO_MINIMO_BUSCA) {
      return;
    }

    fechar();
    router.push(
      `/busca?q=${encodeURIComponent(busca)}`
    );
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Enter") {
      irParaResultados();
    }
  }

  return (
    <div
      className={styles.wrapper}
      ref={wrapperRef}
    >
      <button
        type="button"
        className={styles.triggerButton}
        onClick={() => setAberto((v) => !v)}
        aria-label={
          aberto ? "Fechar busca" : "Buscar"
        }
        aria-expanded={aberto}
      >
        {aberto ? (
          <X size={20} strokeWidth={1.6} />
        ) : (
          <Search size={20} strokeWidth={1.6} />
        )}
      </button>

      {aberto && (
        <div className={styles.desktopPanel}>
          <input
            ref={desktopInputRef}
            type="search"
            className={styles.input}
            placeholder="Buscar produtos..."
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            onKeyDown={handleKeyDown}
            aria-label="Buscar produtos"
          />

          <ResultadosBusca
            estado={estado}
            query={query}
            onNavigate={fechar}
          />
        </div>
      )}

      {aberto &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className={styles.mobileOverlay}
            ref={mobileOverlayRef}
          >
            <div className={styles.mobileHeader}>
              <input
                ref={mobileInputRef}
                type="search"
                className={styles.input}
                placeholder="Buscar produtos..."
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                onKeyDown={handleKeyDown}
                aria-label="Buscar produtos"
              />

              <button
                type="button"
                className={styles.closeButton}
                onClick={fechar}
                aria-label="Fechar busca"
              >
                <X size={22} strokeWidth={1.6} />
              </button>
            </div>

            <div className={styles.mobileResults}>
              <ResultadosBusca
                estado={estado}
                query={query}
                onNavigate={fechar}
              />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

type ResultadosBuscaProps = {
  estado: EstadoBusca;
  query: string;
  onNavigate: () => void;
};

function ResultadosBusca({
  estado,
  query,
  onNavigate,
}: ResultadosBuscaProps) {
  if (estado.tipo === "vazio") {
    if (query.trim().length === 0) {
      return null;
    }

    return (
      <p className={styles.mensagem}>
        Digite ao menos 2 letras para buscar.
      </p>
    );
  }

  if (estado.tipo === "carregando") {
    return (
      <div className={styles.skeleton}>
        <div className={styles.skeletonItem} />
        <div className={styles.skeletonItem} />
        <div className={styles.skeletonItem} />
      </div>
    );
  }

  if (estado.tipo === "erro") {
    return (
      <p className={styles.mensagemErro}>
        Não foi possível buscar agora. Tente
        novamente em instantes.
      </p>
    );
  }

  if (estado.produtos.length === 0) {
    return (
      <p className={styles.mensagem}>
        Nenhum produto encontrado para
        &ldquo;{query.trim()}&rdquo;.
      </p>
    );
  }

  return (
    <>
      <div className={styles.resultadosGrid}>
        {estado.produtos.map((produto) => (
          <ProdutoVitrineCard
            key={produto.id}
            produto={produto}
            onClick={onNavigate}
          />
        ))}
      </div>

      <Link
        href={`/busca?q=${encodeURIComponent(query.trim())}`}
        className={styles.verTodos}
        onClick={onNavigate}
      >
        Ver todos os resultados
      </Link>
    </>
  );
}
