import type { ParticipantData } from "../../pages/Registration/Registration";

import "./GameResultModal.css";

interface GameResultModalProps {
  participant: ParticipantData;
  completedGame: boolean;
  isAdmin: boolean;
  onFinish: () => void;
}

export function GameResultModal({
  participant,
  completedGame,
  isAdmin,
  onFinish,
}: GameResultModalProps) {
  /**
   * Primeiro nome do participante.
   *
   * Utilizado somente nas partidas
   * de participantes cadastrados.
   */
  const firstName =
    participant.name.trim().split(/\s+/)[0] ||
    "Participante";

  return (
    <div className="game-result-overlay">
      <section className="game-result-modal">
        <div className="game-result-icon">
          {completedGame ? "✓" : "!"}
        </div>

        <span className="game-result-eyebrow">
          {completedGame
            ? "Desafio concluído"
            : "Participação encerrada"}
        </span>

        <h2>
          {isAdmin
            ? "Obrigado por participar!"
            : completedGame
              ? `Parabéns, ${firstName}!`
              : `${firstName}, obrigado por participar!`}
        </h2>

        {completedGame ? (
          <p className="game-result-message">
            Você concluiu o Desafio GF!
          </p>
        ) : (
          <p className="game-result-message">
            Não foi dessa vez, mas agradecemos
            pela sua participação no Desafio GF!
          </p>
        )}

        <button
          type="button"
          className="game-result-button"
          onClick={onFinish}
        >
          FINALIZAR
        </button>
      </section>
    </div>
  );
}