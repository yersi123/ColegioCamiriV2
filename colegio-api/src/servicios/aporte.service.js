import { query } from '../lib/db.js';

export async function listarAportes(params = {}) {
  let sql = `SELECT a.*,
             p.nombre || ' ' || p.apellido as estudiante_nombre,
             p.ci as estudiante_ci,
             t.nombre || ' ' || t.apellido as tutor_nombre,
             t.ci as tutor_ci,
             cur.descripcion as curso_descripcion,
             n.nombre as nivel_nombre,
             g.descripcion as gestion_nombre
             FROM aporte a
             JOIN matriculacion m ON m.idmatriculacion = a.idmatriculacion
             JOIN estudiante e ON e.ci = m.ciestudiante
             JOIN persona p ON p.ci = e.ci
             LEFT JOIN persona t ON t.ci = e.citutor
             JOIN curso cur ON cur.idcurso = m.idcurso
             JOIN nivel n ON n.idnivel = cur.idnivel
             JOIN gestion g ON g.idgestion = m.idgestion`;
  const values = [];

  if (params.matricula) {
    sql += ' WHERE a.idmatriculacion = $1';
    values.push(Number(params.matricula));
  }

  sql += ' ORDER BY a.idaporte DESC';
  const result = await query(sql, values);
  return result.rows;
}

export async function pagarAporte(id, data) {
  await query('SELECT sp_ActualizarAporte($1, $2, $3)', [
    id,
    data.tipopago,
    data.fechapago || null,
  ]);
  return { idaporte: id };
}

export async function generarAportesFaltantes(idgestion) {
  const gestion = await query('SELECT cantidadmen FROM gestion WHERE idgestion = $1', [idgestion]);
  if (!gestion.rows[0]) throw new Error('Gestión no encontrada');
  const cantidadmen = Number(gestion.rows[0].cantidadmen);

  const matriculas = await query(
    `SELECT m.idmatriculacion, c.idnivel
     FROM matriculacion m
     JOIN curso c ON c.idcurso = m.idcurso
     WHERE m.idgestion = $1 AND m.estado IN ('A', 'R')`,
    [idgestion],
  );

  const results = [];

  for (const mat of matriculas.rows) {
    const nivel = await query('SELECT montoaporte FROM nivel WHERE idnivel = $1', [mat.idnivel]);
    const monto = Number(nivel.rows[0]?.montoaporte ?? 0);
    if (monto <= 0) continue;

    const countResult = await query(
      'SELECT COUNT(*) as cnt FROM aporte WHERE idmatriculacion = $1',
      [mat.idmatriculacion],
    );
    const existingCount = Number(countResult.rows[0].cnt);

    if (existingCount < cantidadmen) {
      const faltantes = cantidadmen - existingCount;
      for (let i = 0; i < faltantes; i++) {
        const nro = existingCount + i + 1;
        await query(
          `INSERT INTO aporte (nro, tipopago, descuento, monto, estado, totalpagar, idmatriculacion)
           VALUES ($1, NULL, 0, $2, 'P', $2, $3)`,
          [nro, monto, mat.idmatriculacion],
        );
        results.push({ idmatriculacion: mat.idmatriculacion, nro });
      }
    }
  }

  return { idgestion, generadas: results.length };
}
