# Deploy - MarketNow

## Como funciona o deploy

- O projeto esta configurado para deploy na Vercel.
- A branch `main` representa producao.
- Cada push em `main` gera novo build/deploy automaticamente.

## Fluxo padrao de publicacao

1. Garantir `npm run lint` e `npm run build` locais sem erros.
2. Fazer merge das mudancas na `main`.
3. Enviar commit para `origin/main`.
4. Validar no dashboard da Vercel se o deploy terminou com status `Ready`.

## Rollback na Vercel

1. Abrir o projeto no dashboard da Vercel.
2. Acessar a lista de Deployments.
3. Selecionar um deploy anterior estavel.
4. Usar a opcao `Promote to Production` para voltar rapidamente.
5. Opcional: corrigir o codigo em `main` para manter historico alinhado no Git.

## Atualizacao de variaveis de ambiente

1. Abrir `Project Settings > Environment Variables` na Vercel.
2. Atualizar os valores necessarios (`Production` e, se aplicavel, `Preview`/`Development`).
3. Salvar alteracoes.
4. Reexecutar deploy para aplicar os novos valores.

## Observacoes

- Nunca expor `service_role` no frontend.
- Manter somente variaveis publicas (`NEXT_PUBLIC_*`) que forem estritamente necessarias no cliente.
