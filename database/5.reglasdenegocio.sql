-- ============================================================
-- REGLAS DE NEGOCIO - PostgreSQL
-- ============================================================

-- RN: Cambiar contrasena de usuario (Tutor/Admin/Secretaria/Director)
CREATE OR REPLACE FUNCTION sp_CambiarClave(
    p_ci VARCHAR(10),
    p_tabla VARCHAR(20),
    p_claveant VARCHAR(150),
    p_clavenue VARCHAR(150)
)
RETURNS BOOLEAN AS $$
DECLARE
    v_filas INT;
BEGIN
    EXECUTE format(
        'UPDATE %I SET contrasena = $1 WHERE ci = $2 AND contrasena = $3',
        p_tabla
    ) USING p_clavenue, p_ci, p_claveant;

    GET DIAGNOSTICS v_filas = ROW_COUNT;
    RETURN v_filas > 0;
END;
$$ LANGUAGE plpgsql;

-- RN: Verificar orden cronologico de pagos
CREATE OR REPLACE FUNCTION sp_VerificarOrdenPagos(
    p_idmatriculacion INT,
    p_nro SMALLINT
)
RETURNS BOOLEAN AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM mensualidad
        WHERE idmatriculacion = p_idmatriculacion
          AND nro < p_nro
          AND estado = 'P'
    ) THEN
        RETURN FALSE;
    ELSE
        RETURN TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- RN: Verificar cupo disponible en curso (RN-20)
CREATE OR REPLACE FUNCTION sp_VerificarCupoCurso(
    p_idcurso INT,
    p_idgestion INT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_capacidad INT;
    v_matriculados INT;
BEGIN
    SELECT capacidad_maxima INTO v_capacidad FROM curso WHERE idcurso = p_idcurso;

    SELECT COUNT(*) INTO v_matriculados
    FROM matriculacion
    WHERE idcurso = p_idcurso AND idgestion = p_idgestion;

    RETURN v_matriculados < v_capacidad;
END;
$$ LANGUAGE plpgsql;

-- RN: Verificar si estudiante tiene deudas pendientes
CREATE OR REPLACE FUNCTION sp_VerificarDeudasEstudiante(
    p_ciestudiante VARCHAR(10)
)
RETURNS BOOLEAN AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM mensualidad m
        INNER JOIN matriculacion mat ON m.idmatriculacion = mat.idmatriculacion
        WHERE mat.ciestudiante = p_ciestudiante
          AND m.estado = 'P'
    ) THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- RN-10: Verificar que una persona tenga al menos un rol asignado
CREATE OR REPLACE FUNCTION sp_VerificarPersonaTieneRol(
    p_ci VARCHAR(10)
)
RETURNS BOOLEAN AS $$
DECLARE
    v_tiene_rol BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM estudiante WHERE ci = p_ci
        UNION ALL
        SELECT 1 FROM tutor WHERE ci = p_ci
        UNION ALL
        SELECT 1 FROM admin WHERE ci = p_ci
        UNION ALL
        SELECT 1 FROM secretaria WHERE ci = p_ci
        UNION ALL
        SELECT 1 FROM director WHERE ci = p_ci
    ) INTO v_tiene_rol;

    RETURN v_tiene_rol;
END;
$$ LANGUAGE plpgsql;

-- RN-19: Validar que el porcentaje de beca no se modifique si hay estudiantes activos
CREATE OR REPLACE FUNCTION sp_VerificarBecaModificable(
    p_codbeca INT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_activos INT;
BEGIN
    SELECT COUNT(*) INTO v_activos
    FROM matriculacion
    WHERE codbeca = p_codbeca
      AND estado IN ('A', 'R');

    RETURN v_activos = 0;
END;
$$ LANGUAGE plpgsql;

-- RN: Generar codigo de estudiante automaticamente
CREATE OR REPLACE FUNCTION sp_GenerarCodigoEstudiante()
RETURNS VARCHAR(10) AS $$
DECLARE
    v_cont INT;
    v_codigo VARCHAR(10);
BEGIN
    SELECT COUNT(*) + 1 INTO v_cont FROM estudiante;
    v_codigo := 'EST' || LPAD(v_cont::TEXT, 6, '0');
    RETURN v_codigo;
END;
$$ LANGUAGE plpgsql;
