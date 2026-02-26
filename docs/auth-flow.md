# Auth Flow - Supabase Magic Link

## Objetivo

Documentar o fluxo de autenticacao via Magic Link (email), controle de sessao e protecao de rotas privadas no MarketNow.

## Fluxo de Login (Magic Link)

1. Solicitacao
- Usuario informa email na tela de login.
- App chama Supabase Auth para envio de Magic Link.

2. Confirmacao
- Usuario abre o link recebido por email.
- Supabase valida token e cria sessao autenticada.

3. Callback e Redirecionamento
- Aplicacao processa callback de auth.
- Usuario e redirecionado para o dashboard.

4. Sessao Ativa
- Rotas privadas passam a ser acessiveis enquanto a sessao for valida.

## Protecao de Rotas Privadas

### Server-side
- Validar sessao em rotas protegidas (layout/page server quando aplicavel).
- Redirecionar para login se sessao ausente.

### Client-side
- Validar estado de autenticacao ao montar paginas privadas.
- Exibir estado de carregamento ate resolver sessao.

## Logout

- Encerrar sessao via Supabase Auth.
- Limpar estado local derivado da sessao.
- Redirecionar para login.

## Boas Praticas de Seguranca

- Usar `NEXT_PUBLIC_SUPABASE_ANON_KEY` apenas no client.
- Usar `SUPABASE_SERVICE_ROLE_KEY` somente no servidor e apenas quando necessario.
- Nunca expor `service_role` em codigo client, bundle publico ou variavel `NEXT_PUBLIC_*`.
- Aplicar RLS em todas as tabelas de dados de usuario.
- Tratar `auth.uid()` como fonte de verdade para ownership.

## Variaveis de Ambiente

Obrigatorias para MVP:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Somente server-side (uso restrito):
- `SUPABASE_SERVICE_ROLE_KEY`

## Tratamento de Erros

Cenarios previstos:
- Link expirado ou invalido.
- Email nao entregue.
- Sessao ausente em rota privada.

Comportamento recomendado:
- Exibir mensagem objetiva ao usuario.
- Permitir reenviar Magic Link.
- Evitar detalhar erro interno sensivel.

## Convencao de Erros de Dominio

- `AUTH_REQUIRED`: usuario nao autenticado para acao privada.
- `SESSION_INVALID`: sessao expirada/invalida.
