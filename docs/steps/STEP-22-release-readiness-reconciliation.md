# STEP-22 - Release Readiness Reconciliation (v1.0.0)

## Objetivo

Consolidar status real de release sem adicionar features, registrando o que esta validado localmente e o que ainda depende de configuracao externa (Supabase/Vercel).

## Checklist

- [x] Revisado estado de `lint`, `build` e `test` na branch de release.
- [x] Revisados fluxos criticos no codigo: auth, dashboard, lista/produtos, bulk e totais.
- [x] Revisada regra de categoria: UI `Sem categoria` -> persistencia em `outros` (`category_id NOT NULL`).
- [x] Criados documentos de release:
  - `docs/release-notes-v1.0.0.md`
  - `docs/supabase-runbook.md`
  - `docs/architecture-summary.md`
- [x] Ajustado drift de docs centrais para auth por email/senha.
- [ ] Confirmar no Supabase cloud:
  - `Site URL` configurada
  - Redirects de reset/callback configurados
  - provider Email habilitado
  - politica de confirmacao de email decidida
- [ ] Executar runbook SQL no projeto de producao antes do uso real.

## Criterios de aceite

- Branch `main` com codigo e docs coerentes com o estado funcional atual.
- Nenhuma dependência funcional oculta de runtime write em `categories`.
- Pendencias externas claramente explicitas para execucao manual.

## Pendencias reais (externas)

1. Aplicar ordem SQL do `docs/supabase-runbook.md` no projeto cloud.
2. Validar Auth settings no Dashboard do Supabase.
3. Confirmar envs em producao (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`).
