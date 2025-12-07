const API_URL = "http://localhost:4000";
let map;
let markers = [];

document.addEventListener("DOMContentLoaded", () => {
    initMap();
    cargarClientes();
});

// 1. INICIALIZAR EL MAPA (Centrado en CDMX por defecto)
function initMap() {
    // Coordenadas iniciales (puedes cambiarlas a tu ciudad)
    map = L.map('map').setView([19.4326, -99.1332], 12); 

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
}

// 2. CARGAR LISTA Y PINES
async function cargarClientes() {
    const token = localStorage.getItem("token");
    const listaDiv = document.getElementById("listaClientes");

    try {
        const res = await fetch(`${API_URL}/api/clientes`, {
            headers: { "Authorization": "Bearer " + token }
        });
        const clientes = await res.json();

        listaDiv.innerHTML = "";
        
        // Limpiar marcadores viejos
        markers.forEach(m => map.removeLayer(m));
        markers = [];

        if (clientes.length === 0) {
            listaDiv.innerHTML = "<p>No tienes clientes registrados.</p>";
            return;
        }

        // Renderizar lista y poner pines
        clientes.forEach(c => {
            // A. HTML de la tarjeta
            const div = document.createElement("div");
            div.className = "client-item";
            div.innerHTML = `
                <div style="display:flex; justify-content:space-between;">
                    <strong>${c.nombre}</strong>
                    <small>${new Date(c.fecha_registro).toLocaleDateString()}</small>
                </div>
                <p>📍 ${c.direccion || 'Sin dirección'}</p>
                <p>📞 ${c.telefono || 'Sin tel'}</p>
                ${c.notas ? `<p style="font-size:0.9rem; color:#666;">📝 ${c.notas}</p>` : ''}
                
                <div style="margin-top:10px;">
                    <button class="btn btn-sm btn-danger" onclick="eliminarCliente(${c.id})">Eliminar</button>
                    <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.direccion)}" target="_blank" class="btn btn-sm btn-outline">Ir (G.Maps)</a>
                </div>
            `;
            
            // Evento: Al hacer clic en la tarjeta, centrar mapa (si tiene pin)
            div.addEventListener("click", () => buscarEnMapa(c.direccion, c.nombre));
            
            listaDiv.appendChild(div);

            // B. Intentar poner marcador automático (Geocoding simple)
            if (c.direccion && c.direccion.length > 5) {
                buscarEnMapa(c.direccion, c.nombre, false); // false = no centrar, solo poner pin
            }
        });

    } catch (error) {
        console.error(error);
        listaDiv.innerHTML = "<p>Error al cargar clientes.</p>";
    }
}

// 3. FUNCIONES DE MAPA (Geocoding)
async function buscarEnMapa(direccion, titulo, centrar = true) {
    if (!direccion) return;

    // Usamos Nominatim (OpenStreetMap) para convertir texto a coordenadas
    // Nota: Es un servicio gratuito, úsalo con moderación.
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(direccion)}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (data && data.length > 0) {
            const lat = data[0].lat;
            const lon = data[0].lon;

            // Crear marcador
            const marker = L.marker([lat, lon]).addTo(map)
                .bindPopup(`<b>${titulo}</b><br>${direccion}`);
            
            markers.push(marker);

            if (centrar) {
                map.setView([lat, lon], 16);
                marker.openPopup();
            }
        }
    } catch (e) {
        console.log("No se pudo ubicar la dirección en el mapa automáticamente.");
    }
}

// 4. GESTIÓN DEL FORMULARIO
window.mostrarFormulario = () => {
    document.getElementById("formCliente").style.display = "block";
    document.getElementById("nombre").focus();
}

window.ocultarFormulario = () => {
    document.getElementById("formCliente").style.display = "none";
    // Limpiar inputs
    document.getElementById("nombre").value = "";
    document.getElementById("telefono").value = "";
    document.getElementById("direccion").value = "";
    document.getElementById("notas").value = "";
}

window.guardarCliente = async () => {
    const token = localStorage.getItem("token");
// Unir dirección
    const calle = document.getElementById("calle").value;
    const num = document.getElementById("numero").value;
    const col = document.getElementById("colonia").value;
    const cd = document.getElementById("ciudad").value;
    
    const direccionFull = `${calle} ${num}, ${col}, ${cd}, México`;

    const data = {
        nombre: document.getElementById("nombre").value,
        telefono: document.getElementById("telefono").value,
        direccion: direccionFull, // Enviamos la completa
        notas: document.getElementById("notas").value
    };

    if(!data.nombre) return alert("El nombre es obligatorio");

    try {
        const res = await fetch(`${API_URL}/api/clientes`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token 
            },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            alert("Cliente agregado");
            ocultarFormulario();
            cargarClientes(); // Recargar lista y mapa
        } else {
            alert("Error al guardar");
        }
    } catch (e) {
        console.error(e);
    }
}

window.eliminarCliente = async (id) => {
    if(!confirm("¿Eliminar este cliente?")) return;
    const token = localStorage.getItem("token");

    try {
        await fetch(`${API_URL}/api/clientes/${id}`, {
            method: "DELETE",
            headers: { "Authorization": "Bearer " + token }
        });
        cargarClientes();
    } catch (e) {
        console.error(e);
    }
}