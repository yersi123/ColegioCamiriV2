import { query } from '../lib/db.js';
import { ValidationError, ConflictError } from '../lib/errors.js';

export async function listarGestiones() {
  const result = await query('SELECT * FROM gestion ORDER BY idgestion DESC');
  return result.rows;
}

export async function obtenerGestion(id) {
  const gestion = await query('SELECT * FROM gestion WHERE idgestion = $1', [id]);
  if (!gestion.rows[0]) return null;

  const detalles = await query(
    `SELECT dg.*, n.nombre as nivel_nombre
     FROM detallegestion dg
     JOIN nivel n ON n.idnivel = dg.idnivel
     WHERE dg.idgestion = $1`,
    [id],
  );

  return { ...gestion.rows[0], detalles: detalles.rows };
}

export async function crearGestion(data) {
  const anio = new Date(data.fechaapertura).getFullYear();
  const maxAnio = await query('SELECT MAX(EXTRACT(YEAR FROM fechaapertura)) as max_anio FROM gestion');
  if (maxAnio.rows[0].max_anio !== null && anio <= Number(maxAnio.rows[0].max_anio)) {
    throw new ConflictError(`Ya existe una gestión para el año ${Number(maxAnio.rows[0].max_anio)}. Solo puedes crear gestiones con año posterior.`);
  }
  if (new Date(data.fechacierre) <= new Date(data.fechaapertura)) {
    throw new ValidationError('La fecha de cierre debe ser posterior a la fecha de apertura');
  }

  const result = await query(
    'SELECT sp_InsertarGestion($1, $2, $3, $4) as idgestion',
    [data.fechaapertura, data.fechacierre, data.cantidadmen, data.descripcion || null],
  );
  return { idgestion: result.rows[0].idgestion };
}

export async function actualizarGestion(id, data) {
  const gestion = await query('SELECT estado, fechaapertura FROM gestion WHERE idgestion = $1', [id]);
  if (!gestion.rows[0]) throw new ValidationError('Gestión no encontrada');

  const { estado, fechaapertura } = gestion.rows[0];

  if (estado === '0') {
    throw new ValidationError('No se puede editar una gestión cerrada');
  }

  if (gestion.rows[0].estado === '1') {
    const matriculados = await query(
      'SELECT COUNT(*)::int as total FROM matriculacion WHERE idgestion = $1 AND estado IN ($2, $3)',
      [id, 'A', 'R']
    );
    if (matriculados.rows[0].total > 0 && (data.fechacierre || data.cantidadmen)) {
      throw new ValidationError('No se puede modificar las fechas o mensualidades de una gestión activa con ' + matriculados.rows[0].total + ' estudiante(s) matriculado(s)');
    }
  }

  if (data.fechacierre && new Date(data.fechacierre) <= new Date(fechaapertura)) {
    throw new ValidationError('La fecha de cierre debe ser posterior a la fecha de apertura');
  }

  await query('SELECT sp_ActualizarGestion($1, $2, $3)', [
    id,
    data.fechacierre || null,
    data.descripcion || null,
  ]);
  return { idgestion: id };
}

export async function cambiarEstadoGestion(id) {
  await query('SELECT sp_CambiarEstadoGestion($1)', [id]);
  return { idgestion: id };
}

export async function asignarPrecioNivel(data) {
  await query('SELECT sp_InsertarDetalleGestion($1, $2, $3)', [
    data.idgestion,
    data.idnivel,
    data.monto,
  ]);
  return { idgestion: data.idgestion, idnivel: data.idnivel };
}
