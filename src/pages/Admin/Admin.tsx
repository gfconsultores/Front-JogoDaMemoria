import { useState } from "react";
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
  const [showLogoutConfirm, setShowLogoutConfirm] =
    useState(false);

  /**
   * ==================================================
   * SOLICITAR SAÍDA
   * ==================================================
   */
  function handleRequestLogout() {
    setShowLogoutConfirm(true);
  }

  /**
   * ==================================================
   * CANCELAR SAÍDA
   * ==================================================
   */
  function handleCancelLogout() {
    setShowLogoutConfirm(false);
  }

  /**
   * ==================================================
   * CONFIRMAR SAÍDA
   * ==================================================
   */
  function handleConfirmLogout() {
    setShowLogoutConfirm(false);
    onLogout();
  }

  return (
    <main className="admin-page">
      <section className="admin-panel">
        {/* ==================================================
            CABEÇALHO
            ================================================== */}

        <header className="admin-header">
          <span className="admin-eyebrow">
            Desafio GF
          </span>

          <h1>Área Administrativa</h1>

          <p>
            Gerencie os participantes e o jogo.
          </p>
        </header>

        {/* ==================================================
            MENU
            ================================================== */}

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

        {/* ==================================================
            SAIR
            ================================================== */}

        <div className="admin-footer">
          <button
            type="button"
            className="admin-logout"
            onClick={handleRequestLogout}
          >
            Sair da área administrativa
          </button>
        </div>
      </section>

      {/* ==================================================
          CONFIRMAÇÃO DE SAÍDA
          ================================================== */}

      {showLogoutConfirm && (
        <div
          className="admin-confirm-overlay"
          role="presentation"
        >
          <section
            className="admin-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-confirm-title"
          >
            {/* ÍCONE */}

            <div className="admin-confirm-icon">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M9 6H5.5A1.5 1.5 0 0 0 4 7.5v9A1.5 1.5 0 0 0 5.5 18H9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  d="M14 8l4 4-4 4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  d="M18 12H9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* TEXTO */}

            <div className="admin-confirm-content">
              <h2 id="admin-confirm-title">
                Sair da área administrativa?
              </h2>

              <p>
                Sua sessão administrativa será encerrada
                e será necessário fazer login novamente
                para acessar esta área.
              </p>
            </div>

            {/* AÇÕES */}

            <div className="admin-confirm-actions">
              <button
                type="button"
                className="admin-confirm-cancel"
                onClick={handleCancelLogout}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="admin-confirm-exit"
                onClick={handleConfirmLogout}
              >
                Sair
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}