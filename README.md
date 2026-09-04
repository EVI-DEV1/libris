# Circula

Sistema de biblioteca em duas metades: uma **API REST** que carrega as regras de negócio, e um **front-end** que as opera.

- **API** — Node + TypeScript + Express + Prisma + JWT + Zod, com testes de integração, documentação OpenAPI e Docker.
- **Front-end** (`web/`) — React + Vite + TypeScript. Atendimento, acervo, empréstimos, reservas, gestão do estoque e equipe.

O nome *Circula* vem de circulação — o que a biblioteca chama de movimento de empréstimo e devolução. É provisório e mora em um arquivo só, [web/src/brand.ts](web/src/brand.ts): trocar leva um minuto e não encosta em mais nada.

---

## Rodar as duas metades

```bash
npm install && cp .env.example .env && npx prisma db push && npm run seed && npm run dev
```

Em outro terminal:

```bash
npm install --prefix web && npm run dev --prefix web
```

- Funcionários: `http://localhost:5173`
- Direção: `http://localhost:5173/direcao`
- API: `http://localhost:3333/api/v1`
- Documentação: `http://localhost:3333/api/docs`

O Vite faz proxy de `/api` para a porta 3333, então não há CORS no caminho durante o desenvolvimento.

---

## Duas portas, e quem cria acesso

O sistema tem **duas entradas com endereço próprio**: `/` para os funcionários e `/direcao` para a administração. Cada porta recusa quem não é dela, e diz para onde a pessoa deve ir — em vez de deixar tentando a mesma senha numa porta que nunca vai abrir.

**Só a direção cria login.** Não existe autocadastro para a equipe. A direção abre a conta em *Equipe*, escolhe o papel (funcionário ou direção), e pronto — a senha **não é escolhida por quem cria**: sai sempre a `SENHA_PADRAO` do ambiente.

**A senha padrão nunca é a senha de ninguém.** A conta nasce com `mustChangePassword`, e o sistema segura a pessoa numa tela de troca antes de qualquer outra coisa. Senha padrão que sobrevive ao primeiro acesso é a senha que a equipe inteira conhece — deixar isso passar seria entregar um buraco vendido como funcionalidade.

**Esqueci a senha** leva à direção, não ao e-mail: ela reseta a conta de volta para a padrão em *Equipe*, e a troca obrigatória volta a valer. Redefinição por e-mail depende de um serviço de envio que este sistema não tem, e está escrito na própria tela para ninguém esperar o que não existe.

---

## O balcão

A tela parte do gesto real: **o funcionário tem o livro na mão**. Por isso a primeira coisa é um campo único de comando que recebe o código de tombo — digitado, ou bipado por leitor de código de barras, que envia `Enter`. O exemplar aparece e a tela oferece **só a ação que aquele exemplar aceita agora**: emprestar se está na estante, devolver ou renovar se está fora, e um aviso se está separado para quem está na frente da fila.

Três decisões de interface que valem explicar:

**A regra é do servidor; a explicação é da tela.** Quando o empréstimo é recusado — atraso em aberto, limite atingido, exemplar reservado para outra pessoa — a interface mostra a frase que o servidor devolveu, sem reescrever a regra. Existe um lugar só onde essas condições vivem, e é o `loans.service.ts`.

**A recusa ganha o mesmo desenho do sucesso.** Bloquear empréstimo e cobrar multa são rotina de balcão, não erro de sistema. O componente `Recado` trata os dois com a mesma caixa.

**Nenhum número é chumbado.** Prazo, limite de simultâneos, multa por dia e renovações vêm do servidor. A tela mostra o que recebeu.

O mundo visual está registrado em [DESIGN.md](DESIGN.md), e o contrato da direção vive como comentário HTML no topo de [web/index.html](web/index.html).

---

## Por que biblioteca

Boa parte das APIs de estudo é CRUD puro: cadastra, lista, apaga. Biblioteca tem **regras que se contradizem entre si** e obrigam decisões de arquitetura reais:

- O empréstimo não é do *livro*, é do *exemplar*. Duas tabelas, dois ciclos de vida.
- Devolver dispara efeito colateral: promove a próxima reserva da fila e separa o exemplar no balcão.
- Renovar depende de três coisas ao mesmo tempo (atraso, limite, fila).
- Reserva só existe quando **não** há exemplar disponível — senão é fila de uma pessoa só.

Tudo isso vive em transação, porque duas requisições simultâneas emprestariam o mesmo exemplar.

---

### Testes

```bash
npm test
```

29 testes de integração e unidade. A suíte cria e destrói um SQLite próprio (`tests/test.db`) a cada execução — não encosta no banco de desenvolvimento.

---

## Arquitetura

```
src/
├── config/        env validado por Zod, cliente Prisma, logger
├── middlewares/   autenticação JWT, autorização por papel, validação, erros
├── shared/        AppError, paginação, asyncHandler
├── modules/       um diretório por recurso
│   └── loans/     schema.ts (contrato) → service.ts (regra) → routes.ts (HTTP)
├── docs/          documento OpenAPI 3.0
├── app.ts         montagem do Express (testável, sem listen)
└── server.ts      listen + shutdown limpo
```

Três decisões que sustentam o resto:

**1. `app.ts` não chama `listen`.** Quem sobe a porta é o `server.ts`. Assim o Supertest monta a aplicação inteira em memória, sem porta, sem processo separado, sem flakiness.

**2. O schema Zod é a fronteira.** O middleware `validate` **substitui** `req.body`/`query`/`params` pelo dado já parseado e coagido. Do controller para dentro, o tipo vem do Zod — não existe `any` atravessando a camada.

**3. Regra de negócio mora no service, dentro de transação.** As checagens de empréstimo (usuário ativo, sem atraso, abaixo do limite, exemplar disponível) e a escrita acontecem na mesma `$transaction`. Fora dela, duas requisições simultâneas passariam nas mesmas checagens e emprestariam o mesmo exemplar.

---

## Regras de negócio

Configuráveis por variável de ambiente (`.env`):

| Variável | Padrão | O que faz |
|---|---|---|
| `LOAN_DAYS` | 14 | Prazo do empréstimo e de cada renovação |
| `MAX_ACTIVE_LOANS` | 3 | Empréstimos simultâneos por leitor |
| `FINE_PER_DAY` | 1.50 | Multa por dia de atraso |
| `MAX_RENEWALS` | 1 | Renovações por empréstimo |
| `SENHA_PADRAO` | mudar@123 | Senha de toda conta criada pela direção, com troca obrigatória |

**Empréstimo** é recusado se: o usuário está inativo, tem qualquer empréstimo em atraso, atingiu o limite de simultâneos, ou o exemplar não está disponível. Exemplar `RESERVED` só sai para quem está na frente da fila.

**Devolução** calcula a multa por dias inteiros iniciados (devolver no próprio dia do vencimento não gera multa; um dia e uma hora de atraso conta como dois). Se há reserva esperando, o exemplar já sai `RESERVED` para o próximo leitor, com 2 dias para retirada.

**Renovação** é bloqueada por atraso, por limite atingido ou por fila de reserva — quem está esperando tem prioridade sobre quem já leu.

**Reserva** é recusada quando há exemplar na prateleira, quando o leitor já está na fila, e quando ele já está com um exemplar da obra. A fila é FIFO por data de criação.

---

## Papéis

| | MEMBER | LIBRARIAN | ADMIN |
|---|---|---|---|
| Consultar catálogo | público | público | público |
| Emprestar / renovar | só para si | qualquer leitor | qualquer leitor |
| Registrar devolução | — | ✓ | ✓ |
| Gerenciar acervo e exemplares | — | ✓ | ✓ |
| Gerenciar acervo e estoque | — | ✓ | ✓ |
| Criar conta de equipe | — | — | ✓ |
| Resetar senha de alguém | — | — | ✓ |
| Desativar usuário | — | — | ✓ |

O escopo do MEMBER é aplicado no **service**, não na rota: `GET /loans?userId=<outro>` não devolve erro, devolve os empréstimos do próprio solicitante. Filtro do cliente nunca amplia permissão.

---

## Endpoints

Base: `/api/v1`

```
POST   /auth/register            Cadastro de leitor (devolve token)
POST   /auth/login               Login
GET    /auth/me                  Perfil do token

GET    /books                    Catálogo — público, com busca, filtro e ordenação
GET    /books/:id                Obra + seus exemplares
POST   /books                    Cadastra obra                    [LIBRARIAN]
PATCH  /books/:id                Atualiza obra                    [LIBRARIAN]
DELETE /books/:id                Remove obra                      [ADMIN]

GET    /authors  /categories     Listagem pública
POST   PATCH  PUT  DELETE        Gestão do acervo                 [LIBRARIAN/ADMIN]

GET    /copies                   Exemplares, filtrando por obra e status
POST   /copies                   Tomba novo exemplar              [LIBRARIAN]
PATCH  /copies/:id               Prateleira / manutenção / perda  [LIBRARIAN]

GET    /loans                    MEMBER vê só os próprios
POST   /loans                    Registra empréstimo
POST   /loans/:id/return         Devolução + multa                [LIBRARIAN]
POST   /loans/:id/renew          Renovação

GET    /reservations             MEMBER vê só as próprias
POST   /reservations             Entra na fila (devolve posição)
DELETE /reservations/:id         Cancela e libera o exemplar
POST   /reservations/expire-stale  Rotina de expiração (cron)     [LIBRARIAN]

GET    /users                    Lista quem tem acesso            [LIBRARIAN/ADMIN]
POST   /users                    Cria conta com a senha padrão    [ADMIN]
POST   /users/:id/reset-password Devolve a conta à senha padrão   [ADMIN]
POST   /auth/change-password     Troca a própria senha
```

### Busca no catálogo

```
GET /api/v1/books?search=rosa&available=true&sort=-publishedYear&page=1&perPage=20
```

`search` cobre título, ISBN, editora **e nome do autor** numa única query. `available=true` filtra por obras com exemplar na prateleira agora.

---

## Formato das respostas

Listagens vêm sempre com envelope de paginação:

```json
{
  "data": [ ... ],
  "meta": { "page": 1, "perPage": 20, "total": 137, "totalPages": 7, "hasNext": true }
}
```

Erros têm um formato só, em toda a API:

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Exemplar indisponivel: ja esta emprestado"
  }
}
```

Erro de validação traz o campo culpado:

```json
{
  "error": {
    "code": "UNPROCESSABLE_ENTITY",
    "message": "Dados invalidos",
    "details": [{ "campo": "password", "erro": "Senha precisa de ao menos 8 caracteres" }]
  }
}
```

Códigos usados: `400` referência inexistente · `401` sem token / credencial errada · `403` sem permissão · `404` recurso inexistente · `409` conflito de estado (exemplar emprestado, limite atingido, atraso) · `422` payload inválido · `429` rate limit.

---

## Segurança

- Senha com bcrypt, custo 10. `passwordHash` nunca sai numa resposta — os `select` do Prisma são explícitos.
- Login e registro com rate limit próprio (10 tentativas / 15 min); o resto da API, 120 req/min.
- Login não diferencia "e-mail não existe" de "senha errada" — a mensagem é a mesma, e há teste garantindo isso. Mensagens diferentes entregam ao atacante quais e-mails existem na base.
- `helmet`, CORS e corpo limitado a 100 KB.
- Erro não previsto nunca vaza detalhe: só `AppError` chega ao cliente com mensagem própria; stack trace só em desenvolvimento.
- Exclusão de usuário é lógica (`active: false`) — histórico de empréstimo é registro contábil da biblioteca.

---

## Docker

```bash
docker compose up --build
```

O compose sobe a API com **Postgres**. Para usar, troque o provider em `prisma/schema.prisma` de `sqlite` para `postgresql` e rode `npx prisma migrate deploy`. O SQLite é o padrão local para não exigir banco instalado.

---

## O que eu faria em seguida

Honestidade sobre o escopo — o que ficou de fora e por quê:

- **Redefinição de senha por e-mail.** Hoje o "esqueci a senha" passa pela direção, presencialmente. Self-service depende de um provedor de envio (Resend, SES) e de token de uso único com validade — nada disso está feito, e a tela diz isso ao usuário em vez de fingir.
- **Refresh token.** Hoje é um único access token de 1 dia. Rotação com refresh exige tabela de sessão e revogação, e não muda nada nas regras de negócio que este projeto quer mostrar.
- **Migrations versionadas.** Uso `db push` para agilidade em SQLite; em produção o caminho é `prisma migrate` com histórico versionado.
- **Cron real para `expire-stale`.** Está exposto como endpoint administrativo em vez de agendador embutido, porque quem agenda em produção é a infra (cron do sistema, worker, scheduler do provedor), não o processo da API.
- **Notificação de reserva pronta.** A reserva vira `READY` com prazo, mas ninguém avisa o leitor. Precisa de fila e serviço de e-mail.
