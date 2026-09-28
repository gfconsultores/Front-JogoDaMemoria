import { useEffect, useState } from "react";

import { AdminLoginModal } from "../../components/AdminLoginModal/AdminLoginModal";

import {
  getCompanyParticipantCount,
  participantPhoneExists,
  saveParticipant,
} from "../../storage/participantsStorage";

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

/**
 * Mensagens específicas dos campos.
 */
interface FieldErrors {
  name?: string;
  company?: string;
  phone?: string;
}

/**
 * Controla quais campos devem receber
 * destaque visual de erro.
 */
interface InvalidFields {
  name: boolean;
  company: boolean;
  phone: boolean;
}

const INITIAL_INVALID_FIELDS: InvalidFields = {
  name: false,
  company: false,
  phone: false,
};

export function Registration({
  onSuccess,
  onAdminSuccess,
}: RegistrationProps) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");

  /**
   * Mensagem geral.
   *
   * Utilizada principalmente quando todos
   * os campos estão vazios.
   */
  const [error, setError] = useState("");

  /**
   * Mensagens específicas exibidas
   * abaixo dos campos.
   */
  const [fieldErrors, setFieldErrors] =
    useState<FieldErrors>({});

  /**
   * Controla quais campos ficam vermelhos.
   */
  const [invalidFields, setInvalidFields] =
    useState<InvalidFields>(
      INITIAL_INVALID_FIELDS
    );

  /**
   * Controla o modal de acesso administrativo.
   */
  const [showAdminLogin, setShowAdminLogin] =
    useState(false);

  /**
   * ==================================================
   * TEMPO DE EXIBIÇÃO DO AVISO GERAL
   * ==================================================
   */
  useEffect(() => {
    if (!error) {
      return;
    }

    const timer = window.setTimeout(() => {
      setError("");
    }, 7000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [error]);

  /**
   * ==================================================
   * FORMATAR TELEFONE
   * ==================================================
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
   * ==================================================
   * LIMPAR ERRO DE UM CAMPO
   * ==================================================
   *
   * Quando o participante começa a corrigir
   * determinado campo, o erro daquele campo
   * desaparece.
   */
  function clearFieldError(
    field: keyof FieldErrors
  ) {
    setFieldErrors((current) => {
      const updated = {
        ...current,
      };

      delete updated[field];

      return updated;
    });

    setInvalidFields((current) => ({
      ...current,
      [field]: false,
    }));

    /**
     * Caso o aviso geral esteja aparecendo,
     * ele desaparece assim que o participante
     * começa a preencher algum campo.
     */
    if (error) {
      setError("");
    }
  }

  /**
   * ==================================================
   * CADASTRAR PARTICIPANTE
   * ==================================================
   */
  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    /**
     * Limpa validações anteriores.
     */
    setError("");
    setFieldErrors({});
    setInvalidFields(
      INITIAL_INVALID_FIELDS
    );

    const cleanName =
      name.trim();

    const cleanCompany =
      company
        .trim()
        .replace(/\s+/g, " ");

    const cleanPhone =
      phone.replace(/\D/g, "");

    /**
     * ==================================================
     * TODOS OS CAMPOS VAZIOS
     * ==================================================
     *
     * Quando tudo está vazio:
     *
     * - mostramos apenas uma mensagem no topo;
     * - os três campos ficam vermelhos;
     * - não mostramos três mensagens individuais.
     */
    if (
      !cleanName &&
      !cleanCompany &&
      !cleanPhone
    ) {
      setInvalidFields({
        name: true,
        company: true,
        phone: true,
      });

      setError(
        "Preencha os campos para continuar."
      );

      return;
    }

    /**
     * ==================================================
     * CAMPOS OBRIGATÓRIOS
     * ==================================================
     *
     * Caso algum campo já esteja preenchido,
     * os campos restantes mostram somente
     * seus respectivos erros.
     */
    const requiredErrors: FieldErrors = {};

    const requiredInvalidFields: InvalidFields = {
      name: false,
      company: false,
      phone: false,
    };

    if (!cleanName) {
      requiredErrors.name =
        "Campo obrigatório.";

      requiredInvalidFields.name =
        true;
    }

    if (!cleanCompany) {
      requiredErrors.company =
        "Campo obrigatório.";

      requiredInvalidFields.company =
        true;
    }

    if (!cleanPhone) {
      requiredErrors.phone =
        "Campo obrigatório.";

      requiredInvalidFields.phone =
        true;
    }

    if (
      Object.keys(requiredErrors).length > 0
    ) {
      setFieldErrors(
        requiredErrors
      );

      setInvalidFields(
        requiredInvalidFields
      );

      return;
    }

    /**
     * ==================================================
     * TELEFONE INVÁLIDO
     * ==================================================
     */
    if (cleanPhone.length !== 11) {
      setFieldErrors({
        phone:
          "Informe um telefone válido com DDD.",
      });

      setInvalidFields({
        name: false,
        company: false,
        phone: true,
      });

      return;
    }

    /**
     * ==================================================
     * TELEFONE JÁ CADASTRADO
     * ==================================================
     *
     * Cada telefone pode participar
     * apenas uma vez.
     */
    if (
      participantPhoneExists(
        cleanPhone
      )
    ) {
      setFieldErrors({
        phone:
          "Este telefone já está cadastrado. Cada participante pode participar apenas uma vez.",
      });

      setInvalidFields({
        name: false,
        company: false,
        phone: true,
      });

      return;
    }

    /**
     * ==================================================
     * LIMITE DE PARTICIPANTES POR EMPRESA
     * ==================================================
     *
     * Cada empresa pode possuir no máximo
     * 3 participantes.
     */
    const companyParticipantCount =
      getCompanyParticipantCount(
        cleanCompany
      );

    if (
      companyParticipantCount >= 3
    ) {
      setFieldErrors({
        company:
          "Esta empresa já atingiu o limite de 3 participantes.",
      });

      setInvalidFields({
        name: false,
        company: true,
        phone: false,
      });

      return;
    }

    /**
     * ==================================================
     * DADOS DO PARTICIPANTE
     * ==================================================
     */
    const participant: ParticipantData = {
      name: cleanName,
      company: cleanCompany,
      phone: cleanPhone,
    };

    /**
     * ==================================================
     * SALVAR PARTICIPANTE
     * ==================================================
     */
    try {
      saveParticipant(
        participant
      );
    } catch (saveError) {
      /**
       * Proteção adicional para impedir
       * telefone duplicado.
       */
      if (
        saveError instanceof Error &&
        saveError.message ===
          "PARTICIPANT_ALREADY_EXISTS"
      ) {
        setFieldErrors({
          phone:
            "Este telefone já está cadastrado. Cada participante pode participar apenas uma vez.",
        });

        setInvalidFields({
          name: false,
          company: false,
          phone: true,
        });

        return;
      }

      /**
       * Erro inesperado de armazenamento.
       */
      setError(
        "Não foi possível realizar o cadastro. Tente novamente."
      );

      return;
    }

    console.log(
      "Participante salvo:",
      participant
    );

    /**
     * Continua o fluxo normal do jogo.
     */
    onSuccess(
      participant
    );
  }

  /**
   * ==================================================
   * LOGIN ADMINISTRATIVO
   * ==================================================
   */
  function handleAdminSuccess() {
    setShowAdminLogin(false);

    onAdminSuccess();
  }

  return (
    <>
      {/* ============================================= */}
      {/* NOTIFICAÇÃO FLUTUANTE */}
      {/* ============================================= */}

      {error && (
        <div
          className="registration-error"
          role="alert"
        >
          <span className="registration-error-icon">
            !
          </span>

          <span className="registration-error-message">
            {error}
          </span>
        </div>
      )}

      {/* ============================================= */}
      {/* TELA DE CADASTRO */}
      {/* ============================================= */}

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
            {/* ======================================= */}
            {/* NOME */}
            {/* ======================================= */}

            <div
              className={`form-field ${
                invalidFields.name
                  ? "form-field-error"
                  : ""
              }`}
            >
              <label htmlFor="player-name">
                Nome completo
              </label>

              <input
                id="player-name"
                type="text"
                value={name}
                onChange={(event) => {
                  setName(
                    event.target.value
                  );

                  clearFieldError(
                    "name"
                  );
                }}
                placeholder="Digite seu nome"
                autoComplete="name"
                aria-invalid={
                  invalidFields.name
                }
                aria-describedby={
                  fieldErrors.name
                    ? "player-name-error"
                    : undefined
                }
              />

              {fieldErrors.name && (
                <span
                  id="player-name-error"
                  className="form-field-error-message"
                  role="alert"
                >
                  {fieldErrors.name}
                </span>
              )}
            </div>

            {/* ======================================= */}
            {/* EMPRESA */}
            {/* ======================================= */}

            <div
              className={`form-field ${
                invalidFields.company
                  ? "form-field-error"
                  : ""
              }`}
            >
              <label htmlFor="player-company">
                Empresa
              </label>

              <input
                id="player-company"
                type="text"
                value={company}
                onChange={(event) => {
                  setCompany(
                    event.target.value
                  );

                  clearFieldError(
                    "company"
                  );
                }}
                placeholder="Digite o nome da empresa"
                autoComplete="organization"
                aria-invalid={
                  invalidFields.company
                }
                aria-describedby={
                  fieldErrors.company
                    ? "player-company-error"
                    : undefined
                }
              />

              {fieldErrors.company && (
                <span
                  id="player-company-error"
                  className="form-field-error-message"
                  role="alert"
                >
                  {fieldErrors.company}
                </span>
              )}
            </div>

            {/* ======================================= */}
            {/* TELEFONE */}
            {/* ======================================= */}

            <div
              className={`form-field ${
                invalidFields.phone
                  ? "form-field-error"
                  : ""
              }`}
            >
              <label htmlFor="player-phone">
                Telefone
              </label>

              <input
                id="player-phone"
                type="tel"
                value={phone}
                onChange={(event) => {
                  setPhone(
                    formatPhone(
                      event.target.value
                    )
                  );

                  clearFieldError(
                    "phone"
                  );
                }}
                placeholder="(00) 00000-0000"
                autoComplete="tel"
                inputMode="numeric"
                maxLength={15}
                aria-invalid={
                  invalidFields.phone
                }
                aria-describedby={
                  fieldErrors.phone
                    ? "player-phone-error"
                    : undefined
                }
              />

              {fieldErrors.phone && (
                <span
                  id="player-phone-error"
                  className="form-field-error-message"
                  role="alert"
                >
                  {fieldErrors.phone}
                </span>
              )}
            </div>

            {/* ======================================= */}
            {/* BOTÃO CADASTRAR */}
            {/* ======================================= */}

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

      {/* ============================================= */}
      {/* ACESSO ADMINISTRATIVO */}
      {/* ============================================= */}

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

      {/* ============================================= */}
      {/* MODAL ADMINISTRATIVO */}
      {/* ============================================= */}

      {showAdminLogin && (
        <AdminLoginModal
          onClose={() =>
            setShowAdminLogin(false)
          }
          onSuccess={
            handleAdminSuccess
          }
        />
      )}
    </>
  );
}