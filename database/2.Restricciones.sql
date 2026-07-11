-- ============================================================
-- RESTRICCIONES - PostgreSQL
-- FK, UNIQUE, CHECK
-- ============================================================

-- FK: estudiante → persona
ALTER TABLE estudiante
    ADD CONSTRAINT fk_estudiante_persona
    FOREIGN KEY (ci) REFERENCES persona(ci)
    ON UPDATE CASCADE ON DELETE CASCADE;

-- FK: estudiante → tutor
ALTER TABLE estudiante
    ADD CONSTRAINT fk_estudiante_tutor
    FOREIGN KEY (citutor) REFERENCES tutor(ci)
    ON UPDATE CASCADE;

-- FK: estudiante → gestion
ALTER TABLE estudiante
    ADD CONSTRAINT fk_estudiante_gestion
    FOREIGN KEY (idgestion) REFERENCES gestion(idgestion)
    ON UPDATE CASCADE;

-- FK: tutor → persona
ALTER TABLE tutor
    ADD CONSTRAINT fk_tutor_persona
    FOREIGN KEY (ci) REFERENCES persona(ci)
    ON UPDATE CASCADE ON DELETE CASCADE;

-- FK: admin → persona
ALTER TABLE admin
    ADD CONSTRAINT fk_admin_persona
    FOREIGN KEY (ci) REFERENCES persona(ci)
    ON UPDATE CASCADE ON DELETE CASCADE;

-- FK: secretaria → persona
ALTER TABLE secretaria
    ADD CONSTRAINT fk_secretaria_persona
    FOREIGN KEY (ci) REFERENCES persona(ci)
    ON UPDATE CASCADE ON DELETE CASCADE;

-- FK: director → persona
ALTER TABLE director
    ADD CONSTRAINT fk_director_persona
    FOREIGN KEY (ci) REFERENCES persona(ci)
    ON UPDATE CASCADE ON DELETE CASCADE;

-- FK: beca → gestion
ALTER TABLE beca
    ADD CONSTRAINT fk_beca_gestion
    FOREIGN KEY (idgestion) REFERENCES gestion(idgestion)
    ON UPDATE CASCADE;

-- CHECK: curso capacidad minima (RN-20)
ALTER TABLE curso
    ADD CONSTRAINT ch_curso_capacidad
    CHECK (capacidad_maxima > 0);

-- FK: curso → nivel
ALTER TABLE curso
    ADD CONSTRAINT fk_curso_nivel
    FOREIGN KEY (idnivel) REFERENCES nivel(idnivel)
    ON UPDATE CASCADE;

-- FK: detallegestion → gestion
ALTER TABLE detallegestion
    ADD CONSTRAINT fk_detallegestion_gestion
    FOREIGN KEY (idgestion) REFERENCES gestion(idgestion)
    ON UPDATE CASCADE;

-- FK: detallegestion → nivel
ALTER TABLE detallegestion
    ADD CONSTRAINT fk_detallegestion_nivel
    FOREIGN KEY (idnivel) REFERENCES nivel(idnivel)
    ON UPDATE CASCADE;

-- FK: matriculacion → estudiante
ALTER TABLE matriculacion
    ADD CONSTRAINT fk_matriculacion_estudiante
    FOREIGN KEY (ciestudiante) REFERENCES estudiante(ci)
    ON UPDATE CASCADE;

-- FK: matriculacion → beca
ALTER TABLE matriculacion
    ADD CONSTRAINT fk_matriculacion_beca
    FOREIGN KEY (codbeca) REFERENCES beca(codbeca)
    ON UPDATE CASCADE;

-- FK: matriculacion → gestion
ALTER TABLE matriculacion
    ADD CONSTRAINT fk_matriculacion_gestion
    FOREIGN KEY (idgestion) REFERENCES gestion(idgestion)
    ON UPDATE CASCADE;

-- FK: matriculacion → curso
ALTER TABLE matriculacion
    ADD CONSTRAINT fk_matriculacion_curso
    FOREIGN KEY (idcurso) REFERENCES curso(idcurso)
    ON UPDATE CASCADE;

-- FK: mensualidad → matriculacion
ALTER TABLE mensualidad
    ADD CONSTRAINT fk_mensualidad_matriculacion
    FOREIGN KEY (idmatriculacion) REFERENCES matriculacion(idmatriculacion)
    ON UPDATE CASCADE;

-- FK: aporte → matriculacion
ALTER TABLE aporte
    ADD CONSTRAINT fk_aporte_matriculacion
    FOREIGN KEY (idmatriculacion) REFERENCES matriculacion(idmatriculacion)
    ON UPDATE CASCADE;

-- FK: aporte → gestion
ALTER TABLE aporte
    ADD CONSTRAINT fk_aporte_gestion
    FOREIGN KEY (idgestion) REFERENCES gestion(idgestion)
    ON UPDATE CASCADE;

-- ============================================================
-- UNIQUE
-- ============================================================

-- Un estudiante solo puede matricularse una vez por gestion y curso
ALTER TABLE matriculacion
    ADD CONSTRAINT uq_matriculacion_estudiante_gestion_curso
    UNIQUE (ciestudiante, idgestion, idcurso);

-- No puede repetirse el mismo nivel en la misma gestion
ALTER TABLE detallegestion
    ADD CONSTRAINT uq_detallegestion_gestion_nivel
    UNIQUE (idgestion, idnivel);

-- Usuarios unicos por tabla de rol
ALTER TABLE tutor
    ADD CONSTRAINT uq_tutor_usuario UNIQUE (usuario);

ALTER TABLE admin
    ADD CONSTRAINT uq_admin_usuario UNIQUE (usuario);

ALTER TABLE secretaria
    ADD CONSTRAINT uq_secretaria_usuario UNIQUE (usuario);

ALTER TABLE director
    ADD CONSTRAINT uq_director_usuario UNIQUE (usuario);

ALTER TABLE estudiante
    ADD CONSTRAINT uq_estudiante_codestudiante UNIQUE (codestudiante);

-- ============================================================
-- CHECK
-- ============================================================

-- persona
ALTER TABLE persona
    ADD CONSTRAINT ch_persona_correo
    CHECK (correo IS NULL OR correo LIKE '%@%.%');

ALTER TABLE persona
    ADD CONSTRAINT ch_persona_estado
    CHECK (estado IN ('A', 'I'));

-- tutor
ALTER TABLE tutor
    ADD CONSTRAINT ch_tutor_estado CHECK (estado IN ('A', 'I'));

-- admin
ALTER TABLE admin
    ADD CONSTRAINT ch_admin_estado CHECK (estado IN ('A', 'I'));

-- secretaria
ALTER TABLE secretaria
    ADD CONSTRAINT ch_secretaria_estado CHECK (estado IN ('A', 'I'));

-- director
ALTER TABLE director
    ADD CONSTRAINT ch_director_estado CHECK (estado IN ('A', 'I'));

-- beca
ALTER TABLE beca
    ADD CONSTRAINT ch_beca_porcentaje
    CHECK (porcentaje >= 0 AND porcentaje <= 100);

-- gestion
ALTER TABLE gestion
    ADD CONSTRAINT ch_gestion_estado CHECK (estado IN ('1', '0'));

ALTER TABLE gestion
    ADD CONSTRAINT ch_gestion_fechas CHECK (fechacierre > fechaapertura);

ALTER TABLE gestion
    ADD CONSTRAINT ch_gestion_cantidadmen CHECK (cantidadmen > 0);

-- detallegestion
ALTER TABLE detallegestion
    ADD CONSTRAINT ch_detallegestion_monto CHECK (monto >= 0);

-- matriculacion
ALTER TABLE matriculacion
    ADD CONSTRAINT ch_matriculacion_estado CHECK (estado IN ('A', 'R', 'X'));

-- mensualidad
ALTER TABLE mensualidad
    ADD CONSTRAINT ch_mensualidad_tipopago
    CHECK (tipopago IS NULL OR tipopago IN ('E', 'Q', 'A'));

ALTER TABLE mensualidad
    ADD CONSTRAINT ch_mensualidad_descuento CHECK (descuento >= 0);

ALTER TABLE mensualidad
    ADD CONSTRAINT ch_mensualidad_monto CHECK (monto >= 0);

ALTER TABLE mensualidad
    ADD CONSTRAINT ch_mensualidad_totalpagar CHECK (totalpagar >= 0);

ALTER TABLE mensualidad
    ADD CONSTRAINT ch_mensualidad_estado CHECK (estado IN ('P', 'C', 'A'));

ALTER TABLE mensualidad
    ADD CONSTRAINT ch_mensualidad_nro CHECK (nro > 0);

-- aporte
ALTER TABLE aporte
    ADD CONSTRAINT ch_aporte_tipopago
    CHECK (tipopago IS NULL OR tipopago IN ('E', 'Q', 'A'));

ALTER TABLE aporte
    ADD CONSTRAINT ch_aporte_descuento CHECK (descuento >= 0);

ALTER TABLE aporte
    ADD CONSTRAINT ch_aporte_monto CHECK (monto >= 0);

ALTER TABLE aporte
    ADD CONSTRAINT ch_aporte_totalpagar CHECK (totalpagar >= 0);

ALTER TABLE aporte
    ADD CONSTRAINT ch_aporte_estado CHECK (estado IN ('P', 'C', 'A'));

ALTER TABLE aporte
    ADD CONSTRAINT ch_aporte_nro CHECK (nro > 0);
