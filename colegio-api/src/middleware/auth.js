import { verifyToken } from '../lib/jwt.js';
import { UnauthorizedError } from '../lib/errors.js';

export function authMiddleware(req, res, userHolder) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Token requerido');
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token);
    userHolder.user = payload;
  } catch {
    throw new UnauthorizedError('Token inválido o expirado');
  }
}
