
-- ==============================================================================
-- 01_schema.sql
-- JOGO DA MEMORIA GF CONSULTORES
-- Estrutura do banco de dados Supabase
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Perfis dos usuarios e dispositivos

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('device', 'admin')),
    device_name TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.user_profiles IS
'Perfis autorizados da aplicacao: dispositivos e administradores.';

-- 2. Participantes confirmados

CREATE TABLE IF NOT EXISTS public.participants (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    company TEXT NOT NULL,
    normalized_company TEXT NOT NULL,
    role TEXT NOT NULL,
    phone TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    device_id UUID REFERENCES auth.users(id),

    CONSTRAINT participants_phone_unique UNIQUE (phone),

    CONSTRAINT participants_name_not_empty
        CHECK (length(btrim(name)) > 0),

    CONSTRAINT participants_company_not_empty
        CHECK (length(btrim(company)) > 0),

    CONSTRAINT participants_normalized_company_not_empty
        CHECK (length(btrim(normalized_company)) > 0),

    CONSTRAINT participants_role_not_empty
        CHECK (length(btrim(role)) > 0),

    CONSTRAINT participants_phone_format
        CHECK (phone ~ '^[0-9]{10,11}$')
);

CREATE INDEX IF NOT EXISTS idx_participants_normalized_company
    ON public.participants (normalized_company);

CREATE INDEX IF NOT EXISTS idx_participants_created_at
    ON public.participants (created_at DESC);

-- O UNIQUE(phone) ja cria o indice necessario para o telefone.

COMMENT ON TABLE public.participants IS
'Participantes confirmados do Desafio GF.';

-- 3. Cadastros rejeitados por conflito

CREATE TABLE IF NOT EXISTS public.participant_conflicts (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    company TEXT NOT NULL,
    normalized_company TEXT NOT NULL,
    role TEXT NOT NULL,
    phone TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,

    conflict_reason TEXT NOT NULL
        CHECK (
            conflict_reason IN (
                'duplicate_phone',
                'company_limit',
                'unexpected_error'
            )
        ),

    details JSONB,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    device_id UUID REFERENCES auth.users(id),
    resolved BOOLEAN NOT NULL DEFAULT false,
    resolution_notes TEXT,

    CONSTRAINT conflicts_name_not_empty
        CHECK (length(btrim(name)) > 0),

    CONSTRAINT conflicts_company_not_empty
        CHECK (length(btrim(company)) > 0),

    CONSTRAINT conflicts_normalized_company_not_empty
        CHECK (length(btrim(normalized_company)) > 0),

    CONSTRAINT conflicts_role_not_empty
        CHECK (length(btrim(role)) > 0),

    CONSTRAINT conflicts_phone_format
        CHECK (phone ~ '^[0-9]{10,11}$')
);

CREATE INDEX IF NOT EXISTS idx_participant_conflicts_company
    ON public.participant_conflicts (normalized_company);

CREATE INDEX IF NOT EXISTS idx_participant_conflicts_phone
    ON public.participant_conflicts (phone);

CREATE INDEX IF NOT EXISTS idx_participant_conflicts_reason
    ON public.participant_conflicts (conflict_reason);

COMMENT ON TABLE public.participant_conflicts IS
'Historico de cadastros rejeitados por duplicidade ou limite por empresa.';
