import type { ParticipantData } from "../../pages/Registration/Registration";

import "./GameResultModal.css";

interface GameResultModalProps {
  participant: ParticipantData;
  level: number;
  completedGame: boolean;
  onFinish: () => void;
}

export function GameResultModal({
  participant,
  level,
  completedGame,
  onFinish,
}: GameResultModalProps) {
  /**
   * Primeiro nome do participante.
   */
  const firstName =
    participant.name.trim().split(/\s+/)[0] ||
    "Participante";

  /**
   * Ultimo nivel existente no jogo.
   */
  const FINAL_LEVEL = 10;

  /**
   * Participante chegou ao nivel final,
   * mas nao conseguiu conclui-lo.
   */
  const lostOnFinalLevel =
    level === FINAL_LEVEL &&
    !completedGame;

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
          {completedGame
            ? `Parabéns, ${firstName}!`
            : `${firstName}, obrigado por participar!`}
        </h2>

        {completedGame ? (
          /**
           * Concluiu o nivel final.
           */
          <p className="game-result-message">
            Você concluiu todos os níveis do
            Desafio GF!
          </p>
        ) : (
          <>
            <p className="game-result-message">
              Você alcançou o
            </p>

            <div className="game-result-level">
              NÍVEL {level}
            </div>

            <p className="game-result-message">
              {lostOnFinalLevel
                ? "Você chegou ao nível final, mas não conseguiu concluir o Desafio GF."
                : "Você não chegou ao nível final do Desafio GF."}
            </p>
          </>
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