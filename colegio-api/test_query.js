const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:admin@localhost:5432/COLEGIO' });
const gestionId = 1;
const nivel = 2;
pool.query(`
  SELECT c.*, n.nombre as nivel_nombre,
    CASE WHEN $1 IS NOT NULL THEN (
      SELECT COUNT(*) FROM matriculacion m
      WHERE m.idcurso = c.idcurso AND m.idgestion = $1 AND m.estado IN ('R','A')
    ) ELSE 0 END as inscritos
    FROM curso c JOIN nivel n ON n.idnivel = c.idnivel
    WHERE c.idnivel = $2
    ORDER BY c.idcurso
`, [gestionId, nivel])
  .then(r => { console.log('Filtered by gestion=1, nivel=2:', JSON.stringify(r.rows, null, 2)); pool.end(); })
  .catch(e => { console.error('Error:', e.message); pool.end(); });
