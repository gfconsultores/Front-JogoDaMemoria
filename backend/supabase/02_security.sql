
-- ==============================================================================
-- 02_security.sql
-- JOGO DA MEMORIA GF CONSULTORES
-- Seguranca, permissoes e Row Level Security (RLS)
--
-- Executar apos 01_schema.sql e antes de 03_functions.sql.
-- ==============================================================================

-- 1. Funcao auxiliar de autorizacao

CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT p.role
    FROM public.user_profiles AS p
    WHERE p.id = auth.uid()
      AND p.is_active = true;
$$;

COMMENT ON FUNCTION public.current_app_role() IS
'Retorna o perfil ativo do usuario autenticado.';

REVOKE ALL ON FUNCTION public.current_app_role()
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.current_app_role()
TO authenticated;


-- 2. Ativar RLS em todas as tabelas

ALTER TABLE public.user_profiles
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.participants
ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.participant_conflicts
ENABLE ROW LEVEL SECURITY;


-- 3. Permissoes das tabelas
-- Clientes autenticados podem consultar apenas dados permitidos pelo RLS.
-- Escritas diretas sao proibidas.

REVOKE ALL ON TABLE public.user_profiles
FROM PUBLIC, anon, authenticated;

REVOKE ALL ON TABLE public.participants
FROM PUBLIC, anon, authenticated;

REVOKE ALL ON TABLE public.participant_conflicts
FROM PUBLIC, anon, authenticated;

GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT ON TABLE public.user_profiles
TO authenticated;

GRANT SELECT ON TABLE public.participants
TO authenticated;

GRANT SELECT ON TABLE public.participant_conflicts
TO authenticated;


-- 4. Remover politicas conhecidas de versoes anteriores
-- Isso evita que politicas permissivas antigas continuem ativas.

DROP POLICY IF EXISTS "user_profiles_select_policy"
ON public.user_profiles;

DROP POLICY IF EXISTS "user_profiles_insert_deny"
ON public.user_profiles;

DROP POLICY IF EXISTS "user_profiles_update_deny"
ON public.user_profiles;

DROP POLICY IF EXISTS "user_profiles_delete_deny"
ON public.user_profiles;

DROP POLICY IF EXISTS "participants_select_admin"
ON public.participants;

DROP POLICY IF EXISTS "participants_insert_deny"
ON public.participants;

DROP POLICY IF EXISTS "participants_update_deny"
ON public.participants;

DROP POLICY IF EXISTS "participants_delete_deny"
ON public.participants;

DROP POLICY IF EXISTS "conflicts_select_admin"
ON public.participant_conflicts;

DROP POLICY IF EXISTS "conflicts_insert_deny"
ON public.participant_conflicts;

DROP POLICY IF EXISTS "conflicts_update_deny"
ON public.participant_conflicts;

DROP POLICY IF EXISTS "conflicts_delete_deny"
ON public.participant_conflicts;


-- 5. Perfis: usuario ativo ve seu proprio perfil.
-- Administrador ativo pode consultar todos os perfis.

CREATE POLICY "user_profiles_select_policy"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (
    (
        id = (SELECT auth.uid())
        AND is_active = true
    )
    OR (
        (SELECT public.current_app_role()) = 'admin'
    )
);


-- 6. Participantes: somente administradores ativos podem ler.

CREATE POLICY "participants_select_admin"
ON public.participants
FOR SELECT
TO authenticated
USING (
    (SELECT public.current_app_role()) = 'admin'
);


-- 7. Conflitos: somente administradores ativos podem ler.

CREATE POLICY "conflicts_select_admin"
ON public.participant_conflicts
FOR SELECT
TO authenticated
USING (
    (SELECT public.current_app_role()) = 'admin'
);


-- 8. Nenhuma politica de INSERT, UPDATE ou DELETE e criada.
-- Com RLS ativo e sem privilegios de escrita, o acesso direto e negado.
-- A sincronizacao ocorre exclusivamente pela RPC SECURITY DEFINER.

-- 9. Protecao adicional contra execucao anonima da RPC,
-- caso a funcao ja exista.

DO $$
BEGIN
    IF pg_catalog.to_regprocedure(
        'public.sync_participant(uuid,text,text,text,text,timestamp with time zone)'
    ) IS NOT NULL THEN
        REVOKE ALL ON FUNCTION public.sync_participant(
            UUID, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ
        ) FROM PUBLIC, anon;
    END IF;
END;
$$;
