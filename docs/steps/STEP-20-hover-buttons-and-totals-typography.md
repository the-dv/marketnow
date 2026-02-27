# STEP-20 - Hover em Botoes Escuros e Tipografia de Totais

## Objetivo

Ajustar UX visual do Dashboard e Lista para:

- botoes escuros com hover/active visiveis e foco acessivel;
- link/botao "Voltar" sem underline e com comportamento visual de botao;
- valores de "Total por categoria" sem negrito excessivo.

## Checklist

- [x] Estilo escuro padronizado em `.button-secondary` com hover e active visiveis.
- [x] Padrao reutilizavel aplicado via classe global (sem duplicacao por tela).
- [x] Classe `.button` atualizada para remover underline em links e manter visual de botao.
- [x] "Sair" (dashboard) herda novo hover/active automaticamente.
- [x] "Arquivar/Reativar" (dashboard) herda novo hover/active automaticamente.
- [x] "Voltar" (`/lists/:id`) sem underline e com hover/active de botao escuro.
- [x] Tipografia do valor em "Total por categoria" normalizada (sem bold pesado).
- [x] `npm run lint` executado com sucesso.
- [x] `npm run build` executado com sucesso.
- [ ] Commit realizado com referencia `STEP-20`.

## Criterios de Aceite

- "Sair" e "Arquivar" exibem hover/active perceptivel e mantem focus ring.
- "Voltar" nao aparece sublinhado e tem feedback visual consistente com botoes escuros.
- Valores de "Total por categoria" ficam com peso visual coerente com o texto da categoria.
- Lint e build concluem sem erro.

## Como testar manualmente

1. Abrir `/dashboard` e passar mouse em `Sair` e `Arquivar`.
2. Validar hover/active e foco por teclado nos botoes escuros.
3. Abrir `/lists/:id` e validar `Voltar` sem underline, com hover/active.
4. Conferir "Total por categoria" com valor na direita sem negrito pesado.
