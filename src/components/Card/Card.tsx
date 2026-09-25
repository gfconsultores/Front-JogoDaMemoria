/**
 * Componente responsavel por representar uma carta do jogo da memoria.
 * Exibe a imagem quando a carta estiver virada ou combinada e informa
 * ao componente principal quando o jogador selecionar a carta.
 */

import type { MemoryCard } from "../../types/game";
import "./Card.css";

interface CardProps {
  card: MemoryCard;
  onClick: (card: MemoryCard) => void;
}

export function Card({ card, onClick }: CardProps) {
  const isVisible = card.isFlipped || card.isMatched;

  return (
    <button
      className={`memory-card ${isVisible ? "flipped" : ""}`}
      onClick={() => onClick(card)}
      disabled={card.isMatched}
      type="button"
    >
      {isVisible ? (
        <img
          src={card.image}
          alt="Carta do jogo da memoria"
          draggable={false}
        />
      ) : (
        <span>?</span>
      )}
    </button>
  );
}