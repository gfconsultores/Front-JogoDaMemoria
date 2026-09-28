import { useState } from "react";

import { CompanyAutocomplete } from "../../components/CompanyAutocomplete/CompanyAutocomplete";
import { AdminLoginModal } from "../../components/AdminLoginModal/AdminLoginModal";
import { saveParticipant } from "../../storage/participantsStorage";

import "./Registration.css";

/**
 * Dados do participante que serão enviados
 * para o restante da aplicação.
 */
export interface ParticipantData {
  name: string;
  company: string;
  phone: string;
}

interface RegistrationProps {
  onSuccess: (participant: ParticipantData) => void;
  onAdminSuccess: () => void;
}

export function Registration({
  onSuccess,
  onAdminSuccess,
}: RegistrationProps) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");

  /**
   * Controla a exibição do modal
   * de acesso administrativo.
   */
  const [showAdminLogin, setShowAdminLogin] =
    useState(false);

  /**
   * Formata o telefone enquanto o usuário digita.
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
   * Executado quando o botão CADASTRAR
   * é pressionado.
   */
  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const participant: ParticipantData = {
      name: name.trim(),
      company: company.trim(),
      phone: phone.replace(/\D/g, ""),
    };

    /**
     * Salva o participante no
     * armazenamento local.
     */
    saveParticipant(participant);

    console.log(
      "Participante salvo:",
      participant
    );

    /**
     * Continua o fluxo normal do jogo.
     */
    onSuccess(participant);
  }

  /**
   * Executado quando o acesso
   * administrativo é validado.
   */
  function handleAdminSuccess() {
    setShowAdminLogin(false);
    onAdminSuccess();
  }

  return (
    <>
      {/* TELA DE CADASTRO */}
      <main className="registration-page">
        <section className="registration-card">
          <header className="registration-header">
            <span className="registration-eyebrow">
              Desafio GF
            </span>

            <h1>
              Cadastre-se para participar
            </h1>

            <p>
              Preencha seus dados para iniciar o desafio.
            </p>
          </header>

          <form
            className="registration-form"
            onSubmit={handleSubmit}
            noValidate
          >
            {/* NOME */}
            <div className="form-field">
              <label htmlFor="player-name">
                Nome completo
              </label>

              <input
                id="player-name"
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Digite seu nome"
                autoComplete="name"
              />
            </div>

            {/* EMPRESA */}
            <div className="form-field">
              <label htmlFor="player-company">
                Empresa
              </label>

              <CompanyAutocomplete
                value={company}
                onChange={setCompany}
              />
            </div>

            {/* TELEFONE */}
            <div className="form-field">
              <label htmlFor="player-phone">
                Telefone
              </label>

              <input
                id="player-phone"
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
                autoComplete="tel"
                inputMode="numeric"
                maxLength={15}
              />
            </div>

            {/* BOTÃO CADASTRAR */}
            <button
              type="submit"
              className="registration-button"
            >
              Cadastrar
            </button>
          </form>

          <p className="registration-note">
            Cada participante terá direito a uma única
            tentativa.
          </p>
        </section>
      </main>

      {/* 
        ENGRENAGEM ADMINISTRATIVA

        Fica fora do formulário e fora do card.
        É posicionada pelo CSS no canto
        inferior direito da tela.
      */}
      <button
        type="button"
        className="registration-admin-link"
        onClick={() =>
          setShowAdminLogin(true)
        }
        aria-label="Configurações"
        title="Configurações"
      >
        ⚙
      </button>

      {/* MODAL DE ACESSO ADMINISTRATIVO */}
      {showAdminLogin && (
        <AdminLoginModal
          onClose={() =>
            setShowAdminLogin(false)
          }
          onSuccess={handleAdminSuccess}
        />
      )}
    </>
  );
}