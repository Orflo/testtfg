const wol = require('wol');
const path = require('path');
const bodyParser = require('body-parser')
const mysql = require('mysql2')
const bcrypt = require('bcrypt');
const saltRounds = 10; // Número de rondas de salting
const express = require('express');
const { exec } = require('child_process');
const { config } = require('dotenv');
config();

//Conexión a la base de datos
const mysqlPool = mysql.createPool({
    host: process.env.MYSQLDB_HOST,
    user: process.env.MYSQLDB_USER,
    password: process.env.MYSQLDB_PASSWORD,
    database: process.env.MYSQLDB_DATABASE,
    port: process.env.MYSQLDB_DOCKER_PORT
});
function connectToDatabase() {
    mysqlPool.getConnection((err, connection) => {
        if (err) {
            console.log('¡Conexión fallida!' + JSON.stringify(err, undefined, 2));
            setTimeout(connectToDatabase, 5000);
        } else {
            console.log('Conexión con la base de datos establecida.');
            startServer();
            connection.release();
        }
    });
}

const app = express();
    app.use (bodyParser.json());
    app.use (bodyParser.urlencoded({extended: true}));
    app.use(express.static(path.join(__dirname, 'App_web', 'Login')));

// SERVIDOR CON EXPRESS
function startServer() {
    const PORT = process.env.NODE_DOCKER_PORT
    app.listen(PORT, () => {
        console.log(`Servidor iniciado en el puerto ${PORT}`)
    });
}
connectToDatabase();

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'App_web','Login', 'form.html'));
});

// EJECUTAR SCRIPT DE POWERSHELL PARA WAKE ON LAN
// Ruta para ejecutar el script PowerShell
app.get('/wake', (req, res) => {
    const ipAddress = req.query.ip;

    if (!ipAddress) {
        return res.status(400).send('Dirección IP no proporcionada en los parámetros de la consulta.');
    }

    const scriptPath = path.join(__dirname, 'wol.ps1');
    const command = `powershell -File ${scriptPath} ${ipAddress}`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error al ejecutar el script: ${error}`);
            res.status(500).send(`Error al enviar la señal WOL a ${ipAddress}`);
        } else {
            console.log(`Señal WOL enviada con éxito a ${ipAddress}`);
            res.status(200).send(`Señal WOL enviada con éxito a ${ipAddress}`);
            console.log('¡El equipo se encenderá en unos minutos!');
            console.log('El script está funcionando correctamente');
        }
    });
});

// LOGIN PRINCIPAL DE USUARIOS
app.get('/ejecutar-script/:nombreOrdenador', function (req, res) {
    const nombreOrdenador = req.params.nombreOrdenador;
    const comandoPowerShell = `powershell.exe -File ./UserWeb/wol.ps1 -Ordenador ${nombreOrdenador}`;

    exec(comandoPowerShell, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error al ejecutar el script PowerShell para ${nombreOrdenador}: ${error.message}`);
            res.status(500).send(`Error al ejecutar el script PowerShell para ${nombreOrdenador}`);
            return;
        }
        
        console.log(`Script PowerShell para ${nombreOrdenador} ejecutado correctamente: ${stdout}`);
        res.status(200).send(`Script PowerShell para ${nombreOrdenador} ejecutado correctamente`);
    });
});

// Configuración para servir archivos estáticos desde el directorio actual
app.use(express.static(__dirname));

//  Inicio de sesión:
app.post('/iniciarsesion', (req, res) => {
    const usuario = req.body.usuario;
    const password = req.body.password;

    mysqlPool.getConnection((err, connection) => {
        if (err) {
            console.log('Error al obtener la conexión de la pool: ' + err);
            res.status(500).send("Error en el inicio de sesión");
            return;
        }

        const sql = 'SELECT * FROM credenciales WHERE usuario = ?';
        connection.query(sql, [usuario], (err, rows) => {
            connection.release();
            if (!err) {
                if (rows.length > 0) {
                    const hashedPasswordFromDB = rows[0].hash;
                    const userRole = rows[0].role; // Supongamos que hay un campo 'role' en la tabla de credenciales

                    if (usuario === 'admin') {
                        // Lógica para el inicio de sesión del administrador
                        res.redirect('/App_Web/AdminWeb/main.html');
                    } else {
                        // Verificación de la contraseña para roles diferentes a 'admin'
                        bcrypt.compare(password, hashedPasswordFromDB, (compareErr, result) => {
                            if (compareErr) {
                                console.log("Error al comparar contraseñas: " + compareErr);
                                res.status(500).send("Error en el inicio de sesión");
                            } else {
                                if (result) {
                                    // Acciones para otros roles o cualquier lógica adicional
                                    res.sendFile(path.join(__dirname, 'App_web', 'UserWeb', 'index.html'));
                                    app.use(express.static(path.join(__dirname, 'App_web', 'UserWeb')));
                                    const filePath = path.join(__dirname, 'UserWeb', 'wol.ps1');
                                } else {
                                    console.log("Contraseña incorrecta");
                                    res.status(401).send("No se ha podido autenticar el usuario - Contraseña incorrecta");
                                }
                            }
                        });
                    }
                } else {
                    console.log("Usuario no encontrado");
                    res.status(401).send("No se ha podido autenticar el usuario - Usuario no encontrado");
                }
            } else {
                console.log("Error en el inicio de sesión: " + err);
                res.status(500).send("Error en el inicio de sesión");
            }
        });
    });
});

// Función para hashear la contraseña antes de almacenarla
app.get('/cambiarcontrasena', (req, res) => {
    res.sendFile(path.join(__dirname, 'App_web','Change', 'changepasswd.html'));
});

app.post('/cambiarcontrasena', (req, res) => {
    const usuario = req.body.usuario;
    const nuevaContraseña = req.body.nuevaContraseña;

    mysqlPool.getConnection((err, connection) => {
        if (err) {
            console.log('Error al obtener la conexión de la pool: ' + err);
            res.status(500).send("Error al cambiar la contraseña");
            return;
        }

        bcrypt.hash(nuevaContraseña, saltRounds, (hashErr, nuevoHash) => {
            if (hashErr) {
                console.log("Error al hashear la nueva contraseña: " + hashErr);
                res.status(500).send("Error al cambiar la contraseña");
            } else {
                const updateSql = 'UPDATE credenciales SET hash = ? WHERE usuario = ?';
                connection.query(updateSql, [nuevoHash, usuario], (updateErr) => {
                    connection.release();
                    if (updateErr) {
                        console.log("Error al actualizar la contraseña: " + updateErr);
                        res.status(500).send("Error al cambiar la contraseña");
                    } else {
                        console.log("Contraseña cambiada exitosamente");
                        res.status(200).send("Contraseña cambiada exitosamente");
                        res.sendFile(path.join(__dirname + '/App_web','/Login','/form.html'))
                    }
                });
            }
        });
    });
});

// Creación de usuarios y añadido automatico a la BBDD:
app.get('/crearusuario', function (req, res) {
    res.sendFile(path.join(__dirname, 'App_web','Create', 'index.html'));
});

app.post('/crearusuario', async (req, res) => {
    const usuario = req.body.nombre;
    const contraseña = req.body.password;

    // Hasheo de la contraseña antes de almacenarla
    const hashedPassword = await hashPassword(contraseña);

    const sql = 'INSERT INTO credenciales (usuario, hash) VALUES (?, ?)';
    connection.query(sql, [usuario, hashedPassword], (err, result) => {
        connection.release();
        if (!err) {
            console.log("Usuario creado con éxito");
            res.send("Usuario creado con éxito");
        } else {
            console.log("Error al crear usuario: " + err);
            res.status(500).send("Error al crear usuario");
        }
    });
});

const hashPassword = (hash) => {
    return new Promise((resolve, reject) => {
        bcrypt.hash(hash, saltRounds, (err, hash) => {
            if (err) {
                console.log("Error al hashear la contraseña: " + err);
                reject(err);
            } else {
                resolve(hash);
            }
        });
    });
};