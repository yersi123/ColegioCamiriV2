import { z } from 'zod';
import { parseBody, getQuery } from '../lib/request.js';
import { respond } from '../lib/response.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { NotFoundError } from '../lib/errors.js';
import {
  listarAportes,
  pagarAporte,
  generarAportesFaltantes,
} from '../servicios/aporte.service.js';

export function aporteRouter(router) {
  router.get('/aportes', async (req, res) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('secretaria')(userHolder.user);

      const query = getQuery(req);
      const result = await listarAportes(query);
      respond(res, 200, true, result, 'Aportes listados');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });

  router.put('/aportes/:id/pagar', async (req, res, params) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('secretaria')(userHolder.user);

      const body = await parseBody(req);
      const schema = z.object({
        tipopago: z.enum(['E', 'Q'], 'Tipo de pago inválido'),
        fechapago: z.string().optional(),
      });
      const data = schema.parse(body);
      const result = await pagarAporte(Number(params.id), data);
      respond(res, 200, true, result, 'Pago registrado');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });

  router.post('/aportes/completar', async (req, res) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('secretaria', 'director')(userHolder.user);

      const body = await parseBody(req);
      const schema = z.object({ idgestion: z.number() });
      const data = schema.parse(body);
      const result = await generarAportesFaltantes(data.idgestion);
      respond(res, 200, true, result, 'Aportes generados');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });
}
