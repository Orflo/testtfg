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

// CARGA EL VIEW DEL EJS
app.set('view engine', 'ejs');

//Session configuration
app.use(session({
    secret: '2C44-4D44-WppQ38S',
    resave: false,
    saveUninitialized: true
  }));

// Middleware para la autenticación
const authAdmin = function(req, res, next) {
    if (req.session && req.session.user && req.session.rol === 'admin' && req.session.admin)
        return next();
    else
        return res.sendStatus(401);
};

const authUser = function(req, res, next) {
    if (req.session && req.session.user && req.session.rol === 'user')
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
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'App_web', 'Login', 'form.html'));
});

//Ruta login
app.get('/userpanel', (req, res) => {
    res.sendFile(path.join(__dirname, 'App_web', 'Login', 'form.html'));
});

// Ruta de administración
app.get('/administracion', authAdmin, function (req, res){
    res.sendFile(path.join(__dirname, 'App_web', 'AdminWeb', 'main.html'));
});

// Configuración para servir archivos estáticos desde el directorio actual
app.use(express.static(path.join(__dirname, 'App_web', 'AdminWeb')));

// Login endpoint
app.post('/userpanel', function (req, res) {
    const usuario = req.body.usuario;
    const password = req.body.password;

    const sql = 'SELECT * FROM credenciales WHERE usuario = ?';
    mysqlConnection.query(sql, [usuario], (err, rows) => {
        if (!err) {
            if (rows.length > 0) {
                const hashedPasswordFromDB = rows[0].hash;
                const userRole = rows[0].rol;
                const userMac = rows[0].mac;

                bcrypt.compare(password, hashedPasswordFromDB, (compareErr, result) => {
                    if (compareErr) {
                        console.log("Error al comparar contraseñas: " + compareErr);
                        res.status(500).send("Error en el inicio de sesión");
                    } else {
                        if (result) {
                            req.session.user = usuario;
                            req.session.rol = userRole;
                            req.session.mac = userMac;

                            if (userRole === 'admin') {
                                req.session.admin = true;
                                res.redirect('/administracion');
                            } else {
                                    res.render('index', { mac: userMac, user: usuario});
                                    app.use(express.static(path.join(__dirname, 'App_web', 'views')));
                            }
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
      res.redirect('/');
});

// Ruta para modificar la información del usuario
app.get('/modificarinfo', authAdmin, (req, res) => {
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

// Ruta para cambiar la MAC del usuario
app.get('/cambiarmac', authAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'App_web', 'AdminWeb', 'main.html'));
});

app.post('/cambiarmac', async (req, res) => {
    const usuario = req.body.usuario;
    const nuevaMac = req.body.nuevaMac;

    // Verificar si el usuario existe
    const checkUserSql = 'SELECT COUNT(*) as count FROM credenciales WHERE usuario = ?';

    mysqlConnection.query(checkUserSql, [usuario], async (checkErr, checkResult) => {
        if (!checkErr) {
            const userCount = checkResult[0].count;

            if (userCount === 0) {
                // El usuario no existe, enviar mensaje de error
                console.log("Error al cambiar la MAC");
                res.status(500).send(`
                    <script>
                        alert('ERROR: ¡El usuario no existe!');
                        window.history.back();
                    </script>
                `);
            } else {
                // El usuario existe, proceder a cambiar la MAC
                const updateSql = 'UPDATE credenciales SET mac = ? WHERE usuario = ?';
                mysqlConnection.query(updateSql, [nuevaMac, usuario], (updateErr) => {
                    if (updateErr) {
                        console.log("Error al actualizar la MAC: " + updateErr);
                        res.status(500).send("Error al cambiar la MAC");
                    } else {
                        // MAC cambiada exitosamente, enviar respuesta al cliente
                        console.log("Éxito al cambiar la MAC");
                        res.status(500).send(`
                            <script>
                                alert('¡La MAC se ha cambiado con éxito!');
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

// FUNCIONAMIENTO DEL SCRIPT DE POWERSHELL DESDE EL USUARIO

const scriptPath = path.join(__dirname, 'wol.ps1');
app.post('/runPowerShellScript', (req, res) => {
    const macValue = req.body.macValue;

    const command = `powsh -File "${scriptPath}" -macValue "${macValue}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(error);
            res.status(500).send('Error al ejecutar el script de PowerShell');
            return;
        }
        console.log(stdout);
        res.send(stdout); // Enviar respuesta de PowerShell de vuelta al cliente
    });
});

// Creación de usuarios y añadido automático a la BBDD:
app.get('/crearusuario', authAdmin, function (req, res) {
    res.sendFile(path.join(__dirname, 'App_web', 'Create', 'index.html'));
});

app.post('/crearusuario', async (req, res) => {
    const usuario = req.body.nombre;
    const contraseña = req.body.password;
    const mac = req.body.mac;

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
                const insertSql = 'INSERT INTO credenciales (usuario, hash, mac) VALUES (?, ?, ?)';
                mysqlConnection.query(insertSql, [usuario, hashedPassword, mac], (insertErr, insertResult) => {
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