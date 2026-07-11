import { query } from '../lib/db.js';
import { NotFoundError, ConflictError } from '../lib/errors.js';
import { hashPassword } from '../lib/hash.js';
import { generarMensualidadesFaltantes } from './mensualidad.service.js';
import { generarAportesFaltantes } from './aporte.service.js';

export async function listarMatriculas(params = {}) {
  let sql = `SELECT m.*, p.nombre || ' ' || p.apellido as estudiante_nombre,
             p.ci as estudiante_ci, c.descripcion as curso_descripcion,
             n.nombre as nivel_nombre, g.descripcion as gestion_nombre
             FROM matriculacion m
             JOIN estudiante e ON e.ci = m.ciestudiante
             JOIN persona p ON p.ci = e.ci
             JOIN curso c ON c.idcurso = m.idcurso
             JOIN nivel n ON n.idnivel = c.idnivel
             LEFT JOIN gestion g ON g.idgestion = m.idgestion`;
  const values = [];
  const conditions = [];

  if (params.idgestion) {
    conditions.push(` m.idgestion = $${values.length + 1}`);
    values.push(Number(params.idgestion));
  }
  if (params.ciestudiante) {
    conditions.push(` m.ciestudiante = $${values.length + 1}`);
    values.push(params.ciestudiante);
  }
  if (params.estado) {
    conditions.push(` m.estado = $${values.length + 1}`);
    values.push(params.estado);
  }

  if (conditions.length > 0) sql += ' WHERE' + conditions.join(' AND');
  sql += ' ORDER BY m.idmatriculacion DESC';

  const result = await query(sql, values);
  return result.rows;
}

export async function obtenerMatricula(id) {
  const sql = `SELECT m.*, p.nombre || ' ' || p.apellido as estudiante_nombre,
               p.ci as estudiante_ci, c.descripcion as curso_descripcion,
               n.nombre as nivel_nombre, g.descripcion as gestion_nombre,
               g.cantidadmen
               FROM matriculacion m
               JOIN estudiante e ON e.ci = m.ciestudiante
               JOIN persona p ON p.ci = e.ci
               JOIN curso c ON c.idcurso = m.idcurso
               JOIN nivel n ON n.idnivel = c.idnivel
               LEFT JOIN gestion g ON g.idgestion = m.idgestion
               WHERE m.idmatriculacion = $1`;
  const result = await query(sql, [id]);
  return result.rows[0] || null;
}

export async function verificarDeudas(ciEstudiante, idgestion) {
  const result = await query(`
    SELECT COUNT(*)::int as total, COALESCE(SUM(m.totalpagar), 0) as monto_total
    FROM mensualidad m
    JOIN matriculacion mat ON m.idmatriculacion = mat.idmatriculacion
    WHERE mat.ciestudiante = $1 AND m.estado = 'P' AND mat.idgestion != $2
  `, [ciEstudiante, idgestion]);
  return result.rows[0];
}

export async function verificarCapacidadCurso(idcurso, idgestion) {
  const result = await query(`
    SELECT c.capacidad_maxima,
           (SELECT COUNT(*) FROM matriculacion WHERE idcurso = c.idcurso AND idgestion = $2 AND estado IN ('R','A')) as inscritos
    FROM curso c WHERE c.idcurso = $1
  `, [idcurso, idgestion]);
  const row = result.rows[0];
  if (!row) throw new Error('Curso no encontrado');
  if (Number(row.inscritos) >= Number(row.capacidad_maxima)) {
    throw new Error(`El curso ha alcanzado su capacidad máxima (${row.capacidad_maxima} estudiantes)`);
  }
  return row;
}

export async function crearMatricula(data) {
  const deudas = await verificarDeudas(data.ciestudiante, data.idgestion);
  if (deudas.total > 0) {
    throw new Error('El estudiante tiene ' + deudas.total + ' mensualidad(es) pendiente(s) en gestiones anteriores por un total de Bs ' + Number(deudas.monto_total).toFixed(2) + '. Debe cancelarlas antes de matricularse.');
  }
  await verificarCapacidadCurso(data.idcurso, data.idgestion);

  const result = await query(
    'SELECT sp_InsertarMatriculacion($1, $2, $3, $4) as idmatriculacion',
    [data.ciestudiante, data.idgestion, data.idcurso, data.codbeca ?? null],
  );
  await generarMensualidadesFaltantes(data.idgestion);
  await generarAportesFaltantes(data.idgestion);
  return { idmatriculacion: result.rows[0].idmatriculacion };
}

export async function crearMatriculaConRegistro(data) {
  // 1. Validar capacidad del curso
  await verificarCapacidadCurso(data.idcurso, data.idgestion);

  // 2. Verificar si la persona existe, si no crearla
  const personaExistente = await query('SELECT ci FROM persona WHERE ci = $1', [data.ci]);
  if (personaExistente.rows.length === 0) {
    await query(
      'INSERT INTO persona (ci, nombre, apellido, sexo, telefono, correo) VALUES ($1, $2, $3, $4, $5, $6)',
      [data.ci, data.nombre, data.apellido, data.sexo, data.telefono || null, data.correo || null],
    );
  }

  // 3. Verificar que no esté ya matriculado en esta gestión
  const yaMatriculado = await query(
    'SELECT idmatriculacion FROM matriculacion WHERE ciestudiante = $1 AND idgestion = $2 AND estado IN (\'R\',\'A\')',
    [data.ci, data.idgestion],
  );
  if (yaMatriculado.rows.length > 0) {
    throw new Error('El estudiante ya está matriculado en esta gestión');
  }

  // 4. Generar codestudiante
  let codestudiante;
  const estExistente = await query('SELECT codestudiante, citutor FROM estudiante WHERE ci = $1', [data.ci]);
  if (estExistente.rows.length > 0) {
    codestudiante = estExistente.rows[0].codestudiante;
  } else {
    const maxRes = await query("SELECT COALESCE(MAX(codestudiante), 'EST-00000') as max FROM estudiante");
    const num = parseInt(maxRes.rows[0].max.split('-')[1]) + 1;
    codestudiante = 'EST-' + String(num).padStart(5, '0');
  }

  // 5. Procesar tutor si se proporcionó
  let citutor = null;
  if (data.tutor && data.tutor.ci) {
    const t = data.tutor;
    const tutorPersona = await query('SELECT ci FROM persona WHERE ci = $1', [t.ci]);
    if (tutorPersona.rows.length === 0) {
      if (!t.correo) throw new Error('El correo del tutor es obligatorio para crear su cuenta');
      await query(
        'INSERT INTO persona (ci, nombre, apellido, sexo, telefono, correo) VALUES ($1, $2, $3, $4, $5, $6)',
        [t.ci, t.nombre, t.apellido, t.sexo, t.telefono || null, t.correo],
      );
    } else {
      const checkCorreo = await query('SELECT correo FROM persona WHERE ci = $1', [t.ci]);
      if (!checkCorreo.rows[0]?.correo) {
        throw new Error('La persona con CI ' + t.ci + ' no tiene correo electrónico. Debe tener correo para ser tutor.');
      }
    }

    const tutorExistente = await query('SELECT ci FROM tutor WHERE ci = $1', [t.ci]);
    if (tutorExistente.rows.length === 0) {
      const correoTutor = t.correo || (await query('SELECT correo FROM persona WHERE ci = $1', [t.ci])).rows[0]?.correo;
      if (!correoTutor) throw new Error('Correo requerido para crear usuario tutor');
      const hash = await hashPassword(t.ci);
      await query('SELECT sp_InsertarTutor($1, $2, $3)', [t.ci, correoTutor, hash]);
    }

    citutor = t.ci;
  } else if (estExistente.rows.length > 0 && estExistente.rows[0].citutor) {
    citutor = estExistente.rows[0].citutor;
  }

  // 6. Insertar o actualizar estudiante con citutor
  if (estExistente.rows.length === 0) {
    await query(
      'INSERT INTO estudiante (ci, codestudiante, citutor, idgestion) VALUES ($1, $2, $3, $4)',
      [data.ci, codestudiante, citutor, data.idgestion],
    );
  } else if (citutor && citutor !== estExistente.rows[0].citutor) {
    await query('UPDATE estudiante SET citutor = $1 WHERE ci = $2', [citutor, data.ci]);
  }

  // 7. Verificar deudas pendientes
  const deudas = await verificarDeudas(data.ci, data.idgestion);
  if (deudas.total > 0) {
    throw new Error('El estudiante tiene ' + deudas.total + ' mensualidad(es) pendiente(s) en gestiones anteriores por un total de Bs ' + Number(deudas.monto_total).toFixed(2) + '. Debe cancelarlas antes de matricularse.');
  }

  // 8. Crear la matrícula
  const result = await query(
    'SELECT sp_InsertarMatriculacion($1, $2, $3, $4) as idmatriculacion',
    [data.ci, data.idgestion, data.idcurso, data.codbeca ?? null],
  );
  const idmatriculacion = result.rows[0].idmatriculacion;

  // 9. Generar mensualidades y aportes
  await generarMensualidadesFaltantes(data.idgestion);
  await generarAportesFaltantes(data.idgestion);

  return { idmatriculacion, codestudiante, citutor };
}

export async function actualizarMatricula(id, data) {
  const sets = [];
  const values = [];
  let idx = 1;

  if (data.idcurso !== undefined) {
    sets.push(`idcurso = $${idx++}`);
    values.push(data.idcurso);
  }
  if (data.codbeca !== undefined) {
    sets.push(`codbeca = $${idx++}`);
    values.push(data.codbeca);
  }

  if (sets.length === 0) return { idmatriculacion: id };

  values.push(id);
  await query(`UPDATE matriculacion SET ${sets.join(', ')} WHERE idmatriculacion = $${idx}`, values);

  if (data.codbeca !== undefined) {
    await query('SELECT sp_ActualizarBecaMatricula($1, $2)', [id, data.codbeca]);
  }

  return { idmatriculacion: id };
}

export async function cambiarEstadoMatricula(id, estado) {
  const r = await query('UPDATE matriculacion SET estado = $1 WHERE idmatriculacion = $2 RETURNING idmatriculacion, idgestion', [estado, id]);
  if (!r.rows[0]) throw new NotFoundError('Matrícula');
  if (estado === 'A') {
    await generarMensualidadesFaltantes(r.rows[0].idgestion);
    await generarAportesFaltantes(r.rows[0].idgestion);
  }
  return { idmatriculacion: id, estado };
}
