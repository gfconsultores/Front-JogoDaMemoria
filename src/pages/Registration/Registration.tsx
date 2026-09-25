import { useState } from "react";
import { CompanyAutocomplete } from "../../components/CompanyAutocomplete/CompanyAutocomplete";
import "./Registration.css";

/**
 * Dados do participante que serao enviados
 * para o restante da aplicacao.
 */
export interface ParticipantData {
  name: string;
  company: string;
  phone: string;
}

interface RegistrationProps {
  onSuccess: (participant: ParticipantData) => void;
}

export function Registration({
  onSuccess,
}: RegistrationProps) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");

  /**
   * Formata o telefone enquanto o usuario digita.
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
      return `(${numbers.slice(
        0,
        2
      )}) ${numbers.slice(2)}`;
    }

    return `(${numbers.slice(
      0,
      2
    )}) ${numbers.slice(
      2,
      7
    )}-${numbers.slice(7)}`;
  }

  /**
   * Envia os dados do participante
   * para o App.
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
     * TEMPORARIO:
     *
     * Enquanto o backend ainda nao existe,
     * os dados ficam apenas na memoria
     * da aplicacao.
     *
     * Futuramente este sera um dos pontos
     * de integracao com o banco de dados.
     */
    console.log(participant);

    onSuccess(participant);
  }

  return (
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

          <div className="form-field">
            <label htmlFor="player-company">
              Empresa
            </label>

            <CompanyAutocomplete
              value={company}
              onChange={setCompany}
            />
          </div>

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

          <button
            type="submit"
            className="registration-button"
          >
            Cadastrar
          </button>
        </form>

        <p className="registration-note">
          Cada participante terá direito a uma única tentativa.
        </p>
      </section>
    </main>
  );
}