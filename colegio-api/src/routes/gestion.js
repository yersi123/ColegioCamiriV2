import { z } from 'zod';
import { parseBody } from '../lib/request.js';
import { respond } from '../lib/response.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { AppError, NotFoundError } from '../lib/errors.js';
import {
  listarGestiones,
  obtenerGestion,
  crearGestion,
  actualizarGestion,
  cambiarEstadoGestion,
  asignarPrecioNivel,
} from '../servicios/gestion.service.js';

const createSchema = z.object({
  fechaapertura: z.string().min(1, 'Fecha apertura requerida'),
  fechacierre: z.string().min(1, 'Fecha cierre requerida'),
  cantidadmen: z.number().int().min(1, 'Mínimo 1 mensualidad').max(12, 'Máximo 12 mensualidades'),
  descripcion: z.string().max(100).optional().or(z.literal('')),
});

const updateSchema = z.object({
  fechacierre: z.string().optional().or(z.literal('')),
  descripcion: z.string().max(100).optional().or(z.literal('')),
});

const detalleSchema = z.object({
  idgestion: z.number(),
  idnivel: z.number(),
  monto: z.number().min(0, 'Monto no puede ser negativo'),
});

export function gestionRouter(router) {
  router.get('/gestiones', async (req, res) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('director', 'secretaria')(userHolder.user);

      const result = await listarGestiones();
      respond(res, 200, true, result, 'Gestiones listadas');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      if (err instanceof AppError) return respond(res, err.statusCode, false, null, err.message);
      throw err;
    }
  });

  router.get('/gestiones/:id', async (req, res, params) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('director', 'secretaria')(userHolder.user);

      const gestion = await obtenerGestion(Number(params.id));
      if (!gestion) throw new NotFoundError('Gestión');
      respond(res, 200, true, gestion, 'Gestión encontrada');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      if (err instanceof AppError) return respond(res, err.statusCode, false, null, err.message);
      throw err;
    }
  });

  router.post('/gestiones', async (req, res) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('director')(userHolder.user);

      const body = await parseBody(req);
      const data = createSchema.parse(body);
      const result = await crearGestion(data);
      respond(res, 201, true, result, 'Gestión creada');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      if (err instanceof AppError) return respond(res, err.statusCode, false, null, err.message);
      throw err;
    }
  });

  router.put('/gestiones/:id', async (req, res, params) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('director')(userHolder.user);

      const body = await parseBody(req);
      const data = updateSchema.parse(body);
      const result = await actualizarGestion(Number(params.id), data);
      respond(res, 200, true, result, 'Gestión actualizada');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      if (err instanceof AppError) return respond(res, err.statusCode, false, null, err.message);
      throw err;
    }
  });

  router.put('/gestiones/:id/estado', async (req, res, params) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('director')(userHolder.user);

      const result = await cambiarEstadoGestion(Number(params.id));
      respond(res, 200, true, result, 'Estado cambiado');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      if (err instanceof AppError) return respond(res, err.statusCode, false, null, err.message);
      throw err;
    }
  });

  router.post('/detallegestion', async (req, res) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('director')(userHolder.user);

      const body = await parseBody(req);
      const data = detalleSchema.parse(body);
      await asignarPrecioNivel(data);
      respond(res, 201, true, null, 'Precio asignado');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      if (err instanceof AppError) return respond(res, err.statusCode, false, null, err.message);
      throw err;
    }
  });
}
