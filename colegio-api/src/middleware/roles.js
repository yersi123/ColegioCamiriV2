import { ForbiddenError } from '../lib/errors.js';

export function requireRole(...roles) {
  return (user) => {
    if (!user) throw new ForbiddenError('No autenticado');
    if (!roles.includes(user.rol)) throw new ForbiddenError();
  };
}
