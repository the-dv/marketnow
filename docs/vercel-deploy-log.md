# Vercel Deploy Log

## 2026-02-28 12:36:29 -03:00
- SHA publicado na `main`: `c64bcacf58654968a1e1921d49e6929e6f9bbff4`
- Resumo curto do alterado:
  - Mantido o fix de reset de senha na `main` (`0e939b9` em historico).
  - Adicionado este log de deploy (`docs/vercel-deploy-log.md`).
- Validacoes antes do push:
  - `npm ci`
  - `npm run lint`
  - `npm run build`
- Evidencias de publicacao:
  - `git ls-remote origin refs/heads/main` retornou `c64bcacf58654968a1e1921d49e6929e6f9bbff4`.
  - Status do commit no GitHub: `Vercel` = `success` (`Deployment has completed`) em `2026-02-28T15:36:14Z`.
  - URL do deploy reportada pelo status do GitHub:
    - `https://vercel.com/davibcampos29-4191s-projects/marketnow-davi/4VKmfHT2HHHmnXUQmVLN3nfw6pgX`

## 2026-02-28 12:34:32 -03:00
- SHA publicado na `main`: `0e939b9a57574ce73ed763378fff32580c408b94`
- Resumo curto do alterado:
  - Publicado na `main` o fix de reset de senha (`fix: make reset-password confirm submit + toast work`), originalmente do commit `7d953b8` (via cherry-pick).
  - Sem refatoracoes adicionais de UI/fluxos.
- Validacoes antes do push:
  - `npm ci`
  - `npm run lint`
  - `npm run build`
- Evidencias de publicacao:
  - `git ls-remote origin refs/heads/main` retornou o mesmo SHA acima.
  - Status do commit no GitHub: `Vercel` = `success` (`Deployment has completed`) em `2026-02-28T15:34:10Z`.
  - URL do deploy reportada pelo status do GitHub:
    - `https://vercel.com/davibcampos29-4191s-projects/marketnow-davi/B27C16tg6PiwYr5vqKrKt9kdbYrt`

## Rollback no Vercel
1. Abrir Vercel Dashboard -> projeto `marketnow-davi`.
2. Ir em `Deployments`.
3. Localizar um deploy anterior estavel.
4. Usar `Promote to Production` (ou `Instant Rollback`, quando disponivel).
5. Confirmar em `Production` que o novo deploy promovido ficou ativo.
