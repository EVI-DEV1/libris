# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + Vite + TypeScript (escolha do usuário, nesta sessão). Consome a API REST já pronta neste repositório (Express + Prisma + JWT, base `/api/v1`). Front-end vive em `web/` como app separado do servidor.

## Users

Dois usuários confirmados, com portas de entrada separadas:

**O funcionário do balcão** (`LIBRARIAN`), pela porta `/`. Trabalha com fila de pessoas na frente, atendendo um leitor por vez e alternando entre tarefas curtas: achar um livro, emprestar, receber de volta, responder "quando chega minha reserva?", e manter o acervo e o estoque em dia.

**A direção** (`ADMIN`), pela porta `/direcao`. Faz tudo o que o funcionário faz, e mais: cria as contas da equipe, define o papel de cada um e devolve o acesso de quem perdeu a senha. Entrando pela porta dela, cai na gestão, não no balcão.

O leitor (`MEMBER`) existe na API e tem escopo próprio, mas **não recebe tela nesta versão** — decisão do usuário. Área do leitor fica como expansão futura; as duas portas recusam contas de leitor explicitamente.

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

Acesso e contas:

- **Só a direção cria login.** Não existe autocadastro de equipe. `POST /users` exige `ADMIN`.
- **A senha não é escolhida por quem cria**: sai sempre a `SENHA_PADRAO` do ambiente.
- **Senha padrão nunca é a senha de ninguém**: a conta nasce com `mustChangePassword` e o sistema segura a pessoa numa tela de troca antes de qualquer outra coisa. Confirmado pelo usuário como comportamento desejado.
- **"Esqueci a senha" passa pela direção**, não por e-mail: ela reseta a conta para a padrão e a trava religa. Redefinição por e-mail exige provedor de envio, que não existe aqui — e a tela diz isso ao usuário.
- Troca de senha exige a senha atual mesmo quando a conta está na padrão.

Gestão do acervo (`ADMIN` e `LIBRARIAN`): cadastrar obra com criação de autor e categoria embutida, tombar exemplar, e mover exemplar entre na estante / manutenção / perdido. Exemplar emprestado ou reservado não aceita troca de situação — esse estado pertence ao empréstimo.

Não decidido: hospedagem, multi-biblioteca (uma instância por cliente ou várias), leitor de código de barras físico, redefinição de senha por e-mail.

## Brand Commitments

Nome do produto: **Libris**, de *ex libris* — a marca que a biblioteca carimba no livro para dizer de quem ele é. Escolhido pelo usuário depois de dois nomes descartados (Lombada, Circula), o que torna a exigência dura: o nome vive em um ponto só do código (`web/src/brand.ts`) e nada mais o escreve — nem a chave de sessão no navegador, que é neutra de propósito.

Referência visual dada pelo usuário: o gradiente **Transfile** do uiGradients (#16bffd → #cb3066). O usuário recusou explicitamente uma direção retrô anterior com as palavras "velho" e "sem vida", e pediu design atual.

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
