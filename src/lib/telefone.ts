const DDDS_VALIDOS = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19,
  21, 22, 24,
  27, 28,
  31, 32, 33, 34, 35, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48, 49,
  51, 53, 54, 55,
  61,
  62, 64,
  63,
  65, 66,
  67,
  68,
  69,
  71, 73, 74, 75, 77,
  79,
  81, 87,
  82,
  83,
  84,
  85, 88,
  86, 89,
  91, 93, 94,
  92, 97,
  95,
  96,
  98, 99,
]);

export function formatarCelular(valor: string) {
  const digitos = valor
    .replace(/\D/g, "")
    .slice(0, 11);

  if (digitos.length === 0) {
    return "";
  }

  if (digitos.length <= 2) {
    return `(${digitos}`;
  }

  if (digitos.length <= 7) {
    return `(${digitos.slice(
      0,
      2
    )}) ${digitos.slice(2)}`;
  }

  return `(${digitos.slice(
    0,
    2
  )}) ${digitos.slice(2, 7)}-${digitos.slice(
    7
  )}`;
}

/**
 * Celular brasileiro válido: DDD real (lista oficial de 67 códigos) +
 * 9 dígitos com o "nono dígito" obrigatório (sempre começa com 9).
 */
export function celularValido(valor: string) {
  const digitos = valor.replace(/\D/g, "");

  if (digitos.length !== 11) {
    return false;
  }

  const ddd = Number(digitos.slice(0, 2));

  return (
    DDDS_VALIDOS.has(ddd) && digitos[2] === "9"
  );
}
