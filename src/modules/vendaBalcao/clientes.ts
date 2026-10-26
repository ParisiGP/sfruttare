import type { ClienteBalcaoResumo } from "./vendaBalcao.types";

/** Um registro de onde se pode tirar um cliente: uma venda ou uma reserva. */
export type RegistroCliente = {
  nomeCliente: string;
  emailCliente: string | null;
  telefoneCliente: string | null;
  createdAt: Date;
};

export function chaveDoCliente(nome: string) {
  return nome.trim().toLowerCase();
}

/**
 * Junta registros de várias origens (vendas e reservas) em um cliente
 * por nome normalizado. Cada campo (celular, e-mail) vale o **valor não
 * vazio mais recente** entre todas as origens — assim um e-mail que só
 * apareceu numa compra antiga não se perde porque a reserva mais nova
 * veio sem e-mail. O nome exibido é o do registro mais recente. A ordem
 * do resultado é a da atividade mais recente de cada cliente.
 */
export function mesclarClientes(
  registros: RegistroCliente[]
): ClienteBalcaoResumo[] {
  const maisRecentesPrimeiro = [...registros].sort(
    (a, b) =>
      b.createdAt.getTime() - a.createdAt.getTime()
  );

  const porNome = new Map<string, ClienteBalcaoResumo>();

  for (const registro of maisRecentesPrimeiro) {
    const chave = chaveDoCliente(registro.nomeCliente);

    if (!chave) {
      continue;
    }

    const cliente = porNome.get(chave) ?? {
      nomeCliente: registro.nomeCliente,
      emailCliente: "",
      telefoneCliente: "",
    };

    if (!cliente.emailCliente) {
      cliente.emailCliente =
        registro.emailCliente?.trim() ?? "";
    }

    if (!cliente.telefoneCliente) {
      cliente.telefoneCliente =
        registro.telefoneCliente?.trim() ?? "";
    }

    porNome.set(chave, cliente);
  }

  return [...porNome.values()];
}
