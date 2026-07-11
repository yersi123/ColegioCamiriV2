import { z } from 'zod';
import { parseBody, getQuery } from '../lib/request.js';
import { respond } from '../lib/response.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { NotFoundError } from '../lib/errors.js';
import {
  listarMensualidades,
  obtenerMensualidad,
  crearMensualidad,
  actualizarMensualidad,
  pagarMensualidad,
  pagarTodoMatricula,
  generarMensualidadesFaltantes,
  listarDeudores,
  listarHistorial,
} from '../servicios/mensualidad.service.js';

const createSchema = z.object({
  idmatriculacion: z.number(),
  monto: z.number().min(0, 'Monto no puede ser negativo'),
  descuento: z.number().min(0).optional(),
  nro: z.number().int().min(0).optional(),
});

const updateSchema = z.object({
  monto: z.number().min(0, 'Monto no puede ser negativo'),
  descuento: z.number().min(0).optional(),
});

const pagarSchema = z.object({
  tipopago: z.enum(['E', 'Q'], { message: 'Tipo de pago inválido' }),
  fechapago: z.string().optional(),
});

export function mensualidadRouter(router) {
  router.get('/mensualidades', async (req, res) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('secretaria')(userHolder.user);

      const query = getQuery(req);
      const result = await listarMensualidades(query);
      respond(res, 200, true, result, 'Mensualidades listadas');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });

  router.get('/mensualidades/:idmat/:idmen', async (req, res, params) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('secretaria')(userHolder.user);

      const mensualidad = await obtenerMensualidad(Number(params.idmat), Number(params.idmen));
      if (!mensualidad) throw new NotFoundError('Mensualidad');
      respond(res, 200, true, mensualidad, 'Mensualidad encontrada');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });

  router.post('/mensualidades', async (req, res) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('secretaria')(userHolder.user);

      const body = await parseBody(req);
      const data = createSchema.parse(body);
      const result = await crearMensualidad(data);
      respond(res, 201, true, result, 'Mensualidad creada');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });

  router.put('/mensualidades/:idmat/:idmen', async (req, res, params) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('secretaria')(userHolder.user);

      const body = await parseBody(req);
      const data = updateSchema.parse(body);
      const result = await actualizarMensualidad(Number(params.idmat), Number(params.idmen), data);
      respond(res, 200, true, result, 'Mensualidad actualizada');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });

  router.put('/mensualidades/:idmat/:idmen/pagar', async (req, res, params) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('secretaria')(userHolder.user);

      const body = await parseBody(req);
      const data = pagarSchema.parse(body);
      const result = await pagarMensualidad(Number(params.idmat), Number(params.idmen), data);
      respond(res, 200, true, result, 'Pago registrado');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });

  router.post('/mensualidades/:idmat/pagar-todo', async (req, res, params) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('secretaria')(userHolder.user);

      const body = await parseBody(req);
      const data = z.object({ tipopago: z.enum(['E', 'Q']) }).parse(body);
      const result = await pagarTodoMatricula(Number(params.idmat), data.tipopago);
      respond(res, 200, true, result, 'Todas las mensualidades pagadas');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });

  router.get('/mensualidades/deudores', async (req, res) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('secretaria', 'director')(userHolder.user);

      const query = getQuery(req);
      const result = await listarDeudores(query);
      respond(res, 200, true, result, 'Deudores listados');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });

  router.get('/mensualidades/historial', async (req, res) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('secretaria', 'director')(userHolder.user);

      const query = getQuery(req);
      const result = await listarHistorial(query);
      respond(res, 200, true, result, 'Historial listado');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });

  router.post('/mensualidades/completar', async (req, res) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('secretaria', 'director')(userHolder.user);

      const body = await parseBody(req);
      const { idgestion, montoDefault } = body;
      if (!idgestion) return respond(res, 400, false, null, 'idgestion requerido');

      const result = await generarMensualidadesFaltantes(Number(idgestion), Number(montoDefault || 0));
      respond(res, 200, true, result, 'Mensualidades generadas');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      respond(res, 400, false, null, err.message || 'Error');
    }
  });
}
