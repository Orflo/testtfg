const express = require('express');
const { createPool } = require('mysql2/promise');
const { config } = require('dotenv');

config();
const app = express();
const mysqlConnection = createPool = ({
    host: process.env.MYSQLDB_HOST,
    user: process.env.MYSQLDB_USER,
    password: process.env.MYSQLDB_ROOT_PASSWORD,
    database: process.env.MYSQLDB_DATABASE,
});

const PORT = process.env.NODE_DOCKER_PORT
app.listen(PORT, () => {
    console.log(`Servidor iniciado en el puerto ${PORT}`)
});

app.get('/', (req,res) => {
    res.send('Hello World!')
});

app.get('/ping', async (req, res) => {
    const result = await mysqlConnection.query('SELECT NOW()')
    res.json(result[0])
});
