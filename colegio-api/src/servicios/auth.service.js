import { query } from '../lib/db.js';
import { hashPassword, comparePassword } from '../lib/hash.js';
import { signToken } from '../lib/jwt.js';
import { UnauthorizedError } from '../lib/errors.js';

const TABLAS = { admin: 'admin', director: 'director', secretaria: 'secretaria', tutor: 'tutor' };

export async function    login({ usuario, contraseña, rol }) {
  const tabla = TABLAS[rol];
  if (!tabla) throw new UnauthorizedError('Rol inválido');

  const sql = `SELECT t.ci, t.contrasena, p.nombre, p.apellido
    FROM ${tabla} t
    JOIN persona p ON p.ci = t.ci
    WHERE t.usuario = $1 AND t.estado = 'A'`;

  const result = await query(sql, [usuario]);
  if (result.rows.length === 0) throw new UnauthorizedError('Credenciales inválidas');

  const user = result.rows[0];
  const valid = await comparePassword(contraseña, user.contrasena);
  if (!valid) throw new UnauthorizedError('Credenciales inválidas');

  const token = signToken({ ci: user.ci, rol, tabla, usuario });
  return { token, usuario: { ci: user.ci, nombre: user.nombre, apellido: user.apellido, rol } };
}

export async function cambiarPassword(ci, tabla, contraseñaActual, nuevaContraseña) {
  const result = await query(`SELECT contrasena FROM ${tabla} WHERE ci = $1`, [ci]);
  if (result.rows.length === 0) throw new UnauthorizedError('Usuario no encontrado');

  const valid = await comparePassword(contraseñaActual, result.rows[0].contrasena);
  if (!valid) throw new UnauthorizedError('Contraseña actual incorrecta');

  const hash = await hashPassword(nuevaContraseña);
  await query(`UPDATE ${tabla} SET contrasena = $1 WHERE ci = $2`, [hash, ci]);
}
