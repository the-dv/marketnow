# STEP-02 - Pricing Tests and Logic Hardening

## Objetivo

Aumentar confiabilidade da regra de precificacao user-first com testes automatizados da prioridade de sugestao e fallback.

## Escopo

- Extrair parte da logica de escolha de preco para funcoes puras testaveis.
- Adicionar suite de testes unitarios para cenarios de prioridade de preco.
- Integrar script de teste no projeto.
- Validar lint/build apos mudancas.

## Fora de escopo

- Testes E2E de UI.
- Testes de integracao com banco real do Supabase.
- Alteracao de regra de negocio principal.

## Requisitos (Checklist)

- [ ] Criar modulo puro de logica de precificacao com funcoes testaveis.
- [ ] Cobrir em testes a prioridade:
  - [ ] ultimo preco do usuario
  - [ ] media do usuario
  - [ ] seed por UF
  - [ ] seed por macro-regiao
  - [ ] seed nacional
  - [ ] indisponivel
- [ ] Integrar `vitest` no projeto.
- [ ] Garantir `npm run lint` e `npm run build` ok.
- [ ] Registrar changelog curto da etapa.

## Critérios de aceite

- Testes unitarios executam com sucesso.
- Regras de prioridade passam em todos os cenarios.
- `pricing-service` continua funcional e sem regressao no build.

## Arquitetura / Design

- Separar regras deterministicas em modulo puro (`pricing-logic.ts`).
- `pricing-service.ts` continua responsavel por IO (Supabase) e delega decisao de prioridade.

## Alterações esperadas (arquivos)

- `src/services/pricing-logic.ts` (novo)
- `src/services/pricing-service.ts`
- `src/services/pricing-logic.test.ts` (novo)
- `package.json`
- `package-lock.json`
- `vitest.config.ts` (novo)
- `docs/steps/STEP-02-pricing-tests-and-hardening.md` (atualizacao final)

## Modelo de dados / SQL (se houver)

- Sem mudancas de schema nesta etapa.

## Segurança / RLS (se houver)

- Sem alteracoes de RLS.
- Mudanca restrita a logica de calculo e testes locais.

## UI/UX

- Sem mudancas visuais diretas nesta etapa.
- Impacto indireto: maior previsibilidade do valor sugerido exibido ao usuario.

## Plano de testes

- Manual:
  - Abrir lista e validar sugestoes seguem comportamento esperado apos refatoracao.
- Automatizado (se aplicável):
  - `npm run test`
  - `npm run lint`
  - `npm run build`

## Riscos e mitigação

- Risco: divergencia entre logica antiga e nova.
  - Mitigacao: testes com casos de prioridade e refatoracao incremental.
- Risco: configuração de teste quebrar pipeline.
  - Mitigacao: manter setup minimo do Vitest e scripts simples.

## Decisões e trade-offs

- Decisao: testar modulo puro em vez de mockar Supabase inteiro.
  - Trade-off: cobertura de IO menor, mas feedback rapido e confiavel na regra central.

## Pós-etapa (follow-ups)

- STEP-03: testes de server actions e fluxos de erro.
- STEP-04: E2E basico de auth + lista + compra.

## Changelog da etapa

- Em andamento.

