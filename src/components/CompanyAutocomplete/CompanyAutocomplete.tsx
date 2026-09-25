import { useState } from "react";

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
 * Empresas temporarias utilizadas apenas
 * durante o desenvolvimento do front-end.
 *
 * Futuramente esta lista sera substituida
 * pela consulta ao backend.
 */
const testCompanies: Company[] = [
  {
    id: "company-001",
    name: "G3 Telecom",
  },
  {
    id: "company-002",
    name: "Grande Rede",
  },
  {
    id: "company-003",
    name: "Oxente Net Telecom",
  },
  {
    id: "company-004",
    name: "ST1 Internet",
  },
  {
    id: "company-005",
    name: "Connect Fibra",
  },
];

export function CompanyAutocomplete({
  value,
  onChange,
}: CompanyAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);

  const normalizedSearch = value
    .trim()
    .toLocaleLowerCase("pt-BR");

  /**
   * Procura empresas que contenham
   * o texto digitado.
   */
  const filteredCompanies =
    normalizedSearch.length > 0
      ? testCompanies.filter((company) =>
          company.name
            .toLocaleLowerCase("pt-BR")
            .includes(normalizedSearch)
        )
      : [];

  /**
   * Verifica se existe uma empresa
   * com exatamente o mesmo nome digitado.
   */
  const exactCompanyExists = testCompanies.some(
    (company) =>
      company.name
        .trim()
        .toLocaleLowerCase("pt-BR") ===
      normalizedSearch
  );

  function handleInputChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    onChange(event.target.value);
    setIsOpen(true);
  }

  function handleSelectCompany(company: Company) {
    onChange(company.name);
    setIsOpen(false);
  }

  /**
   * Simula o cadastro de uma nova empresa.
   *
   * Por enquanto apenas selecionamos o nome
   * digitado e fechamos a lista.
   *
   * Futuramente esta funcao chamara o backend.
   */
  function handleNewCompany() {
    const newCompanyName = value.trim();

    if (!newCompanyName) {
      return;
    }

    onChange(newCompanyName);
    setIsOpen(false);
  }

  return (
    <div className="company-autocomplete">
      <input
        id="player-company"
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => {
          if (value.trim()) {
            setIsOpen(true);
          }
        }}
        placeholder="Digite o nome da empresa"
        autoComplete="off"
        required
      />

      {isOpen && normalizedSearch && (
        <div className="company-suggestions">
          {filteredCompanies.map((company) => (
            <button
              key={company.id}
              type="button"
              className="company-suggestion"
              onClick={() =>
                handleSelectCompany(company)
              }
            >
              {company.name}
            </button>
          ))}

          {!exactCompanyExists && (
            <>
              {filteredCompanies.length > 0 && (
                <div className="company-divider" />
              )}

              <button
                type="button"
                className="company-create"
                onClick={handleNewCompany}
              >
                <span className="company-create-icon">
                  +
                </span>

                <span>
                  Cadastrar{" "}
                  <strong>
                    &quot;{value.trim()}&quot;
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