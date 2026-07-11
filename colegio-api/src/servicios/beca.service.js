import { query } from '../lib/db.js';
import { ConflictError } from '../lib/errors.js';

export async function listarBecas(params = {}) {
  let sql = `SELECT b.*, g.descripcion as gestion_nombre,
    (SELECT COUNT(*) FROM matriculacion m WHERE m.codbeca = b.codbeca AND m.estado IN ('A','R'))::int as matriculados
             FROM beca b
             LEFT JOIN gestion g ON g.idgestion = b.idgestion`;
  const values = [];
  const conditions = [];

  if (params.idgestion) {
    conditions.push('b.idgestion = $' + (values.length + 1));
    values.push(Number(params.idgestion));
  }

  if (params.search) {
    conditions.push('b.nombrebeca ILIKE $' + (values.length + 1));
    values.push(`%${params.search}%`);
  }

  if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND');
  sql += ' ORDER BY b.codbeca DESC';
  const result = await query(sql, values);
  return result.rows;
}

export async function obtenerBeca(id) {
  const result = await query(
    `SELECT b.*, g.descripcion as gestion_nombre
     FROM beca b
     LEFT JOIN gestion g ON g.idgestion = b.idgestion
     WHERE b.codbeca = $1`,
    [id],
  );
  return result.rows[0] || null;
}

export async function crearBeca(data) {
  const existe = await query(
    'SELECT codbeca FROM beca WHERE TRIM(nombrebeca) = TRIM($1)',
    [data.nombrebeca],
  );
  if (existe.rows.length > 0) throw new ConflictError('Ya existe una beca con ese nombre');

  await query('SELECT sp_InsertarBeca($1, $2, $3, NULL, NULL)', [
    data.nombrebeca,
    data.porcentaje,
    data.idgestion,
  ]);
  return { message: 'Beca creada' };
}

export async function actualizarBeca(id, data) {
  const existe = await query(
    'SELECT codbeca FROM beca WHERE TRIM(nombrebeca) = TRIM($1) AND codbeca != $2',
    [data.nombrebeca, id],
  );
  if (existe.rows.length > 0) throw new ConflictError('Ya existe una beca con ese nombre');

  await query('SELECT sp_ActualizarBeca($1, $2, $3, $4, NULL, NULL)', [
    id,
    data.nombrebeca,
    data.porcentaje,
    data.idgestion,
  ]);
  return { codbeca: id };
}

export async function asignarBecaMatricula(idmatriculacion, codbeca) {
  await query('SELECT sp_ActualizarBecaMatricula($1, $2)', [
    idmatriculacion,
    codbeca || null,
  ]);
  return { idmatriculacion, codbeca: codbeca || null };
}
