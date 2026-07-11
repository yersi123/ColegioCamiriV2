import pg from 'pg';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '..', '.env') });

const TABLAS = ['admin', 'director', 'secretaria', 'tutor'];
const SALT_ROUNDS = 10;

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function isBcryptHash(str) {
  return typeof str === 'string' && /^\$2[abxy]\$/.test(str);
}

async function migrate() {
  const ts = timestamp();
  const logFile = path.join(__dirname, '..', 'logs', `migration-${ts}.log`);
  const lines = [];

  const log = (msg) => {
    console.log(msg);
    lines.push(msg);
  };

  log(`=== Migración de contraseñas - ${ts} ===\n`);

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
  });

  let totalMigrated = 0;
  let totalAlreadyHashed = 0;
  let totalErrors = 0;

  try {
    await pool.query('SELECT 1');
    log('Conexión a PostgreSQL exitosa.\n');
  } catch (err) {
    log(`ERROR: No se pudo conectar a PostgreSQL: ${err.message}`);
    fs.mkdirSync(path.dirname(logFile), { recursive: true });
    fs.writeFileSync(logFile, lines.join('\n'), 'utf-8');
    process.exit(1);
  }

  for (const tabla of TABLAS) {
    log(`--- Tabla: ${tabla} ---`);

    let rows;
    try {
      const result = await pool.query(`SELECT ci, usuario, contrasena FROM ${tabla}`);
      rows = result.rows;
    } catch (err) {
      log(`  ERROR al consultar ${tabla}: ${err.message}`);
      totalErrors++;
      continue;
    }

    if (rows.length === 0) {
      log('  Sin registros.\n');
      continue;
    }

    for (const row of rows) {
      const { ci, usuario, contrasena } = row;

      if (isBcryptHash(contrasena)) {
        log(`  [OK]   CI ${ci} (${usuario}) - ya está hasheado`);
        totalAlreadyHashed++;
        continue;
      }

      try {
        const hash = await bcrypt.hash(contrasena, SALT_ROUNDS);
        await pool.query(`UPDATE ${tabla} SET contrasena = $1 WHERE ci = $2`, [hash, ci]);
        log(`  [FIX]  CI ${ci} (${usuario}) - "${contrasena}" -> hash bcrypt`);
        totalMigrated++;
      } catch (err) {
        log(`  [ERR]  CI ${ci} (${usuario}) - ${err.message}`);
        totalErrors++;
      }
    }

    log('');
  }

  log('=== Resumen ===');
  log(`  Migrados:    ${totalMigrated}`);
  log(`  Ya hasheados: ${totalAlreadyHashed}`);
  log(`  Errores:     ${totalErrors}`);
  log(`  Total:       ${totalMigrated + totalAlreadyHashed + totalErrors}`);

  await pool.end();

  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  fs.writeFileSync(logFile, lines.join('\n'), 'utf-8');
  log(`\nLog guardado en: ${logFile}`);
}

migrate().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
