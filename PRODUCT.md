# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + Vite + TypeScript (escolha do usuário, nesta sessão). Consome a API REST já pronta neste repositório (Express + Prisma + JWT, base `/api/v1`). Front-end vive em `web/` como app separado do servidor.

## Users

Primário e único confirmado: **o funcionário do balcão da biblioteca** (papel `LIBRARIAN`, e o `ADMIN` que faz o mesmo com mais permissão). Trabalha em pé ou sentado num balcão, com fila de pessoas na frente, atendendo um leitor por vez e alternando entre quatro tarefas curtas: achar um livro, emprestar, receber de volta, e responder "quando chega minha reserva?".

O leitor (`MEMBER`) existe na API e tem escopo próprio, mas **não recebe tela nesta versão** — decisão do usuário. Área do leitor fica como expansão futura.

## Product Purpose

Dar à biblioteca a operação de balcão inteira numa tela só: catálogo, empréstimo, devolução com multa calculada, e a fila de reservas. Sucesso é o atendimento acabar sem o funcionário precisar decorar regra nenhuma — a tela diz o que pode e o que não pode, e por quê.

## Positioning

O sistema não guarda só o cadastro: ele **carrega as regras da biblioteca**. Limite de empréstimos, bloqueio por atraso, multa por dia, prioridade de quem está na fila — tudo isso já é decidido no servidor, em transação, e a tela mostra o motivo em português quando recusa. O funcionário não precisa saber a regra; precisa saber o que fazer agora.

## Operating Context

- Atendimento de balcão, um leitor por vez, com fila esperando. Pressa é a condição normal, não a exceção.
- O objeto físico é o **exemplar**, não o título: o funcionário tem um livro na mão com um código de tombo, e é esse código que identifica tudo.
- Quatro tarefas se repetem o dia inteiro: buscar no acervo, emprestar, devolver, consultar reserva.
- Momentos de conflito são frequentes e desconfortáveis: recusar um empréstimo por atraso, cobrar multa, dizer que o exemplar está separado para outra pessoa. A tela precisa dar ao funcionário a frase pronta.
- Ambiente iluminado, tela de desktop, uso contínuo por horas.

## Capabilities and Constraints

Confirmado pela API já construída:

- Papéis `ADMIN`, `LIBRARIAN`, `MEMBER`; autenticação JWT (`Authorization: Bearer`), token de 1 dia.
- Catálogo público (sem token): busca por título, ISBN, editora e nome do autor; filtro por disponibilidade, categoria e autor; ordenação e paginação.
- Empréstimo é do exemplar. Recusado quando: usuário inativo, qualquer atraso em aberto, limite de simultâneos atingido, exemplar indisponível, ou exemplar separado para outro leitor.
- Devolução só pelo balcão. Calcula multa por dias inteiros iniciados e promove automaticamente a primeira reserva da fila.
- Renovação bloqueada por atraso, por limite atingido ou por fila de reserva.
- Reserva só quando não há exemplar disponível; fila FIFO; devolve a posição na fila.
- Erros vêm padronizados com `error.code` e `error.message` **já em português** — a tela deve exibir a mensagem do servidor, não reescrever a regra.
- Parâmetros de negócio (prazo, limite, multa/dia, renovações) são configuráveis por ambiente. A tela nunca pode chumbar esses números.

Não decidido: hospedagem, multi-biblioteca (uma instância por cliente ou várias), leitor de código de barras físico.

## Brand Commitments

Nome do produto: **Lombada**. Criado nesta sessão a pedido do usuário, deliberadamente trocável — deve ficar isolado em um único ponto do código para renomear em minutos.

Interface em português do Brasil. O vocabulário do domínio é o da biblioteca, não o do banco de dados: exemplar, tombo, acervo, empréstimo, devolução, reserva, multa.

## Evidence on Hand

- API completa e funcionando neste repositório, com 29 testes passando.
- Documentação OpenAPI real em `src/docs/openapi.ts`, servida em `/api/docs`.
- Seed com 4 obras, 10 exemplares e 3 usuários (`prisma/seed.ts`) — **dados de demonstração, não acervo real**.

Não existe: cliente real, biblioteca usuária, preço, licença, depoimento, benchmark. Nada disso pode ser inventado na interface.

## Product Principles

1. **O exemplar é a unidade.** Toda ação de balcão começa e termina num objeto físico com código. A tela nunca deixa dúvida sobre qual exemplar está em jogo.
2. **A regra é do servidor; a explicação é da tela.** A interface não reimplementa regra de negócio — ela mostra, em português, o motivo que o servidor deu.
3. **A recusa é parte do atendimento.** Bloquear empréstimo, cobrar multa e segurar exemplar reservado são momentos de rotina, não erros. Merecem tanto desenho quanto o caminho feliz.
4. **Fila na frente, pressa na mão.** Toda tarefa comum termina em poucos gestos; nada essencial exige rolar a página ou trocar de tela.
5. **Sem números chumbados.** Prazo, limite, multa e renovações vêm do servidor. A tela mostra o que recebeu.
