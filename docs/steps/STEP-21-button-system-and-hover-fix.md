# STEP-21 - Button System e Hover Visivel

## Objetivo

Padronizar os botoes do app em um sistema unico (`Button` e `IconButton`) com estados visiveis de hover/focus/active, especialmente para botoes escuros.

## Checklist

- [x] Criado `Button` reutilizavel com variants `primary | dark | danger | ghost`.
- [x] Criado `Button` com sizes `sm | md | lg` e suporte a `leftIcon/rightIcon`.
- [x] Criado `IconButton` reutilizavel com variants `dark | danger | ghost`.
- [x] `IconButton` exige `aria-label` e suporta `tooltip` opcional.
- [x] Estilos base centralizados em `globals.css` (`.btn*` e `.icon-btn*`).
- [x] Variant `dark` com hover perceptivel (borda + sombra + alteracao de fundo) e active com transform.
- [x] Focus ring visivel e consistente em botoes e icon buttons.
- [x] Dashboard migrado: `Sair`, `Criar lista`, `Arquivar/Reativar`, `Excluir (icone)`.
- [x] Lista migrada: `Voltar`, `Salvar produto`, botoes dos modais e lixeira de produto.
- [x] Login/cadastro/reset migrados para `Button` nos principais submits.
- [x] Removido risco de sublinhado indevido em elementos com estilo de botao.
- [x] `npm run lint` executado com sucesso.
- [x] `npm run build` executado com sucesso.
- [x] Commit realizado com referencia `STEP-21`.

## Criterios de Aceite

- Todos os botoes visiveis no app usam o sistema unificado.
- Botoes `dark` exibem hover perceptivel (fundo + borda + sombra) e active com feedback.
- Todos os botoes/icon buttons tem focus ring para navegacao por teclado.
- Nenhum botao ou link estilizado como botao fica sublinhado.
- `npm run lint` e `npm run build` sem erros.

## Plano de verificacao manual

1. Dashboard: validar hover/focus/active em `Sair`, `Criar lista`, `Arquivar/Reativar` e `Excluir`.
2. Lista: validar hover/focus/active em `Voltar`, `Salvar produto`, botoes dos modais e lixeira.
3. Login/Register/Reset: validar hover/focus/active nos botoes de submit.
4. Confirmar tooltip dos icon buttons de exclusao.
