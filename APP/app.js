const wol = require('wol');
const path = require('path');
const bodyParser = require('body-parser')
const mysql = require('mysql2')
const bcrypt = require('bcrypt');
const saltRounds = 10; // Número de rondas de salting
const { exec } = require('child_process');


// SERVIDOR CON EXPRESS
const express = require('express');
const PORT = 3000;
var app = express();
    app.use (bodyParser.json());
    app.use (bodyParser.urlencoded({extended: true}));
app.listen(PORT, () => {
    console.log(`Servidor iniciado en el puerto ${PORT}`);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'App_web','Login', 'form.html'));
});
app.get('/administracion', (req, res) => {
    res.sendFile(path.join(__dirname, 'App_web','AdminWeb', 'main.html'));
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

// Conexión a base de datos:
const mysqlConnection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'wol_app',
    multipleStatements: true
});

mysqlConnection.connect((err) => {
    if (!err)
        console.log('Conexión con la base de datos correcta...');
    else
        console.log('¡Conexión fallida!' + JSON.stringify(err, undefined, 2));
});

const port = process.env.PORT || 8181;

// Configuración para servir archivos estáticos desde el directorio actual
app.use(express.static(path.join(__dirname, 'App_web', 'AdminWeb')));

// Hash de contraseñas para cifrado interno de la bd
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

//  Inicio de sesión:
app.post('/iniciarsesion', (req, res) => {
    const usuario = req.body.usuario;
    const password = req.body.password;

    const sql = 'SELECT * FROM credenciales WHERE usuario = ?';
    mysqlConnection.query(sql, [usuario], (err, rows) => {
        if (!err) {
            if (rows.length > 0) {
                const hashedPasswordFromDB = rows[0].hash;
                const userRole = rows[0].rol; // Supongamos que hay un campo 'role' en la tabla de credenciales

                if (userRole === 'admin') {
                    // Lógica para el inicio de sesión del administrador
                    res.redirect('/administracion');
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

// Función para hashear la contraseña antes de almacenarla
app.get('/cambiarcontrasena', (req, res) => {
    res.sendFile(path.join(__dirname, 'App_web','Change', 'changepasswd.html'));
});

app.post('/cambiarcontrasena', async (req, res) => {
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

// Creación de usuarios y añadido automatico a la BBDD:
app.get('/crearusuario', function (req, res) {
    res.sendFile(path.join(__dirname, 'App_web','Create', 'index.html'));
});

app.post('/crearusuario', async (req, res) => {
    const usuario = req.body.nombre;
    const contraseña = req.body.password;

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
                const insertSql = 'INSERT INTO credenciales (usuario, hash) VALUES (?, ?)';
                mysqlConnection.query(insertSql, [usuario, hashedPassword], (insertErr, insertResult) => {
                    if (!insertErr) {
                        console.log("Usuario creado con éxito");
                        res.status(500).send(`
                            <script>
                                alert('¡El usuario se ha creado con EXITO!');
                                window.history.back();
                            </script>
                        `);
                    } else {
                        console.log("Error al crear usuario: " + insertErr);
                        res.status(500).send(`
                            <script>
                                alert('¡El usuario YA EXISTE! ${insertErr}');
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

// Ruta para asignar equipos
app.get('/asignarequipo', (req, res) => {
    res.sendFile(path.join(__dirname, 'App_web', 'Equipos', 'index.html'));
});
// Agrega la lógica para manejar la asignación de equipos
app.post('/asignarequipo', (req, res) => {
    const usuario = req.body.usuario;
    const ip = req.body.ip;

    // Verifica que el usuario exista en la base de datos
    const selectUserSql = 'SELECT * FROM credenciales WHERE usuario = ?';
    mysqlConnection.query(selectUserSql, [usuario], (selectUserErr, userRows) => {
        if (selectUserErr) {
            console.error('Error al buscar el usuario:', selectUserErr);
            return res.status(500).json({ error: 'Error al asignar el equipo al usuario.' });
        }

        if (userRows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        const userId = userRows[0].id; // Suponiendo que hay un campo 'id' en la tabla 'credenciales'

        // Realiza la inserción en la tabla 'equipos'
        const insertEquipoSql = 'INSERT INTO equipos (usuario_id, ip) VALUES (?, ?)';
        mysqlConnection.query(insertEquipoSql, [userId, ip], (insertEquipoErr) => {
            if (insertEquipoErr) {
                console.error('Error al asignar el equipo al usuario:', insertEquipoErr);
                return res.status(500).json({ error: 'Error al asignar el equipo al usuario.' });
            }

            // Envía una respuesta exitosa al cliente
            res.json({ success: true });
        });
    });
});

// Visualizar los usuarios de la bd en la web para manejarlos más sencillo:
app.get('/allusers', (req, res) => {
    res.sendFile(path.join(__dirname, 'App_web', 'AllUsers', 'index.html'));
});
