import "./GameInstructions.css";

interface GameInstructionsProps {
  onPlay: () => void;
}

export function GameInstructions({
  onPlay,
}: GameInstructionsProps) {
  return (
    <div className="game-instructions-overlay">
      <section className="game-instructions">
        <div className="game-instructions-success">
          ✓
        </div>

        <span className="game-instructions-eyebrow">
          Cadastro realizado!
        </span>

        <h2>Prepare-se para o Desafio GF</h2>

        <p className="game-instructions-intro">
          Antes de começar, confira as regras da partida.
        </p>

        <div className="game-rules">
          <div className="game-rule">
            <span className="game-rule-number">1</span>

            <div>
              <strong>Memorize as cartas</strong>
              <p>
                No início de cada nível, você terá alguns
                segundos para memorizar a posição das cartas.
              </p>
            </div>
          </div>

          <div className="game-rule">
            <span className="game-rule-number">2</span>

            <div>
              <strong>Encontre os pares</strong>
              <p>
                Depois da memorização, encontre todos os pares
                antes que o tempo termine.
              </p>
            </div>
          </div>

          <div className="game-rule">
            <span className="game-rule-number">3</span>

            <div>
              <strong>Cuidado com os erros</strong>
              <p>
                Cada combinação incorreta faz você perder
                uma vida.
              </p>
            </div>
          </div>

          <div className="game-rule">
            <span className="game-rule-number">4</span>

            <div>
              <strong>Complete o desafio</strong>
              <p>
                Se o tempo acabar ou você perder todas as
                vidas, sua participação termina.
              </p>
            </div>
          </div>
        </div>

        <div className="game-attempt-warning">
          Você terá direito a apenas uma tentativa.
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