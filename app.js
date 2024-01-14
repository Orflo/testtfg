const wol = require('wol');
const path = require('path');
const bodyParser = require('body-parser')

// SERVIDOR CON EXPRESS
const express = require('express');
const PORT = 3000;
var app = express();
    app.use (bodyParser.json());
    app.use (bodyParser.urlencoded({extended: true}));
    app.use(express.static(path.join(__dirname, 'App_web', 'Login')));
app.listen(PORT, () => {
    console.log(`Servidor iniciado en el puerto ${PORT}`);
});

// ENVIA PETICIÓN WOL AL EQUIPO PERTINENTE
app.get('/wake', (req, res) => {
    const macAddress = '38:60:77:1F:C8:A0'; // Dirección MAC para encender el equipo.
    wol.wake(macAddress, function (err) {
        if (err) {
            console.log(err);
            res.status(500).send('Error al enviar la señal WOL');
            console.log('Revisa de nuevo la MAC introducida.');
        } else {
            console.log('Señal WOL enviada con éxito');
            res.status(200).send('Señal WOL enviada con éxito');
            console.log('¡El equipo se encenderá en unos minutos!');
        }
    });
});

// LOGIN PRINCIPAL DE USUARIOS
app.get('/', function (req, res){
    res.sendFile(path.join(__dirname + '/App_web','/Login','/form.html'))
})
app.post('/formulario', function (req, res){    
    const nombre = req.body.nombre
    const password = req.body.password
    console.log(nombre);
    console.log(password);
    if(nombre === "sergio.f" && password === "1234"){
        res.sendFile(path.join(__dirname + '/App_web','/UserWeb','/index.html'))
        app.get('/style.css', (req, res) => {
            res.sendFile(path.join(__dirname, 'App_web', 'UserWeb', 'style.css'));
        });
    } else {  
        setTimeout(() => {
            res.sendFile(path.join(__dirname + '/App_web','/Login','/wrongPasswd.html'))
            // Redirigir a otra página con boton de vuelta
        }, 2000);
    }
})