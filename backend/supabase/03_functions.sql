
-- ==============================================================================
-- 03_functions.sql
-- JOGO DA MEMORIA GF CONSULTORES
-- Sincronizacao segura de participantes - Versao corrigida
--
-- Executar somente apos:
--   01_schema.sql
--   02_security.sql
--
-- IMPORTANTE: ainda nao executar no Supabase antes dos testes finais.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.sync_participant(
    p_id UUID,
    p_name TEXT,
    p_company TEXT,
    p_role TEXT,
    p_phone TEXT,
    p_created_at TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_device_user_id UUID;
    v_app_role TEXT;

    v_clean_phone TEXT;
    v_clean_name TEXT;
    v_clean_company TEXT;
    v_clean_role TEXT;
    v_normalized_company TEXT;

    v_existing_participant public.participants%ROWTYPE;
    v_existing_conflict public.participant_conflicts%ROWTYPE;

    v_company_count INTEGER;
    v_lock_phone INTEGER;
    v_lock_company INTEGER;

    v_constraint_name TEXT;
BEGIN

    -- ==============================================================
    -- 1. AUTENTICACAO E AUTORIZACAO
    -- ==============================================================

    v_device_user_id := auth.uid();

    IF v_device_user_id IS NULL THEN
        RETURN pg_catalog.jsonb_build_object(
            'status', 'error',
            'code', 'UNAUTHENTICATED',
            'message', 'Usuario nao autenticado.',
            'id', p_id
        );
    END IF;

    v_app_role := public.current_app_role();

    IF COALESCE(
        v_app_role IN ('device', 'admin'),
        FALSE
    ) = FALSE THEN
        RETURN pg_catalog.jsonb_build_object(
            'status', 'error',
            'code', 'ACCESS_DENIED',
            'message', 'Usuario ou dispositivo nao autorizado.',
            'id', p_id
        );
    END IF;

    -- ==============================================================
    -- 2. VALIDACAO DOS PARAMETROS
    -- ==============================================================

    IF p_id IS NULL
       OR p_name IS NULL
       OR p_company IS NULL
       OR p_role IS NULL
       OR p_phone IS NULL
       OR p_created_at IS NULL THEN

        RETURN pg_catalog.jsonb_build_object(
            'status', 'error',
            'code', 'MISSING_FIELDS',
            'message', 'Campos obrigatorios ausentes.',
            'id', p_id
        );
    END IF;

    -- ==============================================================
    -- 3. NORMALIZACAO DOS DADOS
    -- ==============================================================

    v_clean_phone :=
        pg_catalog.regexp_replace(
            p_phone,
            '[^0-9]',
            '',
            'g'
        );

    v_clean_name :=
        pg_catalog.btrim(
            pg_catalog.regexp_replace(
                p_name,
                '[[:space:]]+',
                ' ',
                'g'
            )
        );

    v_clean_company :=
        pg_catalog.btrim(
            pg_catalog.regexp_replace(
                p_company,
                '[[:space:]]+',
                ' ',
                'g'
            )
        );

    v_clean_role :=
        pg_catalog.btrim(
            pg_catalog.regexp_replace(
                p_role,
                '[[:space:]]+',
                ' ',
                'g'
            )
        );

    v_normalized_company :=
        pg_catalog.lower(v_clean_company);

    -- ==============================================================
    -- 4. VALIDACAO DOS DADOS NORMALIZADOS
    -- ==============================================================

    IF pg_catalog.length(v_clean_phone) NOT BETWEEN 10 AND 11 THEN
        RETURN pg_catalog.jsonb_build_object(
            'status', 'error',
            'code', 'INVALID_PHONE',
            'message', 'Telefone deve conter DDD e 10 ou 11 digitos.',
            'id', p_id
        );
    END IF;

    IF v_clean_name = ''
       OR v_clean_company = ''
       OR v_clean_role = '' THEN

        RETURN pg_catalog.jsonb_build_object(
            'status', 'error',
            'code', 'MISSING_FIELDS',
            'message', 'Nome, empresa e cargo sao obrigatorios.',
            'id', p_id
        );
    END IF;

    -- ==============================================================
    -- 5. BLOQUEIOS PARA SINCRONIZACOES SIMULTANEAS
    --
    -- Os locks usam o telefone e a empresa normalizados.
    -- A ordenacao numerica evita ciclos de espera entre locks.
    -- ==============================================================
    
    v_lock_phone :=
        pg_catalog.hashtext(
            'gf_phone:' || v_clean_phone
        );

    v_lock_company :=
        pg_catalog.hashtext(
            'gf_company:' || v_normalized_company
        );

    IF v_lock_phone < v_lock_company THEN

        PERFORM pg_catalog.pg_advisory_xact_lock(v_lock_phone);
        PERFORM pg_catalog.pg_advisory_xact_lock(v_lock_company);

    ELSIF v_lock_phone > v_lock_company THEN

        PERFORM pg_catalog.pg_advisory_xact_lock(v_lock_company);
        PERFORM pg_catalog.pg_advisory_xact_lock(v_lock_phone);

    ELSE

        PERFORM pg_catalog.pg_advisory_xact_lock(v_lock_phone);

    END IF;

    -- ==============================================================
    -- 6. VERIFICAR SE O UUID JA FOI SINCRONIZADO
    --
    -- Mesmo UUID + mesmos dados = sincronizacao idempotente.
    -- Mesmo UUID + dados diferentes = erro de integridade.
    -- ==============================================================

    SELECT *
    INTO v_existing_participant
    FROM public.participants
    WHERE id = p_id;

    IF FOUND THEN

        IF v_existing_participant.phone = v_clean_phone
           AND v_existing_participant.name = v_clean_name
           AND v_existing_participant.company = v_clean_company
           AND v_existing_participant.normalized_company = v_normalized_company
           AND v_existing_participant.role = v_clean_role
           AND v_existing_participant.created_at = p_created_at
           AND v_existing_participant.device_id = v_device_user_id THEN

            RETURN pg_catalog.jsonb_build_object(
                'status', 'synced',
                'code', 'ALREADY_SYNCED',
                'message', 'Cadastro ja sincronizado.',
                'id', p_id
            );

        ELSE

            RETURN pg_catalog.jsonb_build_object(
                'status', 'error',
                'code', 'UUID_PAYLOAD_MISMATCH',
                'message', 'UUID ja utilizado com dados diferentes.',
                'id', p_id
            );

        END IF;

    END IF;

    -- ==============================================================
    -- 7. VERIFICAR CONFLITO ANTERIOR DO MESMO UUID
    -- ==============================================================

    SELECT *
    INTO v_existing_conflict
    FROM public.participant_conflicts
    WHERE id = p_id;

    IF FOUND THEN

        IF v_existing_conflict.phone = v_clean_phone
           AND v_existing_conflict.name = v_clean_name
           AND v_existing_conflict.company = v_clean_company
           AND v_existing_conflict.normalized_company = v_normalized_company
           AND v_existing_conflict.role = v_clean_role
           AND v_existing_conflict.created_at = p_created_at
           AND v_existing_conflict.device_id = v_device_user_id THEN

            RETURN pg_catalog.jsonb_build_object(
                'status', 'conflict',
                'code', 'ALREADY_RECORDED_CONFLICT',
                'reason', v_existing_conflict.conflict_reason,
                'message', 'Conflito ja registrado anteriormente.',
                'id', p_id
            );

        ELSE

            RETURN pg_catalog.jsonb_build_object(
                'status', 'error',
                'code', 'UUID_PAYLOAD_MISMATCH',
                'message', 'UUID ja utilizado com dados diferentes.',
                'id', p_id
            );

        END IF;

    END IF;

    -- ==============================================================
    -- 8. VERIFICAR TELEFONE DUPLICADO
    -- ==============================================================

    IF EXISTS (
        SELECT 1
        FROM public.participants
        WHERE phone = v_clean_phone
    ) THEN

        INSERT INTO public.participant_conflicts (
            id,
            name,
            company,
            normalized_company,
            role,
            phone,
            created_at,
            conflict_reason,
            details,
            device_id
        )
        VALUES (
            p_id,
            v_clean_name,
            v_clean_company,
            v_normalized_company,
            v_clean_role,
            v_clean_phone,
            p_created_at,
            'duplicate_phone',
            pg_catalog.jsonb_build_object(
                'phone', v_clean_phone
            ),
            v_device_user_id
        )
        ON CONFLICT (id) DO NOTHING;

        RETURN pg_catalog.jsonb_build_object(
            'status', 'conflict',
            'reason', 'duplicate_phone',
            'message', 'Telefone ja cadastrado no evento.',
            'id', p_id
        );

    END IF;

    -- ==============================================================
    -- 9. VERIFICAR LIMITE DE 3 PARTICIPANTES POR EMPRESA
    -- ==============================================================

    SELECT COUNT(*)
    INTO v_company_count
    FROM public.participants
    WHERE normalized_company = v_normalized_company;

    IF v_company_count >= 3 THEN

        INSERT INTO public.participant_conflicts (
            id,
            name,
            company,
            normalized_company,
            role,
            phone,
            created_at,
            conflict_reason,
            details,
            device_id
        )
        VALUES (
            p_id,
            v_clean_name,
            v_clean_company,
            v_normalized_company,
            v_clean_role,
            v_clean_phone,
            p_created_at,
            'company_limit',
            pg_catalog.jsonb_build_object(
                'company', v_clean_company,
                'current_count', v_company_count
            ),
            v_device_user_id
        )
        ON CONFLICT (id) DO NOTHING;

        RETURN pg_catalog.jsonb_build_object(
            'status', 'conflict',
            'reason', 'company_limit',
            'message', 'Empresa atingiu o limite de 3 participantes.',
            'id', p_id
        );

    END IF;

    -- ==============================================================
    -- 10. INSERIR PARTICIPANTE
    -- ==============================================================

    BEGIN

        INSERT INTO public.participants (
            id,
            name,
            company,
            normalized_company,
            role,
            phone,
            created_at,
            device_id
        )
        VALUES (
            p_id,
            v_clean_name,
            v_clean_company,
            v_normalized_company,
            v_clean_role,
            v_clean_phone,
            p_created_at,
            v_device_user_id
        );

    EXCEPTION
        WHEN unique_violation THEN

            GET STACKED DIAGNOSTICS
                v_constraint_name = CONSTRAINT_NAME;

            IF v_constraint_name = 'participants_pkey' THEN

                RETURN pg_catalog.jsonb_build_object(
                    'status', 'error',
                    'code', 'UUID_PAYLOAD_MISMATCH',
                    'message', 'UUID ja utilizado.',
                    'id', p_id
                );

            ELSIF v_constraint_name = 'participants_phone_unique' THEN

                INSERT INTO public.participant_conflicts (
                    id,
                    name,
                    company,
                    normalized_company,
                    role,
                    phone,
                    created_at,
                    conflict_reason,
                    details,
                    device_id
                )
                VALUES (
                    p_id,
                    v_clean_name,
                    v_clean_company,
                    v_normalized_company,
                    v_clean_role,
                    v_clean_phone,
                    p_created_at,
                    'duplicate_phone',
                    pg_catalog.jsonb_build_object(
                        'phone', v_clean_phone
                    ),
                    v_device_user_id
                )
                ON CONFLICT (id) DO NOTHING;

                RETURN pg_catalog.jsonb_build_object(
                    'status', 'conflict',
                    'reason', 'duplicate_phone',
                    'message', 'Telefone ja cadastrado.',
                    'id', p_id
                );

            ELSE

                RAISE;

            END IF;

    END;

    -- ==============================================================
    -- 11. CONFIRMACAO DE SINCRONIZACAO
    -- ==============================================================

    RETURN pg_catalog.jsonb_build_object(
        'status', 'synced',
        'code', 'SUCCESS',
        'message', 'Participante sincronizado com sucesso.',
        'id', p_id
    );

EXCEPTION
    WHEN OTHERS THEN

        -- Registra o erro no servidor, sem expor detalhes ao aplicativo.
        RAISE WARNING
            'sync_participant error [%]: %',
            SQLSTATE,
            SQLERRM;

        RETURN pg_catalog.jsonb_build_object(
            'status', 'error',
            'code', 'SERVER_ERROR',
            'message', 'Erro interno ao processar cadastro.',
            'id', p_id
        );

END;
$$;

-- ==============================================================================
-- PERMISSOES DA FUNCAO
-- ==============================================================================

REVOKE ALL ON FUNCTION public.sync_participant(
    UUID, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.sync_participant(
    UUID, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ
) TO authenticated;

COMMENT ON FUNCTION public.sync_participant(
    UUID, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ
) IS
'Sincronizacao segura com validacao de perfil, UUID, telefone, limite por empresa e controle de concorrencia.';
