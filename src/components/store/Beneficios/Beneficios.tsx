import { Shirt, Package, ShieldCheck } from "lucide-react";

import { Ornamento } from "@/components/store/Ornamento/Ornamento";

import styles from "./Beneficios.module.css";

const beneficios = [
  {
    id: "pecas-unicas",
    icon: (
      <Ornamento
        className={styles.ornamentoIcon}
        width={36}
        height={36}
      />
    ),
    titulo: "Peças únicas",
    subtitulo: "Novas peças toda semana",
  },
  {
    id: "brecho-consciente",
    icon: <Shirt size={30} strokeWidth={1.4} />,
    titulo: "Brechó consciente",
    subtitulo: "Moda que faz bem",
  },
  {
    id: "envio-rapido",
    icon: <Package size={30} strokeWidth={1.4} />,
    titulo: "Envio rápido",
    subtitulo: "Para todo o Brasil",
  },
  {
    id: "compra-segura",
    icon: <ShieldCheck size={30} strokeWidth={1.4} />,
    titulo: "Compra segura",
    subtitulo: "Seus dados protegidos",
  },
];

export function Beneficios() {
  return (
    <section className={styles.beneficios}>
      {beneficios.map((beneficio) => (
        <div
          key={beneficio.id}
          className={styles.item}
        >
          <span className={styles.icon}>
            {beneficio.icon}
          </span>

          <div>
            <p className={styles.titulo}>
              {beneficio.titulo}
            </p>
            <p className={styles.subtitulo}>
              {beneficio.subtitulo}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}
