-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS wol_app;
USE wol_app;

-- Crear la tabla credenciales
CREATE TABLE credenciales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(255) DEFAULT 'user'
);

-- Crear la taba equipos
CREATE TABLE equipos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(255),
    ip VARCHAR(15) NOT NULL,
    FOREIGN KEY (usuario) REFERENCES credenciales(id)
);

-- Crear la taba timeuse para medir el tiempo de conexión
CREATE TABLE timeuse (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    hora_inicio DATETIME NOT NULL,
    hora_fin DATETIME,
    FOREIGN KEY (usuario_id) REFERENCES credenciales(id)
);

-- Insertar un usuario admin con contraseña estandar que se debe cambiar
INSERT INTO credenciales (usuario, password, rol) VALUES ('admin', '$2a$10$qCHw3VatSAJaPZYE8CG6gO/qwXo9haEH5elJ2O0YJkWZ.CGZmGjvq', 'admin');