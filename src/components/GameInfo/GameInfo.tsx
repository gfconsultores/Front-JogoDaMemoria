/**
 * Componente responsável por exibir
 * as informações do Desafio GF.
 *
 * Mostra o nome do desafio e uma mensagem
 * de acordo com o estado atual da partida.
 */

import type { GameState } from "../../types/game";

import "./GameInfo.css";

interface GameInfoProps {
  gameState: GameState;
}

export function GameInfo({
  gameState,
}: GameInfoProps) {
  function getStatusMessage() {
    switch (gameState.status) {
      case "memorizing":
        return "Memorize as cartas!";

      case "playing":
        return "Encontre os pares!";

      case "challengeComplete":
      case "gameOver":
        return "";

      default:
        return "Prepare-se!";
    }
  }

  const statusMessage =
    getStatusMessage();

  return (
    <div className="game-info">
      <span className="game-info-title">
        Desafio GF
      </span>

      {statusMessage && (
        <span className="game-info-status">
          {statusMessage}
        </span>
      )}
    </div>
  );
}