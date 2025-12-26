@echo off
echo ========================================
echo   GREG'S PIZZA - DEPLOY COMPLETO
echo ========================================
echo.

echo [1/4] Verificando Vercel CLI...
vercel --version
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERRO: Vercel CLI nao encontrado!
    echo Instale com: npm i -g vercel
    pause
    exit /b 1
)

echo.
echo [2/4] Fazendo login no Vercel...
echo (Uma janela do navegador vai abrir)
vercel login

echo.
echo [3/4] Fazendo deploy para producao...
echo (Isso pode levar 2-3 minutos)
vercel --prod --yes

echo.
echo ========================================
echo   DEPLOY CONCLUIDO!
echo ========================================
echo.
echo Proximos passos:
echo 1. Acesse https://supabase.com/dashboard
echo 2. Execute o arquivo supabase-schema.sql
echo 3. Configure as variaveis de ambiente no Vercel
echo 4. Teste o app em producao!
echo.
pause
