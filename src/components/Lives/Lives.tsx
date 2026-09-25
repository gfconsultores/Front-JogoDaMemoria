/**
 * Componente responsavel por exibir visualmente as tentativas restantes.
 * A quantidade de vidas e calculada com base no limite maximo de erros
 * permitido no nivel e na quantidade de erros ja cometidos pelo jogador.
 */

import "./Lives.css";

interface LivesProps {
  errors: number;
  maxErrors: number;
}

export function Lives({ errors, maxErrors }: LivesProps) {
  const remainingLives = Math.max(maxErrors - errors, 0);

  return (
    <div className="lives">
      <span className="lives-label">Vidas</span>

      <div className="lives-icons">
        {Array.from({ length: maxErrors }).map((_, index) => (
          <span
            key={index}
            className={`life ${index < remainingLives ? "active" : "lost"}`}
          >
            {index < remainingLives ? "♥" : "♡"}
          </span>
        ))}
      </div>
    </div>
  );
}