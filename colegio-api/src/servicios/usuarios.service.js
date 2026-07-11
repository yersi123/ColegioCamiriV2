import { query } from '../lib/db.js';
import { hashPassword } from '../lib/hash.js';
import { ConflictError } from '../lib/errors.js';

const TABLAS = { admin: 'admin', director: 'director', secretaria: 'secretaria', tutor: 'tutor' };

const SP_INSERTAR = {
  admin: 'sp_InsertarAdmin',
  director: 'sp_InsertarDirector',
  secretaria: 'sp_InsertarSecretaria',
  tutor: 'sp_InsertarTutor',
};

export async function listarUsuarios(rol, { estado = '', search = '', page = 1, limit = 5 } = {}) {
  const tabla = TABLAS[rol];
  if (!tabla) throw new Error('Rol inválido');

  const fromClause = `FROM ${tabla} t JOIN persona p ON p.ci = t.ci`;
  const params = [];
  const conditions = [];

  if (estado) {
    conditions.push(`t.estado = $${params.length + 1}`);
    params.push(estado);
  }

  if (search) {
    conditions.push(`(t.ci ILIKE $${params.length + 1} OR t.usuario ILIKE $${params.length + 1} OR p.nombre ILIKE $${params.length + 1} OR p.apellido ILIKE $${params.length + 1})`);
    params.push(`%${search}%`);
  }

  const whereClause = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND') : '';

  const countSql = `SELECT COUNT(*) ${fromClause}${whereClause}`;
  const countResult = await query(countSql, params);
  const total = Number(countResult.rows[0].count);

  const offset = (page - 1) * limit;
  const dataSql = `SELECT t.ci, t.usuario, t.estado, p.nombre, p.apellido ${fromClause}${whereClause} ORDER BY p.nombre ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  const dataResult = await query(dataSql, [...params, limit, offset]);

  return {
    data: dataResult.rows,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit),
  };
}

export async function obtenerUsuario(rol, ci) {
  const tabla = TABLAS[rol];
  if (!tabla) throw new Error('Rol inválido');

  const sql = `SELECT t.ci, t.usuario, t.estado, p.nombre, p.apellido, p.sexo, p.telefono, p.correo
    FROM ${tabla} t JOIN persona p ON p.ci = t.ci
    WHERE t.ci = $1`;
  const result = await query(sql, [ci]);
  return result.rows[0] || null;
}

export async function crearUsuario({ ci, rol }) {
  const sp = SP_INSERTAR[rol];
  const tabla = TABLAS[rol];
  if (!sp || !tabla) throw new Error('Rol inválido');

  const existente = await query(`SELECT ci FROM ${tabla} WHERE ci = $1`, [ci]);
  if (existente.rows.length > 0) throw new ConflictError(`El CI ${ci} ya está registrado como ${rol}`);

  const persona = await query('SELECT correo FROM persona WHERE ci = $1', [ci]);
  if (persona.rows.length === 0) throw new Error('Persona no encontrada');
  if (!persona.rows[0].correo) throw new Error('La persona debe tener un correo electrónico para crear usuario');

  const usuario = persona.rows[0].correo;
  const hash = await hashPassword(ci);
  await query(`SELECT ${sp}($1, $2, $3)`, [ci, usuario, hash]);
  return { ci, rol, usuario };
}

export async function actualizarUsuario(rol, ci, data) {
  const tabla = TABLAS[rol];
  if (!tabla) throw new Error('Rol inválido');

  if (data.usuario) {
    await query(`UPDATE ${tabla} SET usuario = $1 WHERE ci = $2`, [data.usuario, ci]);
  }

  return { ci, rol };
}

export async function restablecerPassword(rol, ci) {
  const tabla = TABLAS[rol];
  if (!tabla) throw new Error('Rol inválido');

  const hash = await hashPassword(ci);
  await query(`UPDATE ${tabla} SET contrasena = $1 WHERE ci = $2`, [hash, ci]);
  return { ci, rol };
}

export async function eliminarUsuario(rol, ci) {
  const tabla = TABLAS[rol];
  if (!tabla) throw new Error('Rol inválido');

  const result = await query(
    `UPDATE ${tabla} SET estado = $1 WHERE ci = $2 RETURNING ci`,
    ['I', ci],
  );
  return result.rows[0] || null;
}

export async function activarUsuario(rol, ci) {
  const tabla = TABLAS[rol];
  if (!tabla) throw new Error('Rol inválido');

  const result = await query(
    `UPDATE ${tabla} SET estado = $1 WHERE ci = $2 RETURNING ci`,
    ['A', ci],
  );
  return result.rows[0] || null;
}
