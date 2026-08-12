export type EnderecoPorCep = {
  logradouro: string;
  bairro: string;
  cidade: string;
  estado: string;
};

export async function buscarEnderecoPorCep(
  cep: string
): Promise<EnderecoPorCep | null> {
  const resposta = await fetch(
    `https://viacep.com.br/ws/${cep}/json/`
  );

  if (!resposta.ok) {
    return null;
  }

  const dados = await resposta.json();

  if (dados.erro) {
    return null;
  }

  return {
    logradouro: dados.logradouro ?? "",
    bairro: dados.bairro ?? "",
    cidade: dados.localidade ?? "",
    estado: dados.uf ?? "",
  };
}
