# STEP-16 - Hover And Checkbox Fix

## Objetivo

Corrigir dois problemas de UX:
- hover/click inconsistente no card de lista ativa no dashboard;
- falta de feedback visual e area clicavel adequada no checkbox de compra da lista.

## Requisitos (Checklist)

- [x] Lista ativa: card inteiro clicavel.
- [x] Lista ativa: hover aplicado no container completo, com transicao suave.
- [x] Lista ativa: cursor pointer no card.
- [x] Lista arquivada: sem hover.
- [x] Lista arquivada: sem cursor pointer.
- [x] Lista arquivada: sem navegacao ao clicar.
- [x] Lista arquivada: fundo cinza fixo mantido.
- [x] Hover aplicado condicionalmente por status (ativa vs arquivada).
- [x] Checkbox com `cursor: pointer`.
- [x] Checkbox com feedback visual em hover.
- [x] Checkbox com focus visivel para navegacao por teclado.
- [x] Label associado via `htmlFor` para area clicavel maior.
- [x] Alinhamento vertical da coluna de checkbox preservado sem padding lateral exagerado.
- [x] `npm run lint` executado com sucesso.
- [x] `npm run build` executado com sucesso.
- [x] Commit realizado com referencia `STEP-16`.

## Criterios de aceite

- Em `/dashboard`, ao passar o mouse em lista ativa, o hover cobre todo o card e o clique em qualquer area principal abre a lista.
- Em `/dashboard`, listas arquivadas nao mostram hover, nao mudam cursor para pointer e nao navegam.
- Em `/lists/:id`, checkbox responde com cursor pointer, hover leve e focus ring visivel.
- Clique no label do checkbox alterna o estado de comprado corretamente.
- Sem regressao de lint/build.
