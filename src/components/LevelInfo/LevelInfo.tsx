/**
 * Componente responsavel por exibir as informacoes do nivel atual.
 * Mostra o nivel em que o jogador esta e uma mensagem de acordo
 * com o estado atual da partida.
 */

import type { GameState } from "../../types/game";
import "./LevelInfo.css";

interface LevelInfoProps {
  gameState: GameState;
}

export function LevelInfo({ gameState }: LevelInfoProps) {
  function getStatusMessage() {
    switch (gameState.status) {
      case "memorizing":
        return "Memorize as cartas!";

      case "playing":
        return "Encontre os pares!";

      case "levelComplete":
      case "gameOver":
        return "";

      default:
        return "Prepare-se!";
    }
  }

  const statusMessage = getStatusMessage();

  return (
    <div className="level-info">
      <span className="level-number">
        Nível {gameState.level}
      </span>

      {statusMessage && (
        <span className="level-status">
          {statusMessage}
        </span>
      )}
    </div>
  );
}