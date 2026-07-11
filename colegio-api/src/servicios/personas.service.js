  import { query } from '../lib/db.js';

export async function listarPersonas({ estado = 'A', search = '', page = 1, limit = 5 } = {}) {
  const offset = (page - 1) * limit;

  let countSql = 'SELECT COUNT(*) FROM persona WHERE estado = $1';
  let dataSql = 'SELECT * FROM persona WHERE estado = $1';
  const params = [estado];

  if (search) {
    const clause = ' AND (ci ILIKE $2 OR nombre ILIKE $2 OR apellido ILIKE $2)';
    countSql += clause;
    dataSql += clause;
    params.push(`%${search}%`);
  }

  dataSql += ' ORDER BY nombre ASC';
  dataSql += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

  const countResult = await query(countSql, params);
  const total = Number(countResult.rows[0].count);

  const dataParams = [...params, limit, offset];
  const dataResult = await query(dataSql, dataParams);

  return {
    data: dataResult.rows,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit),
  };
}

export async function obtenerPersona(ci) {
  const result = await query('SELECT * FROM persona WHERE ci = $1', [ci]);
  return result.rows[0] || null;
}

export async function crearPersona(data) {
  const { ci, nombre, apellido, sexo, telefono, correo } = data;
  await query('SELECT sp_InsertarPersona($1, $2, $3, $4, $5, $6)', [
    ci,
    nombre,
    apellido,
    sexo,
    telefono || null,
    correo || null,
  ]);
  return { ci };
}

export async function actualizarPersona(ci, data) {
  const { nombre, apellido, sexo, telefono, correo } = data;
  await query('SELECT sp_ActualizarPersona($1, $2, $3, $4, $5, $6)', [
    ci,
    nombre,
    apellido,
    sexo,
    telefono || null,
    correo || null,
  ]);
  return { ci };
}

export async function eliminarPersona(ci) {
  const result = await query(
    'UPDATE persona SET estado = $1 WHERE ci = $2 RETURNING ci',
    ['I', ci],
  );
  return result.rows[0] || null;
}
