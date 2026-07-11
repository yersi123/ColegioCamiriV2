import { createServer } from 'http';
import { Router } from './lib/router.js';
import { handleError } from './middleware/error.js';
import { respond } from './lib/response.js';
import { config } from './config.js';
import { authRouter } from './routes/auth.js';
import { personasRouter } from './routes/personas.js';
import { usuariosRouter } from './routes/usuarios.js';
import { nivelesRouter } from './routes/niveles.js';
import { cursosRouter } from './routes/cursos.js';
import { gestionRouter } from './routes/gestion.js';
import { becaRouter } from './routes/becas.js';
import { aporteRouter } from './routes/aportes.js';
import { matriculacionRouter } from './routes/matriculacion.js';
import { mensualidadRouter } from './routes/mensualidad.js';
import { tutorRouter } from './routes/tutor.js';
import { secretariaRouter } from './routes/secretaria.js';
import { reportesRouter } from './routes/reportes.js';

const router = new Router();

router.get('/health', (req, res) => {
  respond(res, 200, true, { status: 'ok', timestamp: new Date().toISOString() }, 'Servidor activo');
});

authRouter(router);
personasRouter(router);
usuariosRouter(router);
nivelesRouter(router);
cursosRouter(router);
gestionRouter(router);
becaRouter(router);
aporteRouter(router);
matriculacionRouter(router);
mensualidadRouter(router);
tutorRouter(router);
secretariaRouter(router);
reportesRouter(router);

const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', config.CORS_ORIGIN);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    const matched = await router.resolve(req, res);
    if (!matched) {
      respond(res, 404, false, null, 'Ruta no encontrada');
    }
  } catch (err) {
    handleError(err, res);
  }
});

server.listen(Number(config.PORT), config.HOST, () => {
  console.log(`🚀 Servidor iniciado en http://${config.HOST}:${config.PORT}`);
});
