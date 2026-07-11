-- ============================================================
-- TRIGGERS (DISPARADORES) - PostgreSQL
-- ============================================================

-- --------------------------------------------------
-- Asignar codigo de estudiante automaticamente
-- --------------------------------------------------
CREATE OR REPLACE FUNCTION trg_estudiante_codigo_func()
RETURNS TRIGGER AS $$
DECLARE
    v_cont INT;
BEGIN
    SELECT COUNT(*) + 1 INTO v_cont FROM estudiante;
    NEW.codestudiante := 'EST' || LPAD(v_cont::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_estudiante_codigo
    BEFORE INSERT ON estudiante
    FOR EACH ROW
    EXECUTE FUNCTION trg_estudiante_codigo_func();

-- --------------------------------------------------
-- Validar tipo de pago en mensualidad
-- --------------------------------------------------
CREATE OR REPLACE FUNCTION trg_mensualidad_validar_tipopago_func()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.tipopago IS NOT NULL AND NEW.tipopago NOT IN ('E', 'Q', 'A') THEN
        RAISE EXCEPTION 'Tipo de pago invalido. Debe ser E (Efectivo), Q (QR) o A (Automatico)';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_mensualidad_validar_tipopago
    BEFORE INSERT OR UPDATE ON mensualidad
    FOR EACH ROW
    EXECUTE FUNCTION trg_mensualidad_validar_tipopago_func();

-- --------------------------------------------------
-- Crear mensualidades automaticamente al matricular
-- --------------------------------------------------
CREATE OR REPLACE FUNCTION trg_matriculacion_crear_mensualidades_func()
RETURNS TRIGGER AS $$
DECLARE
    v_cantidadmeses SMALLINT;
    v_monto NUMERIC(10,4);
    v_idnivel INT;
    v_porcentaje_beca SMALLINT;
    v_descuento NUMERIC(10,4);
    v_totalpagar NUMERIC(10,4);
    v_contador INT;
BEGIN
    -- Obtener cantidad de meses de la gestion
    SELECT cantidadmen INTO v_cantidadmeses
    FROM gestion
    WHERE idgestion = NEW.idgestion;

    -- Obtener nivel del curso
    SELECT idnivel INTO v_idnivel FROM curso WHERE idcurso = NEW.idcurso;

    -- Obtener monto del detalle de gestion
    SELECT monto INTO v_monto
    FROM detallegestion
    WHERE idgestion = NEW.idgestion AND idnivel = v_idnivel;

    -- Verificar si tiene beca
    v_porcentaje_beca := 0;
    IF NEW.codbeca IS NOT NULL THEN
        SELECT porcentaje INTO v_porcentaje_beca
        FROM beca
        WHERE codbeca = NEW.codbeca;
    END IF;

    -- Calcular descuento y total segun la beca
    IF v_porcentaje_beca > 0 THEN
        v_descuento := (v_monto * v_porcentaje_beca) / 100;
        v_totalpagar := v_monto - v_descuento;
    ELSE
        v_descuento := 0;
        v_totalpagar := v_monto;
    END IF;

    -- Si existe monto, crear registros de mensualidad
    IF v_monto IS NOT NULL AND v_cantidadmeses > 0 THEN
        v_contador := 1;

        WHILE v_contador <= v_cantidadmeses LOOP
            INSERT INTO mensualidad (
                idmensualidad, nro, tipopago, descuento, monto,
                estado, totalpagar, fechapago, idmatriculacion
            )
            VALUES (
                v_contador, v_contador, NULL, v_descuento, v_monto,
                'P', v_totalpagar, NULL, NEW.idmatriculacion
            );

            -- Si la beca es 100%, marcar como automatico
            IF v_porcentaje_beca = 100 THEN
                UPDATE mensualidad SET
                    tipopago = 'A',
                    estado = 'C',
                    fechapago = CURRENT_DATE
                WHERE idmatriculacion = NEW.idmatriculacion
                  AND idmensualidad = v_contador;
            END IF;

            v_contador := v_contador + 1;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_matriculacion_crear_mensualidades
    AFTER INSERT ON matriculacion
    FOR EACH ROW
    EXECUTE FUNCTION trg_matriculacion_crear_mensualidades_func();

-- --------------------------------------------------
-- Validar que no se duplique matricula del mismo estudiante en misma gestion
-- Nota: La constraint UNIQUE (ciestudiante, idgestion, idcurso) ya protege contra duplicados
-- --------------------------------------------------
CREATE OR REPLACE FUNCTION trg_matriculacion_no_duplicado_func()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM matriculacion
        WHERE ciestudiante = NEW.ciestudiante
          AND idgestion = NEW.idgestion
    ) THEN
        RAISE EXCEPTION 'El estudiante ya se encuentra matriculado en esta gestion';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_matriculacion_no_duplicado
    BEFORE INSERT ON matriculacion
    FOR EACH ROW
    EXECUTE FUNCTION trg_matriculacion_no_duplicado_func();

-- --------------------------------------------------
-- RN-19: Bloquear modificacion de % beca si hay estudiantes activos
-- --------------------------------------------------
CREATE OR REPLACE FUNCTION trg_beca_no_modificar_porcentaje_func()
RETURNS TRIGGER AS $$
DECLARE
    v_activos INT;
BEGIN
    IF NEW.porcentaje IS DISTINCT FROM OLD.porcentaje THEN
        SELECT COUNT(*) INTO v_activos
        FROM matriculacion
        WHERE codbeca = NEW.codbeca
          AND estado IN ('A', 'R');

        IF v_activos > 0 THEN
            RAISE EXCEPTION 'No se puede modificar el porcentaje de la beca porque hay % estudiante(s) activo(s) utilizando este beneficio en la gestion actual', v_activos;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_beca_no_modificar_porcentaje
    BEFORE UPDATE ON beca
    FOR EACH ROW
    EXECUTE FUNCTION trg_beca_no_modificar_porcentaje_func();

-- --------------------------------------------------
-- Crear aporte automaticamente al matricular
-- NOTA: Este trigger fue eliminado (2026-07-02)
-- Ahora los aportes se generan desde el backend
-- via generarAportesFaltantes() en aporte.service.js
-- Se crean tantos aportes como gestion.cantidadmen
-- Sin descuento para ningun estudiante
-- --------------------------------------------------
-- DROP TRIGGER IF EXISTS trg_matriculacion_crear_aporte ON matriculacion;
-- DROP FUNCTION IF EXISTS trg_matriculacion_crear_aporte_fn();
CREATE OR REPLACE FUNCTION trg_matriculacion_crear_aporte_fn()
RETURNS TRIGGER AS $$
DECLARE
    v_idnivel INT;
    v_montoaporte NUMERIC(10,4);
    v_descuento NUMERIC(10,4) := 0;
    v_totalpagar NUMERIC(10,4);
    v_beca_porcentaje SMALLINT;
BEGIN
    -- Obtener idnivel del curso
    SELECT idnivel INTO v_idnivel FROM curso WHERE idcurso = NEW.idcurso;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Curso no encontrado';
    END IF;

    -- Obtener montoaporte del nivel
    SELECT COALESCE(montoaporte, 0) INTO v_montoaporte
    FROM nivel WHERE idnivel = v_idnivel;

    -- Verificar si hay beca 100%
    IF NEW.codbeca IS NOT NULL THEN
        SELECT porcentaje INTO v_beca_porcentaje
        FROM beca WHERE codbeca = NEW.codbeca;
        IF v_beca_porcentaje = 100 THEN
            v_descuento := v_montoaporte;
        END IF;
    END IF;

    v_totalpagar := v_montoaporte - v_descuento;

    -- Insertar el aporte
    INSERT INTO aporte (nro, tipopago, descuento, monto, estado, totalpagar, fechapago, idmatriculacion)
    VALUES (
        1,
        CASE WHEN v_descuento = v_montoaporte THEN 'A' ELSE NULL END,
        v_descuento,
        v_montoaporte,
        CASE WHEN v_descuento = v_montoaporte THEN 'C' ELSE 'P' END,
        v_totalpagar,
        CASE WHEN v_descuento = v_montoaporte THEN CURRENT_DATE ELSE NULL END,
        NEW.idmatriculacion
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_matriculacion_crear_aporte
    AFTER INSERT ON matriculacion
    FOR EACH ROW
    EXECUTE FUNCTION trg_matriculacion_crear_aporte_fn();
