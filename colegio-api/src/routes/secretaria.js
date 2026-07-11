import { z } from 'zod';
import { parseBody, getQuery } from '../lib/request.js';
import { respond } from '../lib/response.js';
import { query } from '../lib/db.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { AppError } from '../lib/errors.js';
import {
  listarTutores,
  listarHijos,
  listarEstudiantes,
  listarEstudiantesSinTutor,
  asignarTutor,
  crearEstudiante,
} from '../servicios/secretaria.service.js';
import { crearUsuario, restablecerPassword, activarUsuario, eliminarUsuario } from '../servicios/usuarios.service.js';

export function secretariaRouter(router) {
  router.get('/secretaria/tutores', async (req, res) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('secretaria')(userHolder.user);

      const result = await listarTutores();
      respond(res, 200, true, result, 'Tutores listados');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });

  router.get('/secretaria/tutores/:ci/hijos', async (req, res, params) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('secretaria')(userHolder.user);

      const result = await listarHijos(params.ci);
      respond(res, 200, true, result, 'Hijos listados');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });

  router.get('/secretaria/estudiantes-sin-tutor', async (req, res) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('secretaria')(userHolder.user);

      const result = await listarEstudiantesSinTutor();
      respond(res, 200, true, result, 'Estudiantes sin tutor listados');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });

  const createEstudianteSchema = z.object({
    ci: z.string().min(5).max(10),
    codestudiante: z.string().max(10).optional(),
    citutor: z.string().min(5).max(10).nullable().optional(),
    idgestion: z.number(),
  });

  router.post('/secretaria/estudiantes', async (req, res) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('secretaria')(userHolder.user);

      const body = await parseBody(req);
      const data = createEstudianteSchema.parse(body);

      if (!data.codestudiante) {
        const maxRes = await query("SELECT COALESCE(MAX(codestudiante), 'EST-00000') FROM estudiante");
        const num = parseInt(maxRes.rows[0].coalesce.split('-')[1]) + 1;
        data.codestudiante = `EST-${String(num).padStart(5, '0')}`;
      }

      const result = await crearEstudiante(data);
      respond(res, 201, true, result, 'Estudiante creado');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      if (err instanceof AppError) return respond(res, err.statusCode, false, null, err.message);
      throw err;
    }
  });

  router.get('/secretaria/estudiantes', async (req, res) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('secretaria')(userHolder.user);

      const query = getQuery(req);
      const result = await listarEstudiantes(query.search || '');
      respond(res, 200, true, result, 'Estudiantes listados');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });

  router.get('/secretaria/estudiantes/next-code', async (req, res) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('secretaria')(userHolder.user);

      const maxRes = await query("SELECT COALESCE(MAX(codestudiante), 'EST-00000') FROM estudiante");
      const num = parseInt(maxRes.rows[0].coalesce.split('-')[1]) + 1;
      const codestudiante = `EST-${String(num).padStart(5, '0')}`;
      respond(res, 200, true, { codestudiante }, 'Código generado');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });

  const createTutorSchema = z.object({
    ci: z.string().min(5, 'CI mínimo 5 caracteres').max(10, 'CI máximo 10 caracteres'),
  });

  router.post('/secretaria/tutores', async (req, res) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('secretaria')(userHolder.user);

      const body = await parseBody(req);
      const data = createTutorSchema.parse(body);
      const result = await crearUsuario({ ci: data.ci, rol: 'tutor' });
      respond(res, 201, true, result, 'Tutor creado exitosamente');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      if (err instanceof AppError) return respond(res, err.statusCode, false, null, err.message);
      throw err;
    }
  });

  router.put('/secretaria/tutores/:ci/restablecer', async (req, res, params) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('secretaria')(userHolder.user);

      await restablecerPassword('tutor', params.ci);
      respond(res, 200, true, { ci: params.ci }, 'Contraseña restablecida al CI');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      if (err instanceof AppError) return respond(res, err.statusCode, false, null, err.message);
      throw err;
    }
  });

  router.put('/secretaria/tutores/:ci/activar', async (req, res, params) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('secretaria')(userHolder.user);

      const result = await activarUsuario('tutor', params.ci);
      if (!result) return respond(res, 404, false, null, 'Tutor no encontrado');
      respond(res, 200, true, result, 'Tutor activado');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      if (err instanceof AppError) return respond(res, err.statusCode, false, null, err.message);
      throw err;
    }
  });

  router.put('/secretaria/tutores/:ci/desactivar', async (req, res, params) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('secretaria')(userHolder.user);

      const result = await eliminarUsuario('tutor', params.ci);
      if (!result) return respond(res, 404, false, null, 'Tutor no encontrado');
      respond(res, 200, true, result, 'Tutor desactivado');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      if (err instanceof AppError) return respond(res, err.statusCode, false, null, err.message);
      throw err;
    }
  });

  const asignarSchema = z.object({
    citutor: z.string().min(5).max(10),
  });

  router.put('/secretaria/estudiantes/:ci/asignar-tutor', async (req, res, params) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('secretaria')(userHolder.user);

      const body = await parseBody(req);
      const data = asignarSchema.parse(body);
      const result = await asignarTutor(params.ci, data.citutor);
      if (!result) throw new Error('Estudiante no encontrado');
      respond(res, 200, true, result, 'Tutor asignado correctamente');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });
}
