import { z } from 'zod';
import { parseBody, getQuery } from '../lib/request.js';
import { respond } from '../lib/response.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { AppError, NotFoundError } from '../lib/errors.js';
import {
  listarBecas,
  obtenerBeca,
  crearBeca,
  actualizarBeca,
  asignarBecaMatricula,
} from '../servicios/beca.service.js';

const createSchema = z.object({
  nombrebeca: z.string().min(1, 'Nombre requerido').max(100),
  porcentaje: z.number().int().min(0, 'Mínimo 0').max(100, 'Máximo 100'),
  idgestion: z.number(),
  tipobeca: z.string().max(50).optional().or(z.literal('')),
  descripcion: z.string().max(200).optional().or(z.literal('')),
});

const updateSchema = z.object({
  nombrebeca: z.string().min(1, 'Nombre requerido').max(100),
  porcentaje: z.number().int().min(0).max(100),
  idgestion: z.number(),
  tipobeca: z.string().max(50).optional().or(z.literal('')),
  descripcion: z.string().max(200).optional().or(z.literal('')),
});

export function becaRouter(router) {
  router.get('/becas', async (req, res) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('director', 'secretaria')(userHolder.user);

      const query = getQuery(req);
      const result = await listarBecas(query);
      respond(res, 200, true, result, 'Becas listadas');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });

  router.get('/becas/:id', async (req, res, params) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('director', 'secretaria')(userHolder.user);

      const beca = await obtenerBeca(Number(params.id));
      if (!beca) throw new NotFoundError('Beca');
      respond(res, 200, true, beca, 'Beca encontrada');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });

  router.post('/becas', async (req, res) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('director')(userHolder.user);

      const body = await parseBody(req);
      const data = createSchema.parse(body);
      await crearBeca(data);
      respond(res, 201, true, null, 'Beca creada');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      if (err instanceof AppError) return respond(res, err.statusCode, false, null, err.message);
      throw err;
    }
  });

  router.put('/becas/:id', async (req, res, params) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('director')(userHolder.user);

      const body = await parseBody(req);
      const data = updateSchema.parse(body);
      const result = await actualizarBeca(Number(params.id), data);
      respond(res, 200, true, result, 'Beca actualizada');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      if (err instanceof AppError) return respond(res, err.statusCode, false, null, err.message);
      throw err;
    }
  });

  router.put('/matriculacion/:id/beca', async (req, res, params) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('director')(userHolder.user);

      const body = await parseBody(req);
      const codbeca = body.codbeca != null ? Number(body.codbeca) : null;
      const result = await asignarBecaMatricula(Number(params.id), codbeca);
      respond(res, 200, true, result, 'Beca asignada a matrícula');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });
}
