import { AppError } from '../lib/errors.js';
import { respond } from '../lib/response.js';

export function handleError(err, res) {
  if (err instanceof AppError) {
    respond(res, err.statusCode, false, null, err.message);
    return;
  }

  console.error('Error no manejado:', err);
  respond(res, 500, false, null, 'Error interno del servidor');
}
