const express = require('express');
const mysql = require('mysql2');
const { config } = require('dotenv');
config();

const app = express();

const PORT = process.env.NODE_DOCKER_PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor iniciado en el puerto ${PORT}`);
});

app.get('/', (req,res) => {
    res.send('Hello World!')
});

const mysqlConnection = mysql.createConnection({
    host: process.env.MYSQLDB_HOST,
    user: process.env.MYSQLDB_USER,
    password: process.env.MYSQLDB_PASSWORD,
    database: process.env.MYSQLDB_NAME,
    multipleStatements: true
});

mysqlConnection.connect((err) => {
    if (!err)
        console.log('Conexión con la base de datos correcta...');
    else
        console.log('¡Conexión fallida!' + JSON.stringify(err, undefined, 2));
});
