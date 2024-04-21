function mostrarDatos(){
    fetch('/obtener-datos')
        .then(response => response.json())
        .then(data => {
            const resultadoDiv = document.getElementById('resultado');
            resultadoDiv.innerHTML = '<h2>Datos recopilados</h2>';
            
            const table = document.createElement('table');
            table.innerHTML = `
                <tr>
                    <th>ID</th>
                    <th>Usuario</th>
                    <th>MAC</th>
                    <th>Eliminar</th>
                </tr>
            `;

            data.forEach(dato => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${dato.id}</td>
                    <td>${dato.usuario}</td>
                    <td>${dato.mac || 'N/A'}</td>
                    <td><button class="eliminar-btn" onclick="eliminarUsuario(${dato.id})">Eliminar</button></td>
                `;
                table.appendChild(row);
            });

            resultadoDiv.appendChild(table);
        })
        .catch(error => {
            console.error('Error al obtener datos de la bd: ', error);
        });
}

function buscarPorNombre() {
    const nombre = document.getElementById('nombreBusqueda').value.trim();

    // Verificar si el nombre está vacío
    if (nombre === '') {
        // Mostrar un mensaje de error o simplemente no hacer nada
        return;
    }

    fetch(`/buscar-usuario/${nombre}`)
        .then(response => response.json())
        .then(data => {
            const resultadoDiv = document.getElementById('resultado');
            resultadoDiv.innerHTML = '<h2>Resultado de la búsqueda</h2>';

            const table = document.createElement('table');
            table.innerHTML = `
                <tr>
                    <th>ID</th>
                    <th>Usuario</th>
                    <th>MAC</th>
                    <th>Eliminar</th>
                </tr>
            `;

            data.forEach(dato => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${dato.id}</td>
                    <td>${dato.usuario}</td>
                    <td>${dato.mac || 'N/A'}</td>
                    <td><button class="eliminar-btn" onclick="eliminarUsuario(${dato.id})">Eliminar</button></td>
                `;
                table.appendChild(row);
            });

            resultadoDiv.appendChild(table);
        })
        .catch(error => {
            console.error('Error al buscar usuarios: ', error);
        });
}

function deshacerFiltro() {
    // Lógica para deshacer el filtro, por ejemplo, volver a mostrar todos los usuarios
    mostrarDatos();
}

function eliminarUsuario(id) {
    const confirmacion = confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.');
    if (confirmacion) {
        fetch(`/eliminar-usuario/${id}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (response.ok) {
                // Usuario eliminado correctamente, actualizar la tabla
                mostrarDatos();
            } else {
                console.error('Error al eliminar el usuario.');
            }
        })
        .catch(error => {
            console.error('Error al eliminar el usuario: ', error);
        });
    }
}

