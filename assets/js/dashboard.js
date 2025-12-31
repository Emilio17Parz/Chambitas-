const API_URL = "http://localhost:4000";
let allAppointments = []; 
let currentCitaId = null; 
let chatInterval = null;

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    if (!token) { window.location.href = "/login.html"; return; }

    cargarPerfil();
    cargarCitas();
});

// 1. CARGAR PERFIL
async function cargarPerfil() {
    try {
        const res = await fetch(`${API_URL}/api/users/profile`, {
            headers: { "Authorization": "Bearer " + localStorage.getItem("token") }
        });
        if (res.ok) {
            const user = await res.json();
            document.getElementById("userName").textContent = `${user.nombre} ${user.apellidos || ""}`;
            document.getElementById("userEmail").textContent = user.correo;
            document.getElementById("userRole").textContent = user.tipo_usuario.toUpperCase();
            document.getElementById("userDate").textContent = user.domicilio || "---";
        }
    } catch (err) { console.error(err); }
}

// 2. CARGAR CITAS (Aquí estaba el problema de los botones)
async function cargarCitas() {
    const cont = document.getElementById("listaCitas");
    const kpiCitas = document.getElementById("kpiCitas");
    const token = localStorage.getItem("token");
    
    // --- CORRECCIÓN CLAVE: Convertir el rol a minúsculas ---
    const roleRaw = localStorage.getItem("userRole"); 
    const role = roleRaw ? roleRaw.toLowerCase() : ""; 
    // ------------------------------------------------------

    try {
        const res = await fetch(`${API_URL}/api/citas/mis-citas`, { 
            headers: { "Authorization": "Bearer " + token }
        });

        if (!res.ok) { cont.innerHTML = "<p>Error cargando citas.</p>"; return; }

        const citas = await res.json();
        allAppointments = citas; 
        cont.innerHTML = ""; 

        if(kpiCitas) kpiCitas.textContent = citas.length;

        if (citas.length === 0) {
            cont.innerHTML = "<p class='empty'>No tienes citas próximas.</p>";
            return;
        }

        let totalSinLeer = 0;

        citas.forEach(cita => {
            const card = document.createElement("div");
            
            // --- Notificaciones (Borde Naranja) ---
            let claseExtra = "";
            let textoBtn = "💬 Chat y Detalles";
            let btnClass = "btn-primary";

            if (cita.sin_leer > 0) {
                claseExtra = "card-new-message"; 
                totalSinLeer += cita.sin_leer;
                textoBtn = `💬 Chat (${cita.sin_leer})`;
            }
            
            card.className = `calendar-card ${claseExtra}`; 

            const nombreOtro = cita.otro_nombre ? `${cita.otro_nombre} ${cita.otro_apellidos || ''}` : 'Usuario';
            const etiqueta = role === 'trabajador' ? 'Cliente' : 'Trabajador';

            // --- LÓGICA DE BOTONES (CORREGIDA) ---
            let botonesExtra = '';
            
            // 1. Botón Cancelar (Visible para ambos si no ha terminado)
            if (cita.estado === 'PENDIENTE' || cita.estado === 'ACEPTADA') {
                botonesExtra += `<button class="btn btn-muted btn-sm" onclick="window.actualizarEstado(${cita.id}, 'CANCELADA')">Cancelar</button>`;
            }
            
            // 2. Botón Terminar (Visible SOLO para trabajador y SI está aceptada)
            if (role === 'trabajador' && cita.estado === 'ACEPTADA') {
                botonesExtra += `<button class="btn btn-success btn-sm" onclick="window.actualizarEstado(${cita.id}, 'COMPLETADA')">Terminar Trabajo</button>`;
            }
            // -------------------------------------

            card.innerHTML = `
                <div style="margin-bottom:10px; border-bottom:1px solid #eee; padding-bottom:5px;">
                    <strong>📅 ${new Date(cita.fecha).toLocaleDateString()} — ${cita.hora}</strong>
                </div>
                <p><strong>${etiqueta}:</strong> ${nombreOtro}</p>
                <p><strong>Motivo:</strong> ${cita.motivo}</p>
                <p><strong>Estado:</strong> <span class="badge estado ${cita.estado.toLowerCase()}">${cita.estado}</span></p>
                
                <div style="margin-top:15px; display:flex; gap:10px; flex-wrap:wrap;">
                    <button class="btn ${btnClass} btn-sm" onclick="abrirDetalles(${cita.id})" style="flex:1;">
                        ${textoBtn}
                    </button>
                    ${botonesExtra}
                </div>
            `;
            cont.appendChild(card);
        });

        // Actualizar el globito rojo del logo
        if (window.actualizarBadge) window.actualizarBadge(totalSinLeer);

    } catch (error) { console.error(error); cont.innerHTML = "<p>Error de conexión.</p>"; }
}

// 3. ABRIR DETALLES
window.abrirDetalles = async (citaId) => {
    currentCitaId = citaId;
    const modal = document.getElementById("detailsModal");
    const token = localStorage.getItem("token");
    
    // También normalizamos aquí el rol para los botones dentro del modal
    const roleRaw = localStorage.getItem("userRole");
    const role = roleRaw ? roleRaw.toLowerCase() : "";

    try {
        const res = await fetch(`${API_URL}/api/citas/${citaId}`, {
            headers: { "Authorization": "Bearer " + token }
        });
        if (!res.ok) throw new Error("Error");
        const cita = await res.json();

        document.getElementById("detFecha").textContent = new Date(cita.fecha).toLocaleDateString();
        document.getElementById("detHora").textContent = cita.hora;
        document.getElementById("detDireccion").textContent = cita.direccion_servicio || "---";
        document.getElementById("detMotivo").textContent = cita.motivo;
        
        const badge = document.getElementById("detEstado");
        badge.textContent = cita.estado;
        badge.className = `badge estado ${cita.estado.toLowerCase()}`;

        // Foto Problema
        const fotoContainer = document.getElementById("detFotoProblema");
        if(fotoContainer) {
            fotoContainer.innerHTML = ""; 
            if (cita.foto_problema) {
                fotoContainer.innerHTML = `
                    <div style="margin-top:10px; border:1px solid #eee; padding:5px; border-radius:8px;">
                        <strong style="font-size:0.9rem; color:#666;">📸 Foto del problema:</strong>
                        <img src="${API_URL}/uploads/citas/${cita.foto_problema}" 
                             style="width:100%; max-height:200px; object-fit:cover; border-radius:8px; margin-top:5px; cursor:pointer;"
                             onclick="window.open(this.src)">
                    </div>`;
            }
        }

        // Botones de aceptar/rechazar dentro del modal (Solo Trabajador y Pendiente)
        const actionBtns = document.getElementById("actionButtons");
        if (role === 'trabajador' && cita.estado === 'PENDIENTE') {
            actionBtns.style.display = "flex";
            document.getElementById("btnAcceptJob").onclick = () => actualizarEstado(citaId, 'ACEPTADA');
            document.getElementById("btnRejectJob").onclick = () => actualizarEstado(citaId, 'RECHAZADA');
        } else {
            actionBtns.style.display = "none";
        }

        await cargarChat(citaId);
        cargarCitas(); // Refrescar fondo para quitar notificaciones

        if (chatInterval) clearInterval(chatInterval);
        chatInterval = setInterval(() => cargarChat(citaId, false), 4000);

        modal.style.display = "flex";
    } catch (e) { console.error(e); }
};

// 4. CHAT
async function cargarChat(citaId, scroll = true) {
    const chatDiv = document.getElementById("chatMessages");
    const token = localStorage.getItem("token");
    if(!token) return;
    
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const myId = JSON.parse(decodeURIComponent(window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''))).id;

    try {
        const res = await fetch(`${API_URL}/api/chat/${citaId}`, {
            headers: { "Authorization": "Bearer " + token }
        });
        const mensajes = await res.json();

        chatDiv.innerHTML = "";
        if (mensajes.length === 0) chatDiv.innerHTML = "<p style='text-align:center; color:#ccc; margin-top:50px;'>Inicia la conversación.</p>";

        mensajes.forEach(msg => {
            const isMe = msg.usuario_id === myId;
            const div = document.createElement("div");
            div.className = `message ${isMe ? 'me' : 'them'}`; 
            
            let contenido = "";
            if (msg.archivo_adjunto) contenido += `<img src="${API_URL}/uploads/chat/${msg.archivo_adjunto}" onclick="window.open(this.src)">`;
            if (msg.mensaje) contenido += `<div>${msg.mensaje}</div>`;
            
            const hora = new Date(msg.fecha_envio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            contenido += `<span class="message-time">${msg.nombre} • ${hora}</span>`;
            div.innerHTML = contenido;
            chatDiv.appendChild(div);
        });

        if (scroll) chatDiv.scrollTop = chatDiv.scrollHeight;
    } catch (e) { console.error("Error chat", e); }
}

const chatForm = document.getElementById("chatForm");
if(chatForm) {
    chatForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!currentCitaId) return;
        const input = document.getElementById("chatInput");
        const fileInput = document.getElementById("chatFile");
        if (!input.value.trim() && fileInput.files.length === 0) return;

        const formData = new FormData();
        formData.append("cita_id", currentCitaId);
        formData.append("mensaje", input.value);
        if (fileInput.files.length > 0) formData.append("adjunto", fileInput.files[0]);

        try {
            await fetch(`${API_URL}/api/chat/enviar`, {
                method: "POST",
                headers: { "Authorization": "Bearer " + localStorage.getItem("token") },
                body: formData
            });
            input.value = "";
            fileInput.value = "";
            document.getElementById("fileNameDisplay").style.display = "none";
            cargarChat(currentCitaId);
        } catch (e) { console.error(e); }
    });
}

document.getElementById("chatFile")?.addEventListener("change", function() {
    const span = document.getElementById("fileNameDisplay");
    if (this.files.length > 0) { span.style.display = "inline"; span.textContent = "📷 Foto lista"; } 
    else { span.style.display = "none"; }
});

window.cerrarDetalles = () => {
    document.getElementById("detailsModal").style.display = 'none';
    if (chatInterval) clearInterval(chatInterval);
    cargarCitas();
};

window.actualizarEstado = async (id, estado) => {
    const token = localStorage.getItem("token");
    
    // Alerta Bonita Restaurada
    const result = await Swal.fire({
        title: '¿Confirmar acción?',
        text: `Cambiar estado a: ${estado}`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e37c2a',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, confirmar'
    });

    if (!result.isConfirmed) return;

    try {
        const res = await fetch(`${API_URL}/api/citas/estado/${id}`, { 
            method: "PUT",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ estado })
        });
        if (res.ok) {
            await Swal.fire('¡Listo!', 'Estado actualizado.', 'success');
            window.location.reload(); 
        } else {
            Swal.fire("Error", "No se pudo actualizar.", "error");
        }
    } catch (error) { Swal.fire("Error", "Fallo de conexión.", "error"); }
};