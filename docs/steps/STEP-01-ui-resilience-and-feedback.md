# STEP-01 - UI Resilience and Feedback Hardening

## Objetivo

Melhorar a robustez da experiencia de uso no MVP atual, com foco em estados de carregamento, feedback em formularios e tolerancia a falhas na estimativa de preco.

## Escopo

- Implementar feedback visual de envio (`pending`) em formularios server actions.
- Evitar quebra de tela quando algum item nao tiver preco sugerido.
- Exibir estados de erro/aviso de forma clara para usuario final.
- Padronizar estados de loading em rotas principais.
- Registrar passos manuais externos em `docs/manual-steps.md`.

## Fora de escopo

- Refatoracao completa de design system.
- Testes E2E com framework externo.
- Integracoes externas de preco.

## Requisitos (Checklist)

- [ ] Criar componente reutilizavel para botao com estado de envio (`useFormStatus`).
- [ ] Aplicar estado `pending` nos formularios de dashboard e lista.
- [ ] Tratar ausencia de preco sugerido sem quebrar a pagina de lista.
- [ ] Exibir mensagem de aviso para itens sem sugestao disponivel.
- [ ] Criar pagina/estado de loading para rotas principais.
- [ ] Criar/atualizar `docs/manual-steps.md` com passos externos obrigatorios.
- [ ] Executar `npm run lint` e `npm run build`.
- [ ] Registrar changelog curto da etapa.

## Critérios de aceite

- Formularios mostram estado de envio e evitam duplo submit.
- Pagina de lista continua carregando mesmo se faltarem precos para algum item.
- Usuario visualiza claramente origem da sugestao ou indisponibilidade.
- Build e lint passam sem erros.
- Documento de etapa atualizado com checklist concluido.

## Arquitetura / Design

- Server actions continuam em `src/app/**/actions.ts`.
- Componentes client pequenos para UX (`SubmitButton`) sem mover regra de negocio para client.
- `pricing-service` continua centralizando prioridade de precificacao, com comportamento resiliente para indisponibilidade.

## Alterações esperadas (arquivos)

- `src/components/form-submit-button.tsx` (novo)
- `src/types/domain.ts`
- `src/services/pricing-service.ts`
- `src/app/dashboard/page.tsx`
- `src/app/lists/[listId]/page.tsx`
- `src/app/globals.css`
- `src/app/loading.tsx` (novo)
- `docs/manual-steps.md` (novo ou atualizado)
- `docs/steps/STEP-01-ui-resilience-and-feedback.md` (atualizacao final)

## Modelo de dados / SQL (se houver)

- Sem alteracao estrutural de tabela nesta etapa.

## Segurança / RLS (se houver)

- Sem mudanca de policies nesta etapa.
- Mantido modelo RLS atual: ownership por `auth.uid()` e catalogos read-only.

## UI/UX

- Botao com texto de progresso durante submissao.
- Estados de aviso para preco indisponivel.
- Loading global simples e consistente com paleta atual.
- Melhor legibilidade de mensagens de status em mobile.

## Plano de testes

- Manual:
  - Criar lista e verificar botao em pending.
  - Adicionar item e verificar pending.
  - Simular item sem preco seed/historico e verificar aviso sem crash.
  - Marcar item como comprado e validar fluxo permanece funcional.
- Automatizado (se aplicável):
  - `npm run lint`
  - `npm run build`

## Riscos e mitigação

- Risco: regressao visual em formularios.
  - Mitigacao: ajustes CSS pontuais e validação manual das rotas.
- Risco: mascarar erro real de dados ao tratar preco indisponivel.
  - Mitigacao: manter aviso explicito e preservar possibilidade de registrar preco pago.

## Decisões e trade-offs

- Decisao: tratar falta de preco como estado de UI (`unavailable`) em vez de erro fatal.
  - Trade-off: total estimado pode ficar parcial, mas app continua utilizavel.
- Decisao: usar `useFormStatus` com componente simples ao inves de framework de form state.
  - Trade-off: menos complexidade no MVP e menor custo de manutencao.

## Pós-etapa (follow-ups)

- STEP-02: testes automatizados de fluxos críticos (auth/lista/preco).
- STEP-03: refinamento de UX do fluxo de compra (modal/drawer acessivel).
- STEP-04: reverse geocoding real para preencher `preferred_uf`.

## Changelog da etapa

- Em andamento.

