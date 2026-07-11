
-- MAPEO SOBREPUESTA
CREATE TABLE persona (
    ci            VARCHAR(10)  PRIMARY KEY,
    nombre        VARCHAR(100) NOT NULL,
    sexo          VARCHAR(1)   NOT NULL,
    apellido      VARCHAR(100) NOT NULL,
    telefono      VARCHAR(8)   NULL,
    fecharegistro DATE         NOT NULL DEFAULT CURRENT_DATE,
    correo        VARCHAR(50)  NULL,
    estado        CHAR(1)      NOT NULL DEFAULT 'A'
);

CREATE TABLE estudiante (
    ci            VARCHAR(10) PRIMARY KEY,
    codestudiante VARCHAR(10) NOT NULL,
    citutor       VARCHAR(10) NOT NULL,
    idgestion     INT         NOT NULL
);

CREATE TABLE tutor (
    ci         VARCHAR(10) PRIMARY KEY,
    usuario    VARCHAR(50) NOT NULL,
    contrasena VARCHAR(150) NOT NULL CHECK (LENGTH(contrasena) >= 6),
    estado     CHAR(1)     NOT NULL DEFAULT 'A'
);

CREATE TABLE admin (
    ci         VARCHAR(10) PRIMARY KEY,
    usuario    VARCHAR(50) NOT NULL,
    contrasena VARCHAR(150) NOT NULL CHECK (LENGTH(contrasena) >= 6),
    estado     CHAR(1)     NOT NULL DEFAULT 'A'
);

CREATE TABLE secretaria (
    ci         VARCHAR(10) PRIMARY KEY,
    usuario    VARCHAR(50) NOT NULL,
    contrasena VARCHAR(150) NOT NULL CHECK (LENGTH(contrasena) >= 6),
    estado     CHAR(1)     NOT NULL DEFAULT 'A'
);

CREATE TABLE director (
    ci         VARCHAR(10) PRIMARY KEY,
    usuario    VARCHAR(50) NOT NULL,
    contrasena VARCHAR(150) NOT NULL CHECK (LENGTH(contrasena) >= 6),
    estado     CHAR(1)     NOT NULL DEFAULT 'A'
);

CREATE TABLE nivel (
    idnivel      SERIAL        PRIMARY KEY,
    nombre       VARCHAR(50)   NOT NULL,
    montomes     NUMERIC(10,4) NOT NULL,
    montototal   NUMERIC(10,4) NOT NULL,
    montoaporte  NUMERIC(10,4) NOT NULL DEFAULT 0
);

CREATE TABLE curso (
    idcurso          SERIAL      PRIMARY KEY,
    descripcion      VARCHAR(50) NOT NULL,
    idnivel          INT         NOT NULL,
    capacidad_maxima INT         NOT NULL,
    paralelo         VARCHAR(10) NOT NULL
);

CREATE TABLE beca (
    codbeca     SERIAL        PRIMARY KEY,
    nombrebeca  VARCHAR(50)   NOT NULL,
    tipobeca    VARCHAR(50)   NULL,
    porcentaje  SMALLINT      NOT NULL,
    descripcion VARCHAR(200)  NULL,
    idgestion   INT           NOT NULL
);

CREATE TABLE gestion (
    idgestion     SERIAL       PRIMARY KEY,
    fechaapertura DATE         NOT NULL,
    fechacierre   DATE         NOT NULL,
    estado        CHAR(1)      NOT NULL DEFAULT '1',
    cantidadmen   SMALLINT     NOT NULL,
    descripcion   VARCHAR(100) NULL
);

CREATE TABLE detallegestion (
    iddetallegestion SERIAL        PRIMARY KEY,
    idgestion        INT           NOT NULL,
    idnivel          INT           NOT NULL,
    monto            NUMERIC(10,4) NOT NULL
);

CREATE TABLE matriculacion (
    idmatriculacion SERIAL      PRIMARY KEY,
    ciestudiante    VARCHAR(10) NOT NULL,
    codbeca         INT         NULL,
    idgestion       INT         NOT NULL,
    idcurso         INT         NOT NULL,
    fecharegis      DATE        NOT NULL DEFAULT CURRENT_DATE,
    estado          CHAR(1)     NOT NULL DEFAULT 'R'
);

CREATE TABLE mensualidad (
    idmensualidad   INT           NOT NULL,
    descuento       NUMERIC(10,4) NOT NULL DEFAULT 0,
    nro             SMALLINT      NOT NULL,
    tipopago        CHAR(1)       NULL,
    monto           NUMERIC(10,4) NOT NULL,
    estado          CHAR(1)       NOT NULL,
    totalpagar      NUMERIC(10,4) NOT NULL,
    fechapago       DATE          NULL,
    idmatriculacion INT           NOT NULL,
    PRIMARY KEY (idmatriculacion, idmensualidad)
);

CREATE TABLE aporte (
    idaporte        SERIAL        PRIMARY KEY,
    nro             SMALLINT      NOT NULL,
    tipopago        CHAR(1)       NULL,
    descuento       NUMERIC(10,4) NOT NULL DEFAULT 0,
    monto           NUMERIC(10,4) NOT NULL,
    estado          CHAR(1)       NOT NULL,
    totalpagar      NUMERIC(10,4) NOT NULL,
    fechapago       DATE          NULL,
    idmatriculacion INT           NOT NULL
);

-- SE APLICA MAPEO DISJUNTO: UNA MENSUALIDAD NO PUEDE SER UN APORTE