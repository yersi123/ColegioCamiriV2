import { getQuery } from '../lib/request.js';
import { respond } from '../lib/response.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import {
  reporteMatricula,
  reporteMora,
  reporteIngresos,
  reporteIngresosPorNivel,
  reporteAportes,
  reporteBecas,
} from '../servicios/reportes.service.js';

export function reportesRouter(router) {
  router.get('/reportes/matricula', async (req, res) => {
    const userHolder = {};
    authMiddleware(req, res, userHolder);
    requireRole('director', 'secretaria')(userHolder.user);

    const query = getQuery(req);
    const idgestion = Number(query.idgestion) || 0;
    const idcurso = query.idcurso ? Number(query.idcurso) : null;
    const result = await reporteMatricula(idgestion, idcurso);
    respond(res, 200, true, result, 'Reporte de matrícula generado');
  });

  router.get('/reportes/mora', async (req, res) => {
    const userHolder = {};
    authMiddleware(req, res, userHolder);
    requireRole('director', 'secretaria')(userHolder.user);

    const query = getQuery(req);
    const idgestion = Number(query.idgestion) || 0;
    const mesesMin = Number(query.meses) || 1;
    const result = await reporteMora(idgestion, mesesMin);
    respond(res, 200, true, result, 'Reporte de mora generado');
  });

  router.get('/reportes/ingresos', async (req, res) => {
    const userHolder = {};
    authMiddleware(req, res, userHolder);
    requireRole('director', 'secretaria')(userHolder.user);

    const query = getQuery(req);
    const idgestion = Number(query.idgestion) || 0;
    const result = await reporteIngresos(idgestion);
    const ingresos_nivel = await reporteIngresosPorNivel(idgestion);
    const aportes = await reporteAportes(idgestion);
    respond(res, 200, true, { ...result, ingresos_nivel, aportes }, 'Reporte de ingresos generado');
  });

  router.get('/reportes/becas', async (req, res) => {
    const userHolder = {};
    authMiddleware(req, res, userHolder);
    requireRole('director', 'secretaria')(userHolder.user);

    const query = getQuery(req);
    const idgestion = Number(query.idgestion) || 0;
    const result = await reporteBecas(idgestion);
    respond(res, 200, true, result, 'Reporte de becas generado');
  });
}
