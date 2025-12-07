document.addEventListener("DOMContentLoaded", () => {
    const API_URL = "http://localhost:4000"; 
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");

    console.log(`🚀 Iniciando Dashboard de ${role}...`);

    if (!token) {
        window.location.href = "/login.html";
        return;
    }

    // --- 1. CARGAR PERFIL ---
    async function cargarPerfil() {
        try {
            const res = await fetch(`${API_URL}/api/users/profile`, {
                headers: { "Authorization": "Bearer " + token }
            });

            if (res.ok) {
                const user = await res.json();
                
                const nameEl = document.getElementById("userName");
                const emailEl = document.getElementById("userEmail");
                const roleEl = document.getElementById("userRole");
                const dateEl = document.getElementById("userDate");

                if(nameEl) nameEl.textContent = `${user.nombre} ${user.apellidos || ""}`;
                if(emailEl) emailEl.textContent = user.correo;
                if(roleEl) roleEl.textContent = user.tipo_usuario.toUpperCase();

                if(dateEl) {
                    if (user.tipo_usuario === "trabajador") {
                        dateEl.textContent = user.oficio || "Oficio no especificado";
                    } else {
                        dateEl.textContent = user.domicilio || "Domicilio no especificado";
                    }
                }
            }
        } catch (err) {
            console.error("Error perfil:", err);
        }
    }

    // --- 2. CARGAR CITAS ---
    async function cargarCitas() {
        const cont = document.getElementById("listaCitas");
        const kpiCitas = document.getElementById("kpiCitas");
        
        if (!cont) return;

        try {
            const res = await fetch(`${API_URL}/api/citas`, {
                headers: { "Authorization": "Bearer " + token }
            });

            if (!res.ok) {
                cont.innerHTML = "<p><em>No hay citas pendientes o sistema en mantenimiento.</em></p>";
                return;
            }

            const citas = await res.json();
            cont.innerHTML = ""; 

            if(kpiCitas) kpiCitas.textContent = citas.length;

            if (citas.length === 0) {
                cont.innerHTML = "<p>No tienes citas próximas.</p>";
                return;
            }

            citas.forEach(cita => {
                const fecha = new Date(cita.fecha).toLocaleDateString();
                const etiquetaOtro = role === 'trabajador' ? 'Cliente' : 'Trabajador';
                const nombreOtro = cita.otro_nombre ? `${cita.otro_nombre} ${cita.otro_apellidos || ''}` : 'Usuario';

                const card = document.createElement("div");
                card.className = "card";
                card.innerHTML = `
                    <h3>📅 ${fecha} — ${cita.hora ? cita.hora.slice(0,5) : 'Hora pendiente'}</h3>
                    <p><strong>${etiquetaOtro}:</strong> ${nombreOtro}</p>
                    <p><strong>Motivo:</strong> ${cita.motivo || "Sin descripción"}</p>
                    <p><strong>Estado:</strong> <span class="estado ${cita.estado}">${cita.estado.toUpperCase()}</span></p>

                    <div class="hero-actions" style="margin-top:10px;">
                        ${generarBotones(cita, role)}
                    </div>
                `;
                cont.appendChild(card);
            });

        } catch (error) {
            console.error("Error citas:", error);
            cont.innerHTML = "<p>No se pudo conectar con el servidor de citas.</p>";
        }
    }

    function generarBotones(cita, rolUsuario) {
        if (cita.estado === "completada" || cita.estado === "rechazada" || cita.estado === "cancelada") {
            return `<button class="btn btn-muted" disabled>${cita.estado.toUpperCase()}</button>`;
        }

        if (rolUsuario === 'trabajador') {
            if (cita.estado === "pendiente") {
                return `
                    <button class="btn btn-primary" onclick="actualizarEstado(${cita.id}, 'aceptada')">Aceptar</button>
                    <button class="btn btn-muted" onclick="actualizarEstado(${cita.id}, 'rechazada')">Rechazar</button>
                `;
            }
            if (cita.estado === "aceptada") {
                return `
                    <button class="btn btn-primary" onclick="actualizarEstado(${cita.id}, 'completada')">Terminar Trabajo</button>
                    <button class="btn btn-muted" onclick="actualizarEstado(${cita.id}, 'cancelada')">Cancelar Cita</button>
                `;
            }
        } else {
            if (cita.estado === "pendiente" || cita.estado === "aceptada") {
                return `<button class="btn btn-muted" onclick="actualizarEstado(${cita.id}, 'cancelada')">Cancelar Solicitud</button>`;
            }
        }
        return "";
    }

    cargarPerfil();
    cargarCitas();
});

// --- FUNCIÓN GLOBAL CON ALERTAS BONITAS ---
window.actualizarEstado = async function(id, estado) {
    const API_URL = "http://localhost:4000"; 
    const token = localStorage.getItem("token");
    
    // 1. PREGUNTAR PRIMERO (SweetAlert)
    const result = await Swal.fire({
        title: '¿Confirmar acción?',
        text: `Se cambiará el estado a: ${estado.toUpperCase()}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#e37c2a',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, confirmar',
        cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return; // Si cancela, no hacemos nada

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
            // 2. ÉXITO (SweetAlert)
            await Swal.fire({
                title: '¡Actualizado!',
                text: 'El estado de la cita ha cambiado.',
                icon: 'success',
                confirmButtonColor: '#e37c2a'
            });
            window.location.reload(); 
        } else {
            const data = await res.json();
            Swal.fire("Error", data.error || "No se pudo actualizar.", "error");
        }
    } catch (error) {
        console.error(error);
        Swal.fire("Error", "Fallo de conexión.", "error");
    }
}