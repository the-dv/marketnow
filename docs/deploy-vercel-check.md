# Deploy Check: GitHub main + Vercel

Data da verificacao: 2026-02-28
Repositorio: `https://github.com/the-dv/marketnow.git`

## Estado atual encontrado

- Branch local ativa no inicio: `test-branch`
- `main` local e `test-branch` local estao no mesmo commit:
  - `main`: `7126da263502f6d03824673f62883df8204e0683`
  - `test-branch`: `7126da263502f6d03824673f62883df8204e0683`
- Branch remota `origin/main` esta atrasada:
  - `origin/main`: `55439970af18ab8a322f0f62a796628686bec6a8`
  - Diferenca: `main` local esta 33 commits a frente de `origin/main`

## Branch correta e evidencias (login com senha)

Conclusao: a versao com login por email + senha esta em `main` local (e identica a `test-branch` local), comprovada pelos arquivos e chamadas abaixo.

### Evidencias em codigo

- `src/app/login/login-form.tsx:171` -> `supabase.auth.signInWithPassword(...)`
- `src/app/register/register-form.tsx:166` -> `supabase.auth.signUp(...)`
- `src/app/reset-password/reset-password-request-form.tsx:145` -> `supabase.auth.resetPasswordForEmail(...)`
- `src/app/reset-password/confirm/reset-password-confirm-form.tsx:136` -> `supabase.auth.updateUser(...)`

Arquivos do fluxo de auth/login encontrados:

- `src/app/auth/callback/route.ts`
- `src/app/login/login-form.tsx`
- `src/app/login/page.tsx`
- `src/app/register/page.tsx`
- `src/app/register/register-form.tsx`
- `src/app/reset-password/page.tsx`
- `src/app/reset-password/reset-password-request-form.tsx`
- `src/app/reset-password/confirm/page.tsx`
- `src/app/reset-password/confirm/reset-password-confirm-form.tsx`

Verificacao de ausencia do fluxo antigo (em `src/app`):

- Sem ocorrencias de `signInWithOtp` / `verifyOtp`
- Sem ocorrencias de texto `magic link` / `Magic Link`

Commit que consolida o fluxo email/senha:

- `e26041d1f017807c7b82b138f1e5c44d0019f608` - `fix: stabilize email/password auth flow with register and reset routes`
  - Arquivos alterados:
    - `src/app/login/login-form.tsx`
    - `src/app/register/page.tsx`
    - `src/app/register/register-form.tsx`
    - `src/app/reset-password/confirm/page.tsx`
    - `src/app/reset-password/confirm/reset-password-confirm-form.tsx`
    - `src/app/reset-password/page.tsx`
    - `src/app/reset-password/reset-password-request-form.tsx`

## Acoes feitas (comandos + hashes)

Comandos de diagnostico e comparacao:

```powershell
git status --short --branch
git branch --show-current
git remote -v
git log --oneline -n 30
git fetch --all --prune
git checkout main
git pull origin main
git checkout test-branch
git log --oneline --decorate -n 30
git diff main..test-branch --name-only
git diff test-branch..main --name-only
git log --oneline origin/main..main
git log --oneline main..origin/main
git rev-parse main
git rev-parse origin/main
git rev-parse test-branch
git rev-parse origin/test-branch
```

Comandos de validacao de build:

```powershell
npm ci
npm run lint
npm run build
```

Resultado da validacao:

- `npm ci` OK
- `npm run lint` OK
- `npm run build` OK (Next.js build concluido com sucesso)

Tentativa de publicacao:

```powershell
git checkout main
git push origin main
```

Status do push:

- Falhou por permissao local (HTTP 403):
  - `Permission to the-dv/marketnow.git denied to davicamposdizevolv-wq.`
  - `fatal: unable to access 'https://github.com/the-dv/marketnow.git/': The requested URL returned error: 403`

## Como conferir no GitHub

1. Abrir `https://github.com/the-dv/marketnow`.
2. Entrar na branch `main`.
3. Confirmar o SHA mais recente da `main`:
   - Esperado apos push correto: `7126da263502f6d03824673f62883df8204e0683` (ou commit mais novo contendo esse historico).
4. Se a `main` ainda estiver em `55439970af18ab8a322f0f62a796628686bec6a8`, executar localmente com credencial correta:
   - `git push origin main`
5. Confirmar no historico da `main` que o commit `e26041d1f017807c7b82b138f1e5c44d0019f608` existe.
6. Abrir os arquivos de evidencias listados acima e validar as chamadas:
   - `signInWithPassword`
   - `signUp`
   - `resetPasswordForEmail`
   - `updateUser`

## Como conferir no Vercel (Production Branch + commit SHA)

1. Vercel Dashboard -> Project (`MarketNow`) -> **Settings** -> **Git**.
2. Confirmar:
   - Repositorio conectado: `the-dv/marketnow`
   - **Production Branch** = `main`
3. Ir em **Deployments**.
4. Abrir o deployment mais recente de producao.
5. Conferir o **Commit SHA** usado nesse deploy.
6. O SHA deve ser o ultimo da `main` no GitHub (esperado: `7126da263502f6d03824673f62883df8204e0683` ou mais novo da `main`).
7. Se SHA divergir:
   - Ajustar **Production Branch** para `main` em Settings -> Git.
   - Acionar **Redeploy** do commit correto da `main`.

Checklist pos-deploy:

- [ ] Abrir URL da Vercel de producao
- [ ] Confirmar tela de login com `Email + Senha` (sem Magic Link)
- [ ] Fazer login com usuario existente
- [ ] Acessar `/dashboard` com sessao autenticada

## Checklist de execucao (resultado)

- [x] A) Diagnostico local
- [x] B) Comparacao `main` vs `test-branch`
- [x] C) Validacao de build na `main`
- [ ] C) Push para `origin/main` (bloqueado por permissao 403)
- [x] D) Instrucoes verificaveis para Vercel documentadas
- [x] F) Relatorio final documentado neste arquivo

## ✅ Resultado esperado

Ao abrir a URL de producao da Vercel apos `origin/main` estar atualizado e o deploy usar o SHA mais recente da `main`, voce deve ver:

1. Tela de login com campos `Email` e `Senha`.
2. Opcao de recuperacao de senha (`/reset-password`).
3. Login funcional com usuario existente.
4. Redirecionamento/sessao valida ao acessar `/dashboard`.
