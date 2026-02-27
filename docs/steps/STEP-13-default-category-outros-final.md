# STEP-13 - Default Category Outros Final

## Objetivo

Fechar de forma definitiva a regra de categoria para produtos custom:
- UI permite "Sem categoria".
- Banco persiste sempre `products.category_id` com categoria valida (`NOT NULL`), usando `categories.slug = 'outros'` como default.
- Sem escrita runtime em `categories` pelo app.

## Escopo

- Criar migracao idempotente para garantir categoria base `outros`.
- Ajustar backend para mapear "Sem categoria" por `SELECT` de `outros`.
- Remover dependencias de criacao/upsert de categoria em runtime.
- Padronizar sentinela de UI para "Sem categoria".
- Atualizar docs operacionais e modelo de dados para a regra final.

## Fora de escopo

- Mudancas de RLS alem da regra atual.
- Alteracoes de UI fora do fluxo de categoria.
- Refatoracao de regras de preco.

## Requisitos (Checklist)

- [x] Migracao nova criada em `/supabase/migrations` no padrao `YYYYMMDDHHMM_create_default_category_outros.sql`.
- [x] Migracao insere/atualiza `outros` de forma idempotente.
- [x] Migracao preserva ambientes com categorias existentes sem duplicar slug.
- [x] Backend resolve categoria default por `SELECT slug='outros'`.
- [x] Backend nao executa `insert/upsert` em `categories` em runtime.
- [x] Erro claro quando `outros` nao existe: orientar aplicar migracao no Supabase.
- [x] Dropdown mantem opcao visual "Sem categoria".
- [x] Persistencia com "Sem categoria" envia sentinela e backend mapeia para `outros`.
- [x] Produtos com `category.slug='outros'` aparecem como "Sem categoria" na UI.
- [x] `docs/manual-steps.md` atualizado com passo de aplicacao da nova migracao.
- [x] `docs/data-model.md` atualizado para `category_id NOT NULL` + regra de persistencia em `outros`.
- [x] Steps divergentes atualizados para indicar status historico/superado ou regra final.
- [x] `npm run lint` executado com sucesso.
- [x] `npm run build` executado com sucesso.
- [x] Commit realizado com referencia `STEP-13`.

## Criterios de aceite

- Criar produto com "Sem categoria" nao gera erro `23502` nem `42501`.
- No banco, produto salvo referencia `categories.slug = 'outros'`.
- Se `outros` estiver ausente, app retorna erro amigavel sem tentar criar categoria.
- Documentacao operacional aponta um unico fluxo final de categoria.

## Plano de testes

- Aplicar migracao no Supabase cloud e validar `slug='outros'`.
- Criar produto com "Sem categoria" e confirmar persistencia em `outros`.
- Simular ausencia de `outros` e validar erro orientativo no app.
- Rodar `npm run lint`.
- Rodar `npm run build`.

## Changelog curto

- Migracao de garantia da categoria base `outros` adicionada.
- Fallback de categoria consolidado com `SELECT` only em runtime.
- Sentinela de UI padronizada para `__NONE__`.
- Documentacao de operacao/modelo alinhada a regra final.
