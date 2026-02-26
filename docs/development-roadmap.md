# Development Roadmap

## Objetivo

Organizar a entrega do MarketNow em fases, com foco no MVP e evolucoes pos-MVP baseadas em prioridade tecnica.

## Fase 1 - MVP (Prioridade Alta)

### Etapa 1 - Fundacao de Projeto
- Inicializar projeto Next.js + TypeScript.
- Configurar Supabase (Auth + Database).
- Definir variaveis de ambiente.
- Validar login baseline com Magic Link.

Marco tecnico:
- Estrutura base da aplicacao e autenticacao funcional em ambiente de desenvolvimento.

### Etapa 2 - Dados e Seed
- Criar tabelas: `profiles`, `shopping_lists`, `shopping_list_items`, `categories`, `products`, `user_product_prices`, `regional_prices`.
- Aplicar constraints e indices.
- Inserir seed inicial (categorias + minimo 20 produtos + cobertura seed nacional/UF).

Marco tecnico:
- Modelo de dados versionado e seed inicial consistente para precificacao.

### Etapa 3 - CRUD de Listas e Itens
- Criar operacoes de lista (create/read/update/delete).
- Criar operacoes de itens (add/update/remove).
- Garantir ownership por RLS.

Marco tecnico:
- Usuario autenticado consegue gerenciar listas e itens com isolamento de dados.

### Etapa 4 - Localizacao e Regiao
- Integrar geolocalizacao do navegador.
- Resolver UF por reverse geocoding.
- Mapear macro-regiao e preparar fallback.

Marco tecnico:
- Contexto regional resolvido para suportar estrategia de fallback de preco.

### Etapa 5 - Precificacao e Total
- Implementar estrategia de sugestao: ultimo preco usuario -> media usuario -> seed fallback (UF -> macro-regiao -> nacional).
- Exibir total estimado por lista.
- Exibir origem do preco aplicado por item.
- Implementar fluxo de compra com pergunta de preco pago e opcao de salvar referencia futura.

Marco tecnico:
- Calculo de total estimado operacional com rastreabilidade da origem do preco.

### Etapa 6 - Seguranca e Validacoes
- Revisar e consolidar policies RLS.
- Validar unidades e quantidade.
- Endurecer tratamento de erros de auth/localizacao/preco.

Marco tecnico:
- Regras de seguranca e validacao consolidadas para operacao segura do MVP.

### Etapa 7 - QA e Deploy
- Executar checklist funcional do MVP.
- Ajustes finais de UX e mensagens.
- Deploy na Vercel (free plan).
- Validacao pos-deploy.

Marco tecnico:
- MVP publicado com fluxo funcional validado em ambiente de producao.

## Fases de Evolucao (Pos-MVP)

### Fase 2
- Colaboracao em listas (feature paga).
- Compartilhamento controlado por permissao.

### Fase 3
- Historico de listas e versoes de preco.
- Visualizacoes de tendencia de custo.

### Fase 4
- Analytics de consumo.
- Melhorias no modelo de recomendacao de compras.

### Fase 5
- Refinamento geografico por cidade/bairro.
- Melhor granularidade de estimativa regional.

## Criterios de Aceite do MVP

- Usuario autentica por Magic Link e acessa rotas privadas.
- Usuario gerencia listas e itens proprios.
- Total estimado respeita prioridade user-first e fallback seed.
- Preco salvo de um usuario nao e compartilhado com outro.
- RLS impede acesso indevido entre usuarios.
- Aplicacao deployada e funcional na Vercel free.
