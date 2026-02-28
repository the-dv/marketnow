# Arquitetura - MarketNow

## Visao geral

O MarketNow usa arquitetura de frontend serverless:
- Frontend em Next.js (App Router)
- Backend as a Service com Supabase (Auth + Postgres)
- Deploy continuo na Vercel

Nao existe backend customizado separado neste projeto. O frontend conversa direto com o Supabase usando cliente browser/server e regras de RLS.

## Blocos principais

### Frontend (Next.js)

- Rotas publicas: login, cadastro e reset de senha
- Rotas autenticadas: dashboard e listas
- Componentizacao em `src/components` e organizacao de rotas em `src/app`

### Backend as a Service (Supabase)

- Auth por email/senha
- Banco Postgres com tabelas de dominio da aplicacao
- RLS para garantir isolamento de dados entre usuarios

### Autenticacao

- Sessao gerenciada pelo Supabase Auth
- Middlewares/guards de rota para areas autenticadas
- Fluxos suportados: cadastro, login e redefinicao de senha

### Deploy (Vercel)

- Build e hosting do frontend Next.js
- Variaveis de ambiente configuradas no projeto Vercel
- Publicacao da branch `main` como ambiente de producao

## Fluxo de requisicoes

1. Usuario acessa a aplicacao pela Vercel.
2. Frontend renderiza pagina e valida estado de autenticacao.
3. Acoes de usuario disparam chamadas para Supabase (Auth e Database).
4. Supabase aplica RLS e retorna apenas dados permitidos para o usuario autenticado.
5. Frontend atualiza estado/tela com base na resposta.

## Limites de responsabilidade

- Regras de acesso a dados ficam no Supabase (RLS), nao no cliente.
- Frontend usa apenas credenciais publicas (`ANON KEY`).
- Sem API proprietaria adicional para este escopo de portfolio.
