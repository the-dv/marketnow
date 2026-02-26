# Development Roadmap

## Objetivo

Organizar a entrega do MarketNow em fases, com foco no MVP em 1 semana e evolucoes pos-MVP.

## MVP (1 semana)

### Dia 1 - Fundacao
- Inicializar projeto Next.js + TypeScript.
- Configurar Supabase (Auth + Database).
- Definir variaveis de ambiente.
- Validar login baseline com Magic Link.

### Dia 2 - Dados e Seed
- Criar tabelas: `profiles`, `shopping_lists`, `shopping_list_items`, `products`, `regional_prices`.
- Aplicar constraints e indices.
- Inserir seed inicial (minimo 20 produtos + cobertura nacional e UF).

### Dia 3 - CRUD de Listas e Itens
- Criar operacoes de lista (create/read/update/delete).
- Criar operacoes de itens (add/update/remove).
- Garantir ownership por RLS.

### Dia 4 - Localizacao e Regiao
- Integrar geolocalizacao do navegador.
- Resolver UF por reverse geocoding.
- Mapear macro-regiao e preparar fallback.

### Dia 5 - Precificacao e Total
- Implementar estrategia de preco: UF -> macro-regiao -> nacional.
- Exibir total estimado por lista.
- Exibir origem do preco aplicado por item.

### Dia 6 - Seguranca e Validacoes
- Revisar e consolidar policies RLS.
- Validar unidades e quantidade.
- Endurecer tratamento de erros de auth/localizacao/preco.

### Dia 7 - QA e Deploy
- Executar checklist funcional do MVP.
- Ajustes finais de UX e mensagens.
- Deploy na Vercel (free plan).
- Validacao pos-deploy.

## Pos-MVP

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
- Total estimado respeita fallback regional.
- RLS impede acesso indevido entre usuarios.
- Aplicacao deployada e funcional na Vercel free.
