# STEP-09 - Stabilize Products Layout

## Objetivo

Estabilizar a tela `/lists/:id` corrigindo falha de cadastro sem categoria, ampliando largura util da tela e refatorando o grid de "Meus produtos" para manter alinhamento consistente.

## Escopo

- Diagnosticar e melhorar feedback de erro Supabase no cadastro de produto.
- Garantir persistencia de `category_id = null` para "Sem categoria".
- Aumentar largura da area principal em desktop mantendo responsividade.
- Reestruturar grid da lista com colunas estaveis: checkbox, nome, categoria, quantidade, unidade, acoes.
- Polir estados visuais de lixeira e botoes principais.

## Fora de escopo

- Reescrever fluxo de compras ou historico.
- Alterar regras de negocio de auth/RLS.
- Refatoracao global de todos componentes do app.

## Requisitos (Checklist)

- [x] Log de erro Supabase inclui `message`, `code`, `details`, `hint` no servidor.
- [x] "Sem categoria" envia/persiste `category_id = null` sem bloquear save.
- [x] Mensagem de erro em dev exibe detalhe real quando houver erro de banco.
- [x] Container principal de `/lists/:id` ampliado para suportar colunas sem aperto.
- [x] Grid da lista segue colunas: `[checkbox] [nome] [categoria] [quantidade] [unidade] [acoes]`.
- [x] Campo quantidade compacto (72-96px) e usavel.
- [x] Categoria exibida/edicao sem corte visual ruim.
- [x] Lixeira com hover vermelho e foco acessivel.
- [x] Botao "Salvar produto" e "Voltar" com hover/focus consistentes.
- [x] Layout mobile quebra para vertical limpo sem colisoes.
- [x] `npm run lint` executado com sucesso.
- [x] `npm run build` executado com sucesso.
- [x] Commit realizado com referencia `STEP-09`.
- [x] Cabecalho da primeira coluna atualizado para "Comprado".
- [x] Checkbox centralizado verticalmente em todas as linhas.
- [x] Botao de lixeira centralizado verticalmente com dimensao consistente.
- [x] Valor "Sem categoria" tratado por sentinela e persistido como `NULL`.

## Criterios de aceite

- Criar produto com apenas nome funciona e aparece na lista.
- Criar produto com categoria funciona.
- Com 4+ produtos, colunas permanecem alinhadas em desktop.
- Em desktop amplo, container usa mais largura horizontal.
- Excluir item nao degrada alinhamento.
- Build e lint sem erros.

## Arquitetura / Design

- Acoes server mantidas como fonte de verdade com `revalidatePath`.
- Adicao de utilitario de erro para padronizar diagnostico Supabase.
- Layout baseado em CSS Grid com colunas fixas/minmax para previsibilidade.

## Alteracoes esperadas (arquivos)

- `docs/steps/STEP-09-stabilize-products-layout.md`
- `src/app/lists/[listId]/actions.ts`
- `src/app/lists/[listId]/my-products-list.tsx`
- `src/app/lists/[listId]/page.tsx`
- `src/app/globals.css`
- `docs/manual-steps.md` (se necessario)

## Modelo de dados / SQL

- Reusar migracao existente de guarda nullable (`20260227_category_nullable_guard.sql`).
- Sem nova tabela prevista.

## Seguranca / RLS

- RLS inalterada: insert/update/delete apenas em produtos do proprio usuario.
- Diagnostico de erro nao expoe secrets, apenas metadados de falha.

## UI/UX

- Colunas separadas e legiveis.
- Feedback de sucesso/erro em slot fixo para evitar salto de layout.
- Estados visuais claros de hover/focus nas acoes.

## Plano de testes

- Manual:
  - Salvar produto apenas com nome (sem categoria).
  - Salvar com categoria.
  - Verificar alinhamento com 4+ produtos.
  - Verificar container mais largo em desktop.
  - Excluir item e validar estabilidade visual.
- Automatizado:
  - `npm run lint`
  - `npm run build`

## Riscos e mitigacao

- Risco: mudanca de grid impactar mobile.
  - Mitigacao: media query dedicada para stack vertical.
- Risco: mensagens de erro muito tecnicas para usuario final.
  - Mitigacao: detalhar somente em dev, manter texto limpo em producao.

## Decisoes e trade-offs

- Decisao: manter uma unica linha editavel por produto em vez de cards complexos.
  - Trade-off: visual mais denso, porem melhor para edicao em massa.
- Decisao: usar classe `container-wide` local da pagina.
  - Trade-off: nao afeta outras telas, mas exige classe adicional no layout.

## Pos-etapa (follow-ups)

- Adicionar testes e2e de regressao visual da grade.
- Adicionar toast nao-bloqueante para salvar/excluir.

## Changelog curto

- Erros Supabase de cadastro passaram a registrar `message/code/details/hint` no servidor.
- Mensagens de erro em ambiente de dev agora incluem detalhes do banco para diagnostico.
- Container da pagina de lista foi ampliado com classe `container-wide`.
- Grid de produtos foi reconstruida em 6 colunas estaveis com quebra limpa no mobile.
- Campo de quantidade ficou compacto e a coluna de categoria ganhou largura fixa legivel.
- Cabecalho da coluna de checkbox alterado de "OK" para "Comprado".
- Fluxo "Sem categoria" reforcado com sentinela `__none__` mapeada para `category_id = NULL`.
