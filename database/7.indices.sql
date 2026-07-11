-- ============================================================
-- INDICES - PostgreSQL
-- ============================================================

-- Indices para tabla matriculacion
CREATE INDEX IF NOT EXISTS idx_matriculacion_ciestudiante ON matriculacion(ciestudiante);
CREATE INDEX IF NOT EXISTS idx_matriculacion_idgestion ON matriculacion(idgestion);
CREATE INDEX IF NOT EXISTS idx_matriculacion_idcurso ON matriculacion(idcurso);
CREATE INDEX IF NOT EXISTS idx_matriculacion_codbeca ON matriculacion(codbeca);

-- Indices para tabla mensualidad
CREATE INDEX IF NOT EXISTS idx_mensualidad_idmatriculacion ON mensualidad(idmatriculacion);
CREATE INDEX IF NOT EXISTS idx_mensualidad_estado ON mensualidad(estado);
CREATE INDEX IF NOT EXISTS idx_mensualidad_tipopago ON mensualidad(tipopago);

-- Indices para tabla aporte
CREATE INDEX IF NOT EXISTS idx_aporte_idmatriculacion ON aporte(idmatriculacion);

-- Indices para tabla detallegestion
CREATE INDEX IF NOT EXISTS idx_detallegestion_idgestion ON detallegestion(idgestion);
CREATE INDEX IF NOT EXISTS idx_detallegestion_idnivel ON detallegestion(idnivel);

-- Indices para tabla estudiante
CREATE INDEX IF NOT EXISTS idx_estudiante_citutor ON estudiante(citutor);
CREATE INDEX IF NOT EXISTS idx_estudiante_idgestion ON estudiante(idgestion);
