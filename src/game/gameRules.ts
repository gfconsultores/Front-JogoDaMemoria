/**
 * Define as principais regras do jogo da memoria.
 * Responsael por verificar se duas cartas formam um par,
 * identificar quando todas as cartas do nivel foram combinadas
 * e determinar quando o jogador atingiu o limite de erros.
 */

import type { MemoryCard } from "../types/game";

export function isPair(
  firstCard: MemoryCard,
  secondCard: MemoryCard
): boolean {
  return firstCard.pairId === secondCard.pairId;
}

export function isLevelComplete(cards: MemoryCard[]): boolean {
  return cards.every((card) => card.isMatched);
}

export function hasPlayerLost(
  errors: number,
  maxErrors: number
): boolean {
  return errors >= maxErrors;
}