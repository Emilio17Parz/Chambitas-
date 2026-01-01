const API_URL = "https://chambitas-backend-ncie.onrender.com";
let map;
let markers = [];

document.addEventListener("DOMContentLoaded", () => {
    initMap();
    cargarClientes();
});

// 1. INICIALIZAR EL MAPA
function initMap() {
    // Coordenadas iniciales (CDMX)
    map = L.map('map').setView([19.4326, -99.1332], 12); 

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Fix visual por si el mapa carga gris
    setTimeout(() => { map.invalidateSize(); }, 500);
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
        
        // Limpiar marcadores viejos del mapa
        markers.forEach(m => map.removeLayer(m));
        markers = [];

        if (clientes.length === 0) {
            listaDiv.innerHTML = "<p>No tienes clientes registrados.</p>";
            return;
        }

        // Renderizar lista y poner pines
        for (const c of clientes) {
            // A. HTML de la tarjeta
            const div = document.createElement("div");
            div.className = "client-item";
            
            // CORRECCIÓN: Link de Google Maps bien formado
            const gmapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.direccion)}`;

            div.innerHTML = `
                <div style="display:flex; justify-content:space-between;">
                    <strong>${c.nombre}</strong>
                    <small>${new Date(c.fecha_registro).toLocaleDateString()}</small>
                </div>
                <p style="font-size:0.9rem; margin:5px 0;">📍 ${c.direccion || 'Sin dirección'}</p>
                <p style="font-size:0.9rem; margin:5px 0;">📞 ${c.telefono || 'Sin tel'}</p>
                ${c.notas ? `<p style="font-size:0.8rem; color:#666;">📝 ${c.notas}</p>` : ''}
                
                <div style="margin-top:10px; display:flex; gap:5px;">
                    <button class="btn btn-sm btn-danger" onclick="eliminarCliente(${c.id})">Eliminar</button>
                    <a href="${gmapsLink}" target="_blank" class="btn btn-sm" style="border:1px solid #ddd;">Ir a G.Maps</a>
                </div>
            `;
            
            // Evento: Al hacer clic en la tarjeta, centrar mapa en ese cliente específico
            div.addEventListener("click", () => {
                // Buscamos si ya existe un marcador para este cliente en el mapa
                // (Nota: Esto requiere que buscarEnMapa ya haya terminado)
                buscarEnMapa(c.direccion, c.nombre, true); 
            });
            
            listaDiv.appendChild(div);

            // B. Poner marcador en el mapa (sin centrar la cámara cada vez)
            if (c.direccion && c.direccion.length > 5) {
                // Usamos await aquí para que no sature la API de mapas lanzando todas las peticiones a la vez
                await buscarEnMapa(c.direccion, c.nombre, false); 
            }
        }

    } catch (error) {
        console.error(error);
        listaDiv.innerHTML = "<p>Error al cargar clientes.</p>";
    }
}

/// Reemplaza SOLAMENTE la función buscarEnMapa con esto:

// REEMPLAZA SOLO LA FUNCIÓN buscarEnMapa EN TU ARCHIVO clients.js

async function buscarEnMapa(direccion, titulo, centrar = true) {
    if (!direccion) return;

    // Configuración para que la API no te bloquee (importante)
    const opciones = {
        headers: {
            "User-Agent": "ChambitasApp/1.0",
            "Accept-Language": "es-MX, es;q=0.9" // Prioridad a México
        }
    };

    // Función auxiliar para consultar
    const consultar = async (txt) => {
        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(txt)}`;
            const res = await fetch(url, opciones);
            return await res.json();
        } catch (e) { return []; }
    };

    // --- ESTRATEGIA DE BÚSQUEDA INTELIGENTE ---
    
    // 1. Intento Exacto (Lo que viene de la base de datos)
    let data = await consultar(direccion);

    // 2. Si falla, intentamos limpiar la dirección
    if (!data || data.length === 0) {
        // Dividimos la dirección por comas. 
        // Ej: "AV. Tlahuac 1577 31, casa 34, Mirasoles, CDMX"
        const partes = direccion.split(',');
        
        if (partes.length >= 2) {
            // Tomamos la primera parte (Calle y Número) y la penúltima (Ciudad/Estado)
            // Esto elimina "casa 34" o la colonia si está mal escrita
            let calle = partes[0].trim(); 
            const ciudad = partes[partes.length - 2].trim(); // Asumiendo formato "... , Ciudad, Pais"

            // TRUCO: Si la calle termina en varios números (ej "1577 31"), quitamos el último
            // porque suele ser el número de departamento y eso confunde al mapa.
            // Regex: Busca un número al final y lo quita
            const calleLimpia = calle.replace(/\s+\d+$/, ''); 

            // Construimos una búsqueda más sencilla: "Av Tlahuac 1577, CDMX"
            const busquedaSimple = `${calleLimpia}, ${ciudad}`;
            
            console.warn(`Reintentando búsqueda simplificada: ${busquedaSimple}`);
            data = await consultar(busquedaSimple);
        }
    }

    // --- RENDERIZADO DEL PIN ---
    if (data && data.length > 0) {
        const lat = data[0].lat;
        const lon = data[0].lon;

        const marker = L.marker([lat, lon]).addTo(map)
            .bindPopup(`<b>${titulo}</b><br><span style="font-size:0.85em">${direccion}</span>`);
        
        markers.push(marker);

        if (centrar) {
            map.setView([lat, lon], 16);
            marker.openPopup();
        }
    } else {
        console.log("No se pudo ubicar ni simplificando:", direccion);
    }
}

// 4. GESTIÓN DEL FORMULARIO
window.mostrarFormulario = () => {
    document.getElementById("formCliente").style.display = "block";
    document.getElementById("nombre").focus();
    // Reajuste del mapa por si estaba oculto
    setTimeout(() => { map.invalidateSize(); }, 100);
}

window.ocultarFormulario = () => {
    document.getElementById("formCliente").style.display = "none";
    
    // CORRECCIÓN: Limpiar los inputs individuales del HTML nuevo
    document.getElementById("nombre").value = "";
    document.getElementById("telefono").value = "";
    document.getElementById("calle").value = "";
    document.getElementById("numero").value = "";
    document.getElementById("colonia").value = "";
    // document.getElementById("ciudad").value = "CDMX"; // Opcional resetear ciudad
    document.getElementById("notas").value = "";
}

window.guardarCliente = async () => {
    const token = localStorage.getItem("token");

    // Unir dirección desde los campos separados
    const calle = document.getElementById("calle").value;
    const num = document.getElementById("numero").value;
    const col = document.getElementById("colonia").value;
    const cd = document.getElementById("ciudad").value;
    
    const direccionFull = `${calle} ${num}, ${col}, ${cd}, México`;

    const data = {
        nombre: document.getElementById("nombre").value,
        telefono: document.getElementById("telefono").value,
        direccion: direccionFull, 
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
            Swal.fire('Guardado', 'Cliente agregado correctamente', 'success');
            ocultarFormulario();
            cargarClientes(); // Esto volverá a pintar los pines
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