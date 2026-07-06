"use client";

import { useEffect, useState } from "react";

import Cropper from "react-easy-crop";

import type {
  ProdutoImagem,
} from "@/modules/produto/produto.types";

import { salvarEnquadramentoFotos } from "@/modules/produto/actions";

import styles from "./PhotoEditor.module.css";

type PhotoEditorProps = {
  imagens: ProdutoImagem[];
  onClose: () => void;
  onSave: (
    imagens: ProdutoImagem[]
  ) => void;
};

export function PhotoEditor({
  imagens,
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

  if (!imagemSelecionada) {
    return null;
  }

  const [crop, setCrop] =
    useState({
      x: imagemSelecionada.offsetX,
      y: imagemSelecionada.offsetY,
    });

  const [zoom, setZoom] =
    useState(imagemSelecionada.zoom);

  useEffect(() => {
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
              Categoria
            </span>

            <h3>
              Vestido Midi Floral
            </h3>

            <strong>
              R$ 189,90
            </strong>
          </div>
        </div>
      </section>

      <section
        className={styles.gallery}
      >
        {imagensEditadas.map(
          (imagem) => (
            <button
              key={imagem.id}
              type="button"
              onClick={() =>
                setImagemSelecionadaId(
                  imagem.id
                )
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
            console.log(imagensEditadas);
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