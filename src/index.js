const express = require('express');
const mysql = require('mysql2');
const { config } = require('dotenv');

config();
const app = express();
const mysqlConnection = mysql.createConnection({
    host: process.env.MYSQLDB_HOST,
    user: process.env.MYSQLDB_USER,
    password: process.env.MYSQLDB_ROOT_PASSWORD,
    port: process.env.MYSQLDB_DOCKER_PORT
});

const PORT = process.env.NODE_DOCKER_PORT
app.listen(PORT, () => {
    console.log(`Servidor iniciado en el puerto ${PORT}`)
});

app.get('/', (req,res) => {
    res.send('Hello World!')
});

mysqlConnection.connect((err) => {
    if (!err)
        console.log('Conexión con la base de datos correcta...');
    else
        console.log('¡Conexión fallida!' + JSON.stringify(err, undefined, 2));
});