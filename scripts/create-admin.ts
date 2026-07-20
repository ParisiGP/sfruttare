import "dotenv/config";
import { UsuarioService } from "../src/modules/usuario/usuario.service";

const usuarioService = new UsuarioService();
console.log(process.env.DATABASE_URL);
async function main() {
  await usuarioService.criarUsuario({
    nome: "Administrador",
    email: "gustavoparisi12@gmail.com",
    senha: "P@risi1342",
    role: "ADMIN",
  });

  console.log("✅ Administrador criado com sucesso!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });