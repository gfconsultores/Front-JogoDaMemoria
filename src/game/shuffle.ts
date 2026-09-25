/**
 * Responsavel pelo embaralhamento dos elementos utilizados no jogo.
 * Utiliza o algoritmo Fisher-Yates para gerar uma nova ordem aleatoria
 * sem modificar o array original recebido pela funçao.
 */

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));

    [shuffled[i], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[i],
    ];
  }

  return shuffled;
}