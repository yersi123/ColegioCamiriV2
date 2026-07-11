import { z } from 'zod';
import { parseBody, getQuery } from '../lib/request.js';
import { respond } from '../lib/response.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { NotFoundError } from '../lib/errors.js';
import { query } from '../lib/db.js';

const createSchema = z.object({
  idnivel: z.number({ message: 'idnivel requerido' }),
  descripcion: z.string().min(1, 'Descripción requerida').max(100),
  capacidad_maxima: z.number().int().min(1, 'Capacidad mínima 1').max(50, 'Capacidad máxima 50'),
  paralelo: z.string().min(1).max(10),
});

const updateSchema = z.object({
  capacidad_maxima: z.number().int().min(1, 'Capacidad mínima 1').max(50, 'Capacidad máxima 50'),
});

export function cursosRouter(router) {
  router.get('/cursos', async (req, res) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('director', 'secretaria')(userHolder.user);

      const queryParams = getQuery(req);
      const gestionId = queryParams.idgestion ? Number(queryParams.idgestion) : null;
      let sql = `SELECT c.*, n.nombre as nivel_nombre,
        CASE WHEN $1::int IS NOT NULL THEN (
          SELECT COUNT(*) FROM matriculacion m
          WHERE m.idcurso = c.idcurso AND m.idgestion = $1 AND m.estado IN ('R','A')
        ) ELSE 0 END as inscritos
        FROM curso c JOIN nivel n ON n.idnivel = c.idnivel`;
      const params = [gestionId];

      if (queryParams.nivel) {
        sql += ' WHERE c.idnivel = $2';
        params.push(Number(queryParams.nivel));
      }

      sql += ' ORDER BY c.idcurso';
      const result = await query(sql, params);
      respond(res, 200, true, result.rows, 'Cursos listados');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });

  router.get('/cursos/:id', async (req, res, params) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('director', 'secretaria')(userHolder.user);

      const result = await query(
        `SELECT c.*, n.nombre as nivel_nombre
        FROM curso c JOIN nivel n ON n.idnivel = c.idnivel
        WHERE c.idcurso = $1`,
        [Number(params.id)],
      );
      if (!result.rows[0]) throw new NotFoundError('Curso');
      respond(res, 200, true, result.rows[0], 'Curso encontrado');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });

  router.post('/cursos', async (req, res) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('director')(userHolder.user);

      const body = await parseBody(req);
      const data = createSchema.parse(body);

      const existe = await query(
        'SELECT COUNT(*) FROM curso WHERE idnivel = $1 AND TRIM(descripcion) = TRIM($2) AND TRIM(paralelo) = TRIM($3)',
        [data.idnivel, data.descripcion, data.paralelo],
      );
      if (Number(existe.rows[0].count) > 0) {
        return respond(res, 409, false, null, 'Ya existe un curso con esa descripción y paralelo en este nivel');
      }

      await query('SELECT sp_InsertarCurso($1, $2, $3, $4)', [
        data.idnivel,
        data.descripcion,
        data.capacidad_maxima,
        data.paralelo,
      ]);
      respond(res, 201, true, null, 'Curso creado');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });

  router.put('/cursos/:id', async (req, res, params) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      requireRole('director')(userHolder.user);

      const body = await parseBody(req);
      const data = updateSchema.parse(body);
      await query('SELECT sp_ActualizarCurso($1, NULL, $2)', [Number(params.id), data.capacidad_maxima]);
      respond(res, 200, true, null, 'Capacidad actualizada');
    } catch (err) {
      if (err instanceof z.ZodError) return respond(res, 400, false, null, err.errors[0].message);
      throw err;
    }
  });
}
