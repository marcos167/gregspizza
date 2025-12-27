-- ============================================
-- CEO PROTECTION - ULTIMATE SECURITY
-- ============================================
-- Garante que o usuário marco.lp12@hotmail.com NUNCA possa ser:
-- - Deletado
-- - Ter role alterada
-- - Ter email alterado
-- - Ter tenant_id adicionado
-- ============================================

-- 1. Criar função para bloquear modificações no CEO
CREATE OR REPLACE FUNCTION protect_ceo_account()
RETURNS TRIGGER AS $$
BEGIN
    -- Bloquear DELETE do CEO
    IF TG_OP = 'DELETE' THEN
        IF OLD.email = 'marco.lp12@hotmail.com' THEN
            RAISE EXCEPTION '🚫 ACESSO NEGADO: Conta do CEO não pode ser deletada!';
        END IF;
        RETURN OLD;
    END IF;

    -- Bloquear UPDATE do CEO
    IF TG_OP = 'UPDATE' THEN
        IF OLD.email = 'marco.lp12@hotmail.com' THEN
            -- Bloquear alteração de email
            IF NEW.email != OLD.email THEN
                RAISE EXCEPTION '🚫 ACESSO NEGADO: Email do CEO não pode ser alterado!';
            END IF;
            
            -- Bloquear alteração de role
            IF NEW.role != 'SUPER_ADMIN' THEN
                RAISE EXCEPTION '🚫 ACESSO NEGADO: Role do CEO deve sempre ser SUPER_ADMIN!';
            END IF;
            
            -- Bloquear adição de tenant_id (CEO nunca pode ter tenant)
            IF NEW.tenant_id IS NOT NULL THEN
                RAISE EXCEPTION '🚫 ACESSO NEGADO: CEO não pode ter tenant_id!';
            END IF;
            
            -- Bloquear mudança de status
            IF NEW.status != 'ACTIVE' THEN
                RAISE EXCEPTION '🚫 ACESSO NEGADO: CEO deve sempre estar ACTIVE!';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Criar trigger BEFORE para bloquear operações
DROP TRIGGER IF EXISTS trigger_protect_ceo ON user_profiles;
CREATE TRIGGER trigger_protect_ceo
    BEFORE UPDATE OR DELETE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION protect_ceo_account();

-- 3. Garantir que o CEO está corretamente configurado
UPDATE user_profiles
SET 
    role = 'SUPER_ADMIN',
    tenant_id = NULL,
    status = 'ACTIVE'
WHERE email = 'marco.lp12@hotmail.com';

-- 4. RLS Policy adicional: Apenas o próprio CEO pode atualizar seus dados
-- (e mesmo assim, com as restrições do trigger acima)
DROP POLICY IF EXISTS "ceo_self_update" ON user_profiles;
CREATE POLICY "ceo_self_update" ON user_profiles
FOR UPDATE
TO authenticated
USING (
    email = 'marco.lp12@hotmail.com' 
    AND id = auth.uid()
)
WITH CHECK (
    email = 'marco.lp12@hotmail.com' 
    AND id = auth.uid()
    AND role = 'SUPER_ADMIN'
    AND tenant_id IS NULL
    AND status = 'ACTIVE'
);

-- 5. Comentários de documentação
COMMENT ON FUNCTION protect_ceo_account IS 'PROTEÇÃO CEO: Impede qualquer modificação no perfil marco.lp12@hotmail.com';
COMMENT ON TRIGGER trigger_protect_ceo ON user_profiles IS 'PROTEÇÃO CEO: Garante integridade da conta do CEO';

-- 6. Verificação final
DO $$ 
DECLARE
    ceo_record RECORD;
BEGIN
    SELECT * INTO ceo_record 
    FROM user_profiles 
    WHERE email = 'marco.lp12@hotmail.com';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION '❌ CEO não encontrado! Crie o usuário primeiro.';
    END IF;
    
    IF ceo_record.role != 'SUPER_ADMIN' THEN
        RAISE EXCEPTION '❌ CEO deve ser SUPER_ADMIN!';
    END IF;
    
    IF ceo_record.tenant_id IS NOT NULL THEN
        RAISE EXCEPTION '❌ CEO não pode ter tenant_id!';
    END IF;
    
    IF ceo_record.status != 'ACTIVE' THEN
        RAISE EXCEPTION '❌ CEO deve estar ACTIVE!';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '🛡️  PROTEÇÃO CEO ATIVADA COM SUCESSO!';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '👤 Email: %', ceo_record.email;
    RAISE NOTICE '👑 Role: %', ceo_record.role;
    RAISE NOTICE '🏢 Tenant: % (sempre NULL para CEO)', ceo_record.tenant_id;
    RAISE NOTICE '✅ Status: %', ceo_record.status;
    RAISE NOTICE '';
    RAISE NOTICE '🔒 PROTEÇÕES ATIVAS:';
    RAISE NOTICE '   ✓ Impossível deletar conta';
    RAISE NOTICE '   ✓ Impossível alterar email';
    RAISE NOTICE '   ✓ Impossível alterar role';
    RAISE NOTICE '   ✓ Impossível adicionar tenant_id';
    RAISE NOTICE '   ✓ Impossível alterar status';
    RAISE NOTICE '';
    RAISE NOTICE '🚨 Tentativas de modificação serão BLOQUEADAS com erro!';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;
