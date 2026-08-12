import { EnderecoRepository } from "./endereco.repository";
import {
  enderecoSchema,
  type EnderecoInput,
} from "./endereco.schema";
import type { EnderecoResumo } from "./endereco.types";

export class EnderecoService {
  constructor(
    private enderecoRepository =
      new EnderecoRepository()
  ) { }

  async listarEnderecos(
    usuarioId: string
  ): Promise<EnderecoResumo[]> {
    const enderecos =
      await this.enderecoRepository.findByUsuarioId(
        usuarioId
      );

    return enderecos.map((endereco) => ({
      id: endereco.id,
      cep: endereco.cep,
      logradouro: endereco.logradouro,
      numero: endereco.numero,
      complemento: endereco.complemento ?? "",
      bairro: endereco.bairro,
      cidade: endereco.cidade,
      estado: endereco.estado,
    }));
  }

  async criarEndereco(
    usuarioId: string,
    data: EnderecoInput
  ) {
    const dadosValidados =
      enderecoSchema.parse(data);

    return this.enderecoRepository.create(
      usuarioId,
      dadosValidados
    );
  }

  async editarEndereco(
    usuarioId: string,
    id: string,
    data: EnderecoInput
  ) {
    const enderecoExistente =
      await this.enderecoRepository.findById(
        id
      );

    if (
      !enderecoExistente ||
      enderecoExistente.usuarioId !== usuarioId
    ) {
      throw new Error(
        "Endereço não encontrado."
      );
    }

    const dadosValidados =
      enderecoSchema.parse(data);

    return this.enderecoRepository.update(
      id,
      dadosValidados
    );
  }

  async excluirEndereco(
    usuarioId: string,
    id: string
  ) {
    const enderecoExistente =
      await this.enderecoRepository.findById(
        id
      );

    if (
      !enderecoExistente ||
      enderecoExistente.usuarioId !== usuarioId
    ) {
      throw new Error(
        "Endereço não encontrado."
      );
    }

    return this.enderecoRepository.delete(id);
  }
}
