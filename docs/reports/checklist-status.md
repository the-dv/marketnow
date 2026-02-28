# Checklist Status - Steps (Auditoria 2026-02-27)

Legenda:
- `Conforme`: implementacao observada no codigo atual.
- `Parcial`: implementacao presente, mas com drift documental/processual.
- `Nao evidenciado`: sem prova suficiente apenas por leitura estatica.

| Step | Status real | Evidencia curta |
|---|---|---|
| STEP-01 | Conforme | Toast/feedback/loading e robustez geral presentes em formularios e acoes. |
| STEP-02 | Conforme | Testes de pricing ativos em `src/services/pricing-logic.test.ts`. |
| STEP-03 | Conforme | Produtos por usuario + cards clicaveis no dashboard implementados. |
| STEP-04 | Conforme | Layout da lista sem bloco legacy, cadastro consolidado no topo. |
| STEP-05 | Conforme | Categoria opcional na UI com persistencia via fallback backend. |
| STEP-06 | Conforme | Fluxo dinamico de compra com modal e persistencia em `shopping_list_items`. |
| STEP-07 | Conforme | Acoes de produto (editar/excluir) e grid organizado em colunas. |
| STEP-08 | Conforme | Edicao inline + recalculo de total implementados. |
| STEP-09 | Conforme | Layout estabilizado da grade e largura util ampliada. |
| STEP-10 | Historico superado | Step marcado como historico no proprio manual (categoria nullable antiga). |
| STEP-11 | Conforme | Regra final `Sem categoria` -> `outros` ativa no backend. |
| STEP-12 | Conforme | Toasts flutuantes e alinhamentos principais presentes. |
| STEP-13 | Conforme | Migration/seed para `outros` e fallback backend por SELECT. |
| STEP-14 | Conforme | Reuso de preco referencia + total por categoria implementados. |
| STEP-15 | Conforme | Confirmacoes no dashboard + comportamento de lista arquivada. |
| STEP-16 | Conforme | Hover do card ativo/arquivado e UX de checkbox ajustados. |
| STEP-17 | Conforme | Bulk purchase modal em 2 etapas + validacao numerica. |
| STEP-18 | Conforme | Ajuste de unique/on conflict + RPC bulk funcionando no codigo. |
| STEP-19 | Conforme | Bulk unpurchase via header checkbox com confirmacao. |
| STEP-20 | Conforme | Hover/active em botoes escuros e tipografia de totais. |
| STEP-21 | Parcial (doc) | Sistema de botoes unificado existe, mas doc cita Magic Link legado. |

## Observacao importante

- Todos os steps estao 100% marcados em checklist.
- O principal desvio atual nao e de feature, e sim de **documentacao operacional** (auth antigo em parte dos docs e bootstrap SQL ambiguo para ambiente novo).
