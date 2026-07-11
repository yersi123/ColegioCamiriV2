-- ============================================================
-- FUNCIONES (PROCEDIMIENTOS ALMACENADOS) - PostgreSQL
-- ============================================================

-- -------------  PERSONA -----------------

CREATE OR REPLACE FUNCTION sp_InsertarPersona(
    p_ci VARCHAR(10),
    p_nombre VARCHAR(100),
    p_apellido VARCHAR(100),
    p_sexo CHAR(1),
    p_telefono VARCHAR(8) DEFAULT NULL,
    p_correo VARCHAR(50) DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO persona (ci, nombre, apellido, sexo, telefono, fecharegistro, correo, estado)
    VALUES (p_ci, p_nombre, p_apellido, p_sexo, p_telefono, CURRENT_DATE, p_correo, 'A');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sp_ActualizarPersona(
    p_ci VARCHAR(10),
    p_nombre VARCHAR(100),
    p_apellido VARCHAR(100),
    p_sexo CHAR(1),
    p_telefono VARCHAR(8) DEFAULT NULL,
    p_correo VARCHAR(50) DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE persona SET
        nombre = p_nombre,
        apellido = p_apellido,
        sexo = p_sexo,
        telefono = p_telefono,
        correo = p_correo
    WHERE ci = p_ci;
END;
$$ LANGUAGE plpgsql;

-- -------------  TUTOR -----------------

CREATE OR REPLACE FUNCTION sp_InsertarTutor(
    p_ci VARCHAR(10),
    p_usuario VARCHAR(50),
    p_contrasena VARCHAR(150)
)
RETURNS VOID AS $$
BEGIN
    IF LENGTH(p_contrasena) < 6 THEN
        RAISE EXCEPTION 'La contraseña debe tener al menos 6 caracteres';
    END IF;
    INSERT INTO tutor (ci, usuario, contrasena, estado)
    VALUES (p_ci, p_usuario, p_contrasena, 'A');
END;
$$ LANGUAGE plpgsql;

-- -------------  ADMIN -----------------

CREATE OR REPLACE FUNCTION sp_InsertarAdmin(
    p_ci VARCHAR(10),
    p_usuario VARCHAR(50),
    p_contrasena VARCHAR(150)
)
RETURNS VOID AS $$
BEGIN
    IF LENGTH(p_contrasena) < 6 THEN
        RAISE EXCEPTION 'La contraseña debe tener al menos 6 caracteres';
    END IF;
    INSERT INTO admin (ci, usuario, contrasena, estado)
    VALUES (p_ci, p_usuario, p_contrasena, 'A');
END;
$$ LANGUAGE plpgsql;

-- -------------  DIRECTOR -----------------

CREATE OR REPLACE FUNCTION sp_InsertarDirector(
    p_ci VARCHAR(10),
    p_usuario VARCHAR(50),
    p_contrasena VARCHAR(150)
)
RETURNS VOID AS $$
BEGIN
    IF LENGTH(p_contrasena) < 6 THEN
        RAISE EXCEPTION 'La contraseña debe tener al menos 6 caracteres';
    END IF;
    INSERT INTO director (ci, usuario, contrasena, estado)
    VALUES (p_ci, p_usuario, p_contrasena, 'A');
END;
$$ LANGUAGE plpgsql;

-- -------------  SECRETARIA -----------------

CREATE OR REPLACE FUNCTION sp_InsertarSecretaria(
    p_ci VARCHAR(10),
    p_usuario VARCHAR(50),
    p_contrasena VARCHAR(150)
)
RETURNS VOID AS $$
BEGIN
    IF LENGTH(p_contrasena) < 6 THEN
        RAISE EXCEPTION 'La contraseña debe tener al menos 6 caracteres';
    END IF;
    INSERT INTO secretaria (ci, usuario, contrasena, estado)
    VALUES (p_ci, p_usuario, p_contrasena, 'A');
END;
$$ LANGUAGE plpgsql;

-- -------------  ESTUDIANTE -----------------

CREATE OR REPLACE FUNCTION sp_InsertarEstudiante(
    p_ci VARCHAR(10),
    p_codestudiante VARCHAR(10),
    p_citutor VARCHAR(10),
    p_idgestion INT
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO estudiante (ci, codestudiante, citutor, idgestion)
    VALUES (p_ci, p_codestudiante, p_citutor, p_idgestion);
END;
$$ LANGUAGE plpgsql;

-- -------------  NIVEL -----------------

CREATE OR REPLACE FUNCTION sp_InsertarNivel(
    p_nombre VARCHAR(50),
    p_montomes NUMERIC(10,4),
    p_montototal NUMERIC(10,4)
)
RETURNS INT AS $$
DECLARE
    v_idnivel INT;
BEGIN
    INSERT INTO nivel (nombre, montomes, montototal)
    VALUES (p_nombre, p_montomes, p_montototal)
    RETURNING idnivel INTO v_idnivel;
    RETURN v_idnivel;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sp_ActualizarNivel(
    p_idnivel INT,
    p_nombre VARCHAR(50),
    p_montomes NUMERIC(10,4),
    p_montototal NUMERIC(10,4)
)
RETURNS VOID AS $$
BEGIN
    UPDATE nivel SET
        nombre = p_nombre,
        montomes = p_montomes,
        montototal = p_montototal
    WHERE idnivel = p_idnivel;
END;
$$ LANGUAGE plpgsql;

-- -------------  CURSO -----------------

CREATE OR REPLACE FUNCTION sp_InsertarCurso(
    p_idnivel INT,
    p_descripcion VARCHAR(100),
    p_capacidad_maxima INT,
    p_paralelo VARCHAR(10)
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO curso (idnivel, descripcion, capacidad_maxima, paralelo)
    VALUES (p_idnivel, p_descripcion, p_capacidad_maxima, p_paralelo);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sp_ActualizarCurso(
    p_idcurso INT,
    p_descripcion VARCHAR(100) DEFAULT NULL,
    p_capacidad_maxima INT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE curso SET
        descripcion = COALESCE(p_descripcion, descripcion),
        capacidad_maxima = COALESCE(p_capacidad_maxima, capacidad_maxima)
    WHERE idcurso = p_idcurso;
END;
$$ LANGUAGE plpgsql;

-- -------------  GESTION -----------------

CREATE OR REPLACE FUNCTION sp_InsertarGestion(
    p_fechaapertura DATE,
    p_fechacierre DATE,
    p_cantidadmen SMALLINT,
    p_descripcion VARCHAR(100) DEFAULT NULL
)
RETURNS INT AS $$
DECLARE
    v_idgestion INT;
BEGIN
    -- Deshabilitar gestiones activas anteriores
    UPDATE gestion SET estado = '0' WHERE estado = '1';

    INSERT INTO gestion (fechaapertura, fechacierre, estado, cantidadmen, descripcion)
    VALUES (p_fechaapertura, p_fechacierre, '1', p_cantidadmen, p_descripcion)
    RETURNING idgestion INTO v_idgestion;

    RETURN v_idgestion;
END;
$$ LANGUAGE plpgsql;

-- -------------  DETALLEGESTION -----------------

CREATE OR REPLACE FUNCTION sp_InsertarDetalleGestion(
    p_idgestion INT,
    p_idnivel INT,
    p_monto NUMERIC(10,4)
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO detallegestion (idgestion, idnivel, monto)
    VALUES (p_idgestion, p_idnivel, p_monto)
    ON CONFLICT (idgestion, idnivel) DO UPDATE SET monto = EXCLUDED.monto;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sp_ActualizarGestion(
    p_idgestion INT,
    p_fechacierre DATE DEFAULT NULL,
    p_descripcion VARCHAR(100) DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE gestion SET
        fechacierre = COALESCE(p_fechacierre, fechacierre),
        descripcion = COALESCE(p_descripcion, descripcion)
    WHERE idgestion = p_idgestion;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sp_CambiarEstadoGestion(
    p_idgestion INT
)
RETURNS VOID AS $$
DECLARE
    v_estado CHAR(1);
    v_activa INT;
BEGIN
    SELECT estado INTO v_estado FROM gestion WHERE idgestion = p_idgestion;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Gestión no encontrada';
    END IF;

    IF v_estado = '1' THEN
        UPDATE gestion SET estado = '0' WHERE idgestion = p_idgestion;
    ELSE
        SELECT COUNT(*) INTO v_activa FROM gestion WHERE estado = '1' AND idgestion <> p_idgestion;
        IF v_activa > 0 THEN
            RAISE EXCEPTION 'Ya existe una gestión activa. Desactívela primero.';
        END IF;
        UPDATE gestion SET estado = '1' WHERE idgestion = p_idgestion;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- -------------  MATRICULACION -----------------

CREATE OR REPLACE FUNCTION sp_InsertarMatriculacion(
    p_ciestudiante VARCHAR(10),
    p_idgestion INT,
    p_idcurso INT,
    p_codbeca INT DEFAULT NULL
)
RETURNS INT AS $$
DECLARE
    v_idmatriculacion INT;
BEGIN
    INSERT INTO matriculacion (ciestudiante, idgestion, idcurso, codbeca, fecharegis, estado)
    VALUES (p_ciestudiante, p_idgestion, p_idcurso, p_codbeca, CURRENT_DATE, 'R')
    RETURNING idmatriculacion INTO v_idmatriculacion;

    RETURN v_idmatriculacion;
END;
$$ LANGUAGE plpgsql;

-- -------------  MENSUALIDAD -----------------

CREATE OR REPLACE FUNCTION sp_InsertarMensualidad(
    p_idmensualidad INT,
    p_nro SMALLINT,
    p_descuento NUMERIC(10,4),
    p_monto NUMERIC(10,4),
    p_totalpagar NUMERIC(10,4),
    p_idmatriculacion INT
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO mensualidad (idmensualidad, descuento, nro, monto, estado, totalpagar, idmatriculacion)
    VALUES (p_idmensualidad, p_descuento, p_nro, p_monto, 'P', p_totalpagar, p_idmatriculacion);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sp_ActualizarMensualidad(
    p_idmensualidad INT,
    p_idmatriculacion INT,
    p_tipopago CHAR(1),
    p_fechapago DATE DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE mensualidad SET
        tipopago = p_tipopago,
        estado = 'C',
        fechapago = COALESCE(p_fechapago, CURRENT_DATE)
    WHERE idmensualidad = p_idmensualidad AND idmatriculacion = p_idmatriculacion;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sp_InsertarMensualidadManual(
    p_idmatriculacion INT,
    p_monto NUMERIC(10,4),
    p_descuento NUMERIC(10,4) DEFAULT 0,
    p_nro SMALLINT DEFAULT NULL
)
RETURNS INT AS $$
DECLARE
    v_idmensualidad INT;
    v_nro SMALLINT;
BEGIN
    SELECT COALESCE(MAX(idmensualidad), 0) + 1 INTO v_idmensualidad
    FROM mensualidad
    WHERE idmatriculacion = p_idmatriculacion;

    IF p_nro IS NULL THEN
        v_nro := v_idmensualidad;
    ELSE
        v_nro := p_nro;
    END IF;

    INSERT INTO mensualidad (idmensualidad, descuento, nro, monto, estado, totalpagar, idmatriculacion)
    VALUES (v_idmensualidad, p_descuento, v_nro, p_monto, 'P', p_monto - p_descuento, p_idmatriculacion);

    RETURN v_idmensualidad;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sp_ActualizarMensualidadMonto(
    p_idmatriculacion INT,
    p_idmensualidad INT,
    p_monto NUMERIC(10,4),
    p_descuento NUMERIC(10,4) DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE mensualidad SET
        monto = p_monto,
        descuento = COALESCE(p_descuento, descuento),
        totalpagar = p_monto - COALESCE(p_descuento, descuento)
    WHERE idmatriculacion = p_idmatriculacion
      AND idmensualidad = p_idmensualidad
      AND estado = 'P';
END;
$$ LANGUAGE plpgsql;

-- -------------  APORTE -----------------
-- El aporte se crea automáticamente al matricular mediante trigger
-- sp_ActualizarAporte solo registra el pago

CREATE OR REPLACE FUNCTION sp_ActualizarAporte(
    p_idaporte INT,
    p_tipopago CHAR(1) DEFAULT NULL,
    p_fechapago DATE DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE aporte SET
        tipopago = p_tipopago,
        estado = 'C',
        fechapago = COALESCE(p_fechapago, CURRENT_DATE)
    WHERE idaporte = p_idaporte;
END;
$$ LANGUAGE plpgsql;

-- -------------  BECA -----------------

CREATE OR REPLACE FUNCTION sp_InsertarBeca(
    p_nombrebeca VARCHAR(100),
    p_porcentaje SMALLINT,
    p_idgestion INT,
    p_tipobeca VARCHAR(50) DEFAULT NULL,
    p_descripcion VARCHAR(200) DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO beca (nombrebeca, tipobeca, porcentaje, descripcion, idgestion)
    VALUES (p_nombrebeca, p_tipobeca, p_porcentaje, p_descripcion, p_idgestion);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sp_ActualizarBeca(
    p_codbeca INT,
    p_nombrebeca VARCHAR(100),
    p_porcentaje SMALLINT,
    p_idgestion INT,
    p_tipobeca VARCHAR(50) DEFAULT NULL,
    p_descripcion VARCHAR(200) DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE beca SET
        nombrebeca = p_nombrebeca,
        tipobeca = p_tipobeca,
        porcentaje = p_porcentaje,
        descripcion = p_descripcion,
        idgestion = p_idgestion
    WHERE codbeca = p_codbeca;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sp_ActualizarBecaMatricula(
    p_idmatriculacion INT,
    p_codbeca INT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_porcentaje SMALLINT;
    v_monto NUMERIC(10,4);
    v_descuento NUMERIC(10,4);
    v_totalpagar NUMERIC(10,4);
    v_idgestion INT;
    v_idnivel INT;
BEGIN
    SELECT m.idgestion, c.idnivel INTO v_idgestion, v_idnivel
    FROM matriculacion m
    JOIN curso c ON c.idcurso = m.idcurso
    WHERE m.idmatriculacion = p_idmatriculacion;

    IF v_idgestion IS NULL THEN
        RAISE EXCEPTION 'Matriculacion no encontrada';
    END IF;

    UPDATE matriculacion SET codbeca = p_codbeca
    WHERE idmatriculacion = p_idmatriculacion;

    SELECT monto INTO v_monto
    FROM detallegestion
    WHERE idgestion = v_idgestion AND idnivel = v_idnivel;

    IF p_codbeca IS NOT NULL THEN
        SELECT porcentaje INTO v_porcentaje FROM beca WHERE codbeca = p_codbeca;
    ELSE
        v_porcentaje := 0;
    END IF;

    IF v_monto IS NOT NULL THEN
        v_descuento := (v_monto * v_porcentaje) / 100;
        v_totalpagar := v_monto - v_descuento;

        UPDATE mensualidad SET
            descuento = v_descuento,
            totalpagar = v_totalpagar,
            tipopago = CASE WHEN v_porcentaje = 100 THEN 'A' ELSE tipopago END,
            estado = CASE WHEN v_porcentaje = 100 THEN 'C' ELSE estado END,
            fechapago = CASE WHEN v_porcentaje = 100 THEN CURRENT_DATE ELSE fechapago END
        WHERE idmatriculacion = p_idmatriculacion AND estado = 'P';
    END IF;
END;
$$ LANGUAGE plpgsql;
