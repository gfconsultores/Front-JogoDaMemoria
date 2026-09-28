import { useState } from "react";

import { GF_ADMIN } from "../../config/adminConfig";

import "./AdminLoginModal.css";

interface AdminLoginModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminLoginModal({
  onClose,
  onSuccess,
}: AdminLoginModalProps) {
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  /**
   * Formata o telefone durante a digitação.
   */
  function formatPhone(value: string) {
    const numbers = value
      .replace(/\D/g, "")
      .slice(0, 11);

    if (numbers.length === 0) {
      return "";
    }

    if (numbers.length <= 2) {
      return `(${numbers}`;
    }

    if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    }

    return `(${numbers.slice(0, 2)}) ${numbers.slice(
      2,
      7
    )}-${numbers.slice(7)}`;
  }

  /**
   * Normaliza textos para evitar diferenças
   * entre maiúsculas, minúsculas e espaços.
   */
  function normalizeText(value: string) {
    return value
      .trim()
      .toLocaleLowerCase("pt-BR");
  }

  /**
   * Valida os dados administrativos.
   */
  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    const normalizedCompany =
      normalizeText(company);

    const adminCompany =
      normalizeText(GF_ADMIN.company);

    const normalizedPhone =
      phone.replace(/\D/g, "");

    /**
     * Empresa ou telefone incorretos.
     */
    if (
      normalizedCompany !== adminCompany ||
      normalizedPhone !== GF_ADMIN.phone
    ) {
      setError(
        "Empresa ou telefone incorretos."
      );

      return;
    }

    /**
     * Acesso autorizado.
     */
    onSuccess();
  }

  return (
    <div className="admin-login-overlay">
      <section className="admin-login-modal">
        {/* VOLTAR PARA O CADASTRO */}
        <button
          type="button"
          className="admin-login-back"
          onClick={onClose}
          aria-label="Voltar ao cadastro"
          title="Voltar"
        >
          <span className="admin-login-back-icon" />
        </button>

        {/* CABEÇALHO */}
        <header className="admin-login-header">
          <span>Desafio GF</span>

          <h2>
            Acesso administrativo
          </h2>

          <p>
            Informe os dados de acesso da GF.
          </p>
        </header>

        {/* FORMULÁRIO */}
        <form
          className="admin-login-form"
          onSubmit={handleSubmit}
        >
          {/* EMPRESA */}
          <div className="admin-login-field">
            <label htmlFor="admin-company">
              Empresa
            </label>

            <input
              id="admin-company"
              type="text"
              value={company}
              onChange={(event) =>
                setCompany(event.target.value)
              }
              placeholder="Nome da empresa"
              autoComplete="off"
            />
          </div>

          {/* TELEFONE */}
          <div className="admin-login-field">
            <label htmlFor="admin-phone">
              Telefone
            </label>

            <input
              id="admin-phone"
              type="tel"
              value={phone}
              onChange={(event) =>
                setPhone(
                  formatPhone(
                    event.target.value
                  )
                )
              }
              placeholder="(00) 00000-0000"
              inputMode="numeric"
              autoComplete="off"
              maxLength={15}
            />
          </div>

          {/* MENSAGEM DE ERRO */}
          {error && (
            <p className="admin-login-error">
              {error}
            </p>
          )}

          {/* BOTÃO ENTRAR */}
          <button
            type="submit"
            className="admin-login-submit"
          >
            Entrar
          </button>
        </form>
      </section>
    </div>
  );
}