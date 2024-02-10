const express = require('express');
const mysql = require('mysql2');
const { config } = require('dotenv');

config();
const app = express();
function connectToDatabase() {
    const mysqlConnection = mysql.createConnection({
        host: process.env.MYSQLDB_HOST,
        user: process.env.MYSQLDB_USER,
        password: process.env.MYSQLDB_PASSWORD,
        database: process.env.MYSQLDB_DATABASE,
        port: process.env.MYSQLDB_DOCKER_PORT
    });

    mysqlConnection.connect((err) => {
        if (err) {
            console.log('¡Conexión fallida!' + JSON.stringify(err, undefined, 2));
            setTimeout(connectToDatabase, 5000);
        } else {
            console.log('Conexión con la base de datos establecida.');
            startServer();
        }
    });
}

function startServer() {
    const PORT = process.env.NODE_DOCKER_PORT
    app.listen(PORT, () => {
        console.log(`Servidor iniciado en el puerto ${PORT}`)
    });

    app.get('/', (req,res) => {
        res.send('Hello World!')
    });
}

connectToDatabase();