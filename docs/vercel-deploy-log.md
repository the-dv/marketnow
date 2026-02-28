# Vercel Deploy Log

## 2026-02-28 15:16:46 -03:00
- SHA: `pendente de push (commit local: fix: password reset confirm session in production)`
- Arquivos alterados:
  - `src/app/reset-password/reset-password-request-form.tsx`
  - `src/app/reset-password/confirm/reset-password-confirm-form.tsx`
  - `docs/vercel-deploy-log.md`
- Resumo curto:
  - Fluxo de envio de reset ajustado para gerar link sem dependencia de PKCE code verifier no cliente.
  - Fluxo de confirmacao ajustado para preparar sessao com fallback robusto entre `access_token/refresh_token`, `token_hash/token` e `code`.
  - Logs apenas em DEV, sem tokens, com `pathname` e presenca de chaves do link.

## Teste manual em Vercel
1. Abrir `https://<seu-dominio>/reset-password`.
2. Solicitar reset para um email valido.
3. Abrir o link recebido no email.
4. Confirmar que a tela `Definir nova senha` abre em `/reset-password/confirm`.
5. Preencher nova senha e confirmacao.
6. Clicar em `Salvar nova senha`.
7. Resultado esperado:
   - Toast: `Senha atualizada com sucesso`
   - Redirecionamento para `/login`.
8. Validacao negativa:
   - Reabrir o mesmo link expirado.
   - Resultado esperado: toast orientando para solicitar novo link.
