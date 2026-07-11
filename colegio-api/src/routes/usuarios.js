import { z } from 'zod';
import { parseBody, getQuery } from '../lib/request.js';
import { respond } from '../lib/response.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { NotFoundError } from '../lib/errors.js';
import {
  listarUsuarios,
  obtenerUsuario,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  restablecerPassword,
  activarUsuario,
} from '../servicios/usuarios.service.js';

const createSchema = z.object({
  ci: z.string().min(1, 'CI requerido').max(10, 'CI máximo 10 caracteres'),
  rol: z.enum(['admin', 'director', 'secretaria', 'tutor'], { message: 'Rol inválido' }),
});

const ciSchema = z.string().min(5, 'CI mínimo 5 caracteres').max(10, 'CI máximo 10 caracteres');

const updateSchema = z.object({
  usuario: z.string().min(3).max(50).optional(),
});

export function usuariosRouter(router) {
  router.get('/usuarios', async (req, res) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('admin')(userHolder.user);

      const query = getQuery(req);
      if (!query.rol) return respond(res, 400, false, null, 'Parámetro "rol" requerido');

      const result = await listarUsuarios(query.rol, query);
      respond(res, 200, true, result, 'Usuarios listados');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });

  router.get('/usuarios/:ci', async (req, res, params) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('admin')(userHolder.user);

      const ci = ciSchema.parse(params.ci);

      const query = getQuery(req);
      if (!query.rol) return respond(res, 400, false, null, 'Parámetro "rol" requerido');

      const usuario = await obtenerUsuario(query.rol, ci);
      if (!usuario) throw new NotFoundError('Usuario');
      respond(res, 200, true, usuario, 'Usuario encontrado');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });

  router.post('/usuarios', async (req, res) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('admin')(userHolder.user);

      const body = await parseBody(req);
      const data = createSchema.parse(body);
      const result = await crearUsuario(data);
      respond(res, 201, true, result, 'Usuario creado');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });

  router.put('/usuarios/:ci', async (req, res, params) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('admin')(userHolder.user);

      const ci = ciSchema.parse(params.ci);

      const query = getQuery(req);
      if (!query.rol) return respond(res, 400, false, null, 'Parámetro "rol" requerido');

      const body = await parseBody(req);
      const data = updateSchema.parse(body);

      const result = await actualizarUsuario(query.rol, ci, data);
      respond(res, 200, true, result, 'Usuario actualizado');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });

  router.put('/usuarios/:ci/restablecer', async (req, res, params) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('admin')(userHolder.user);

      const ci = ciSchema.parse(params.ci);

      const query = getQuery(req);
      if (!query.rol) return respond(res, 400, false, null, 'Parámetro "rol" requerido');

      await restablecerPassword(query.rol, ci);
      respond(res, 200, true, { ci }, 'Contraseña restablecida al CI');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });

  router.put('/usuarios/:ci/activar', async (req, res, params) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('admin')(userHolder.user);

      const ci = ciSchema.parse(params.ci);

      const query = getQuery(req);
      if (!query.rol) return respond(res, 400, false, null, 'Parámetro "rol" requerido');

      const result = await activarUsuario(query.rol, ci);
      if (!result) throw new NotFoundError('Usuario');
      respond(res, 200, true, result, 'Usuario activado');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });

  router.delete('/usuarios/:ci', async (req, res, params) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('admin')(userHolder.user);

      const ci = ciSchema.parse(params.ci);

      const query = getQuery(req);
      if (!query.rol) return respond(res, 400, false, null, 'Parámetro "rol" requerido');

      const result = await eliminarUsuario(query.rol, ci);
      if (!result) throw new NotFoundError('Usuario');
      respond(res, 200, true, result, 'Usuario desactivado');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });
}
