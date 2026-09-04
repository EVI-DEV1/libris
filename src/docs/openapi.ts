/**
 * Documento OpenAPI 3.0 servido em /api/docs (Swagger UI) e /api/openapi.json.
 * Escrito a mao de proposito: o contrato e o que a API promete, e promessa
 * gerada automaticamente a partir do codigo so descreve o que ela ja faz.
 */

const bearerAuth = [{ bearerAuth: [] }];

const erro = (descricao: string) => ({
  description: descricao,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
});

const paginationParams = [
  { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
  { name: 'perPage', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
];

const uuidParam = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'string', format: 'uuid' },
};

export const openapiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'API da Biblioteca',
    version: '1.0.0',
    description: [
      'API REST para gestao de biblioteca: acervo, exemplares, emprestimos, reservas e multas.',
      '',
      '**Autenticacao:** JWT via `Authorization: Bearer <token>`. Obtenha o token em `POST /api/v1/auth/login`.',
      '',
      '**Papeis:** `MEMBER` (leitor), `LIBRARIAN` (balcao), `ADMIN` (gestao).',
      '',
      '**Regras de negocio principais:**',
      '- O emprestimo acontece sobre o *exemplar* (copy), nunca sobre o *livro* (book).',
      '- Maximo de emprestimos simultaneos e prazo configuraveis por variavel de ambiente.',
      '- Quem tem emprestimo em atraso nao retira outro exemplar.',
      '- Multa por dia de atraso, calculada na devolucao.',
      '- Reserva so e aceita quando nao ha exemplar disponivel; a fila e FIFO.',
      '- Devolucao promove automaticamente a primeira reserva da fila.',
    ].join('\n'),
    license: { name: 'MIT' },
  },
  servers: [{ url: '/api/v1', description: 'v1' }],
  tags: [
    { name: 'Auth', description: 'Cadastro, login e perfil' },
    { name: 'Users', description: 'Gestao de usuarios (balcao/admin)' },
    { name: 'Authors', description: 'Autores do acervo' },
    { name: 'Categories', description: 'Categorias do acervo' },
    { name: 'Books', description: 'Catalogo (obras)' },
    { name: 'Copies', description: 'Exemplares fisicos' },
    { name: 'Loans', description: 'Emprestimos, devolucoes e renovacoes' },
    { name: 'Reservations', description: 'Fila de reserva' },
  ],
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Cadastra um leitor e ja devolve o token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Maria Andrade' },
                  email: { type: 'string', format: 'email', example: 'maria@exemplo.com' },
                  password: { type: 'string', minLength: 8, example: 'senha-forte-123' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Criado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
          },
          409: erro('E-mail ja cadastrado'),
          422: erro('Dados invalidos'),
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Autentica e devolve o token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'admin@biblioteca.dev' },
                  password: { type: 'string', example: 'admin12345' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Autenticado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
          },
          401: erro('E-mail ou senha incorretos'),
          429: erro('Muitas tentativas'),
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Perfil do usuario do token',
        security: bearerAuth,
        responses: {
          200: {
            description: 'OK',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } },
          },
          401: erro('Token ausente ou invalido'),
        },
      },
    },

    "/users": {
      post: {
        tags: ["Users"],
        summary: "Cria conta de equipe com a senha padrao (ADMIN)",
        description:
          "A senha NAO vem no corpo: e sempre a SENHA_PADRAO do ambiente, e a conta nasce com troca obrigatoria no primeiro acesso.",
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "role"],
                properties: {
                  name: { type: "string", example: "Joana Balcao" },
                  email: { type: "string", format: "email" },
                  role: { type: "string", enum: ["ADMIN", "LIBRARIAN"] },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Criado, com mustChangePassword true" },
          403: erro("So a direcao cria conta"),
          409: erro("E-mail ja cadastrado"),
        },
      },
      get: {
        tags: ['Users'],
        summary: 'Lista usuarios',
        security: bearerAuth,
        parameters: [
          ...paginationParams,
          { name: 'search', in: 'query', schema: { type: 'string' } },
          {
            name: 'role',
            in: 'query',
            schema: { type: 'string', enum: ['ADMIN', 'LIBRARIAN', 'MEMBER'] },
          },
          { name: 'active', in: 'query', schema: { type: 'string', enum: ['true', 'false'] } },
        ],
        responses: { 200: { description: 'OK' }, 403: erro('Sem permissao') },
      },
    },
    '/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Detalhe do usuario',
        security: bearerAuth,
        parameters: [uuidParam],
        responses: { 200: { description: 'OK' }, 404: erro('Nao encontrado') },
      },
      patch: {
        tags: ['Users'],
        summary: 'Altera nome, papel ou situacao (ADMIN)',
        security: bearerAuth,
        parameters: [uuidParam],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  role: { type: 'string', enum: ['ADMIN', 'LIBRARIAN', 'MEMBER'] },
                  active: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'OK' }, 403: erro('Sem permissao') },
      },
      delete: {
        tags: ['Users'],
        summary: 'Desativa o usuario (exclusao logica, ADMIN)',
        security: bearerAuth,
        parameters: [uuidParam],
        responses: { 204: { description: 'Desativado' }, 409: erro('Tem emprestimo em aberto') },
      },
    },

    "/users/{id}/reset-password": {
      post: {
        tags: ["Users"],
        summary: "Devolve a conta para a senha padrao (ADMIN)",
        description:
          "E o caminho de esqueci-a-senha desta versao: sem servico de e-mail, quem restabelece acesso e a direcao, e a troca obrigatoria volta a valer.",
        security: bearerAuth,
        parameters: [uuidParam],
        responses: { 204: { description: "Resetado" }, 403: erro("So a direcao reseta") },
      },
    },

    "/auth/change-password": {
      post: {
        tags: ["Auth"],
        summary: "Troca a propria senha",
        description:
          "Exige a senha atual mesmo quando a conta esta na senha padrao: com o token na mao, nao pedir a atual deixa sessao esquecida virar sequestro de conta.",
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["senhaAtual", "senhaNova"],
                properties: {
                  senhaAtual: { type: "string" },
                  senhaNova: { type: "string", minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Trocada, com mustChangePassword false" },
          400: erro("A nova senha e igual a atual"),
          401: erro("Senha atual incorreta"),
        },
      },
    },

    "/books": {
      get: {
        tags: ['Books'],
        summary: 'Busca no catalogo (publico)',
        parameters: [
          ...paginationParams,
          {
            name: 'search',
            in: 'query',
            description: 'Titulo, ISBN, editora ou nome do autor',
            schema: { type: 'string' },
          },
          { name: 'categoryId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'authorId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          {
            name: 'available',
            in: 'query',
            description: 'true = apenas obras com exemplar na prateleira',
            schema: { type: 'string', enum: ['true', 'false'] },
          },
          {
            name: 'sort',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['title', '-title', 'publishedYear', '-publishedYear', 'createdAt', '-createdAt'],
              default: 'title',
            },
          },
        ],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Book' } },
                    meta: { $ref: '#/components/schemas/PaginationMeta' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Books'],
        summary: 'Cadastra obra no catalogo (LIBRARIAN/ADMIN)',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['isbn', 'title', 'authorIds'],
                properties: {
                  isbn: { type: 'string', example: '9788535902778' },
                  title: { type: 'string', example: 'Grande Sertao: Veredas' },
                  synopsis: { type: 'string' },
                  publisher: { type: 'string' },
                  publishedYear: { type: 'integer', example: 1956 },
                  categoryId: { type: 'string', format: 'uuid' },
                  authorIds: {
                    type: 'array',
                    minItems: 1,
                    items: { type: 'string', format: 'uuid' },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Criado' },
          409: erro('ISBN ja cadastrado'),
          422: erro('Dados invalidos'),
        },
      },
    },
    '/books/{id}': {
      get: {
        tags: ['Books'],
        summary: 'Detalhe da obra com seus exemplares',
        parameters: [uuidParam],
        responses: { 200: { description: 'OK' }, 404: erro('Nao encontrado') },
      },
      patch: {
        tags: ['Books'],
        summary: 'Atualiza a obra (LIBRARIAN/ADMIN)',
        security: bearerAuth,
        parameters: [uuidParam],
        responses: { 200: { description: 'OK' } },
      },
      delete: {
        tags: ['Books'],
        summary: 'Remove a obra (ADMIN)',
        security: bearerAuth,
        parameters: [uuidParam],
        responses: { 204: { description: 'Removido' }, 409: erro('Ha exemplares em uso') },
      },
    },

    '/copies': {
      get: {
        tags: ['Copies'],
        summary: 'Lista exemplares',
        security: bearerAuth,
        parameters: [
          ...paginationParams,
                    {
            name: 'code',
            in: 'query',
            description: 'Codigo de tombo, o gesto do balcao: o livro esta na mao',
            schema: { type: 'string', example: 'BIB-000123' },
          },
{ name: 'bookId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['AVAILABLE', 'ON_LOAN', 'RESERVED', 'MAINTENANCE', 'LOST'],
            },
          },
        ],
        responses: { 200: { description: 'OK' } },
      },
      post: {
        tags: ['Copies'],
        summary: 'Tomba um novo exemplar (LIBRARIAN/ADMIN)',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['bookId', 'code'],
                properties: {
                  bookId: { type: 'string', format: 'uuid' },
                  code: { type: 'string', example: 'BIB-000123' },
                  shelf: { type: 'string', example: 'C-04' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Criado' }, 409: erro('Codigo de tombo repetido') },
      },
    },
    '/copies/{id}': {
      get: {
        tags: ['Copies'],
        summary: 'Detalhe do exemplar',
        security: bearerAuth,
        parameters: [uuidParam],
        responses: { 200: { description: 'OK' } },
      },
      patch: {
        tags: ['Copies'],
        summary: 'Muda prateleira ou situacao fisica (LIBRARIAN/ADMIN)',
        description: 'Nao aceita `ON_LOAN`: esse status so muda por emprestimo ou devolucao.',
        security: bearerAuth,
        parameters: [uuidParam],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  shelf: { type: 'string' },
                  status: { type: 'string', enum: ['AVAILABLE', 'MAINTENANCE', 'LOST'] },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'OK' }, 409: erro('Exemplar emprestado') },
      },
      delete: {
        tags: ['Copies'],
        summary: 'Baixa o exemplar (ADMIN)',
        security: bearerAuth,
        parameters: [uuidParam],
        responses: { 204: { description: 'Removido' } },
      },
    },

    '/loans': {
      get: {
        tags: ['Loans'],
        summary: 'Lista emprestimos (MEMBER ve apenas os proprios)',
        security: bearerAuth,
        parameters: [
          ...paginationParams,
          { name: 'userId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['ACTIVE', 'RETURNED', 'LATE'] },
          },
          {
            name: 'overdue',
            in: 'query',
            description: 'true = apenas os vencidos e ainda nao devolvidos',
            schema: { type: 'string', enum: ['true', 'false'] },
          },
        ],
        responses: { 200: { description: 'OK' } },
      },
      post: {
        tags: ['Loans'],
        summary: 'Registra o emprestimo de um exemplar',
        description:
          'MEMBER so empresta em seu proprio nome. `userId` e reservado ao balcao (LIBRARIAN/ADMIN).',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['copyId'],
                properties: {
                  copyId: { type: 'string', format: 'uuid' },
                  userId: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Emprestado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Loan' } } },
          },
          409: erro('Exemplar indisponivel, limite atingido ou usuario em atraso'),
        },
      },
    },
    '/loans/{id}': {
      get: {
        tags: ['Loans'],
        summary: 'Detalhe do emprestimo',
        security: bearerAuth,
        parameters: [uuidParam],
        responses: { 200: { description: 'OK' }, 403: erro('Emprestimo de outro usuario') },
      },
    },
    '/loans/{id}/return': {
      post: {
        tags: ['Loans'],
        summary: 'Registra a devolucao e calcula a multa (LIBRARIAN/ADMIN)',
        description:
          'Se houver reserva na fila para a obra, o exemplar ja sai reservado para o proximo leitor.',
        security: bearerAuth,
        parameters: [uuidParam],
        responses: { 200: { description: 'Devolvido' }, 409: erro('Ja devolvido') },
      },
    },
    '/loans/{id}/renew': {
      post: {
        tags: ['Loans'],
        summary: 'Renova o prazo',
        description: 'Bloqueado se houver atraso, limite de renovacoes atingido ou fila de reserva.',
        security: bearerAuth,
        parameters: [uuidParam],
        responses: { 200: { description: 'Renovado' }, 409: erro('Renovacao nao permitida') },
      },
    },

    '/reservations': {
      get: {
        tags: ['Reservations'],
        summary: 'Lista reservas (MEMBER ve apenas as proprias)',
        security: bearerAuth,
        parameters: [
          ...paginationParams,
          { name: 'bookId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'userId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          {
            name: 'status',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['WAITING', 'READY', 'FULFILLED', 'CANCELLED', 'EXPIRED'],
            },
          },
        ],
        responses: { 200: { description: 'OK' } },
      },
      post: {
        tags: ['Reservations'],
        summary: 'Entra na fila de uma obra sem exemplar disponivel',
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['bookId'],
                properties: {
                  bookId: { type: 'string', format: 'uuid' },
                  userId: { type: 'string', format: 'uuid' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Na fila, com `posicaoNaFila`' },
          409: erro('Ha exemplar disponivel, ou o leitor ja esta na fila/com o livro'),
        },
      },
    },
    '/reservations/{id}': {
      delete: {
        tags: ['Reservations'],
        summary: 'Cancela a reserva e devolve o exemplar a fila',
        security: bearerAuth,
        parameters: [uuidParam],
        responses: { 200: { description: 'Cancelada' }, 409: erro('Reserva ja encerrada') },
      },
    },
    '/reservations/expire-stale': {
      post: {
        tags: ['Reservations'],
        summary: 'Expira reservas nao retiradas no prazo (rotina para cron)',
        security: bearerAuth,
        responses: { 200: { description: 'Quantidade expirada' } },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'CONFLICT' },
              message: { type: 'string', example: 'Exemplar indisponivel: ja esta emprestado' },
              details: { type: 'array', items: { type: 'object' } },
            },
          },
        },
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          perPage: { type: 'integer', example: 20 },
          total: { type: 'integer', example: 137 },
          totalPages: { type: 'integer', example: 7 },
          hasNext: { type: 'boolean', example: true },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['ADMIN', 'LIBRARIAN', 'MEMBER'] },
          active: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          user: { $ref: '#/components/schemas/User' },
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        },
      },
      Book: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          isbn: { type: 'string' },
          title: { type: 'string' },
          synopsis: { type: 'string', nullable: true },
          publisher: { type: 'string', nullable: true },
          publishedYear: { type: 'integer', nullable: true },
          category: { type: 'object', nullable: true },
          authors: { type: 'array', items: { type: 'object' } },
          totalCopies: { type: 'integer' },
          availableCopies: { type: 'integer' },
        },
      },
      Loan: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          loanedAt: { type: 'string', format: 'date-time' },
          dueAt: { type: 'string', format: 'date-time' },
          returnedAt: { type: 'string', format: 'date-time', nullable: true },
          renewals: { type: 'integer' },
          fine: { type: 'number', description: 'Multa consolidada na devolucao' },
          fineDue: { type: 'number', description: 'Multa em aberto, calculada agora' },
          isOverdue: { type: 'boolean' },
          daysLate: { type: 'integer' },
          status: { type: 'string', enum: ['ACTIVE', 'RETURNED', 'LATE'] },
        },
      },
    },
  },
} as const;
