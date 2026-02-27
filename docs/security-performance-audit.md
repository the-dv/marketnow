# MarketNow - Security & Performance Audit

Data da auditoria: 2026-02-27  
Escopo: Next.js + TypeScript + Supabase (Auth, RLS, migrations, server actions, UI)

## 1) Sumario executivo

O projeto esta funcional para MVP, com isolamento de dados consistente via RLS nas tabelas principais e com fluxo de compra/edicao robusto no uso comum.  
Nesta rodada, foram aplicados hardenings importantes em autenticacao, validacao server-side, mitigacao de spam e padronizacao de parsers/testes.

Status de risco (apos correcoes desta rodada):
- Segurança: **LOW-MEDIUM**
- Performance: **LOW**
- Confiabilidade: **LOW-MEDIUM**
- Deploy readiness: **MEDIUM** (depende de configuracao correta de ambiente externo)

## 2) Metodologia

1. Revisao estatica de `src/`, `supabase/`, `docs/`.
2. Revisao de schema, constraints, indices, policies e migrations.
3. Revisao de fluxo auth/sessao (middleware, callback, pages protegidas).
4. Revisao de server actions (validacao, ownership, mensagens de erro).
5. Revisao de performance de consultas e agregacoes em memoria.
6. Revisao de qualidade (types, duplicacao, testes, lint/build).

## 3) Achados por severidade (com status)

### CRITICAL

Nenhum achado CRITICAL identificado.

### HIGH

1. Open redirect potencial no callback de auth. **RESOLVIDO**
- Evidencia: `src/app/auth/callback/route.ts` aceitava `next` com `startsWith("/")`, incluindo `//dominio`.
- Correcao aplicada:
  - Sanitizacao estrita de `next` com bloqueio de `//`, vazio e tamanho anomalo.
  - Fallback para `/dashboard`.

2. Ausencia de rate limiting minimo em writes. **RESOLVIDO**
- Evidencia: server actions de escrita sem protecao contra spam.
- Correcao aplicada:
  - Novo helper `src/lib/security/rate-limit.ts`.
  - Limiter in-memory por usuario+acao em actions de dashboard e lista.

### MEDIUM

1. Validacao incompleta de IDs e limites numericos em actions. **RESOLVIDO**
- Evidencia: `listId`/`productId` validados apenas por string vazia.
- Correcao aplicada:
  - Novo helper `src/lib/validation.ts` com `parseUuid` e `parseTrimmedString`.
  - Validacao de UUID em actions criticas.
  - Limites maximos para preco e quantidade em `src/app/lists/[listId]/actions.ts`.

2. Baseline de headers de seguranca ausente. **RESOLVIDO**
- Evidencia: `next.config.ts` sem headers adicionais.
- Correcao aplicada:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`

3. Detalhes internos de erro em mensagens de UI (dev). **RESOLVIDO**
- Evidencia: detalhes do Postgres eram anexados ao texto exibido para cliente em dev.
- Correcao aplicada:
  - Detalhes ficam apenas em log de servidor; resposta de UI permanece sanitizada.

4. Drift entre tipagem TS e schema final (`category_id`). **RESOLVIDO**
- Evidencia: `Product.categoryId` tipado como `string | null` em `src/types/domain.ts` apesar de schema `NOT NULL`.
- Correcao aplicada:
  - Alinhado para `string`.

### LOW

1. Custo extra em agregacao de preco por filtros repetidos. **RESOLVIDO**
- Evidencia: `filter` repetido por item em `src/services/pricing-service.ts`.
- Correcao aplicada:
  - Indexacao por `Map` de `user_product_prices` e `regional_prices`.

2. Idioma de documento HTML desalinhado com app. **RESOLVIDO**
- Correcao aplicada: `src/app/layout.tsx` atualizado para `lang="pt-BR"`.

3. Cobertura de testes limitada para parsers/totais. **RESOLVIDO**
- Correcao aplicada:
  - `src/services/input-format.test.ts`
  - `src/services/list-totals.test.ts`

## 4) Revisao por area (obrigatoria)

### A) Autenticacao / Sessao

Estado observado:
- Sessao validada server-side em `/dashboard` e `/lists/[listId]`.
- Middleware (`middleware.ts` + `src/lib/supabase/middleware.ts`) atualiza sessao.
- Logout invalida sessao no cliente via Supabase.

Melhorias aplicadas:
- Hardening de callback para impedir open redirect.

Risco residual:
- Configuracao incorreta de URL no Supabase Auth pode quebrar callback em cloud.

### B) RLS / Policies / Privacidade (Supabase)

Estado observado:
- RLS habilitado em `profiles`, `shopping_lists`, `shopping_list_items`, `user_product_prices`, `categories`, `products`, `regional_prices`.
- Policies com isolamento por `auth.uid()`.
- `shopping_list_items_update_own` contem `USING` e `WITH CHECK`.
- `categories` somente leitura para autenticado.

Queries recomendadas para verificacao em ambiente cloud:

```sql
select schemaname, tablename, policyname, cmd, permissive, roles, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

```sql
select relname as table_name, relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and relkind = 'r'
order by relname;
```

Risco residual:
- Sem lacuna critica identificada nas policies atuais.

### C) Server actions / API safety

Estado observado:
- Ownership checks presentes (`assertListOwnership`, verificacao de dono de produto).
- Bulk protegido por RPC com ownership + constraints.

Melhorias aplicadas:
- UUID validation padronizada.
- Limites de preco/quantidade.
- Rate limiting MVP em writes.
- Erros sanitizados para UI.

Risco residual:
- Rate limit in-memory nao e distribuido entre multiplas instancias.

### D) Integridade de dados

Estado observado:
- `products.category_id` NOT NULL com fallback para `outros`.
- Unique em `shopping_list_items(shopping_list_id, product_id)` presente.
- Seed idempotente para `categories/products/regional_prices`.

Decisao mantida:
- `user_product_prices` como historico (sem unique `user_id,product_id`).

### E) Performance

Estado observado:
- Sem N+1 de banco critico nas pages principais.
- Selects razoavelmente enxutos.

Melhorias aplicadas:
- Otimizacao de agregacao em `pricing-service` com mapas por `product_id`.
- Extracao de helpers para reduzir duplicacao de parse/format no client.

### F) UI/UX robustez e acessibilidade

Estado observado:
- Confirm dialogs criticos presentes.
- Toasts com auto-dismiss.
- Inputs numericos com saneamento.
- Icon buttons com `aria-label`.

Melhorias aplicadas:
- Helpers de input centralizados e testados.

### G) Segredos e configuracao

Estado observado:
- `.env*` ignorado em `.gitignore`.
- `.env.example` com variaveis publicas essenciais.
- Sem segredos hardcoded detectados nos arquivos rastreados.

Melhorias aplicadas:
- Validacao de env mais estrita em `src/lib/supabase/env.ts` (URL e chave anon).

### H) Qualidade / testes

Estado observado:
- Lint/build e testes verdes.

Melhorias aplicadas:
- Novos testes unitarios para BRL parser/formatter e total por categoria.

## 5) Mudancas aplicadas (detalhadas)

1. Auth hardening:
- `src/app/auth/callback/route.ts`

2. Validacao e seguranca de actions:
- `src/lib/validation.ts` (novo)
- `src/lib/security/rate-limit.ts` (novo)
- `src/app/dashboard/actions.ts`
- `src/app/lists/[listId]/actions.ts`

3. Hardening de headers:
- `next.config.ts`

4. Env hardening:
- `src/lib/supabase/env.ts`

5. Performance/refactor:
- `src/services/pricing-service.ts`
- `src/services/input-format.ts` (novo)
- `src/services/list-totals.ts` (novo)
- `src/app/lists/[listId]/my-products-list.tsx`
- `src/app/lists/[listId]/page.tsx`
- `src/app/layout.tsx`
- `src/types/domain.ts`

6. Testes:
- `src/services/input-format.test.ts` (novo)
- `src/services/list-totals.test.ts` (novo)

## 6) Pendencias manuais (Supabase / ambiente)

Nesta rodada, **nao houve alteracao de schema/policy/index/seed**.  
Logo, **nenhuma migration SQL nova** foi necessaria.

Acoes externas recomendadas:
1. Confirmar `Auth > URL Configuration` no Supabase:
   - `http://localhost:3000/auth/callback`
   - URL de producao com `/auth/callback`
2. Revisar envs por ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 7) Plano de evolucao (impacto x esforco)

1. HIGH impacto / medio esforco
- Rate limit distribuido (Redis/Upstash) para ambiente horizontal.

2. MEDIUM impacto / baixo esforco
- Testes de integracao para server actions de erro/ownership/rate limit.

3. MEDIUM impacto / medio esforco
- Telemetria centralizada (erros por acao, latencia por consulta, taxa de rejeicao por rate limit).

4. LOW impacto / medio esforco
- Testes E2E de fluxo principal (login, dashboard, lista, compra individual/bulk).

## 8) Validacao final executada

```bash
npm run test
npm run lint
npm run build
```

Resultado: **OK**.
