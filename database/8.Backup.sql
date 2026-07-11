-- ============================================================
-- BACKUP - PostgreSQL
-- Respaldo de la base de datos COLEGIO
-- ============================================================

-- Tabla de registro de backups
CREATE TABLE IF NOT EXISTS backup_log (
    id              SERIAL PRIMARY KEY,
    database_name   VARCHAR(100) NOT NULL DEFAULT 'COLEGIO',
    backup_type     VARCHAR(20)  NOT NULL,
    backup_path     TEXT         NOT NULL,
    backup_size     BIGINT       NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'PENDIENTE',
    error_message   TEXT         NULL,
    started_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    finished_at     TIMESTAMP    NULL
);

-- Funcion para registrar inicio de backup
CREATE OR REPLACE FUNCTION sp_registrar_inicio_backup(
    p_tipo VARCHAR(20),
    p_ruta TEXT
)
RETURNS INT AS $$
DECLARE
    v_id INT;
BEGIN
    INSERT INTO backup_log (backup_type, backup_path, status, started_at)
    VALUES (p_tipo, p_ruta, 'EN_PROGRESO', NOW())
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Funcion para registrar finalizacion de backup exitoso
CREATE OR REPLACE FUNCTION sp_registrar_backup_exitoso(
    p_id INT,
    p_size BIGINT
)
RETURNS VOID AS $$
BEGIN
    UPDATE backup_log SET
        status = 'COMPLETADO',
        backup_size = p_size,
        finished_at = NOW()
    WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

-- Funcion para registrar error de backup
CREATE OR REPLACE FUNCTION sp_registrar_backup_error(
    p_id INT,
    p_error TEXT
)
RETURNS VOID AS $$
BEGIN
    UPDATE backup_log SET
        status = 'ERROR',
        error_message = p_error,
        finished_at = NOW()
    WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

-- Funcion para limpiar registros antiguos
CREATE OR REPLACE FUNCTION sp_limpiar_backups_antiguos(
    p_dias_retener INT DEFAULT 30
)
RETURNS INT AS $$
DECLARE
    v_eliminados INT;
BEGIN
    DELETE FROM backup_log
    WHERE started_at < NOW() - (p_dias_retener || ' days')::INTERVAL;

    GET DIAGNOSTICS v_eliminados = ROW_COUNT;
    RETURN v_eliminados;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- INSTRUCCIONES PARA REALIZAR BACKUP DESDE CONSOLA:
-- ============================================================
-- Backup completo:
--   pg_dump -h localhost -U postgres -d COLEGIO -F c -f /ruta/backups/COLEGIO_COMPLETO_$(date +%%Y%%m%%d_%%H%%M%%S).backup
--
-- Backup en formato SQL:
--   pg_dump -h localhost -U postgres -d COLEGIO -F p -f /ruta/backups/COLEGIO_$(date +%%Y%%m%%d_%%H%%M%%S).sql
--
-- Restaurar backup:
--   pg_restore -h localhost -U postgres -d COLEGIO -c /ruta/al/backup.backup
--
-- Programar backup diario (crontab):
--   0 2 * * * pg_dump -h localhost -U postgres -d COLEGIO -F c -f /ruta/backups/COLEGIO_$(date +%%Y%%m%%d).backup
-- ============================================================
