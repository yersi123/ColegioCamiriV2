import { query } from '../lib/db.js';

export async function listarHijos(citutor) {
  const sql = `SELECT e.ci, e.codestudiante, p.nombre, p.apellido,
               c.descripcion as curso_descripcion, n.nombre as nivel_nombre,
               g.descripcion as gestion_nombre, m.idmatriculacion
               FROM estudiante e
               JOIN persona p ON p.ci = e.ci
               LEFT JOIN matriculacion m ON m.ciestudiante = e.ci AND m.estado IN ('R', 'A')
               LEFT JOIN curso c ON c.idcurso = m.idcurso
               LEFT JOIN nivel n ON n.idnivel = c.idnivel
               LEFT JOIN gestion g ON g.idgestion = m.idgestion
               WHERE e.citutor = $1
               ORDER BY p.nombre`;
  const result = await query(sql, [citutor]);
  return result.rows;
}

export async function listarMensualidadesHijo(citutor, ciHijo, params = {}) {
  const val = await query('SELECT 1 FROM estudiante WHERE ci = $1 AND citutor = $2', [ciHijo, citutor]);
  if (val.rows.length === 0) throw new Error('El estudiante no es su dependiente');

  let sql = `SELECT m.*, p.nombre || ' ' || p.apellido as estudiante_nombre,
             cur.descripcion as curso_descripcion, g.descripcion as gestion_nombre
             FROM mensualidad m
             JOIN matriculacion mat ON mat.idmatriculacion = m.idmatriculacion
             JOIN estudiante e ON e.ci = mat.ciestudiante
             JOIN persona p ON p.ci = e.ci
             JOIN curso cur ON cur.idcurso = mat.idcurso
             LEFT JOIN gestion g ON g.idgestion = mat.idgestion
             WHERE e.ci = $1`;
  const values = [ciHijo];

  if (params.estado) {
    sql += ' AND m.estado = $2';
    values.push(params.estado);
  }

  sql += ' ORDER BY m.idmatriculacion DESC, m.idmensualidad ASC';
  const result = await query(sql, values);
  return result.rows;
}

export async function listarAportesHijo(citutor, ciHijo) {
  const val = await query('SELECT 1 FROM estudiante WHERE ci = $1 AND citutor = $2', [ciHijo, citutor]);
  if (val.rows.length === 0) throw new Error('El estudiante no es su dependiente');

  const sql = `SELECT a.*, p.nombre || ' ' || p.apellido as estudiante_nombre
               FROM aporte a
               JOIN matriculacion m ON m.idmatriculacion = a.idmatriculacion
               JOIN estudiante e ON e.ci = m.ciestudiante
               JOIN persona p ON p.ci = e.ci
               WHERE e.ci = $1
               ORDER BY a.idaporte DESC`;
  const result = await query(sql, [ciHijo]);
  return result.rows;
}
