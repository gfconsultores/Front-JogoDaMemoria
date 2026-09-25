/**
 * Modal exibido quando o jogador conclui um nivel
 * ou quando a partida termina.
 */

import "./GameModal.css";

interface GameModalProps {
  type: "gameOver" | "levelComplete";
  level: number;
  isLastLevel: boolean;
  gameOverReason?: "lives" | "time";
  onRestart: () => void;
  onNextLevel: () => void;
}

export function GameModal({
  type,
  level,
  isLastLevel,
  gameOverReason = "lives",
  onRestart,
  onNextLevel,
}: GameModalProps) {
  const isGameOver = type === "gameOver";
  const isTimeOver = gameOverReason === "time";

  return (
    <div className="game-modal-overlay">
      <div className="game-modal">
        {isGameOver ? (
          <>
            <div className="game-modal-icon">
              {isTimeOver ? "⌛" : "×"}
            </div>

            <h2>
              {isTimeOver
                ? "Tempo esgotado!"
                : "Fim de jogo!"}
            </h2>

            <p>
              {isTimeOver
                ? `O tempo acabou no nível ${level}. Tente encontrar todos os pares mais rápido.`
                : `Você perdeu todas as vidas no nível ${level}.`}
            </p>

            <button
              className="game-modal-button"
              onClick={onRestart}
            >
              Tentar novamente
            </button>
          </>
        ) : (
          <>
            <div className="game-modal-icon">✓</div>

            <h2>
              {isLastLevel
                ? "Parabéns!"
                : `Nível ${level} concluído!`}
            </h2>

            <p>
              {isLastLevel
                ? "Você concluiu todos os níveis do jogo!"
                : "Você encontrou todos os pares."}
            </p>

            <button
              className="game-modal-button"
              onClick={
                isLastLevel ? onRestart : onNextLevel
              }
            >
              {isLastLevel
                ? "Jogar novamente"
                : "Próximo nível"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}