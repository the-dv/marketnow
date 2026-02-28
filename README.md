# MarketNow

Aplicacao web para gerenciamento de listas de compras com autenticacao por email/senha e acompanhamento de produtos por usuario.
O foco do projeto e oferecer um fluxo simples de cadastro, login, recuperacao de senha e operacao segura de dados com Supabase.
Este repositorio representa a versao final preparada para portfolio.

## Aplicacao em producao

- Vercel: [https://marketnow.vercel.app](https://marketnow.vercel.app)

## Stack

- Next.js
- React
- Supabase
- Vercel

## Funcionalidades implementadas

- Cadastro com email e senha
- Login
- Redefinicao de senha
- Protecao de rotas autenticadas
- Integracao com banco via Supabase

## Estrutura do projeto

- `src/app`: rotas e paginas (App Router)
- `src/components`: componentes reutilizaveis de UI
- `src/lib`: clientes/config de Supabase, validacoes e utilitarios
- `src/services`: regras de servico (ex.: precificacao e formatacao)
- `supabase`: schema, seed e migrations SQL
- `docs`: documentacao tecnica e operacional

## Como rodar localmente

1. Clonar o repositorio:

```bash
git clone https://github.com/the-dv/marketnow.git
cd marketnow
```

2. Instalar dependencias:

```bash
npm install
```

3. Criar o arquivo `.env.local` na raiz:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Executar em desenvolvimento:

```bash
npm run dev
```

## Decisoes tecnicas

- Next.js App Router para separar claramente rotas publicas e autenticadas.
- Supabase como BaaS para acelerar autenticacao e persistencia com RLS.
- Frontend consumindo apenas chaves publicas e sessao do usuario autenticado.

## Consideracoes de seguranca

- RLS habilitado no Supabase para isolamento de dados por usuario.
- Uso somente de `NEXT_PUBLIC_SUPABASE_ANON_KEY` no frontend.
- Segredos e variaveis de ambiente protegidos no painel da Vercel.

## Checklist de producao

- Fluxos principais validados em producao (login, cadastro, reset).
- Build e lint executados antes de publicar.
- Variaveis de ambiente revisadas no projeto Vercel.

## Licenca

MIT
