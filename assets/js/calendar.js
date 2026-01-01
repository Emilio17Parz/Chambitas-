document.addEventListener("DOMContentLoaded", () => {
    const API_URL = "https://chambitas-backend-ncie.onrender.com";
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole"); 

    if (!token) {
        window.location.href = "/login.html";
        return;
    }

    cargarCalendario();

    async function cargarCalendario() {
        const grid = document.getElementById("calendarGrid");
        if(!grid) return;
        
        grid.innerHTML = "<p>Cargando agenda...</p>";

        try {
            // CORRECCIÓN: Usar la ruta correcta 'mis-citas'
            const res = await fetch(`${API_URL}/api/citas/mis-citas`, {
                headers: { "Authorization": "Bearer " + token }
            });

            if (!res.ok) {
                grid.innerHTML = "<p>Error al cargar citas.</p>";
                return;
            }

            const citas = await res.json();
            grid.innerHTML = ""; 

            if (citas.length === 0) {
                grid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                        <h3>📅 Agenda libre</h3>
                        <p>No tienes citas programadas por el momento.</p>
                    </div>`;
                return;
            }

            citas.forEach(cita => {
                const fechaObj = new Date(cita.fecha);
                const fechaLegible = fechaObj.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                
                const etiquetaOtro = role === 'trabajador' ? '👤 Cliente' : '👷 Trabajador';
                const nombreOtro = cita.otro_nombre ? `${cita.otro_nombre} ${cita.otro_apellidos || ''}` : (cita.cliente_nombre || 'Usuario'); 

                const card = document.createElement("div");
                card.className = `card cita-item ${cita.estado}`; 
                card.style.borderLeft = `5px solid ${getColorEstado(cita.estado)}`;
                
                card.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h3>${cita.hora ? cita.hora.slice(0,5) : '--:--'} hrs</h3>
                        <span class="estado ${cita.estado}">${cita.estado.toUpperCase()}</span>
                    </div>
                    <p style="margin: 5px 0; font-weight:bold; color:#555;">${fechaLegible}</p>
                    <hr style="border:0; border-top:1px solid #eee; margin:10px 0;">
                    <p><strong>${etiquetaOtro}:</strong> ${nombreOtro}</p>
                    <p><strong>📍 Dirección:</strong> ${cita.direccion_servicio}</p>
                    <p><strong>💬 Motivo:</strong> ${cita.motivo}</p>
                    
                    <div class="hero-actions" style="margin-top:15px; display:flex; flex-direction:column; gap:10px;">
                        <button class="btn btn-primary btn-sm" onclick="window.location.href='dashboard.html'" style="width:100%">
                            💬 Ir al Chat (Ver en Dashboard)
                        </button>
                        ${generarBotones(cita, role)}
                    </div>
                `;
                grid.appendChild(card);
            });

        } catch (error) {
            console.error(error);
            grid.innerHTML = "<p>Error de conexión.</p>";
        }
    }

    function getColorEstado(estado) {
        switch(estado) {
            case 'pendiente': return '#f39c12';
            case 'aceptada': return '#27ae60';
            case 'completada': return '#2980b9';
            case 'rechazada': return '#c0392b';
            case 'cancelada': return '#7f8c8d';
            default: return '#ccc';
        }
    }

    function generarBotones(cita, rolUsuario) {
        if (cita.estado === 'completada' || cita.estado === 'rechazada') return '';

        let html = '<div style="display:flex; gap:10px; width:100%">';

        if (rolUsuario === 'trabajador') {
            if (cita.estado === 'pendiente') {
                html += `
                    <button class="btn btn-primary btn-sm" onclick="window.cambiarEstado(${cita.id}, 'aceptada')">Aceptar</button>
                    <button class="btn btn-muted btn-sm" onclick="window.cambiarEstado(${cita.id}, 'rechazada')">Rechazar</button>
                `;
            }
            if (cita.estado === 'aceptada') {
                html += `
                    <button class="btn btn-primary btn-sm" onclick="window.cambiarEstado(${cita.id}, 'completada')">Terminar Trabajo</button>
                    <button class="btn btn-muted btn-sm" onclick="window.cambiarEstado(${cita.id}, 'cancelada')">Cancelar</button>
                `;
            }
        } else {
            if (cita.estado === 'pendiente' || cita.estado === 'aceptada') {
                html += `
                    <button class="btn btn-muted btn-sm" onclick="window.cambiarEstado(${cita.id}, 'cancelada')">Cancelar Solicitud</button>
                `;
            }
        }
        html += '</div>';
        return html;
    }

    // --- FUNCIÓN GLOBAL CON SWEETALERT ---
    window.cambiarEstado = async (id, nuevoEstado) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: `Vas a cambiar el estado a: ${nuevoEstado.toUpperCase()}`,
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
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({ estado: nuevoEstado })
            });

            if (res.ok) {
                Swal.fire('¡Actualizado!', 'El estado ha cambiado.', 'success')
                .then(() => location.reload());
            } else {
                Swal.fire('Error', 'No se pudo actualizar.', 'error');
            }
        } catch (e) {
            console.error(e);
            Swal.fire('Error', 'Fallo de conexión.', 'error');
        }
    };
});