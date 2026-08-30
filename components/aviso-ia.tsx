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
    </aside>
  );
}
