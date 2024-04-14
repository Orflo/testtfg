const wol = require('wol');
const path = require('path');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const saltRounds = 10; // Número de rondas de salting
const { exec } = require('child_process');
const session = require('express-session');

// SERVIDOR CON EXPRESS
const express = require('express');
const app = express();
const PORT = 3000;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.listen(PORT, () => {
    console.log(`Servidor iniciado en el puerto ${PORT}`);
});

//Session configuration
app.use(session({
    secret: '2C44-4D44-WppQ38S',
    resave: false,
    saveUninitialized: true
  }));

// Middleware para la autenticación
const auth = function(req, res, next) {
    if (req.session && req.session.user && req.session.admin)
        return next();
    else
        return res.sendStatus(401);
};

// Conexión a base de datos:
const mysqlConnection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'wol_app',
    multipleStatements: true
});

mysqlConnection.connect((err) => {
    if (!err)
        console.log('Conexión con la base de datos correcta...');
    else
        console.log('¡Conexión fallida!' + JSON.stringify(err, undefined, 2));
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

// Ruta principal
app.get('/iniciarsesion', (req, res) => {
    res.sendFile(path.join(__dirname, 'App_web', 'Login', 'form.html'));
});

// Ruta de administración
app.get('/administracion', auth, function (req, res){
    res.sendFile(path.join(__dirname, 'App_web', 'AdminWeb', 'main.html'));
});

// Ruta de usuarios
app.get('/userpanel', auth, function (req, res) {
    res.sendFile(path.join(__dirname, 'App_web', 'UserWeb', 'index.html'));
});

// Configuración para servir archivos estáticos desde el directorio actual
app.use(express.static(path.join(__dirname, 'App_web', 'AdminWeb')));

// Ruta para ejecutar el script de PowerShell para Wake on LAN
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

// Ruta para ejecutar el script de PowerShell para Wake on LAN
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

// Login endpoint
app.post('/iniciarsesion', function (req, res) {
    const usuario = req.body.usuario;
    const password = req.body.password;

    const sql = 'SELECT * FROM credenciales WHERE usuario = ?';
    mysqlConnection.query(sql, [usuario], (err, rows) => {
        if (!err) {
            if (rows.length > 0) {
                const hashedPasswordFromDB = rows[0].hash;
                const userRole = rows[0].rol;

                bcrypt.compare(password, hashedPasswordFromDB, (compareErr, result) => {
                    if (compareErr) {
                        console.log("Error al comparar contraseñas: " + compareErr);
                        res.status(500).send("Error en el inicio de sesión");
                    } else {
                        if (result) {
                            req.session.user = usuario;
                            req.session.admin = (userRole === 'admin');
                            res.redirect('/administracion');
                        } else {
                            console.log("Contraseña incorrecta");
                            res.status(401).send("No se ha podido autenticar el usuario - Contraseña incorrecta");
                        }
                    }
                });
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

// Logout endpoint
app.get('/logout', function (req, res) {
      req.session.destroy();
      res.redirect('/iniciarsesion');
});

// Ruta para modificar la información del usuario
app.get('/modificarinfo', (req, res) => {
    res.sendFile(path.join(__dirname, 'App_web', 'AdminWeb', 'main.html'));
});

app.post('/modificarinfo', async (req, res) => {
    const usuario = req.body.usuario;
    const nuevaContraseña = req.body.nuevaContraseña;

    // Verificar si el usuario existe
    const checkUserSql = 'SELECT COUNT(*) as count FROM credenciales WHERE usuario = ?';

    mysqlConnection.query(checkUserSql, [usuario], async (checkErr, checkResult) => {
        if (!checkErr) {
            const userCount = checkResult[0].count;

            if (userCount === 0) {
                // El usuario no existe, enviar mensaje de error
                console.log("Error al cambiar la contraseña");
                res.status(500).send(`
                    <script>
                        alert('ERROR: ¡El usuario no existe!');
                        window.history.back();
                    </script>
                `);
            }

            // El usuario existe, proceder con el cambio de contraseña
            bcrypt.hash(nuevaContraseña, saltRounds, (hashErr, nuevoHash) => {
                if (hashErr) {
                    console.log("Error al hashear la nueva contraseña: " + hashErr);
                    res.status(500).send("Error al cambiar la contraseña");
                } else {
                    const updateSql = 'UPDATE credenciales SET hash = ? WHERE usuario = ?';
                    mysqlConnection.query(updateSql, [nuevoHash, usuario], (updateErr) => {
                        if (updateErr) {
                            console.log("Error al actualizar la contraseña: " + updateErr);
                            res.status(500).send("Error al cambiar la contraseña");
                        } else {
                            // Contraseña cambiada exitosamente, enviar respuesta al cliente
                            console.log("Exito al cambiar la contraseña");
                            res.status(500).send(`
                                <script>
                                    alert('¡La contraseña se ha cambiado con exito!');
                                    window.history.back();
                                </script>
                            `);
                        }
                    });
                }
            });
        } else {
            console.log("Error al verificar usuario: " + checkErr);
            res.status(500).send("Error al verificar usuario");
        }
    });
});

// Ruta para cambiar la IP del usuario
app.get('/cambiarip', (req, res) => {
    res.sendFile(path.join(__dirname, 'App_web', 'AdminWeb', 'main.html'));
});

app.post('/cambiarip', async (req, res) => {
    const usuario = req.body.usuario;
    const nuevaIP = req.body.nuevaIP;

    // Verificar si el usuario existe
    const checkUserSql = 'SELECT COUNT(*) as count FROM credenciales WHERE usuario = ?';

    mysqlConnection.query(checkUserSql, [usuario], async (checkErr, checkResult) => {
        if (!checkErr) {
            const userCount = checkResult[0].count;

            if (userCount === 0) {
                // El usuario no existe, enviar mensaje de error
                console.log("Error al cambiar la IP");
                res.status(500).send(`
                    <script>
                        alert('ERROR: ¡El usuario no existe!');
                        window.history.back();
                    </script>
                `);
            } else {
                // El usuario existe, proceder a cambiar la IP
                const updateSql = 'UPDATE credenciales SET ip = ? WHERE usuario = ?';
                mysqlConnection.query(updateSql, [nuevaIP, usuario], (updateErr) => {
                    if (updateErr) {
                        console.log("Error al actualizar la IP: " + updateErr);
                        res.status(500).send("Error al cambiar la IP");
                    } else {
                        // IP cambiada exitosamente, enviar respuesta al cliente
                        console.log("Éxito al cambiar la IP");
                        res.status(500).send(`
                            <script>
                                alert('¡La IP se ha cambiado con éxito!');
                                window.history.back();
                            </script>
                        `);
                    }
                });
            }
        } else {
            console.log("Error al verificar usuario: " + checkErr);
            res.status(500).send("Error al verificar usuario");
        }
    });
});

// Creación de usuarios y añadido automático a la BBDD:
app.get('/crearusuario', function (req, res) {
    res.sendFile(path.join(__dirname, 'App_web', 'Create', 'index.html'));
});

app.post('/crearusuario', async (req, res) => {
    const usuario = req.body.nombre;
    const contraseña = req.body.password;
    const ip = req.body.ip;

    // Hasheo de la contraseña antes de almacenarla
    const hashedPassword = await hashPassword(contraseña);

    // Verificar si el usuario ya existe
    const checkUserSql = 'SELECT COUNT(*) as count FROM credenciales WHERE usuario = ?';

    mysqlConnection.query(checkUserSql, [usuario], async (checkErr, checkResult) => {
        if (!checkErr) {
            const userCount = checkResult[0].count;

            if (userCount > 0) {
                // El usuario ya existe, enviar mensaje de error
                console.log("El nombre de usuario ya existe");
                res.status(400).send(`
                    <script>
                        alert('El nombre de usuario ya existe');
                        window.history.back();
                    </script>
                `);
            } else {
                // El usuario no existe, proceder con la inserción
                const insertSql = 'INSERT INTO credenciales (usuario, hash, ip) VALUES (?, ?, ?)';
                mysqlConnection.query(insertSql, [usuario, hashedPassword, ip], (insertErr, insertResult) => {
                    if (!insertErr) {
                        console.log("Usuario creado con éxito");
                        res.status(500).send(`
                            <script>
                                alert('¡El usuario se ha creado con ÉXITO!');
                                window.history.back();
                            </script>
                        `);
                    } else {
                        console.log("Error al crear usuario: " + insertErr);
                        res.status(500).send(`
                            <script>
                                alert('¡Error al crear usuario! ${insertErr}');
                                window.history.back();
                            </script>
                        `);
                    }
                });
            }
        } else {
            console.log("Error al verificar usuario: " + checkErr);
            res.status(500).send(`
                <script>
                    alert('Error al verificar usuario: ${checkErr}');
                    window.history.back();
                </script>
            `);
        }
    });
});

// Visualizar los usuarios de la BD en la web para manejarlos más fácilmente:
app.get('/allusers', (req, res) => {
    res.sendFile(path.join(__dirname, 'App_web', 'AdminWeb', 'main.html'));
});

app.get('/obtener-datos', (req, res) => {
    const sql = 'SELECT * from credenciales;'
    mysqlConnection.query(sql, (err, result) => {
        if (err) {
            console.error('Error al obtener los datos de la BD: ', err);
            return res.status(500).send('Error al obtener datos de la BD');
        }
        console.log('Datos obtenidos correctamente.');
        res.json(result);
    });
});

// Eliminar usuarios a través de botón en la web:
app.delete('/eliminar-usuario/:id', (req, res) => {
    const userId = req.params.id;

    // Query SQL para eliminar el usuario de la base de datos
    const deleteSql = 'DELETE FROM credenciales WHERE id = ?';

    mysqlConnection.query(deleteSql, [userId], (err, result) => {
        if (!err) {
            if (result.affectedRows > 0) {
                // Usuario eliminado exitosamente
                console.log(`Usuario con ID ${userId} eliminado correctamente.`);
                res.sendStatus(200); // OK
            } else {
                // No se encontró ningún usuario con el ID especificado
                console.log(`No se encontró ningún usuario con ID ${userId}.`);
                res.sendStatus(404); // Not Found
            }
        } else {
            // Ocurrió un error al ejecutar la consulta SQL
            console.error('Error al eliminar el usuario:', err);
            res.sendStatus(500); // Internal Server Error
        }
    });
});

// Lógica para buscar usuarios y filtro:
app.get('/buscar-usuario/:nombre', (req, res) => {
    const nombre = req.params.nombre;
    const sql = 'SELECT * FROM credenciales WHERE usuario LIKE ?';
    const searchTerm = `%${nombre}%`; // Añadir comodines para buscar coincidencias parciales

    mysqlConnection.query(sql, [searchTerm], (err, result) => {
        if (err) {
            console.error('Error al buscar usuarios:', err);
            return res.status(500).send('Error al buscar usuarios');
        }

        if (result.length === 0) {
            console.log('No se encontraron usuarios con el nombre especificado.');
            return res.status(404).send('No se encontraron usuarios con el nombre especificado');
        }

        console.log('Usuarios encontrados:', result);
        res.json(result);
    });
});