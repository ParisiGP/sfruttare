import { Phone, Mail, Camera } from "lucide-react";

import { PaginaInstitucional } from "@/components/store/PaginaInstitucional/PaginaInstitucional";

export default function ContatoPage() {
  return (
    <PaginaInstitucional titulo="Contato">
      <p>
        Ficou com alguma dúvida ou quer saber mais
        sobre uma peça? Fale com a gente por
        qualquer um dos canais abaixo.
      </p>

      <p>
        <Phone
          size={16}
          strokeWidth={1.6}
          style={{
            verticalAlign: "-3px",
            marginRight: 8,
          }}
        />
        <a href="tel:+5511999999999">
          (11) 99999-9999
        </a>
      </p>

      <p>
        <Mail
          size={16}
          strokeWidth={1.6}
          style={{
            verticalAlign: "-3px",
            marginRight: 8,
          }}
        />
        <a href="mailto:contato@sfruttare.com.br">
          contato@sfruttare.com.br
        </a>
      </p>

      <p>
        <Camera
          size={16}
          strokeWidth={1.6}
          style={{
            verticalAlign: "-3px",
            marginRight: 8,
          }}
        />
        <a
          href="https://www.instagram.com/sfruttare/"
          target="_blank"
          rel="noopener noreferrer"
        >
          @sfruttare
        </a>
      </p>
    </PaginaInstitucional>
  );
}
