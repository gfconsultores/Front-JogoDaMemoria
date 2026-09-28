import "./Admin.css";

interface AdminProps {
  onParticipants: () => void;
  onPlayAsGF: () => void;
  onExport: () => void;
  onLogout: () => void;
}

export function Admin({
  onParticipants,
  onPlayAsGF,
  onExport,
  onLogout,
}: AdminProps) {
  return (
    <main className="admin-page">
      {/* VOLTAR PARA O CADASTRO */}
      <button
        type="button"
        className="admin-back"
        onClick={onLogout}
        aria-label="Voltar para o cadastro"
        title="Voltar"
      >
        <span className="admin-back-icon" />
      </button>

      <section className="admin-panel">
        {/* CABEÇALHO */}
        <header className="admin-header">
          <span className="admin-eyebrow">
            Desafio GF
          </span>

          <h1>Área Administrativa</h1>

          <p>
            Gerencie os participantes e o jogo.
          </p>
        </header>

        {/* MENU */}
        <div className="admin-menu">
          {/* PARTICIPANTES */}
          <button
            type="button"
            className="admin-option"
            onClick={onParticipants}
          >
            <div className="admin-option-icon">
              👥
            </div>

            <div className="admin-option-content">
              <strong>Participantes</strong>

              <span>
                Visualizar e gerenciar os participantes
                cadastrados.
              </span>
            </div>

            <span className="admin-option-arrow">
              ›
            </span>
          </button>

          {/* JOGAR */}
          <button
            type="button"
            className="admin-option"
            onClick={onPlayAsGF}
          >
            <div className="admin-option-icon">
              🎮
            </div>

            <div className="admin-option-content">
              <strong>Jogar</strong>

              <span>
                Iniciar uma partida sem limite de
                tentativas.
              </span>
            </div>

            <span className="admin-option-arrow">
              ›
            </span>
          </button>

          {/* EXPORTAR */}
          <button
            type="button"
            className="admin-option"
            onClick={onExport}
          >
            <div className="admin-option-icon">
              ↓
            </div>

            <div className="admin-option-content">
              <strong>Exportar dados</strong>

              <span>
                Exportar os participantes cadastrados.
              </span>
            </div>

            <span className="admin-option-arrow">
              ›
            </span>
          </button>
        </div>

        {/* SAIR */}
        <div className="admin-footer">
          <button
            type="button"
            className="admin-logout"
            onClick={onLogout}
          >
            Sair da área administrativa
          </button>
        </div>
      </section>
    </main>
  );
}