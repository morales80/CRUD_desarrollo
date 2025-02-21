        let usuarioEditandoId = null;
        let editandoRelacional = false; // mi variable para indicar el tipo de tabla que eastoy usando xd
        const baseR = ('http://localhost:4000/')
        const baserNR = ('http://localhost:5000/')

        function openModalRelacional(id) {
            openModal(id, true);
        }
        
        function openModalNoRelacional(id) {
            openModal(id, false);
        }
    
        function openModal(id, esRelacional) {
            document.getElementById('userForm').reset();
            usuarioEditandoId = id;
            editandoRelacional = esRelacional; // Asigna el valor a la variable
        
            if (id) {
                document.getElementById('modalLabel').textContent = "Editar Usuario";
        
                const url = esRelacional ? `${baseR}usuarios/${id}` : `${baserNR}api/users/${id}`;
                console.log("URL solicitada", url);
        
                fetch(url)
                    .then(response => {
                        if (!response.ok) {
                            console.error("Error del servidor:", response.status, response.statusText); // Imprime el código de estado y el mensaje
                            throw new Error(`Error ${response.status}: ${response.statusText}`); // Lanza un error con más detalles
                        }
                        return response.json();
                    })
                    .then(usuario => {
                        console.log("Datos del usuario recibidos:", usuario);                        
                        document.getElementById('textoid').value = usuario.nombre;
                        document.getElementById('paswordid').value = usuario.password;
                        document.getElementById('textolargoid').value = usuario.descripcion;
                        document.getElementById('fechaid').value = usuario.fecha.substring(0, 10);
        
                        if (usuario.imagen) {
                            const imgElement = document.getElementById('imagePreview');
                            imgElement.src = esRelacional ? `uploads/${usuario.imagen}` : usuario.imagen; // Ajusta la URL según el tipo de tabla
                            imgElement.style.display = 'block';
                        } else {
                            document.getElementById('imagePreview').style.display = 'none';
                        }
        
                        const modal = new bootstrap.Modal(document.getElementById('userModal'));
                        modal.show();
                    })
                    .catch(error => {
                        console.error(" Error al obtener el usuario:", error);
                        alert("Hubo un problema al obtener los datos del usuario.");
                    });
            } else {
                document.getElementById('modalLabel').textContent = "Crear Usuario";
                document.getElementById('imagePreview').style.display = 'none';
        
                const modal = new bootstrap.Modal(document.getElementById('userModal'));
                modal.show();
            }
        }
        
        async function enviarDatos() {
            const nombre = document.getElementById('textoid').value;
            const password = document.getElementById('paswordid').value;
            const descripcion = document.getElementById('textolargoid').value;
            const fecha = document.getElementById('fechaid').value;
            const imagenInput = document.getElementById('imagenid').files[0];
            const switchEstado = document.getElementById('databaseSwitch').checked;
        
            if (!nombre || !password || !descripcion || !fecha) {
                alert("❌ Todos los campos son obligatorios.");
                return;
            }
        
            const reader = new FileReader();
            reader.readAsDataURL(imagenInput || new Blob());
            reader.onload = async function () {
                const imagenBase64 = imagenInput ? reader.result : null;
        
                const datos = {
                    nombre,
                    password,
                    descripcion,
                    fecha,
                    imagen: imagenBase64
                };
        
                try {
                    let response;
                    let url;
                    let method;
        
                    if (usuarioEditandoId) { // Si hay un ID, es una edición (PUT)
                        url = editandoRelacional ? `${baseR}usuarios/${usuarioEditandoId}` : `${baserNR}api/users/${usuarioEditandoId}`;
                        method = 'PUT';
                    } else { // Si no hay ID, es una creación (POST)
                        url = editandoRelacional ? `${baseR}submit` : `${baserNR}api/users`;
                        method = 'POST';
                    }
        
                    console.log("URL:", url); // Para depurar
                    console.log("Método:", method); // Para depurar
        
                    response = await fetch(url, {
                        method,
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(datos)
                    });
        
                    if (response.ok) {
                        const mensaje = usuarioEditandoId ? "Usuario actualizado" : "Usuario registrado";
                        alert(`✅ ${mensaje} exitosamente`);
                        obtenerUsuarios();
                        obtenerRegistros();
                        document.getElementById('userForm').reset();
                        $('#userModal').modal('hide');
                        usuarioEditandoId = null; // Reiniciar usuarioEditandoId después de la operación
                    } else {
                        console.error("Error al guardar los datos:", response.status, response.statusText);
                        const errorData = await response.json();//Intenta parsear la respuesta del error
                        alert(`Error al guardar los datos: ${response.status} - ${response.statusText} - ${errorData?.message || 'Detalles no disponibles'}`); //Muestra un mensaje de error más descriptivo
                    }
                } catch (error) {
                    console.error("Error en la solicitud:", error);
                    alert("Ocurrió un error. Por favor, inténtalo de nuevo más tarde.");
                    
                }
            };
        }
        
        async function obtenerRegistros() {
            try {
                const response = await fetch(`${baserNR}api/users`);
                const registros = await response.json();
    
                if (!Array.isArray(registros)) {
                    throw new Error("La respuesta no es un arreglo");
                }
    
                document.getElementById('noRelacionalTable').innerHTML = '';
                
                registros.forEach((registro) => {
                    const row = `<tr class="color-black">
                        <td>${registro._id}</td>
                        <td>${registro.nombre}</td>
                        <td>${registro.password}</td>
                        <td>${registro.descripcion}</td>
                        <td><img src="${registro.imagen}" alt="Imagen" width="50"></td>
                        <td>
                            <button class="btn btn-warning" onclick="openModal('${registro._id}')">Editar</button>
                            <button class="btn btn-danger" onclick="eliminarUsuario('${registro._id}', false)">Eliminar</button> 
                        </td>
                    </tr>`;
                    document.getElementById('noRelacionalTable').insertAdjacentHTML('beforeend', row);
                });
            } catch (error) {
                console.error("Error al obtener los registros:", error);
            }
        }
    
        async function eliminarUsuario(userId, esRelacional) {
            try {
                const confirmacion = confirm("¿Estás seguro de que deseas eliminar este usuario?");
                if (!confirmacion) return;
    
                const url = esRelacional ? `${baseR}usuarios/${userId}` : `${baserNR}api/users/${userId}`;
                const method = "DELETE";
    
                const response = await fetch(url, {
                    method
                });
    
                if (response.ok) {
                    console.log("✅ Usuario eliminado");
                    obtenerUsuarios();
                    obtenerRegistros();
                } else {
                    console.error("❌ Error al eliminar usuario:", response.status, response.statusText);
                    alert("❌ Error al eliminar usuario. Por favor, inténtalo de nuevo.");
                }
            } catch (error) {
                console.error("❌ Error al eliminar usuario:", error);
                alert("❌ Ocurrió un error. Por favor, inténtalo de nuevo más tarde.");
            }
        }
    
        async function obtenerUsuarios() {
            try {
                const response = await fetch(`${baseR}usuarios`);
                const data = await response.json();
                mostrarUsuarios(data);
            } catch (error) {
                console.error("Error al obtener los usuarios:", error);
            }
        }
    
        function mostrarUsuarios(usuarios) {
            const tabla = document.getElementById("tabla-usuarios");
            tabla.innerHTML = "";
        
            usuarios.forEach(usuario => {
                const fila = document.createElement("tr");
                fila.innerHTML = `
                    <td>${usuario.id}</td>
                    <td>${usuario.nombre}</td>
                    <td>${usuario.fecha}</td>
                    <td><img src="uploads/${usuario.imagen}" alt="Imagen" width="50" height="50"></td>
                    <td>${usuario.descripcion}</td>
                    <td>
                        <button onclick="eliminarUsuario(${usuario.id}, true)">Eliminar</button>
                        <button onclick="openModalRelacional(${usuario.id})">Editar</button> 
                    </td>
                `;
                tabla.appendChild(fila);
            });
        }

        async function editarUsuario(id){
            openModalRelacional(id);
        }
    
        window.onload = () => {
            obtenerRegistros();
            obtenerUsuarios();
        };
        async function editarUsuario(id) {
            try {
                const response = await fetch(`${baseR}usuarios/${id}`);
                const usuario = await response.json();
        
                openModal(usuario.id);
        
                document.getElementById('textoid').value = usuario.nombre;
                document.getElementById('paswordid').value = usuario.password;
                document.getElementById('textolargoid').value = usuario.descripcion;
                document.getElementById('fechaid').value = usuario.fecha;
        
                if (usuario.imagen) {
                    const imgElement = document.getElementById('imagePreview');
                    imgElement.src = `uploads/${usuario.imagen}`;
                    imgElement.style.display = 'block';
                } else {
                    document.getElementById('imagePreview').style.display = 'none';
                }
        
                usuarioEditandoId = id;
                document.getElementById('modalLabel').textContent = "Editar Usuario";
            } catch (error) {
                console.error("Error al obtener el usuario:", error);
            }
        }
    
        document.getElementById('databaseSwitch').addEventListener('change', function () {
            const label = document.querySelector('label[for="databaseSwitch"]');
            label.textContent = this.checked ? "Base Relacional" : "Base No Relacional";
            editandoRelacional = this.checked; 
            console.log("editandoRelacional:", editandoRelacional); // <-- Para depurar
        });
