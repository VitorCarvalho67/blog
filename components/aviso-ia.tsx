/** A política editorial da casa. Aparece onde alguém colaria texto gerado. */
export default function AvisoIA({ curto = false }: { curto?: boolean }) {
  return (
    <aside className="aviso">
      <strong>Nada de texto de IA aqui dentro.</strong>
      <p>
        Aqui seu cérebro será o responsável por criar algo. Talvez ele nem
        lembre mais como se faz. Vai ter de ter paciência.
      </p>
      {!curto && (
        <p className="dim">
          Texto meia-boca escrito por você vale mais do que texto redondo
          escrito por uma máquina. É esse o trato.
        </p>
      )}
      <p className="dim">
        Colar está desligado nas caixas de texto. Link sozinho passa.
      </p>
    </aside>
  );
}

/**
 * Recado que o script de bloqueio revela quando alguém tenta colar. Nasce
 * escondido e é servido pelo servidor como todo o resto: sem JavaScript ele
 * simplesmente não aparece, porque sem JavaScript também não há bloqueio.
 */
export function AvisoColar({ id }: { id: string }) {
  return (
    <p id={id} className="err" hidden>
      Colar não passa aqui. Link sozinho, sim. O resto é seu cérebro que
      escreve, e é esse o trato.
    </p>
  );
}
