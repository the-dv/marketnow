# STEP-07 - Products Actions Layout

## Objetivo

Melhorar a UX da tela `/lists/:id` com foco em acoes de produto (excluir com seguranca), categoria opcional e layout de produtos em colunas claras.

## Escopo

- Adicionar acao de excluir produto na lista "Meus produtos" via botao de lixeira.
- Aplicar exclusao segura somente para produtos do usuario logado (soft delete com `is_active=false`).
- Garantir fluxo de cadastro de produto sem categoria obrigatoria.
- Garantir dropdown de categorias com "Outros" na ultima posicao.
- Reestruturar lista em colunas: Nome | Categoria | Quantidade | Unidade | Acoes.
- Permitir ajuste de quantidade e unidade por produto na lista, com persistencia no estado da lista atual.

## Fora de escopo

- Hard delete fisico de produtos com historico.
- Refatoracao completa de precificacao.
- Novas integracoes externas.

## Requisitos (Checklist)

- [x] Botao de lixeira exibido por produto na coluna de acoes.
- [x] Exclusao por soft delete implementada e restrita ao dono do produto.
- [x] UI atualiza imediatamente apos exclusao.
- [x] Cadastro de produto funciona com nome apenas (categoria opcional).
- [x] Dropdown de categoria contem "Outros" como ultima opcao.
- [x] Lista em colunas: Nome | Categoria | Quantidade | Unidade | Acoes.
- [x] Quantidade ajustavel com persistencia por lista/produto.
- [x] Unidade ajustavel com persistencia por lista/produto.
- [x] Sem texto tecnico desnecessario na UI principal.
- [x] `npm run lint` executado com sucesso.
- [x] `npm run build` executado com sucesso.
- [x] Commit realizado com referencia `STEP-07`.

## Criterios de aceite

- Produto criado sem categoria aparece normalmente em "Meus produtos".
- Seletor de categoria mostra "Outros" como ultima opcao.
- Quantidade e unidade aparecem em colunas separadas, com alinhamento limpo.
- Ajustes de quantidade/unidade persistem apos refresh.
- Excluir por lixeira remove item da lista visivel e mantem seguranca de ownership.
- Produto seed/global nao pode ser excluido pelo client.

## Arquitetura / Design

- Reuso de `shopping_list_items` como estado persistente por `(shopping_list_id, product_id)`.
- Nova server action para atualizar quantidade/unidade via upsert por lista/produto.
- Nova server action de soft delete em `products` com `owner_user_id = auth.uid()`.
- Lista "Meus produtos" migrada para grid semantico de colunas.

## Alteracoes esperadas (arquivos)

- `docs/steps/STEP-07-products-actions-layout.md`
- `src/app/lists/[listId]/actions.ts`
- `src/app/lists/[listId]/my-products-list.tsx`
- `src/app/lists/[listId]/page.tsx`
- `src/app/lists/[listId]/create-product-form.tsx` (validacao opcional, se necessario)
- `src/services/pricing-service.ts`
- `src/app/globals.css`

## Modelo de dados / SQL

- Sem nova tabela obrigatoria.
- Reuso de `products.is_active` para soft delete.
- Reuso de `shopping_list_items` para quantidade/unidade da lista.

## Seguranca / RLS

- Exclusao logica permitida apenas quando `owner_user_id = auth.uid()`.
- Atualizacao de estado de lista permitida apenas para lista pertencente ao usuario.
- Sem compartilhamento de dados entre usuarios.

## UI/UX

- Grid com separacao visual entre colunas.
- Coluna de acoes com lixeira compacta e acessivel.
- Mensagens de sucesso/erro objetivas.

## Plano de testes

- Manual:
  - Criar produto sem categoria e validar exibicao.
  - Validar dropdown com "Outros" na ultima opcao.
  - Criar produto com categoria "Outros".
  - Ajustar quantidade e unidade na grade e recarregar pagina.
  - Excluir produto via lixeira e validar remocao imediata.
  - Validar que nao ha texto tecnico exposto.
- Automatizado:
  - `npm run lint`
  - `npm run build`

## Riscos e mitigacao

- Risco: produtos soft-deleted ainda influenciarem estimativa.
  - Mitigacao: ignorar produtos inativos no calculo.
- Risco: conflito de estado por updates concorrentes quantidade/unidade.
  - Mitigacao: upsert deterministico por `(shopping_list_id, product_id)`.

## Decisoes e trade-offs

- Decisao: soft delete em vez de hard delete.
  - Trade-off: historico preservado, mas exige filtro por `is_active=true` na UI/calculo.
- Decisao: persistir quantidade/unidade em `shopping_list_items`.
  - Trade-off: evita nova tabela e reduz complexidade no MVP.

## Pos-etapa (follow-ups)

- Adicionar undo para exclusao de produto.
- Permitir edicao de nome/categoria em linha.

## Changelog curto

- Lista "Meus produtos" recebeu layout em colunas com campos separados de categoria, quantidade e unidade.
- Acao de exclusao via lixeira implementada com soft delete (`is_active=false`) e validacao de ownership.
- Atualizacao de quantidade/unidade por produto persistida na lista atual.
- Produtos inativos passaram a ser ignorados no calculo de total estimado.
