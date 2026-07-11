-- ============================================================
-- INSERCION DE DATOS INICIALES - PostgreSQL
-- ============================================================

-- 1. PERSONA (tabla base)

INSERT INTO persona (ci, nombre, apellido, sexo, telefono, fecharegistro, correo, estado)
VALUES
    ('10000001', 'Carlos',   'Mamani Quispe',     'M', '71234567', '2026-01-10', 'carlos.mamani@escuelacristiana.edu.bo', 'A'),
    ('10000002', 'Laura',    'Flores Gutierrez',  'F', '76543210', '2026-01-10', 'laura.flores@escuelacristiana.edu.bo', 'A'),
    ('10000003', 'Roberto',  'Vargas Condori',    'M', '79876543', '2026-01-10', 'roberto.vargas@escuelacristiana.edu.bo', 'A'),
    ('10000004', 'Sofia',    'Ramos Alanoca',     'F', '75678901', '2026-01-10', 'sofia.ramos@escuelacristiana.edu.bo', 'A'),
    ('10000005', 'Maria',    'Quispe Huanca',     'F', '72345678', '2026-01-10', 'maria.quispe@escuelacristiana.edu.bo', 'A'),
    ('10000006', 'Jorge',    'Salinas Perez',     'M', '78901234', '2026-01-10', 'jorge.salinas@escuelacristiana.edu.bo', 'A'),
    ('10000007', 'Ana',      'Torres Blanco',     'F', '77654321', '2026-01-10', 'ana.torres@escuelacristiana.edu.bo', 'A'),
    ('10000008', 'Pedro',    'Choque Limachi',    'M', '76789012', '2026-01-10', 'pedro.choque@escuelacristiana.edu.bo', 'A'),
    ('10000009', 'Luis',     'Apaza Calle',       'M', '74567890', '2026-01-10', 'luis.apaza@escuelacristiana.edu.bo', 'A'),
    ('10000010', 'Patricia', 'Mendoza Cruz',      'F', '73456789', '2026-01-10', 'patricia.mendoza@escuelacristiana.edu.bo', 'A'),
    ('10000011', 'Erika',    'Chumacero Salazar', 'F', '62820956', '2026-01-10', 'erika.chuma@escuelacristiana.edu.bo', 'A');


-- 2. TUTOR (debe ir antes que estudiante por FK)

INSERT INTO tutor (ci, usuario, contrasena, estado)
VALUES
    ('10000005', 'tutor.maria',    'pass1234', 'A'),
    ('10000006', 'tutor.jorge',    'pass1234', 'A'),
    ('10000007', 'tutor.ana',      'pass1234', 'A');


-- 3. ADMIN

INSERT INTO admin (ci, usuario, contrasena, estado)
VALUES
    ('10000008', 'admin.pedro', 'admin2025', 'A');


-- 4. SECRETARIA

INSERT INTO secretaria (ci, usuario, contrasena, estado)
VALUES
    ('10000009', 'secret.luis',  'user1234', 'A'),
    ('10000010', 'secret.patri', 'user1234', 'A');


-- 5. DIRECTOR

INSERT INTO director (ci, usuario, contrasena, estado)
VALUES
    ('10000011', 'director.erika', 'dir2025', 'A');


-- 6. NIVEL

INSERT INTO nivel (nombre, montomes, montototal)
VALUES
    ('INICIAL',   350.00, 350.00),
    ('PRIMARIO',  480.00, 480.00),
    ('SECUNDARIO', 550.00, 550.00);


-- 7. CURSO (depende de nivel)

INSERT INTO curso (idnivel, descripcion, capacidad_maxima, paralelo)
VALUES
    (1, 'Kinder',   30, 'A'),
    (2, '1ro A',    30, 'A'),
    (2, '2do A',    30, 'A'),
    (2, '3ro A',    30, 'A'),
    (2, '4to A',    30, 'A'),
    (2, '5to A',    30, 'A'),
    (2, '6to A',    30, 'A'),
    (3, '1ro A',    30, 'A'),
    (3, '2do A',    30, 'A'),
    (3, '3ro A',    30, 'A'),
    (3, '4to A',    30, 'A'),
    (3, '5to A',    30, 'A');


-- 8. GESTION (debe ir antes de estudiante, beca y matriculacion)

INSERT INTO gestion (fechaapertura, fechacierre, estado, cantidadmen, descripcion)
VALUES
    ('2025-02-01', '2025-11-30', '1', 8, 'Gestion 2025 - Escuela Cristiana Camirena');


-- 9. DETALLEGESTION (depende de gestion y nivel)

INSERT INTO detallegestion (idgestion, idnivel, monto)
VALUES
    (1, 1, 350.00),
    (1, 2, 480.00),
    (1, 3, 550.00);


-- 10. BECA (depende de gestion)

INSERT INTO beca (nombrebeca, tipobeca, porcentaje, descripcion, idgestion)
VALUES
    ('Beca Excelencia',     'Academica', 100, 'Descuento total por excelencia academica', 1),
    ('Beca Tercer Hermano', 'Familiar',  100, 'Descuento total por tercer hermano',        1),
    ('Beca Parcial',        'Academica',  50, 'Descuento del 50% en mensualidad',           1);


-- 11. ESTUDIANTE (depende de persona, tutor y gestion)

INSERT INTO estudiante (ci, codestudiante, citutor, idgestion)
VALUES
    ('10000001', 'EST000001', '10000005', 1),
    ('10000002', 'EST000002', '10000005', 1),
    ('10000003', 'EST000003', '10000006', 1),
    ('10000004', 'EST000004', '10000007', 1);


-- 12. MATRICULACION (depende de estudiante, beca, gestion, curso)
-- El trigger generará las mensualidades automáticamente

INSERT INTO matriculacion (ciestudiante, codbeca, idgestion, idcurso, fecharegis, estado)
VALUES
    ('10000001', NULL, 1, 1, '2025-01-15', 'A'),
    ('10000002', 1,    1, 2, '2025-01-15', 'A'),
    ('10000003', 2,    1, 3, '2025-01-15', 'A'),
    ('10000004', NULL, 1, 4, '2025-01-15', 'R');


-- 13. MENSUALIDAD (depende de matriculacion)
-- Se insertan manualmente si el trigger no está activo aún
-- 8 cuotas por cada matricula

INSERT INTO mensualidad (idmensualidad, descuento, nro, tipopago, monto, estado, totalpagar, fechapago, idmatriculacion)
VALUES
-- Matricula 1 - sin beca - monto nivel inicial 350.00
    (1, 0.00, 1, NULL, 350.00, 'P', 350.00, NULL, 1),
    (2, 0.00, 2, NULL, 350.00, 'P', 350.00, NULL, 1),
    (3, 0.00, 3, NULL, 350.00, 'P', 350.00, NULL, 1),
    (4, 0.00, 4, NULL, 350.00, 'P', 350.00, NULL, 1),
    (5, 0.00, 5, NULL, 350.00, 'P', 350.00, NULL, 1),
    (6, 0.00, 6, NULL, 350.00, 'P', 350.00, NULL, 1),
    (7, 0.00, 7, NULL, 350.00, 'P', 350.00, NULL, 1),
    (8, 0.00, 8, NULL, 350.00, 'P', 350.00, NULL, 1),
-- Matricula 2 - beca excelencia 100% - monto nivel primario 480.00
    (1, 480.00, 1, 'A', 480.00, 'C', 0.00, '2026-02-01', 2),
    (2, 480.00, 2, 'A', 480.00, 'C', 0.00, '2026-02-01', 2),
    (3, 480.00, 3, 'A', 480.00, 'C', 0.00, '2026-02-01', 2),
    (4, 480.00, 4, 'A', 480.00, 'C', 0.00, '2026-02-01', 2),
    (5, 480.00, 5, 'A', 480.00, 'C', 0.00, '2026-02-01', 2),
    (6, 480.00, 6, 'A', 480.00, 'C', 0.00, '2026-02-01', 2),
    (7, 480.00, 7, 'A', 480.00, 'C', 0.00, '2026-02-01', 2),
    (8, 480.00, 8, 'A', 480.00, 'C', 0.00, '2026-02-01', 2),
-- Matricula 3 - beca tercer hermano 100% - monto nivel primario 480.00
    (1, 480.00, 1, 'A', 480.00, 'C', 0.00, '2026-02-01', 3),
    (2, 480.00, 2, 'A', 480.00, 'C', 0.00, '2026-02-01', 3),
    (3, 480.00, 3, 'A', 480.00, 'C', 0.00, '2026-02-01', 3),
    (4, 480.00, 4, 'A', 480.00, 'C', 0.00, '2026-02-01', 3),
    (5, 480.00, 5, 'A', 480.00, 'C', 0.00, '2026-02-01', 3),
    (6, 480.00, 6, 'A', 480.00, 'C', 0.00, '2026-02-01', 3),
    (7, 480.00, 7, 'A', 480.00, 'C', 0.00, '2026-02-01', 3),
    (8, 480.00, 8, 'A', 480.00, 'C', 0.00, '2026-02-01', 3);


-- 14. APORTE (depende de matriculacion)
-- Mapeo disjunto: una mensualidad NO puede ser un aporte

INSERT INTO aporte (nro, tipopago, descuento, monto, estado, totalpagar, fechapago, idmatriculacion, nombre, descripcion, idgestion)
VALUES
    (1, 'E', 0.00, 350.00, 'C', 350.00, '2025-02-05', 1, 'Cuota Inicial', 'Cuota unica de ingreso anual', 1),
    (2, 'Q', 0.00, 350.00, 'C', 350.00, '2025-03-05', 1, 'Material Didactico', 'Aporte para materiales educativos', 1);