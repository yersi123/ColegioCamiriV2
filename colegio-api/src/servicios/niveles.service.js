import { query } from '../lib/db.js';

export async function listarNiveles() {
  const result = await query('SELECT * FROM nivel ORDER BY idnivel');
  return result.rows;
}

export async function obtenerNivel(id) {
  const result = await query('SELECT * FROM nivel WHERE idnivel = $1', [id]);
  return result.rows[0] || null;
}

export async function actualizarNivel(id, data) {
  await query('UPDATE nivel SET montomes = $1, montototal = $2, montoaporte = $3 WHERE idnivel = $4', [
    data.montomes,
    data.montototal,
    data.montoaporte,
    id,
  ]);
  return { idnivel: id };
}
