# STEP-08 - UI Polish Editing Total

## Objetivo

Corrigir bugs funcionais e melhorar UX da tela `/lists/:id`, com foco em edicao inline de produto, estados visuais de acoes e recalculo confiavel do total.

## Escopo

- Ajustar largura do campo de quantidade para formato compacto.
- Implementar edicao inline de nome e categoria em "Meus produtos".
- Melhorar botao de lixeira com icone mais legivel e estados visuais (hover/focus).
- Padronizar hover/focus/active dos botoes principais (ex.: Salvar produto, Voltar, Dashboard).
- Corrigir definitivamente fluxo de salvar produto sem categoria.
- Corrigir regra do total para refletir estado atual do banco sem stale state.

## Fora de escopo

- Refatoracao completa de arquitetura de pricing.
- Fluxos avancados de undo/historico visual.
- Mudancas no fluxo de autenticacao.

## Requisitos (Checklist)

- [x] Input de quantidade com largura compacta (72-96px) e responsivo.
- [x] Edicao inline de nome com persistencia no Supabase.
- [x] Edicao inline de categoria com persistencia no Supabase.
- [x] Opcao "Sem categoria" funcional na edicao (grava `null`).
- [x] Dropdown de categorias mantem ordem oficial com "Outros" por ultimo.
- [x] Botao de lixeira com icone melhor e estilo vermelho com hover/focus acessivel.
- [x] Hover/focus/active padronizado para botoes principais reutilizando classes existentes.
- [x] Criacao de produto sem categoria salva corretamente.
- [x] Total recalcula corretamente apos marcar/desmarcar/excluir comprado.
- [x] Ao excluir unico comprado, total volta para `R$ 0,00`.
- [x] `npm run lint` executado com sucesso.
- [x] `npm run build` executado com sucesso.
- [x] Commit realizado com referencia `STEP-08`.

## Criterios de aceite

- Produto pode ser criado com nome apenas (categoria vazia) e aparece em "Meus produtos".
- Nome e categoria podem ser alterados inline e persistem apos refresh.
- Categoria aceita alternancia entre "Sem categoria" e "Outros".
- Lixeira tem feedback visual claro em hover/focus e exclusao funciona com ownership.
- Total mostrado no card reflete somente produtos comprados com `paid_price` no estado atual.
- Nenhum texto tecnico extra exibido no front principal.

## Arquitetura / Design

- Server action dedicada para atualizar metadados do produto (nome + categoria).
- Reuso de `shopping_list_items` para quantidade/unidade e estado comprado.
- Recalculo do total baseado na fonte de verdade do banco (`purchased_at` + `paid_price`).

## Alteracoes esperadas (arquivos)

- `docs/steps/STEP-08-ui-polish-editing-total.md`
- `src/app/lists/[listId]/actions.ts`
- `src/app/lists/[listId]/my-products-list.tsx`
- `src/app/lists/[listId]/page.tsx`
- `src/app/globals.css`
- `src/services/pricing-service.ts`
- `package.json` e lockfile (se for adotado pacote de icones)
- `supabase/migrations/20260227_category_nullable_guard.sql` (se necessario)
- `docs/manual-steps.md` (se houver migracao)

## Modelo de dados / SQL

- Avaliar necessidade de migracao de garantia para `products.category_id` nullable.
- Sem nova tabela obrigatoria para esta etapa.

## Seguranca / RLS

- Atualizacao/exclusao de produto restrita ao owner (`owner_user_id = auth.uid()`).
- Atualizacoes de estado da lista continuam protegidas por ownership da lista.

## UI/UX

- Layout de linha com colunas claras e espacamento consistente.
- Estados visuais de botao padronizados para interacao mais previsivel.
- Feedback discreto de salvamento nas edicoes inline.

## Plano de testes

- Manual:
  - Criar produto sem categoria.
  - Editar nome e validar persistencia.
  - Editar categoria para "Sem categoria" e "Outros" e validar persistencia.
  - Ajustar quantidade e verificar largura compacta.
  - Validar lixeira com hover/focus vermelho e exclusao.
  - Marcar comprado com preco e validar aumento do total.
  - Excluir unico comprado e validar retorno para `R$ 0,00`.
- Automatizado:
  - `npm run lint`
  - `npm run build`

## Riscos e mitigacao

- Risco: atualizacao inline disparar muitos requests por blur/change.
  - Mitigacao: salvar apenas em `onBlur`/`Enter`, com feedback discreto.
- Risco: ambientes antigos ainda com `category_id not null`.
  - Mitigacao: migracao de guarda para `drop not null`.
- Risco: total inconsistente por cache local apos acoes.
  - Mitigacao: recalculo server-side e `router.refresh()` apos sucesso.

## Decisoes e trade-offs

- Decisao: total do card baseado em comprado+paid_price, sem usar sugestao para somatorio.
  - Trade-off: comportamento mais previsivel para usuario, mas deixa de ser "estimado" no sentido de sugestao.
- Decisao: usar update inline por linha (nome/categoria/quantidade/unidade) sem modal extra.
  - Trade-off: fluxo rapido, com maior sensibilidade a blur acidental.

## Pos-etapa (follow-ups)

- Adicionar debounce/icone de status por campo para reduzir ruidao visual.
- Opcao de confirmacao customizavel para exclusao.

## Changelog curto

- Edicao inline de nome e categoria adicionada na grade de produtos.
- Campo de quantidade ajustado para largura compacta com responsividade.
- Lixeira atualizada para icone `Trash2` com estilo vermelho e estados de hover/focus.
- Padrao global de hover/focus/active aplicado nas classes base de botoes.
- Regra de total alterada para considerar apenas itens comprados com `paid_price`.
- Migracao de guarda adicionada para garantir `products.category_id` nullable.
