# UI Guidelines - MarketNow

## Objetivo

Definir diretrizes de interface para um MVP mobile-first, minimalista e orientado a usabilidade.

## Direcao Visual

- Base: fundo branco.
- Cor primaria: azul.
- Detalhes e texto principal: preto.
- Estilo limpo, sem excesso de elementos decorativos.

## Paleta Recomendada

- `--bg: #FFFFFF`
- `--primary: #0B5FFF`
- `--text: #111111`
- `--muted: #6B7280`
- `--border: #E5E7EB`
- `--error: #B00020`

## Layout Responsivo (Mobile-First)

Breakpoints sugeridos:
- Base mobile: ate 767px
- Tablet: 768px+
- Desktop: 1024px+

Regras:
- Priorizacao de leitura vertical no mobile.
- Acoes principais em area facil de toque.
- Conteudo centralizado com largura maxima em desktop.

## Componentes Minimos

- Navbar
  - Logo/nome do app.
  - Acao de logout.

- Lista de compras
  - Cards ou blocos com nome da lista, quantidade de itens e ultima atualizacao.
  - Card principal deve ser clicavel para abrir a lista.

- Formulario de item
  - Seletor de produto.
  - Campo de quantidade.
  - Seletor de unidade (`un`, `kg`, `L`).
  - Fluxo adicional para cadastrar produto custom:
    - nome
    - categoria (opcional)
    - unidade

- Card de total estimado
  - Exibir total em BRL.
  - Exibir indicador da origem do preco quando houver fallback.

## Estados de Interface Obrigatorios

- Loading
  - Enquanto autentica sessao, carrega lista ou calcula total.

- Erro de geolocalizacao
  - Mensagem clara com acao de tentar novamente.
  - Permitir fallback sem bloquear totalmente o uso.

- Sem historico de preco do usuario
  - Aviso discreto quando a sugestao vier da seed fallback (UF/macro/nacional).

- Estado vazio
  - Sem listas criadas.
  - Lista sem itens.

## Usabilidade

- Feedback imediato para acoes do usuario (salvar, remover, erro).
- Mensagens curtas e objetivas.
- Hierarquia visual clara: nome da lista, itens, total.

## Acessibilidade Basica

- Contraste minimo adequado entre texto e fundo.
- Indicador de foco visivel para navegacao por teclado.
- Labels e placeholders claros em formularios.
- Alvos de toque adequados no mobile.

## Nao Escopo Visual do MVP

- Tematizacao avancada (dark mode, personalizacao de tema).
- Animacoes complexas.
- Biblioteca extensa de componentes customizados.
