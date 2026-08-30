import { alternarLido } from "@/lib/actions";
import { Check, Circulo } from "@/components/icons";

/**
 * Botão de marcar/desmarcar leitura. Server Action e formulário comum, como o
 * resto do site: funciona com JavaScript desligado.
 *
 * `de` é a rota de volta, validada no servidor em `voltarPara()`. É o que
 * permite o mesmo botão viver no post e num cartão do feed sem jogar a pessoa
 * para outra página depois do clique.
 */
export default function LidoToggle({
  postId,
  lido,
  de,
}: {
  postId: string;
  lido: boolean;
  de: string;
}) {
  return (
    <form action={alternarLido}>
      <input type="hidden" name="id" value={postId} />
      <input type="hidden" name="de" value={de} />
      <button
        className={lido ? "secundario on" : "secundario"}
        aria-pressed={lido}
        title={
          lido
            ? "Você marcou este post como lido. Clique para desmarcar."
            : "Marcar este post como lido"
        }
      >
        {lido ? <Check /> : <Circulo />}
        {lido ? "Lido" : "Marcar como lido"}
      </button>
    </form>
  );
}
