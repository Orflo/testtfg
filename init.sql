-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS wol_app;
USE wol_app;

-- Crear la tabla "credenciales"
CREATE TABLE IF NOT EXISTS credenciales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario VARCHAR(20) NOT NULL,
    hash VARCHAR(255) NOT NULL,
    role VARCHAR(10) NOT NULL DEFAULT "user"
);

-- Insertar un usuario de prueba
INSERT INTO credenciales (usuario, hash, role) VALUES ('admin', '12345', 'admin');