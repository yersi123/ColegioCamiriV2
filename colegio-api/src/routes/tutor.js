import { z } from 'zod';
import { getQuery } from '../lib/request.js';
import { respond } from '../lib/response.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import {
  listarHijos,
  listarMensualidadesHijo,
  listarAportesHijo,
} from '../servicios/tutor.service.js';

export function tutorRouter(router) {
  router.get('/tutor/hijos', async (req, res) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('tutor')(userHolder.user);

      const result = await listarHijos(userHolder.user.ci);
      respond(res, 200, true, result, 'Hijos listados');
    } catch (err) {
      if (err instanceof z.ZodError)
        return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });

  router.get('/tutor/hijos/:ci/mensualidades', async (req, res, params) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('tutor')(userHolder.user);

      const query = getQuery(req);
      const result = await listarMensualidadesHijo(userHolder.user.ci, params.ci, query);
      respond(res, 200, true, result, 'Mensualidades listadas');
    } catch (err) {
      if (err instanceof z.ZodError)
        return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });

  router.get('/tutor/hijos/:ci/aportes', async (req, res, params) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('tutor')(userHolder.user);

      const result = await listarAportesHijo(userHolder.user.ci, params.ci);
      respond(res, 200, true, result, 'Aportes listados');
    } catch (err) {
      if (err instanceof z.ZodError)
        return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });
}
