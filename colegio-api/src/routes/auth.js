import { z } from 'zod';
import { parseBody } from '../lib/request.js';
import { respond } from '../lib/response.js';
import { authMiddleware } from '../middleware/auth.js';
import { login, cambiarPassword } from '../servicios/auth.service.js';

const loginSchema = z.object({
  usuario: z.string().min(1, 'Usuario requerido'),
  contraseña: z.string().min(6, 'Mínimo 6 caracteres'),
  rol: z.enum(['admin', 'director', 'secretaria', 'tutor'], { message: 'Rol inválido' }),
});

const cambiarPassSchema = z.object({
  contraseñaActual: z.string().min(1, 'Contraseña actual requerida'),
  nuevaContraseña: z.string().min(6, 'Nueva contraseña mínimo 6 caracteres').max(150),
});

export function authRouter(router) {
  router.post('/auth/login', async (req, res) => {
    try {
      const body = await parseBody(req);
      const data = loginSchema.parse(body);
      const result = await login(data);
      respond(res, 200, true, result, 'Login exitoso');
    } catch (err) {
      if (err instanceof z.ZodError) {
        return respond(res, 400, false, null, err.errors[0].message);
      }
      throw err;
    }
  });

  router.put('/auth/cambiar-contrasena', async (req, res) => {
    try {
      const userHolder = {};
      authMiddleware(req, res, userHolder);
      const { ci, tabla } = userHolder.user;

      const body = await parseBody(req);
      const data = cambiarPassSchema.parse(body);

      await cambiarPassword(ci, tabla, data.contraseñaActual, data.nuevaContraseña);
      respond(res, 200, true, null, 'Contraseña actualizada');
    } catch (err) {
      if (err instanceof z.ZodError) {
        return respond(res, 400, false, null, err.errors[0].message);
      }
      throw err;
    }
  });
}
