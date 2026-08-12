"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Modal } from "@/components/ui/Modal/Modal";
import { Button } from "@/components/ui/Button/Button";
import { Input } from "@/components/ui/Input/Input";

import {
  criarEndereco,
  editarEndereco,
  excluirEndereco,
} from "@/modules/endereco/actions";
import type { EnderecoResumo } from "@/modules/endereco/endereco.types";
import type { EnderecoInput } from "@/modules/endereco/endereco.schema";
import { buscarEnderecoPorCep } from "@/lib/cep";

import styles from "./EnderecoSelecao.module.css";

type EnderecoSelecaoProps = {
  enderecos: EnderecoResumo[];
  onEnderecoSelecionado?: (
    endereco: EnderecoResumo | null
  ) => void;
};

const formVazio: EnderecoInput = {
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
};

export function EnderecoSelecao({
  enderecos,
  onEnderecoSelecionado,
}: EnderecoSelecaoProps) {
  const router = useRouter();

  const [selecionadoId, setSelecionadoId] =
    useState<string | null>(
      enderecos[0]?.id ?? null
    );

  const onEnderecoSelecionadoRef = useRef(
    onEnderecoSelecionado
  );
  onEnderecoSelecionadoRef.current =
    onEnderecoSelecionado;

  useEffect(() => {
    const aindaExiste = enderecos.some(
      (endereco) => endereco.id === selecionadoId
    );

    if (!aindaExiste) {
      setSelecionadoId(enderecos[0]?.id ?? null);
    }
  }, [enderecos, selecionadoId]);

  useEffect(() => {
    const selecionado =
      enderecos.find(
        (endereco) => endereco.id === selecionadoId
      ) ?? null;

    onEnderecoSelecionadoRef.current?.(selecionado);
  }, [selecionadoId, enderecos]);

  const [formAberto, setFormAberto] =
    useState(false);

  const [enderecoEmEdicao, setEnderecoEmEdicao] =
    useState<EnderecoResumo | null>(null);

  const [enderecoParaExcluir, setEnderecoParaExcluir] =
    useState<EnderecoResumo | null>(null);

  const [form, setForm] =
    useState<EnderecoInput>(formVazio);

  const [erroForm, setErroForm] = useState("");
  const [erroExclusao, setErroExclusao] = useState("");
  const [erroCep, setErroCep] = useState("");
  const [buscandoCep, setBuscandoCep] =
    useState(false);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  function abrirNovo() {
    setEnderecoEmEdicao(null);
    setForm(formVazio);
    setErroForm("");
    setErroCep("");
    setFormAberto(true);
  }

  function abrirEdicao(endereco: EnderecoResumo) {
    setEnderecoEmEdicao(endereco);
    setForm({
      cep: endereco.cep,
      logradouro: endereco.logradouro,
      numero: endereco.numero,
      complemento: endereco.complemento,
      bairro: endereco.bairro,
      cidade: endereco.cidade,
      estado: endereco.estado,
    });
    setErroForm("");
    setErroCep("");
    setFormAberto(true);
  }

  function fecharForm() {
    setFormAberto(false);
    setEnderecoEmEdicao(null);
  }

  function atualizarCampo(
    campo: keyof EnderecoInput,
    valor: string
  ) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  async function handleCepChange(
    valorDigitado: string
  ) {
    const cep = valorDigitado
      .replace(/\D/g, "")
      .slice(0, 8);

    atualizarCampo("cep", cep);
    setErroCep("");

    if (cep.length !== 8) {
      return;
    }

    setBuscandoCep(true);

    const endereco =
      await buscarEnderecoPorCep(cep);

    setBuscandoCep(false);

    if (!endereco) {
      setErroCep(
        "CEP não encontrado. Preencha o endereço manualmente."
      );
      return;
    }

    setForm((atual) => ({
      ...atual,
      logradouro: endereco.logradouro,
      bairro: endereco.bairro,
      cidade: endereco.cidade,
      estado: endereco.estado,
    }));
  }

  async function salvar(
    event: React.FormEvent
  ) {
    event.preventDefault();
    setSalvando(true);
    setErroForm("");

    const resultado = enderecoEmEdicao
      ? await editarEndereco(
          enderecoEmEdicao.id,
          form
        )
      : await criarEndereco(form);

    setSalvando(false);

    if (!resultado.ok) {
      setErroForm(resultado.message);
      return;
    }

    fecharForm();
    router.refresh();
  }

  async function confirmarExclusao() {
    if (!enderecoParaExcluir) {
      return;
    }

    setExcluindo(true);
    setErroExclusao("");

    const resultado = await excluirEndereco(
      enderecoParaExcluir.id
    );

    setExcluindo(false);

    if (!resultado.ok) {
      setErroExclusao(resultado.message);
      return;
    }

    if (selecionadoId === enderecoParaExcluir.id) {
      setSelecionadoId(null);
    }

    setEnderecoParaExcluir(null);
    router.refresh();
  }

  return (
    <section className={styles.wrapper}>
      <div className={styles.header}>
        <h2>Endereço de entrega</h2>

        {enderecos.length > 0 && (
          <button
            type="button"
            className={styles.addButton}
            onClick={abrirNovo}
          >
            + Novo endereço
          </button>
        )}
      </div>

      {enderecos.length === 0 ? (
        <div className={styles.empty}>
          <strong>
            Nenhum endereço cadastrado
          </strong>

          <span>
            Cadastre um endereço para
            continuar a compra.
          </span>

          <Button type="button" onClick={abrirNovo}>
            Cadastrar endereço
          </Button>
        </div>
      ) : (
        <ul className={styles.lista}>
          {enderecos.map((endereco) => (
            <li
              key={endereco.id}
              className={styles.item}
            >
              <label className={styles.itemLabel}>
                <input
                  type="radio"
                  name="endereco"
                  checked={
                    selecionadoId === endereco.id
                  }
                  onChange={() =>
                    setSelecionadoId(endereco.id)
                  }
                />

                <span className={styles.itemInfo}>
                  <strong>
                    {endereco.logradouro},{" "}
                    {endereco.numero}
                    {endereco.complemento &&
                      ` — ${endereco.complemento}`}
                  </strong>

                  <span
                    className={styles.itemLinha}
                  >
                    {endereco.bairro} —{" "}
                    {endereco.cidade}/
                    {endereco.estado}
                  </span>

                  <span
                    className={styles.itemLinha}
                  >
                    CEP {endereco.cep}
                  </span>
                </span>
              </label>

              <div className={styles.itemAcoes}>
                <button
                  type="button"
                  onClick={() =>
                    abrirEdicao(endereco)
                  }
                >
                  Editar
                </button>

                <button
                  type="button"
                  className={styles.excluirButton}
                  onClick={() => {
                    setErroExclusao("");
                    setEnderecoParaExcluir(
                      endereco
                    );
                  }}
                >
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal aberto={formAberto} onClose={fecharForm}>
        <form
          className={styles.form}
          onSubmit={salvar}
        >
          <h2 className={styles.formTitle}>
            {enderecoEmEdicao
              ? "Editar endereço"
              : "Novo endereço"}
          </h2>

          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>CEP</span>
              <Input
                value={form.cep}
                onChange={(event) =>
                  handleCepChange(
                    event.target.value
                  )
                }
                placeholder="00000000"
                maxLength={8}
                inputMode="numeric"
                required
              />
              {buscandoCep && (
                <span
                  className={styles.cepStatus}
                >
                  Buscando endereço...
                </span>
              )}
              {erroCep && (
                <span
                  className={styles.cepStatusErro}
                >
                  {erroCep}
                </span>
              )}
            </label>

            <label className={styles.field}>
              <span>Estado</span>
              <Input
                value={form.estado}
                onChange={(event) =>
                  atualizarCampo(
                    "estado",
                    event.target.value
                  )
                }
                placeholder="SP"
                maxLength={2}
                required
              />
            </label>

            <label
              className={`${styles.field} ${styles.fieldWide}`}
            >
              <span>Logradouro</span>
              <Input
                value={form.logradouro}
                onChange={(event) =>
                  atualizarCampo(
                    "logradouro",
                    event.target.value
                  )
                }
                required
              />
            </label>

            <label className={styles.field}>
              <span>Número</span>
              <Input
                value={form.numero}
                onChange={(event) =>
                  atualizarCampo(
                    "numero",
                    event.target.value
                  )
                }
                required
              />
            </label>

            <label
              className={`${styles.field} ${styles.fieldWide}`}
            >
              <span>Complemento</span>
              <Input
                value={form.complemento ?? ""}
                onChange={(event) =>
                  atualizarCampo(
                    "complemento",
                    event.target.value
                  )
                }
                placeholder="Opcional"
              />
            </label>

            <label
              className={`${styles.field} ${styles.fieldWide}`}
            >
              <span>Bairro</span>
              <Input
                value={form.bairro}
                onChange={(event) =>
                  atualizarCampo(
                    "bairro",
                    event.target.value
                  )
                }
                required
              />
            </label>

            <label
              className={`${styles.field} ${styles.fieldWide}`}
            >
              <span>Cidade</span>
              <Input
                value={form.cidade}
                onChange={(event) =>
                  atualizarCampo(
                    "cidade",
                    event.target.value
                  )
                }
                required
              />
            </label>
          </div>

          {erroForm && (
            <p className={styles.error}>
              {erroForm}
            </p>
          )}

          <div className={styles.formActions}>
            <Button
              type="button"
              variant="outline"
              onClick={fecharForm}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={salvando}
            >
              {salvando
                ? "Salvando..."
                : "Salvar endereço"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        aberto={enderecoParaExcluir !== null}
        onClose={() =>
          setEnderecoParaExcluir(null)
        }
      >
        {enderecoParaExcluir && (
          <div className={styles.deleteContent}>
            <h2 className={styles.formTitle}>
              Excluir endereço
            </h2>

            <p>
              Tem certeza que deseja excluir o
              endereço em{" "}
              {enderecoParaExcluir.logradouro},{" "}
              {enderecoParaExcluir.numero}?
            </p>

            {erroExclusao && (
              <p className={styles.error}>
                {erroExclusao}
              </p>
            )}

            <div className={styles.formActions}>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setEnderecoParaExcluir(null)
                }
              >
                Cancelar
              </Button>

              <Button
                type="button"
                variant="danger"
                disabled={excluindo}
                onClick={confirmarExclusao}
              >
                {excluindo
                  ? "Excluindo..."
                  : "Confirmar exclusão"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
