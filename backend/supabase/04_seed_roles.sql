-- ==============================================================================
-- 04_seed_roles.sql
-- Jogo da Memória GF - Guia e Instruções para Criação de Usuários e Perfis
-- ==============================================================================

/*
COMO FUNCIONA A ATRIBUIÇÃO DE PERFIS:

1. No Supabase Dashboard (Authentication > Users > "Add user" > "Create user"):
   - Crie o usuário do Totem 27":
     Email: totem27@gf.app
     Password: [DEFINIR_SENHA_FORTE]
     Auto Confirm User: Sim

   - Crie o usuário do Xiaomi Pad 7 (para testes/backup):
     Email: pad7@gf.app
     Password: [DEFINIR_SENHA_FORTE]
     Auto Confirm User: Sim

   - Crie o usuário do Administrador da GF:
     Email: admin@gfconsultores.com.br
     Password: [DEFINIR_SENHA_FORTE]
     Auto Confirm User: Sim

2. Após criar os usuários, copie os seus respectivos UUIDs (coluna User UID no painel)
   e execute os comandos abaixo no SQL Editor do Supabase para vincular os perfis:
*/

-- Substitua 'SEU_UID_DO_TOTEM_AQUI' pelo UID real do usuário criado:
-- INSERT INTO public.user_profiles (id, role, device_name, is_active)
-- VALUES 
--     ('SEU_UID_DO_TOTEM_AQUI', 'device', 'Totem 27 Polegadas Vertical', true)
-- ON CONFLICT (id) DO UPDATE 
-- SET role = EXCLUDED.role, device_name = EXCLUDED.device_name, is_active = EXCLUDED.is_active;

-- Substitua 'SEU_UID_DO_PAD7_AQUI' pelo UID real do usuário criado:
-- INSERT INTO public.user_profiles (id, role, device_name, is_active)
-- VALUES 
--     ('SEU_UID_DO_PAD7_AQUI', 'device', 'Xiaomi Pad 7 - Testes', true)
-- ON CONFLICT (id) DO UPDATE 
-- SET role = EXCLUDED.role, device_name = EXCLUDED.device_name, is_active = EXCLUDED.is_active;

-- Substitua 'SEU_UID_DO_ADMIN_AQUI' pelo UID real do usuário criado:
-- INSERT INTO public.user_profiles (id, role, device_name, is_active)
-- VALUES 
--     ('SEU_UID_DO_ADMIN_AQUI', 'admin', 'Administrador GF Consultores', true)
-- ON CONFLICT (id) DO UPDATE 
-- SET role = EXCLUDED.role, device_name = EXCLUDED.device_name, is_active = EXCLUDED.is_active;

-- ------------------------------------------------------------------------------
-- CONSULTA PARA CONFERIR OS DISPOSITIVOS E ADMINISTRADORES ATIVOS:
-- ------------------------------------------------------------------------------
-- SELECT 
--     u.email,
--     p.role,
--     p.device_name,
--     p.is_active,
--     p.created_at
-- FROM public.user_profiles p
-- JOIN auth.users u ON u.id = p.id
-- ORDER BY p.created_at DESC;
