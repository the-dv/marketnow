# MarketNow v1.0.0 - Release Notes

Data: 2026-02-27

## 1) Entregas desta versao

- Autenticacao por email e senha:
  - Login (`/login`)
  - Cadastro (`/register`)
  - Reset de senha (`/reset-password` e `/reset-password/confirm`)
- Dashboard de listas:
  - Criar lista
  - Arquivar/Reativar com confirmacao
  - Excluir com confirmacao
  - Lista arquivada com comportamento nao clicavel
- Tela de lista (`/lists/:id`):
  - Cadastro de produto do usuario
  - Edicao inline (nome, categoria, quantidade, unidade)
  - Exclusao de produto
  - Compra individual com valor pago
  - Marcar todos como comprados (fluxo em lote com modal)
  - Desmarcar todos em lote com confirmacao
  - Total por categoria e total geral
- UX base consolidada:
  - Toasts flutuantes no topo-direito com auto-dismiss
  - Sistema unificado de botoes (`Button`/`IconButton`)
  - Hover/focus/active consistentes

## 2) Como testar (passo a passo)

1. Configurar `.env.local` com:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL`
2. Aplicar SQL do runbook em `docs/supabase-runbook.md` (ordem obrigatoria).
3. Rodar local:
   - `npm install`
   - `npm run dev`
4. Testar auth:
   - Criar conta em `/register`
   - Se confirmacao de email estiver ativa no Supabase, confirmar email
   - Login em `/login`
5. Testar dashboard:
   - Criar lista
   - Arquivar/Reativar
   - Excluir lista
6. Testar lista:
   - Criar produto com e sem categoria
   - Editar nome/categoria/qtd/unidade
   - Marcar comprado individualmente
   - Marcar todos com e sem salvar valores
   - Desmarcar todos
   - Conferir total por categoria e total final

## 3) Pontos conhecidos / limitacoes

- Rate limit de Auth no Supabase pode bloquear envio de email (cadastro/reset) apos tentativas repetidas.
- Se a configuracao de email confirmation estiver ativa, login antes de confirmar email retorna erro esperado.
- A RPC `bulk_mark_products_purchased` precisa estar aplicada no banco (via migration); apenas `schema.sql` + `seed.sql` nao bastam para fluxo bulk.

## 4) Proximos passos sugeridos

- Consolidar documentacao legada para evitar ambiguidades de fluxo antigo (Magic Link).
- Opcional: adicionar smoke E2E para auth + fluxo de lista.
- Opcional: padronizar checklist de deploy/operacao em CI.
