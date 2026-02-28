# Runbook Operacional - MarketNow

## Como testar login

1. Acessar `/login`.
2. Informar email e senha de um usuario valido.
3. Confirmar redirecionamento para area autenticada (`/dashboard`).
4. Confirmar que a sessao persiste ao atualizar a pagina.

## Como testar cadastro

1. Acessar `/register`.
2. Informar email novo e senha valida.
3. Confirmar mensagem de sucesso.
4. Se houver confirmacao por email ativa, validar abertura do link enviado.
5. Fazer login com as credenciais cadastradas.

## Como testar reset de senha

1. Acessar `/reset-password`.
2. Solicitar redefinicao para um email existente.
3. Abrir o link recebido por email.
4. Definir nova senha em `/reset-password/confirm`.
5. Confirmar redirecionamento para `/login`.
6. Fazer login com a nova senha.

## Onde ver logs no Supabase

1. Dashboard do projeto Supabase.
2. Menu `Logs` para Auth, Database e API.
3. Para erros de permissao, validar politicas RLS e eventos de Auth.

## Onde ver logs na Vercel

1. Dashboard da Vercel > projeto MarketNow.
2. Acessar o deployment de producao.
3. Ver `Runtime Logs` e `Build Logs`.
4. Em falha de build, revisar primeiro os logs de install/build.
