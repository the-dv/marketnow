# STEP-15 - Dashboard UI Confirmations

## Objetivo

Melhorar a UX da tela `/dashboard` com:
- layout consistente do botao "Criar lista";
- comportamento claro para listas arquivadas;
- padronizacao visual do delete com icone;
- confirmacoes antes de acoes criticas;
- toasts de sucesso/erro nas acoes.

## Escopo

- Ajustar layout do form "Nova lista" para manter texto do botao em uma linha.
- Tornar cards arquivados visualmente apagados e nao clicaveis.
- Reutilizar botao de delete com icone no dashboard e na lista de produtos.
- Adicionar confirmacoes para arquivar, reativar e excluir lista.
- Exibir toast para criar, arquivar, reativar e excluir (sucesso/erro).

## Fora de escopo

- Mudancas de regra de negocio de listas.
- Refatoracao de autenticacao/sessao.
- Mudancas no modelo de dados.

## Requisitos (Checklist)

- [x] Botao "Criar lista" sem quebra de texto e com largura/padding adequados.
- [x] Form de "Nova lista" com alinhamento vertical consistente entre input e botao.
- [x] Lista ativa permanece clicavel e abre `/lists/:id`.
- [x] Lista arquivada fica com visual cinza/apagado.
- [x] Lista arquivada nao e clicavel e nao navega.
- [x] Botoes "Reativar" e "Excluir" continuam visiveis em lista arquivada.
- [x] Delete do dashboard usa mesmo padrao visual de delete com icone da tela de produtos.
- [x] Componente reutilizavel de delete aplicado para evitar duplicacao.
- [x] Confirmacao para arquivar lista antes de executar.
- [x] Confirmacao para reativar lista antes de executar.
- [x] Confirmacao para excluir lista antes de executar.
- [x] Cancelar confirmacao nao executa acao.
- [x] Confirmar executa acao e mostra toast de sucesso/erro.
- [x] Toast para "Lista criada".
- [x] Toast para "Lista arquivada".
- [x] Toast para "Lista reativada".
- [x] Toast para "Lista excluida".
- [x] `npm run lint` executado com sucesso.
- [x] `npm run build` executado com sucesso.
- [x] Commit realizado com referencia `STEP-15`.

## Criterios de aceite

- Botao "Criar lista" exibe texto em uma linha e nao quebra em desktop/mobile.
- Cards arquivados nao aceitam clique para abrir detalhe, mantendo controles de reativar/excluir.
- Acoes de arquivar/reativar/excluir sempre pedem confirmacao antes de chamar server action.
- Feedback visual via toast aparece para sucesso/erro em todas as acoes principais do dashboard.

## Plano de testes

- Verificar layout do form de criacao de lista em desktop e mobile.
- Clicar em card ativo e validar navegacao para detalhe.
- Clicar em card arquivado e validar ausencia de navegacao.
- Arquivar lista: cancelar e confirmar, validando comportamento e toast.
- Reativar lista: cancelar e confirmar, validando comportamento e toast.
- Excluir lista: cancelar e confirmar, validando comportamento e toast.
- Validar padrao visual de delete (dashboard e lista de produtos).
- Executar `npm run lint`.
- Executar `npm run build`.

## Alteracoes esperadas (arquivos)

- `src/app/dashboard/actions.ts`
- `src/app/dashboard/page.tsx`
- `src/app/dashboard/dashboard-lists-panel.tsx` (novo)
- `src/components/delete-icon-button.tsx` (novo)
- `src/app/lists/[listId]/my-products-list.tsx`
- `src/app/globals.css`
- `docs/steps/STEP-15-dashboard-ui-confirmations.md`

## Changelog curto

- Dashboard passou a usar painel client para toasts e confirmacoes de acoes criticas.
- Cards arquivados receberam estilo apagado e comportamento nao clicavel.
- Botao "Criar lista" ajustado para nao quebrar texto.
- Delete com icone padronizado via componente reutilizavel.
