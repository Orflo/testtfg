# Inicio de proyecto
## 09.01.2024
Se crea la estructura inicial del proyecto y se empieza a configurar los ficheros server.js y app.js
Se ha modificado y creado la estructura inicial web-servidor y se consigue que mande la señal pero de momento no hay pruebas de que funcione bien.
- Queda por refinar el código y probarlo con otro PC
- Rediseñar la WEB para que este todo más centrado y de otra manera más limpia.
- En caso de que el PC inicie con la orden, habrá que ingeniar un login para más seguridad y una bd.

## 10.01.2024
Se crea una máquina virtual con un Ubuntu Server 20.04, se procede a la instalación de Docker, de esta manera, se deja preparado parte del entorno del PFG.

Tambien se rehace el código de nuevo para que funcione todo correctamente y parece que el código funciona, solamente falta un ordenador que admita WOL. Se ha eliminado server.js ya que app.js tiene todo lo necesario. Tambiene se ha cambiado la estructura y la carpeta web se ha movido dentro de la carpeta 'NodeJS'. 

## 11.01.2024
Estamos teniendo problemas con el script, nuestra idea era que a través de una app web en nodeJS ejecutará a través de un botón y mandara el 'magic packet' el problema es que NodeJS solo se basa en side-server y no puede envíar mensajes UDP. He encontrado un lenguaje que se llama AHK que parece que puede envíar mensajes UDP. Seguiremos investigando.

## 14.01.2024
He restructurado por completo las carpetas. Ahora en APP está todo lo relacionado con lo que es la aplicación. Solamente ejecutando 'node app.js' ya coge todos los ficheros de la carpeta APP. Se ha realizado lo siguiente:
- Página login, login incorrecto y login correcto inicial realizado con exito.
Queda añadir que los botones funcionen correctamente y envíen el paquete UDP. Támbien rediseñar un poco la caja derecha y los colores de la página.

- Se instala Java y Jenkins en la máquina virtual de Ubuntu 20.04, se realizan las configuraciones en Jenkins, se crea un Dockerfile con node para crear una imagen que luego desplegaremos en un contenedor, también se ha creado un repositorio de pruebas para comprobar los despliegues y la estructura adecuada para que no de fallos en el futuro, se adjunta enlace [Test del TFG](https://github.com/Orflo/testtfg). Se han instalado parte de pluguins que serán necesarios en Jenkins.

Queda pendiente encontrar una forma de realizar un Web-hook desde github con Jenkins.

## 15.01.2024
Se modifica la web de usuario con una pantalla de carga al iniciar correctamente el login y tambien se añade un botón para cambiar colores entre negro y blanco. 
- Tengo que modificar el tema blanco para que los botones tengan hover y otro tipo de estilo distinto al modo oscuro.
- Aún queda por revisar los temas pendientes del día 14.01 con Alfonso. Lo revisaremos hoy en clase.
Se añade un listado de tareas en la parte de usuario para controlar lo que hace día a día y tener orden de lo que hace o deja de hacer.

## 19.01.2024
Se abren los puertos para permitir a jenkins que salga a internet, y se realiza una pruba de WebHook con GitHub, la prueba ha resultado satisfactoria, también se han instalado más plugins en Jenkins, entre ellos BlueOcean, que facilita el control y la creación de pipelines en Jenkins.

## 23.01.2024
Se ha creado un entorno de pruebas como base de datos para probar que funciona todo correctamente. Se ha creado /create y /change que crea y modifica usuarios. Tambien hashea todas las contraseñas que se crean en la base de datos para más seguridad. De momento todo funciona correctamente.

## 24.01.2024
Se ha creado el inicio de sesión haseado con la bd y lleva a la página del usuario. Queda intentar que al pulsar en el botón de la IP se ejecute un script con la mac del equipo deseado .ps1. Tambien hay que darle una vuelta importante ya que estamos haciendo diferentes páginas en hacer todo mucho más centralizado y con otros botones. Por lo demás todo está en orden, el login, cambiar contraseña, crear usuario, y la interfaz inicial.
- Realizar zona centralizada para las diferentes webs.
- Modificar y terminar haciendo funcionar los botones y .ps1
- Rediseñar un poco la web y darle otros colores...
- Aplicar seguridad de administrador para webs como crear y cambiar credenciales de usuario.

## 25.01.2024
Se crea en app.js un bloque de login para administrador y otro para el usuario. Tambien se crea en la bd roles para el inicio de sesión. (admin para el uso administrativo). Tambien se crea una ruta especifica (nueva carpeta) para la web de administración.
- Falta crear en la bd el rol admin
- Falta modificar y centralizar el uso de las webs en la zona administrador.

## 26.01.2024
Se añade un menú de adminsitración con su estilo css y se piensan nuevas ideas para administrar mejor a los usuarios.
- Falta añadir el rol de admin en la bd.
- Queda modificar la web de adminitración
El siguente paso a realizar será administrar la seguridad y el bloqueo de usuarios normales a diferentes webs dividido por roles.

## 16.02.2024
Aun que no hemos subido nada en un tiempo no se ha dejado de trabajar. Ahora se quería bloquear el acceso a diferentes urls a través del rol que disponga cada usuario. He intentado hacerlo con passport y con diferentes funciones pero no llega a funcionar, tengo que seguir revisando código a ver si consigo descubrir cual es el error. Se ha creado el atributo rol en la tabla 'credenciales' y tambien se ha creado la tabla timeuse donde se registrará el tiempo del usuario que ha estado conectado para proyectarlo en la página de administración de usuarios.
- Lo principal actualmente es que el login por roles funcione corretamente.
- El tiempo de conexión habrá que revisarlo una vez realizada correctamente el inicio de sesión.
- Modificar correctamente la zona de administradores y darle una vuelta a ver como enfocar mejor el tema.
- Repasar en una pequeña reunión los sistemas que está montando Lucas y como influye al mergear con la app.
- Optimizar el código con paquetes NPM invalidos y barajar si realmente necesitamos que la página de admin tenga tantos parametros de administración.
- Revisar el código para que funcione correctamente el magic packet con WOL (está en el script APP.js)

## 19.02.2024
El login por roles funicona. Hay que revisar ahora el tiempo de conexión y restringir diferentes webs de adminsitración para usuarios. Se ha modificado tambien la zona de administración.
- No lee correctamente en Admin Web el css, hay que revisarlo.
- Restringir diferentes webs de administración para más seguridad.
- Paquetes NPM reducidos y optimizados para el código.
- Aún queda revisar el magic packet y varios aspectos de admin web.

## 22.02.2024
Se realiza una nueva zona en la pag de administración donde con el nombre de usuario y una IP al iniciar sesión con dicho usuario puede ver su PC. Aún falla ya que no lee el JS correctamente, hay que revisar el código para ver cual es el problema. Se crea tambien una nueva tabla en la bd con la información de los equipos. (sin funcionar todavía)
- Hay que revisar aún el magic packet
- Ya lee correctamente el css de todas las webs.
- Queda por restringir aún más las webs.
- Optimizado el código app.js y de las webs admin y webusers.

## 24.02.2024
Se crea allusers y se deja en desarollo. Moficiación y organización de adminweb, se crean tambien botones para volver en cada zona de administración además de cambiar el código para verificacion de usuarios y control de errores.
- Aun queda por revisar magic packet, restringir webs y sigue sin leer el js en asignar equipos.

## 31.03.2024
- Se modifica completamente el directorio AllUsers de forma que se pueda administrar perfectamente los usuarios activos creados.
- Se modifica la tabla credenciales y se crea un nuevo campo llamado IP. 
- Se elimina la tabla equipos de la BD y se modifica el fichero bd_estructure.md
- Se elimina asignar equipos ya que no hace falta al poder asignar IP al crear el usuario.
- Se añade y cambia el apartado 'Modificar informacion' donde se administra de mejor manera la contraseña del usuario además de la dir IP asignada.
- Se modifica 'Añadir usuario' con la opción de poder o no asignar la dirección IP.

## 01.04.2024
- Se realizan cambios en la página de administración.
- Se añade la funcionalidad de cambiar IP, cambiar contraseña y añadir usuarios correctamente.
- Se soluciona el problema de login al iniciar sesión como administrador.

## 21.04.2024
Se completa el proyecto.

Que se ha modificado:
- Plantilla EJS creada con exito para mostrar MACs de manera dínamica en userpanel.
- Se añade .ps1 para el funcionamiento dínamico de magic packet para iniciar el ordenador a traves de WOL.
- Restructuración de código no válido y borrado de carpetas y ficheros innecesarios.
- Se modifica la bd con el atributo mac (antes era IP)
