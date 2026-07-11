import { query } from '../lib/db.js';

export async function reporteMatricula(idgestion, idcurso = null) {
  let sql = `
    SELECT cur.idcurso, cur.descripcion as curso, cur.paralelo, cur.capacidad_maxima,
           n.nombre as nivel,
           COUNT(mat.idmatriculacion) as inscritos,
           COUNT(mat.idmatriculacion) FILTER (WHERE mat.estado = 'A') as activos,
           COUNT(mat.idmatriculacion) FILTER (WHERE mat.estado = 'R') as registrados
    FROM curso cur
    JOIN nivel n ON n.idnivel = cur.idnivel
    LEFT JOIN matriculacion mat ON mat.idcurso = cur.idcurso AND mat.idgestion = $1
    WHERE 1=1
  `;
  const params = [idgestion];
  if (idcurso) { sql += ` AND cur.idcurso = $2`; params.push(idcurso); }
  sql += ` GROUP BY cur.idcurso, cur.descripcion, cur.paralelo, cur.capacidad_maxima, n.nombre
           ORDER BY n.nombre, cur.descripcion`;
  const result = await query(sql, params);
  return { rows: result.rows, total: result.rows.reduce((s, r) => s + Number(r.inscritos), 0) };
}

export async function reporteMora(idgestion, mesesMin = 1) {
  const sql = `
    SELECT e.ci, e.codestudiante,
           p.nombre, p.apellido,
           cur.descripcion as curso, n.nombre as nivel,
           COUNT(*) FILTER (WHERE m.estado = 'P') as meses_adeudados,
           SUM(m.totalpagar) FILTER (WHERE m.estado = 'P') as total_adeudado
    FROM mensualidad m
    JOIN matriculacion mat ON mat.idmatriculacion = m.idmatriculacion
    JOIN estudiante e ON e.ci = mat.ciestudiante
    JOIN persona p ON p.ci = e.ci
    JOIN curso cur ON cur.idcurso = mat.idcurso
    JOIN nivel n ON n.idnivel = cur.idnivel
    WHERE mat.idgestion = $1
    GROUP BY e.ci, e.codestudiante, p.nombre, p.apellido, cur.descripcion, n.nombre
    HAVING COUNT(*) FILTER (WHERE m.estado = 'P') >= $2
    ORDER BY total_adeudado DESC`;
  const result = await query(sql, [Number(idgestion), Number(mesesMin)]);
  return { rows: result.rows, total_morosos: result.rows.length };
}

export async function reporteIngresos(idgestion) {
  const sql = `
    SELECT
      COUNT(*) FILTER (WHERE m.estado = 'C') as canceladas,
      COUNT(*) FILTER (WHERE m.estado = 'P') as pendientes,
      COALESCE(SUM(m.totalpagar) FILTER (WHERE m.estado = 'C'), 0) as total_recaudado,
      COALESCE(SUM(m.totalpagar) FILTER (WHERE m.estado = 'P'), 0) as total_pendiente,
      COALESCE(SUM(m.descuento) FILTER (WHERE m.estado = 'C'), 0) as total_descuentos
    FROM mensualidad m
    JOIN matriculacion mat ON mat.idmatriculacion = m.idmatriculacion
    WHERE mat.idgestion = $1`;
  const result = await query(sql, [Number(idgestion)]);
  return result.rows[0] || {};
}

export async function reporteIngresosPorNivel(idgestion) {
  const sql = `
    SELECT n.idnivel, n.nombre as nivel,
           COUNT(*) FILTER (WHERE m.estado = 'C') as canceladas,
           COUNT(*) FILTER (WHERE m.estado = 'P') as pendientes,
           COALESCE(SUM(m.totalpagar) FILTER (WHERE m.estado = 'C'), 0) as total_recaudado,
           COALESCE(SUM(m.totalpagar) FILTER (WHERE m.estado = 'P'), 0) as total_pendiente
    FROM mensualidad m
    JOIN matriculacion mat ON mat.idmatriculacion = m.idmatriculacion
    JOIN curso cur ON cur.idcurso = mat.idcurso
    JOIN nivel n ON n.idnivel = cur.idnivel
    WHERE mat.idgestion = $1
    GROUP BY n.idnivel, n.nombre
    ORDER BY n.idnivel`;
  const result = await query(sql, [Number(idgestion)]);
  return result.rows;
}

export async function reporteAportes(idgestion) {
  const sql = `
    SELECT
      COUNT(*) as total_aportes,
      COALESCE(SUM(a.monto), 0) as total_monto,
      COUNT(*) FILTER (WHERE a.estado = 'C') as cancelados,
      COALESCE(SUM(a.monto) FILTER (WHERE a.estado = 'C'), 0) as total_cancelado,
      COUNT(*) FILTER (WHERE a.estado = 'P') as pendientes,
      COALESCE(SUM(a.monto) FILTER (WHERE a.estado = 'P'), 0) as total_pendiente
    FROM aporte a
    JOIN matriculacion mat ON mat.idmatriculacion = a.idmatriculacion
    WHERE mat.idgestion = $1`;
  const result = await query(sql, [Number(idgestion)]);
  return result.rows[0] || {};
}

export async function reporteBecas(idgestion) {
  const sql = `
    SELECT e.ci, e.codestudiante,
           p.nombre, p.apellido,
           cur.descripcion as curso, n.nombre as nivel,
           b.nombrebeca, b.tipobeca, b.porcentaje,
           mat.codbeca
    FROM matriculacion mat
    JOIN beca b ON b.codbeca = mat.codbeca
    JOIN estudiante e ON e.ci = mat.ciestudiante
    JOIN persona p ON p.ci = e.ci
    JOIN curso cur ON cur.idcurso = mat.idcurso
    JOIN nivel n ON n.idnivel = cur.idnivel
    WHERE mat.idgestion = $1 AND mat.codbeca IS NOT NULL
    ORDER BY b.nombrebeca, p.apellido`;
  const result = await query(sql, [Number(idgestion)]);
  const total = await query('SELECT COUNT(*) as total FROM matriculacion WHERE idgestion = $1', [Number(idgestion)]);
  const total_matriculados = Number(total.rows[0]?.total || 0);
  return { rows: result.rows, total_becados: result.rows.length, total_matriculados };
}
