/**
 * Erro de negocio previsto. Tudo que nao for AppError e tratado como 500,
 * porque so o que a aplicacao previu pode ser mostrado ao cliente.
 */
export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 400,
    public readonly code: string = 'BAD_REQUEST',
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError(message, 400, 'BAD_REQUEST', details);
  }
  static unauthorized(message = 'Credenciais invalidas ou ausentes') {
    return new AppError(message, 401, 'UNAUTHORIZED');
  }
  static forbidden(message = 'Voce nao tem permissao para esta operacao') {
    return new AppError(message, 403, 'FORBIDDEN');
  }
  static notFound(resource: string) {
    return new AppError(`${resource} nao encontrado`, 404, 'NOT_FOUND');
  }
  static conflict(message: string) {
    return new AppError(message, 409, 'CONFLICT');
  }
  static unprocessable(message: string, details?: unknown) {
    return new AppError(message, 422, 'UNPROCESSABLE_ENTITY', details);
  }
}
