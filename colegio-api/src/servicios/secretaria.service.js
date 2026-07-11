import { query } from '../lib/db.js';

export async function listarTutores() {
  const sql = `SELECT t.ci, t.usuario, t.estado, p.nombre, p.apellido, p.telefono, p.correo,
               (SELECT COUNT(*) FROM estudiante e WHERE e.citutor = t.ci) as total_hijos
               FROM tutor t
               JOIN persona p ON p.ci = t.ci
               ORDER BY p.nombre ASC`;
  const result = await query(sql);
  return result.rows;
}

export async function listarHijos(citutor) {
  const sql = `SELECT e.ci, e.codestudiante, p.nombre, p.apellido
               FROM estudiante e
               JOIN persona p ON p.ci = e.ci
               WHERE e.citutor = $1
               ORDER BY p.nombre ASC`;
  const result = await query(sql, [citutor]);
  return result.rows;
}

export async function listarEstudiantesSinTutor() {
  const sql = `SELECT e.ci, e.codestudiante, p.nombre, p.apellido
               FROM estudiante e
               JOIN persona p ON p.ci = e.ci
               WHERE e.citutor IS NULL
               ORDER BY p.nombre ASC`;
  const result = await query(sql);
  return result.rows;
}

export async function crearEstudiante(data) {
  const result = await query(
    'INSERT INTO estudiante (ci, codestudiante, citutor, idgestion) VALUES ($1, $2, $3, $4) RETURNING ci',
    [data.ci, data.codestudiante, data.citutor || null, data.idgestion],
  );
  return result.rows[0];
}

export async function listarEstudiantes(search = '') {
  let sql = `SELECT e.ci, e.codestudiante, e.citutor,
             p.nombre, p.apellido, p.sexo, p.telefono, p.correo,
             t.nombre as tutor_nombre, t.apellido as tutor_apellido
             FROM estudiante e
             JOIN persona p ON p.ci = e.ci
             LEFT JOIN persona t ON t.ci = e.citutor`;
  const params = [];
  if (search) {
    sql += ` WHERE (p.nombre ILIKE $1 OR p.apellido ILIKE $1 OR e.ci ILIKE $1 OR e.codestudiante ILIKE $1)`;
    params.push(`%${search}%`);
  }
  sql += ' ORDER BY p.nombre ASC';
  const result = await query(sql, params);
  return result.rows;
}

export async function reemplazarTutor(ciEstudiante, ciTutor) {
  const result = await query(
    'UPDATE estudiante SET citutor = $1 WHERE ci = $2 RETURNING ci',
    [ciTutor, ciEstudiante],
  );
  return result.rows[0] || null;
}

export async function asignarTutor(ciEstudiante, ciTutor) {
  const result = await query(
    'UPDATE estudiante SET citutor = $1 WHERE ci = $2 RETURNING ci',
    [ciTutor, ciEstudiante],
  );
  return result.rows[0] || null;
}
