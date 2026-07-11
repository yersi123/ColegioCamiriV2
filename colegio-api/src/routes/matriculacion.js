import { z } from 'zod';
import { parseBody, getQuery } from '../lib/request.js';
import { respond } from '../lib/response.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { AppError, NotFoundError } from '../lib/errors.js';
import {
  listarMatriculas,
  obtenerMatricula,
  crearMatricula,
  actualizarMatricula,
  cambiarEstadoMatricula,
  verificarDeudas,
  crearMatriculaConRegistro,
} from '../servicios/matriculacion.service.js';

const createMatriculaSchema = z.object({
  ciestudiante: z
    .string()
    .min(5, 'CI mínimo 5 caracteres')
    .max(10, 'CI máximo 10 caracteres'),
  idgestion: z.number({ message: 'idgestion requerido' }),
  idcurso: z.number({ message: 'idcurso requerido' }),
  codbeca: z.number().nullable().optional(),
});

const registroCompletoSchema = z.object({
  ci: z.string().min(5, 'CI mínimo 5 caracteres').max(10, 'CI máximo 10 caracteres'),
  nombre: z.string().min(3, 'Nombre mínimo 3 caracteres').max(100),
  apellido: z.string().min(3, 'Apellido mínimo 3 caracteres').max(100),
  sexo: z.enum(['M', 'F'], { message: 'Sexo debe ser M o F' }),
  telefono: z.string().max(8).optional(),
  correo: z.string().email('Correo inválido').optional(),
  idgestion: z.number({ message: 'Gestión requerida' }),
  idcurso: z.number({ message: 'Curso requerido' }),
  codbeca: z.number().nullable().optional(),
  tutor: z.object({
    ci: z.string().min(5, 'CI mínimo 5 caracteres').max(10, 'CI máximo 10 caracteres'),
    nombre: z.string().min(3, 'Nombre mínimo 3 caracteres').max(100),
    apellido: z.string().min(3, 'Apellido mínimo 3 caracteres').max(100),
    sexo: z.enum(['M', 'F']),
    telefono: z.string().max(8).optional(),
    correo: z.string().email('Correo del tutor inválido').optional(),
  }).nullable().optional(),
});

const updateMatriculaSchema = z.object({
  idcurso: z.number({ message: 'idcurso debe ser número' }).optional(),
  codbeca: z.number().nullable().optional(),
});

export function matriculacionRouter(router) {
  router.get('/matriculacion', async (req, res) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('secretaria', 'director')(userHolder.user);

      const query = getQuery(req);
      const result = await listarMatriculas(query);
      respond(res, 200, true, result, 'Matrículas listadas');
    } catch (err) {
      if (err instanceof z.ZodError)
        return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });

  router.get('/matriculacion/verificar-deudas', async (req, res) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('secretaria', 'director')(userHolder.user);

      const params = getQuery(req);
      const ci = params.ci;
      const gestion = params.gestion;
      if (!ci || !gestion) {
        return respond(res, 400, false, null, 'CI y gestión son requeridos');
      }
      const result = await verificarDeudas(ci, Number(gestion));
      respond(res, 200, true, result, 'Verificación de deudas');
    } catch (err) {
      if (err instanceof z.ZodError)
        return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });

  router.get('/matriculacion/:id', async (req, res, params) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('secretaria', 'director')(userHolder.user);

      const result = await obtenerMatricula(Number(params.id));
      if (!result) throw new NotFoundError('Matrícula');
      respond(res, 200, true, result, 'Matrícula encontrada');
    } catch (err) {
      if (err instanceof z.ZodError)
        return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });

  router.post('/matriculacion', async (req, res) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('secretaria')(userHolder.user);

      const body = await parseBody(req);
      const data = createMatriculaSchema.parse(body);
      const result = await crearMatricula(data);
      respond(res, 201, true, result, 'Matrícula creada');
    } catch (err) {
      if (err instanceof z.ZodError)
        return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });

  router.post('/matriculacion/registro-completo', async (req, res) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('secretaria')(userHolder.user);

      const body = await parseBody(req);
      const data = registroCompletoSchema.parse(body);
      const result = await crearMatriculaConRegistro(data);
      respond(res, 201, true, result, 'Matrícula registrada exitosamente');
    } catch (err) {
      if (err instanceof z.ZodError)
        return respond(res, 400, false, null, err.errors[0].message);
      if (err instanceof AppError)
        return respond(res, err.statusCode, false, null, err.message);
      return respond(res, 400, false, null, err.message || 'Error al registrar matrícula');
    }
  });

  router.put('/matriculacion/:id', async (req, res, params) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('secretaria')(userHolder.user);

      const body = await parseBody(req);
      const data = updateMatriculaSchema.parse(body);
      const result = await actualizarMatricula(Number(params.id), data);
      respond(res, 200, true, result, 'Matrícula actualizada');
    } catch (err) {
      if (err instanceof z.ZodError)
        return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });

  router.put('/matriculacion/:id/estado', async (req, res, params) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('secretaria')(userHolder.user);

      const body = await parseBody(req);
      const estado = z.string().length(1, 'Estado inválido').parse(body.estado);
      const result = await cambiarEstadoMatricula(Number(params.id), estado);
      respond(res, 200, true, result, 'Estado actualizado');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });
}
