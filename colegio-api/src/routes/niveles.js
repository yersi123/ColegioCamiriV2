import { z } from 'zod';
import { parseBody } from '../lib/request.js';
import { respond } from '../lib/response.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { AppError, NotFoundError } from '../lib/errors.js';
import {
  listarNiveles,
  obtenerNivel,
  actualizarNivel,
} from '../servicios/niveles.service.js';

const updateSchema = z.object({
  montomes: z.number().min(0, 'Monto mes no puede ser negativo'),
  montototal: z.number().min(0, 'Monto total no puede ser negativo'),
  montoaporte: z.number().min(0, 'Monto aporte no puede ser negativo'),
});

export function nivelesRouter(router) {
  router.get('/niveles', async (req, res) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('director', 'secretaria')(userHolder.user);

      const result = await listarNiveles();
      respond(res, 200, true, result, 'Niveles listados');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      if (err instanceof AppError) return respond(res, err.statusCode, false, null, err.message);
      throw err;
    }
  });

  router.get('/niveles/:id', async (req, res, params) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('director', 'secretaria')(userHolder.user);

      const nivel = await obtenerNivel(Number(params.id));
      if (!nivel) throw new NotFoundError('Nivel');
      respond(res, 200, true, nivel, 'Nivel encontrado');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      if (err instanceof AppError) return respond(res, err.statusCode, false, null, err.message);
      throw err;
    }
  });

  router.put('/niveles/:id', async (req, res, params) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('director')(userHolder.user);

      const body = await parseBody(req);
      const data = updateSchema.parse(body);
      const result = await actualizarNivel(Number(params.id), data);
      respond(res, 200, true, result, 'Nivel actualizado');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });
}
