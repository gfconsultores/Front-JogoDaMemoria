import { useEffect, useState } from "react";

import {
  getParticipants,
} from "../../storage/participantsStorage";

import "./CompanyAutocomplete.css";

interface Company {
  id: string;
  name: string;
}

interface CompanyAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * ==================================================
 * NORMALIZAR NOME DA EMPRESA
 * ==================================================
 *
 * Utilizado para evitar empresas duplicadas
 * apenas por diferenças de maiúsculas,
 * minúsculas ou espaços.
 */
function normalizeCompany(
  company: string
): string {
  return company
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("pt-BR");
}

export function CompanyAutocomplete({
  value,
  onChange,
}: CompanyAutocompleteProps) {
  const [isOpen, setIsOpen] =
    useState(false);
  const [companies, setCompanies] =
    useState<Company[]>([]);

  useEffect(() => {
    let isMounted = true;

    getParticipants().then((participants) => {
      if (!isMounted) return;

      const map = new Map<string, Company>();

      participants.forEach((participant) => {
        const companyName = participant.company.trim();
        const normalizedName = normalizeCompany(companyName);

        if (!normalizedName || map.has(normalizedName)) {
          return;
        }

        map.set(normalizedName, {
          id: normalizedName,
          name: companyName,
        });
      });

      setCompanies(
        Array.from(map.values()).sort((a, b) =>
          a.name.localeCompare(b.name, "pt-BR")
        )
      );
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const normalizedSearch =
    normalizeCompany(value);

  /**
   * ==================================================
   * FILTRAR EMPRESAS
   * ==================================================
   */
  const filteredCompanies =
    normalizedSearch.length > 0
      ? companies.filter(
          (company) =>
            normalizeCompany(
              company.name
            ).includes(
              normalizedSearch
            )
        )
      : [];

  /**
   * ==================================================
   * EMPRESA EXATA JÁ EXISTE
   * ==================================================
   */
  const exactCompanyExists =
    companies.some(
      (company) =>
        normalizeCompany(
          company.name
        ) === normalizedSearch
    );

  /**
   * ==================================================
   * ALTERAR TEXTO
   * ==================================================
   */
  function handleInputChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    onChange(
      event.target.value
    );

    setIsOpen(true);
  }

  /**
   * ==================================================
   * SELECIONAR EMPRESA EXISTENTE
   * ==================================================
   */
  function handleSelectCompany(
    company: Company
  ) {
    onChange(
      company.name
    );

    setIsOpen(false);
  }

  /**
   * ==================================================
   * UTILIZAR NOVA EMPRESA
   * ==================================================
   *
   * A empresa será efetivamente armazenada
   * quando o participante for cadastrado.
   */
  function handleNewCompany() {
    const newCompanyName =
      value
        .trim()
        .replace(/\s+/g, " ");

    if (!newCompanyName) {
      return;
    }

    onChange(
      newCompanyName
    );

    setIsOpen(false);
  }

  return (
    <div className="company-autocomplete">
      <input
        id="player-company"
        type="text"
        value={value}
        onChange={
          handleInputChange
        }
        onFocus={() => {
          if (value.trim()) {
            setIsOpen(true);
          }
        }}
        placeholder="Digite o nome da empresa"
        autoComplete="off"
        required
      />

      {isOpen &&
        normalizedSearch && (
          <div className="company-suggestions">
            {filteredCompanies.map(
              (company) => (
                <button
                  key={
                    company.id
                  }
                  type="button"
                  className="company-suggestion"
                  onClick={() =>
                    handleSelectCompany(
                      company
                    )
                  }
                >
                  {company.name}
                </button>
              )
            )}

            {!exactCompanyExists && (
              <>
                {filteredCompanies.length >
                  0 && (
                  <div className="company-divider" />
                )}

                <button
                  type="button"
                  className="company-create"
                  onClick={
                    handleNewCompany
                  }
                >
                  <span className="company-create-icon">
                    +
                  </span>

                  <span>
                    Cadastrar{" "}
                    <strong>
                      &quot;
                      {value.trim()}
                      &quot;
                    </strong>
                  </span>
                </button>
              </>
            )}
          </div>
        )}
    </div>
  );
}