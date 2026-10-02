/**
 * Define as principais regras do jogo da memória.
 *
 * Responsável por verificar se duas cartas formam um par,
 * identificar quando todas as cartas do desafio foram combinadas
 * e determinar quando o jogador atingiu o limite de erros.
 */

import type { MemoryCard } from "../types/game";

/**
 * Verifica se duas cartas formam um par.
 */
export function isPair(
  firstCard: MemoryCard,
  secondCard: MemoryCard
): boolean {
  return firstCard.pairId === secondCard.pairId;
}

/**
 * Verifica se todos os pares foram encontrados
 * e, consequentemente, se o Desafio GF foi concluído.
 */
export function isChallengeComplete(
  cards: MemoryCard[]
): boolean {
  return cards.every(
    (card) => card.isMatched
  );
}

/**
 * Verifica se o jogador atingiu
 * o limite máximo de erros permitidos.
 */
export function hasPlayerLost(
  errors: number,
  maxErrors: number
): boolean {
  return errors >= maxErrors;
}