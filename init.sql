-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS wol_app;
USE wol_app;

-- Crear la tabla "credenciales"
CREATE TABLE IF NOT EXISTS credenciales (
    usuario VARCHAR(20) PRIMARY KEY,
    hash VARCHAR(255),
    rol VARCHAR(10)
);

-- Insertar un usuario de prueba
INSERT INTO credenciales (usuario, hash, rol) VALUES ('admin', '12345', 'admin');