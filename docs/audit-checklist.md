# Audit Checklist - MarketNow

Use este checklist para acompanhar a execucao da auditoria e o fechamento de riscos.

## 1) Seguranca - Auth e Sessao

- [x] Callback de auth bloqueia open redirect (`next` interno estrito).
- [x] Rotas privadas validam sessao no servidor.
- [x] Logout invalida sessao local e redireciona corretamente.
- [x] Chaves Supabase apenas via env (sem hardcode).
- [x] Cookies/sessao com fluxo padrao do Supabase SSR sem sobrescrita insegura.

## 2) Seguranca - Server actions

- [x] Todas actions de escrita validam UUID de IDs (`listId`, `productId`).
- [x] Validacoes numericas com limites (quantidade/preco) aplicadas.
- [x] Ownership conferido no servidor antes de mutacoes.
- [x] Mensagens para UI nao vazam detalhes internos de banco.
- [x] Rate limiting minimo aplicado em actions de escrita criticas.

## 3) Seguranca - Supabase RLS/Policies

- [x] RLS habilitado para tabelas de dados de usuario.
- [x] Policies de SELECT/INSERT/UPDATE/DELETE com isolamento por `auth.uid()`.
- [x] `shopping_list_items_update_own` com `USING` e `WITH CHECK`.
- [x] `categories` somente leitura para autenticados.
- [x] Categoria `outros` garantida por migration/seed (sem runtime upsert).

## 4) Integridade de dados

- [x] FK/constraints coerentes com regras do dominio.
- [x] Unique de `shopping_list_items (shopping_list_id, product_id)` confirmado.
- [x] Seed idempotente validado.
- [x] Drift schema x types/documentacao revisado.

## 5) Performance

- [x] Queries de listagem sem N+1 relevante.
- [x] Agregacoes locais otimizadas (evitar `filter` repetido por item).
- [x] Payloads/selecoes trazem apenas colunas necessarias.
- [x] Revalidate/caching coerente com dados autenticados.

## 6) UX robustez e acessibilidade

- [x] Confirmacoes em acoes criticas.
- [x] Toasts com auto-dismiss e feedback consistente.
- [x] Inputs numericos blindados contra caracteres invalidos.
- [x] Focus ring e aria-label em icon buttons.

## 7) Segredos e configuracao

- [x] `.gitignore` cobrindo `.env*` e artefatos sensiveis.
- [x] `.env.example` atualizado com variaveis necessarias.
- [x] Validacao de env falha de forma clara quando faltar variavel.

## 8) Qualidade e testes

- [x] `npm run lint` OK.
- [x] `npm run build` OK.
- [x] Testes unitarios para pricing helpers OK.
- [x] Testes unitarios para parse/format BRL e quantidade OK.
- [x] Testes unitarios para total por categoria OK.

## 9) Backend changes (quando houver)

- [ ] Migration SQL idempotente criada em `supabase/migrations/YYYYMMDDHHMM_<desc>.sql`.
- [ ] `docs/manual-steps.md` atualizado com passos de execucao no Supabase SQL Editor.
- [ ] Queries de verificacao adicionadas na documentacao.
- [ ] Sem dependencia de criacao de dados sensiveis em runtime do usuario.
