import { useEffect, useState } from "react";

import { GF_ADMIN } from "../../config/adminConfig";

import "./AdminLoginModal.css";

interface AdminLoginModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface FieldErrors {
  login?: string;
  password?: string;
}

interface InvalidFields {
  login: boolean;
  password: boolean;
}

const INITIAL_INVALID_FIELDS: InvalidFields = {
  login: false,
  password: false,
};

export function AdminLoginModal({
  onClose,
  onSuccess,
}: AdminLoginModalProps) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  /**
   * Mensagem geral.
   *
   * Utilizada quando:
   * - os dois campos estão vazios;
   * - login ou senha estão incorretos.
   */
  const [error, setError] = useState("");

  /**
   * Mensagens específicas exibidas
   * abaixo dos campos.
   */
  const [fieldErrors, setFieldErrors] =
    useState<FieldErrors>({});

  /**
   * Controla quais campos recebem
   * destaque visual de erro.
   */
  const [invalidFields, setInvalidFields] =
    useState<InvalidFields>(
      INITIAL_INVALID_FIELDS
    );

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
   * NORMALIZAR LOGIN
   * ==================================================
   *
   * O login não diferencia letras maiúsculas
   * e minúsculas.
   */
  function normalizeLogin(value: string) {
    return value
      .trim()
      .toLocaleLowerCase("pt-BR");
  }

  /**
   * ==================================================
   * LIMPAR ERRO DE UM CAMPO
   * ==================================================
   *
   * Assim que o usuário começa a corrigir
   * determinado campo, removemos o erro
   * daquele campo.
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
     * Remove também eventual aviso geral
     * quando o usuário começa a corrigir
     * os dados.
     */
    if (error) {
      setError("");
    }
  }

  /**
   * ==================================================
   * VALIDAR ACESSO ADMINISTRATIVO
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

    const cleanLogin =
      normalizeLogin(login);

    /**
     * A senha não é normalizada.
     *
     * Maiúsculas, minúsculas, espaços e
     * caracteres especiais são preservados.
     */
    const cleanPassword =
      password;

    /**
     * ==================================================
     * LOGIN E SENHA VAZIOS
     * ==================================================
     *
     * Se os dois campos estiverem vazios:
     *
     * - mostra somente um aviso geral;
     * - destaca os dois campos em vermelho;
     * - não mostra "Campo obrigatório" duas vezes.
     */
    if (
      !cleanLogin &&
      !cleanPassword
    ) {
      setInvalidFields({
        login: true,
        password: true,
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
     * Se somente um campo estiver vazio,
     * mostramos a mensagem apenas abaixo
     * daquele campo.
     */
    const requiredErrors: FieldErrors = {};

    const requiredInvalidFields: InvalidFields = {
      login: false,
      password: false,
    };

    if (!cleanLogin) {
      requiredErrors.login =
        "Campo obrigatório.";

      requiredInvalidFields.login =
        true;
    }

    if (!cleanPassword) {
      requiredErrors.password =
        "Campo obrigatório.";

      requiredInvalidFields.password =
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
     * VALIDAR CREDENCIAIS
     * ==================================================
     */
    const adminLogin =
      normalizeLogin(
        GF_ADMIN.login
      );

    if (
      cleanLogin !== adminLogin ||
      cleanPassword !== GF_ADMIN.password
    ) {
      /**
       * Não indicamos se foi o login
       * ou a senha que está incorreto.
       */
      setError(
        "Login ou senha incorretos."
      );

      return;
    }

    /**
     * ==================================================
     * ACESSO AUTORIZADO
     * ==================================================
     */
    onSuccess();
  }

  return (
    <>
      {/* ============================================= */}
      {/* AVISO DE ERRO FORA DO MODAL */}
      {/* ============================================= */}

      {error && (
        <div
          className="admin-login-error-toast"
          role="alert"
        >
          <span className="admin-login-error-toast-icon">
            !
          </span>

          <span className="admin-login-error-toast-message">
            {error}
          </span>
        </div>
      )}

      {/* ============================================= */}
      {/* MODAL DE ACESSO ADMINISTRATIVO */}
      {/* ============================================= */}

      <div className="admin-login-overlay">
        <section className="admin-login-modal">
          {/* ========================================= */}
          {/* BOTÃO VOLTAR */}
          {/* ========================================= */}

          <button
            type="button"
            className="admin-login-back"
            onClick={onClose}
            aria-label="Voltar ao cadastro"
            title="Voltar"
          >
            <span className="admin-login-back-icon" />
          </button>

          {/* ========================================= */}
          {/* CABEÇALHO */}
          {/* ========================================= */}

          <header className="admin-login-header">
            <span>
              Desafio GF
            </span>

            <h2>
              Acesso administrativo
            </h2>

            <p>
              Informe seu login e senha para continuar.
            </p>
          </header>

          {/* ========================================= */}
          {/* FORMULÁRIO */}
          {/* ========================================= */}

          <form
            className="admin-login-form"
            onSubmit={handleSubmit}
            noValidate
          >
            {/* ======================================= */}
            {/* LOGIN */}
            {/* ======================================= */}

            <div
              className={`admin-login-field ${
                invalidFields.login
                  ? "admin-login-field-error"
                  : ""
              }`}
            >
              <label htmlFor="admin-login">
                Login
              </label>

              <input
                id="admin-login"
                type="text"
                value={login}
                onChange={(event) => {
                  setLogin(
                    event.target.value
                  );

                  clearFieldError(
                    "login"
                  );
                }}
                placeholder="Digite seu login"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                aria-invalid={
                  invalidFields.login
                }
                aria-describedby={
                  fieldErrors.login
                    ? "admin-login-field-error"
                    : undefined
                }
              />

              {fieldErrors.login && (
                <span
                  id="admin-login-field-error"
                  className="admin-login-field-error-message"
                  role="alert"
                >
                  {fieldErrors.login}
                </span>
              )}
            </div>

            {/* ======================================= */}
            {/* SENHA */}
            {/* ======================================= */}

            <div
              className={`admin-login-field ${
                invalidFields.password
                  ? "admin-login-field-error"
                  : ""
              }`}
            >
              <label htmlFor="admin-password">
                Senha
              </label>

              <div className="admin-password-wrapper">
                <input
                  id="admin-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) => {
                    setPassword(
                      event.target.value
                    );

                    clearFieldError(
                      "password"
                    );
                  }}
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  aria-invalid={
                    invalidFields.password
                  }
                  aria-describedby={
                    fieldErrors.password
                      ? "admin-password-field-error"
                      : undefined
                  }
                />

                <button
                  type="button"
                  className={`admin-password-toggle ${
                    showPassword
                      ? "is-visible"
                      : ""
                  }`}
                  onClick={() => {
                    setShowPassword(
                      (current) =>
                        !current
                    );
                  }}
                  aria-label={
                    showPassword
                      ? "Ocultar senha"
                      : "Mostrar senha"
                  }
                  title={
                    showPassword
                      ? "Ocultar senha"
                      : "Mostrar senha"
                  }
                >
                  {showPassword ? (
                    /*
                     * OLHO RISCADO
                     * SENHA VISÍVEL
                     */
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        d="M3 3L21 21"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                      />

                      <path
                        d="M10.7 10.8a2 2 0 0 0 2.5 2.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                      />

                      <path
                        d="M9.9 4.3A9.7 9.7 0 0 1 12 4c5.5 0 9 5 9 5a15.7 15.7 0 0 1-3.1 3.4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      <path
                        d="M6.2 6.2A15.5 15.5 0 0 0 3 9s3.5 5 9 5c1 0 2-.2 2.9-.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    /*
                     * OLHO NORMAL
                     * SENHA OCULTA
                     */
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        d="M2.5 12s3.5-5.5 9.5-5.5S21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      <circle
                        cx="12"
                        cy="12"
                        r="2.6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      />
                    </svg>
                  )}
                </button>
              </div>

              {fieldErrors.password && (
                <span
                  id="admin-password-field-error"
                  className="admin-login-field-error-message"
                  role="alert"
                >
                  {fieldErrors.password}
                </span>
              )}
            </div>

            {/* ======================================= */}
            {/* BOTÃO ENTRAR */}
            {/* ======================================= */}

            <button
              type="submit"
              className="admin-login-submit"
            >
              Entrar
            </button>
          </form>
        </section>
      </div>
    </>
  );
}