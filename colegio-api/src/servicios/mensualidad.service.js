import { query } from '../lib/db.js';

export async function listarMensualidades(params = {}) {
  let sql = `SELECT m.*, p.nombre || ' ' || p.apellido as estudiante_nombre,
             p.ci as estudiante_ci, cur.descripcion as curso_descripcion,
             n.nombre as nivel_nombre,
             g.descripcion as gestion_nombre,
             t.nombre || ' ' || t.apellido as tutor_nombre,
             t.ci as tutor_ci,
             mat.codbeca,
             b.nombrebeca,
             b.porcentaje as beca_porcentaje
             FROM mensualidad m
             JOIN matriculacion mat ON mat.idmatriculacion = m.idmatriculacion
             JOIN estudiante e ON e.ci = mat.ciestudiante
             JOIN persona p ON p.ci = e.ci
             LEFT JOIN persona t ON t.ci = e.citutor
             JOIN curso cur ON cur.idcurso = mat.idcurso
             JOIN nivel n ON n.idnivel = cur.idnivel
             LEFT JOIN gestion g ON g.idgestion = mat.idgestion
             LEFT JOIN beca b ON b.codbeca = mat.codbeca`;
  const values = [];
  const conditions = [];

  if (params.idmatriculacion) {
    conditions.push(` m.idmatriculacion = $${values.length + 1}`);
    values.push(Number(params.idmatriculacion));
  }
  if (params.estado) {
    conditions.push(` m.estado = $${values.length + 1}`);
    values.push(params.estado);
  }

  if (conditions.length > 0) sql += ' WHERE' + conditions.join(' AND');
  sql += ' ORDER BY m.idmatriculacion DESC, m.idmensualidad ASC';

  const result = await query(sql, values);
  return result.rows;
}

export async function obtenerMensualidad(idmatriculacion, idmensualidad) {
  const result = await query(
    `SELECT m.*, p.nombre || ' ' || p.apellido as estudiante_nombre,
     p.ci as estudiante_ci, cur.descripcion as curso_descripcion,
     g.descripcion as gestion_nombre
     FROM mensualidad m
     JOIN matriculacion mat ON mat.idmatriculacion = m.idmatriculacion
     JOIN estudiante e ON e.ci = mat.ciestudiante
     JOIN persona p ON p.ci = e.ci
     JOIN curso cur ON cur.idcurso = mat.idcurso
     LEFT JOIN gestion g ON g.idgestion = mat.idgestion
     WHERE m.idmatriculacion = $1 AND m.idmensualidad = $2`,
    [idmatriculacion, idmensualidad],
  );
  return result.rows[0] || null;
}

export async function crearMensualidad(data) {
  const result = await query('SELECT sp_InsertarMensualidadManual($1, $2, $3, $4)', [
    data.idmatriculacion,
    data.monto,
    data.descuento || 0,
    data.nro || null,
  ]);
  return { idmensualidad: result.rows[0].sp_insertarmensualidadmanual };
}

export async function actualizarMensualidad(idmatriculacion, idmensualidad, data) {
  await query('SELECT sp_ActualizarMensualidadMonto($1, $2, $3, $4)', [
    idmatriculacion,
    idmensualidad,
    data.monto,
    data.descuento ?? null,
  ]);
  return { idmatriculacion, idmensualidad };
}

export async function pagarMensualidad(idmat, idmen, data) {
  await query('SELECT sp_ActualizarMensualidad($1, $2, $3, $4)', [
    idmen,
    idmat,
    data.tipopago,
    data.fechapago || null,
  ]);
  return { idmatriculacion: idmat, idmensualidad: idmen };
}

export async function pagarTodoMatricula(idmat, tipopago) {
  const beca = await query(
    "SELECT porcentaje FROM beca WHERE nombrebeca = 'Descuento por pagar al contado' LIMIT 1",
  );
  const porcentaje = Number(beca.rows[0]?.porcentaje ?? 0);

  const pendientes = await query(
    `SELECT idmensualidad, monto FROM mensualidad
     WHERE idmatriculacion = $1 AND tipopago IS NULL
     ORDER BY idmensualidad`,
    [idmat],
  );

  let pagadas = 0;
  for (const m of pendientes.rows) {
    const descuento = porcentaje > 0 ? (Number(m.monto) * porcentaje) / 100 : 0;
    const totalpagar = Number(m.monto) - descuento;
    await query(
      `UPDATE mensualidad SET descuento = $1, totalpagar = $2
       WHERE idmatriculacion = $3 AND idmensualidad = $4`,
      [descuento, totalpagar, idmat, m.idmensualidad],
    );
    await query('SELECT sp_ActualizarMensualidad($1, $2, $3, $4)', [
      m.idmensualidad,
      idmat,
      tipopago,
      null,
    ]);
    pagadas++;
  }

  return { idmatriculacion: idmat, pagadas, porcentajeAplicado: porcentaje };
}

export async function listarDeudores(params = {}) {
  const { gestion, meses, nivel, busqueda } = params;
  const gestionId = gestion || '0';
  const mesesMin = meses || '1';

  let sql = `
    SELECT
      e.ci, e.codestudiante,
      p.nombre, p.apellido,
      cur.descripcion as curso_nombre,
      n.nombre as nivel_nombre,
      COUNT(*) FILTER (WHERE m.estado = 'P') as meses_adeudados,
      SUM(m.totalpagar) FILTER (WHERE m.estado = 'P') as monto_total_adeudado
    FROM mensualidad m
    JOIN matriculacion mat ON mat.idmatriculacion = m.idmatriculacion
    JOIN estudiante e ON e.ci = mat.ciestudiante
    JOIN persona p ON p.ci = e.ci
    JOIN curso cur ON cur.idcurso = mat.idcurso
    JOIN nivel n ON n.idnivel = cur.idnivel
    WHERE mat.idgestion = $1`;
  const values = [Number(gestionId)];
  let paramIdx = 2;

  if (nivel) {
    sql += ` AND cur.idnivel = $${paramIdx++}`;
    values.push(Number(nivel));
  }
  if (busqueda) {
    sql += ` AND (p.nombre ILIKE $${paramIdx} OR p.apellido ILIKE $${paramIdx} OR e.codestudiante ILIKE $${paramIdx})`;
    values.push(`%${busqueda}%`);
    paramIdx++;
  }

  sql += `
    GROUP BY e.ci, e.codestudiante, p.nombre, p.apellido, cur.descripcion, n.nombre
    HAVING COUNT(*) FILTER (WHERE m.estado = 'P') >= $${paramIdx}
    ORDER BY monto_total_adeudado DESC`;
  values.push(Number(mesesMin));

  const result = await query(sql, values);
  return result.rows;
}

export async function listarHistorial(params = {}) {
  const { fecha_inicial, fecha_final, tipopago, gestion, nivel, busqueda } = params;
  const fecIni = fecha_inicial || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
  const fecFin = fecha_final || new Date().toISOString().split('T')[0];

  let sql = `
    SELECT m.*,
      p.nombre || ' ' || p.apellido as estudiante_nombre,
      p.ci as estudiante_ci, p.apellido,
      e.codestudiante,
      cur.descripcion as curso_nombre,
      n.nombre as nivel_nombre
    FROM mensualidad m
    JOIN matriculacion mat ON mat.idmatriculacion = m.idmatriculacion
    JOIN estudiante e ON e.ci = mat.ciestudiante
    JOIN persona p ON p.ci = e.ci
    JOIN curso cur ON cur.idcurso = mat.idcurso
    JOIN nivel n ON n.idnivel = cur.idnivel
    WHERE m.fechapago IS NOT NULL
      AND m.fechapago >= $1
      AND m.fechapago <= $2`;
  const values = [fecIni, fecFin];
  let paramIdx = 3;

  if (tipopago) {
    sql += ` AND m.tipopago = $${paramIdx++}`;
    values.push(tipopago);
  }
  if (gestion) {
    sql += ` AND mat.idgestion = $${paramIdx++}`;
    values.push(Number(gestion));
  }
  if (nivel) {
    sql += ` AND cur.idnivel = $${paramIdx++}`;
    values.push(Number(nivel));
  }
  if (busqueda) {
    sql += ` AND (p.nombre ILIKE $${paramIdx} OR p.apellido ILIKE $${paramIdx} OR CAST(p.ci AS text) LIKE $${paramIdx})`;
    values.push(`%${busqueda}%`);
    paramIdx++;
  }

  sql += ` ORDER BY m.fechapago DESC, m.idmensualidad ASC`;

  const result = await query(sql, values);
  return result.rows;
}

export async function generarMensualidadesFaltantes(idgestion, montoDefault = 0) {
  const gestion = await query('SELECT cantidadmen FROM gestion WHERE idgestion = $1', [idgestion]);
  if (!gestion.rows[0]) throw new Error('Gestión no encontrada');
  const cantidadmen = Number(gestion.rows[0].cantidadmen);

  const matriculas = await query(
    `SELECT m.idmatriculacion, m.ciestudiante, m.idcurso, m.codbeca, c.idnivel
     FROM matriculacion m
     JOIN curso c ON c.idcurso = m.idcurso
     WHERE m.idgestion = $1 AND m.estado IN ('A', 'R')`,
    [idgestion],
  );

  const becaCache = {};

  const results = [];

  for (const mat of matriculas.rows) {
    const detalle = await query(
      `SELECT dg.monto, n.montomes FROM nivel n
       LEFT JOIN detallegestion dg ON dg.idnivel = n.idnivel AND dg.idgestion = $1
       WHERE n.idnivel = $2`,
      [idgestion, mat.idnivel],
    );
    const monto = detalle.rows[0]?.monto ?? detalle.rows[0]?.montomes ?? montoDefault;

    let porcentajeBeca = 0;
    if (mat.codbeca) {
      if (becaCache[mat.codbeca] !== undefined) {
        porcentajeBeca = becaCache[mat.codbeca];
      } else {
        const beca = await query('SELECT porcentaje FROM beca WHERE codbeca = $1', [mat.codbeca]);
        porcentajeBeca = beca.rows[0]?.porcentaje ?? 0;
        becaCache[mat.codbeca] = porcentajeBeca;
      }
    }

    const descuento = porcentajeBeca > 0 ? (monto * porcentajeBeca) / 100 : 0;
    const beca100 = porcentajeBeca >= 100;

    // Update existing mensualidades with wrong monto/descuento
    if (monto > 0) {
      const actualizar = await query(
        `UPDATE mensualidad SET monto = $1, descuento = $2, totalpagar = $1 - $2
         WHERE idmatriculacion = $3 AND (monto != $1 OR descuento != $2)`,
        [monto, descuento, mat.idmatriculacion],
      );
    }

    const countResult = await query(
      'SELECT COUNT(*) as cnt FROM mensualidad WHERE idmatriculacion = $1',
      [mat.idmatriculacion],
    );
    const existingCount = Number(countResult.rows[0].cnt);

    if (existingCount < cantidadmen) {
      const faltantes = cantidadmen - existingCount;

      for (let i = 0; i < faltantes; i++) {
        const result = await query('SELECT sp_InsertarMensualidadManual($1, $2, $3, $4)', [
          mat.idmatriculacion,
          monto,
          descuento,
          existingCount + i + 1,
        ]);
        const idmensualidad = result.rows[0].sp_insertarmensualidadmanual;

        if (beca100) {
          await query(
            `UPDATE mensualidad SET tipopago = $1, estado = $2, fechapago = CURRENT_DATE
             WHERE idmatriculacion = $3 AND idmensualidad = $4`,
            ['A', 'C', mat.idmatriculacion, idmensualidad],
          );
        }

        results.push({ idmatriculacion: mat.idmatriculacion, idmensualidad });
      }
    }
  }

  return { idgestion, generadas: results.length };
}
