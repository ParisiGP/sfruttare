"use client";

import { useEffect, useState } from "react";

import Cropper from "react-easy-crop";

import type {
  ProdutoImagem,
} from "@/modules/produto/produto.types";

import { salvarEnquadramentoFotos } from "@/modules/produto/actions";

import { formatarPreco } from "@/lib/formatarPreco";

import styles from "./PhotoEditor.module.css";

type PhotoEditorProps = {
  imagens: ProdutoImagem[];
  produtoNome: string;
  produtoPreco: number;
  categoriaNome: string;
  onClose: () => void;
  onSave: (
    imagens: ProdutoImagem[]
  ) => void;
};

export function PhotoEditor({
  imagens,
  produtoNome,
  produtoPreco,
  categoriaNome,
  onClose,
  onSave,
}: PhotoEditorProps) {
  const [imagensEditadas, setImagensEditadas] =
    useState<ProdutoImagem[]>(imagens);

  const [imagemSelecionadaId, setImagemSelecionadaId] =
    useState(imagens[0]?.id);

  useEffect(() => {
    setImagensEditadas(imagens);
    setImagemSelecionadaId(imagens[0]?.id);
  }, [imagens]);

  const imagemSelecionada =
    imagensEditadas.find(
      (imagem) =>
        imagem.id === imagemSelecionadaId
    ) ?? imagensEditadas[0];

  const [crop, setCrop] =
    useState({
      x: imagemSelecionada?.offsetX ?? 0,
      y: imagemSelecionada?.offsetY ?? 0,
    });

  const [zoom, setZoom] =
    useState(imagemSelecionada?.zoom ?? 1);

  useEffect(() => {
    if (!imagemSelecionada) {
      return;
    }

    setCrop({
      x: imagemSelecionada.offsetX,
      y: imagemSelecionada.offsetY,
    });

    setZoom(imagemSelecionada.zoom);
  }, [imagemSelecionada]);

  function atualizarImagem(
    dados: Partial<ProdutoImagem>
  ) {
    setImagensEditadas((atual) =>
      atual.map((imagem) =>
        imagem.id === imagemSelecionadaId
          ? {
            ...imagem,
            ...dados,
          }
          : imagem
      )
    );
  }

  if (!imagemSelecionada) {
    return null;
  }

  const precoFormatado =
    formatarPreco(produtoPreco);

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div>
          <h2>
            Ajustar enquadramento
          </h2>

          <p>
            Ajuste exatamente como a
            imagem aparecerá na
            vitrine.
          </p>
        </div>
      </header>

      <section
        className={styles.previewArea}
      >
        <div className={styles.productCard}>
          <div className={styles.imageArea}>
            <Cropper
              image={imagemSelecionada.url}
              crop={crop}
              zoom={zoom}
              aspect={4 / 5}
              objectFit="cover"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={(
                novoZoom
              ) => {
                setZoom(novoZoom);
              }}
              onCropComplete={() => {
                atualizarImagem({
                  offsetX: crop.x,
                  offsetY: crop.y,
                  zoom: zoom,
                });
              }}
            />
          </div>

          <div className={styles.cardBody}>
            <span
              className={
                styles.category
              }
            >
              {categoriaNome}
            </span>

            <h3>
              {produtoNome}
            </h3>

            <strong>
              {precoFormatado}
            </strong>
          </div>
        </div>
      </section>

      <section
        className={styles.gallery}
      >
        {imagensEditadas.map(
          (imagem, index) => (
            <button
              key={imagem.id}
              type="button"
              onClick={() =>
                setImagemSelecionadaId(
                  imagem.id
                )
              }
              aria-label={`Selecionar imagem ${index + 1} para editar`}
              aria-pressed={
                imagem.id === imagemSelecionadaId
              }
              className={`${styles.thumbnail} ${imagem.id ===
                  imagemSelecionadaId
                  ? styles.active
                  : ""
                }`}
            >
              <img
                src={imagem.url}
                alt=""
              />
            </button>
          )
        )}
      </section>

      <section
        className={styles.zoom}
      >
        <label>Zoom</label>

        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(event) => {
            const novoZoom =
              Number(
                event.target.value
              );

            setZoom(
              novoZoom
            );

            atualizarImagem({
              zoom: novoZoom,
            });
          }}
        />

        <span>
          {Math.round(
            zoom * 100
          )}
          %
        </span>
      </section>

      <footer
        className={styles.footer}
      >
        <button
          type="button"
          className={
            styles.cancel
          }
          onClick={onClose}
        >
          Cancelar
        </button>

        <button
          type="button"
          className={styles.save}
          
          onClick={async () => {
            const resultado =
              await salvarEnquadramentoFotos(
                imagensEditadas
              );

            if (resultado.ok) {
              onSave(imagensEditadas);
            } else {
              alert(resultado.message);
            }
          }}
        >
          Salvar
        </button>
      </footer>
    </div>
  );
}