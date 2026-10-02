import type { GameConfig } from "../types/game";

/**
 * Configuração única do Desafio GF.
 *
 * O jogo possui:
 * - 8 pares de cartas;
 * - 15 segundos para memorização;
 * - 35 segundos para encontrar os pares;
 * - máximo de 5 erros.
 */
export const gameConfig: GameConfig = {
  pairs: 8,
  memorizeTime: 15000,
  playTime: 35000,
  maxErrors: 5,
};