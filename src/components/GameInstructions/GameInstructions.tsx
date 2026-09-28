import "./GameInstructions.css";

interface GameInstructionsProps {
  onPlay: () => void;

  /**
   * Indica se a partida foi iniciada
   * pela Área Administrativa.
   */
  isAdmin?: boolean;

  /**
   * Volta para a Área Administrativa.
   * Utilizado somente no modo ADM.
   */
  onBack?: () => void;
}

export function GameInstructions({
  onPlay,
  isAdmin = false,
  onBack,
}: GameInstructionsProps) {
  return (
    <div className="game-instructions-overlay">
      <section className="game-instructions">
        {/* VOLTAR - SOMENTE ADMINISTRADOR */}
        {isAdmin && onBack && (
          <button
            type="button"
            className="game-instructions-back"
            onClick={onBack}
            aria-label="Voltar para a área administrativa"
            title="Voltar"
          >
            <span className="game-instructions-back-icon" />
          </button>
        )}

        <div className="game-instructions-success">
          ✓
        </div>

        <span className="game-instructions-eyebrow">
          {isAdmin
            ? "Modo administrativo"
            : "Cadastro realizado!"}
        </span>

        <h2>
          Prepare-se para o Desafio GF
        </h2>

        <p className="game-instructions-intro">
          Antes de começar, confira as regras da partida.
        </p>

        <div className="game-rules">
          <div className="game-rule">
            <span className="game-rule-number">
              1
            </span>

            <div>
              <strong>
                Memorize as cartas
              </strong>

              <p>
                No início de cada nível, você terá alguns
                segundos para memorizar a posição das cartas.
              </p>
            </div>
          </div>

          <div className="game-rule">
            <span className="game-rule-number">
              2
            </span>

            <div>
              <strong>
                Encontre os pares
              </strong>

              <p>
                Depois da memorização, encontre todos os pares
                antes que o tempo termine.
              </p>
            </div>
          </div>

          <div className="game-rule">
            <span className="game-rule-number">
              3
            </span>

            <div>
              <strong>
                Cuidado com os erros
              </strong>

              <p>
                Cada combinação incorreta faz você perder
                uma vida.
              </p>
            </div>
          </div>

          <div className="game-rule">
            <span className="game-rule-number">
              4
            </span>

            <div>
              <strong>
                Complete o desafio
              </strong>

              <p>
                Se o tempo acabar ou você perder todas as
                vidas, sua participação termina.
              </p>
            </div>
          </div>
        </div>

        <div
          className={
            isAdmin
              ? "game-attempt-warning game-attempt-warning-admin"
              : "game-attempt-warning"
          }
        >
          {isAdmin
            ? "Modo administrativo: tentativas ilimitadas."
            : "Você terá direito a apenas uma tentativa."}
        </div>

        <button
          type="button"
          className="game-instructions-button"
          onClick={onPlay}
        >
          JOGAR
        </button>
      </section>
    </div>
  );
}