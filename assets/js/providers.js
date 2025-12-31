const API_URL = "http://localhost:4000";
let allWorkers = []; // Guardamos copia local para filtrar rápido

document.addEventListener("DOMContentLoaded", () => {
    cargarTrabajadores();
    
    // Filtro automático al escribir
    document.getElementById("searchName").addEventListener("keyup", filtrarTrabajadores);
    document.getElementById("searchJob").addEventListener("change", filtrarTrabajadores);
});

// 1. OBTENER TRABAJADORES
async function cargarTrabajadores() {
    const grid = document.getElementById("workersGrid");
    try {
        const res = await fetch(`${API_URL}/api/users/trabajadores`);
        allWorkers = await res.json();
        
        renderWorkers(allWorkers);
    } catch (error) {
        console.error(error);
        grid.innerHTML = "<p>Error al cargar proveedores.</p>";
    }
}

// 2. DIBUJAR TARJETAS
function renderWorkers(lista) {
    const grid = document.getElementById("workersGrid");
    grid.innerHTML = "";

    if (lista.length === 0) {
        grid.innerHTML = "<p>No se encontraron trabajadores con esos criterios.</p>";
        return;
    }

    lista.forEach(w => {
        const card = document.createElement("div");
        card.className = "worker-card";
        card.innerHTML = `
            <div class="worker-header">
                <div class="worker-avatar">👤</div>
            </div>
            <div class="worker-body">
                <h3>${w.nombre} ${w.apellidos || ''}</h3>
                <span class="worker-tag">${w.oficio || 'General'}</span>
                <p style="color:#666; font-size:0.9rem; margin-top:10px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                    ${w.descripcion || 'Sin descripción disponible.'}
                </p>
                <button class="btn btn-primary btn-sm" style="width:100%; margin-top:15px;" onclick="verDetalle(${w.id})">Ver Perfil</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// --- FUNCIÓN DE FILTRADO INTELIGENTE ---
function filtrarTrabajadores() {
    const nameFilter = normalizar(document.getElementById("searchName").value);
    const jobFilter = document.getElementById("searchJob").value; // Valor del select

    const filtrados = allWorkers.filter(w => {
        // Normalizamos los datos del trabajador para comparar sin acentos ni mayúsculas
        const nombreCompleto = normalizar(`${w.nombre} ${w.apellidos}`);
        const oficioWorker = normalizar(w.oficio || "");
        const descWorker = normalizar(w.descripcion || "");

        // 1. Filtro por Nombre (búsqueda parcial)
        const matchName = nombreCompleto.includes(nameFilter);

        // 2. Filtro por Oficio (Lógica flexible)
        let matchJob = true; // Si no hay filtro seleccionado, pasa todo

        if (jobFilter !== "") {
            // Palabras clave según la selección
            const keywords = obtenerPalabrasClave(jobFilter);
            
            // Verificamos si alguna palabra clave está en el oficio o descripción del trabajador
            matchJob = keywords.some(k => oficioWorker.includes(k) || descWorker.includes(k));
        }

        return matchName && matchJob;
    });

    renderWorkers(filtrados);
}

// --- AYUDANTES ---

// Quita acentos y pasa a minúsculas
function normalizar(texto) {
    return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Devuelve raíces de palabras para búsqueda flexible
function obtenerPalabrasClave(categoria) {
    const cat = normalizar(categoria);
    
    if (cat.includes("plomer")) return ["plom", "fontan", "tuber"];
    if (cat.includes("electric")) return ["electri", "luz", "cabl"];
    if (cat.includes("albanil")) return ["albanil", "construp", "muro", "piso"];
    if (cat.includes("limpieza")) return ["limpie", "aseo", "domestic"];
    if (cat.includes("carpint")) return ["carpint", "mueble", "madera"];
    if (cat.includes("jardin")) return ["jardin", "pasto", "podar"];
    if (cat.includes("pint")) return ["pint", "imperme"];
    
    // Si es "Otros" o no identificado, buscamos la palabra tal cual
    return [cat];
}

// 4. MODALES Y CONTRATACIÓN
let selectedWorker = null;

// Hacemos global la función verDetalle
window.verDetalle = (id) => {
    selectedWorker = allWorkers.find(w => w.id === id);
    if(!selectedWorker) return;

    // Llenar datos de texto
    document.getElementById("modalName").textContent = `${selectedWorker.nombre} ${selectedWorker.apellidos || ''}`;
    document.getElementById("modalJob").textContent = selectedWorker.oficio || 'General';
    document.getElementById("modalDesc").textContent = selectedWorker.carta_presentacion || selectedWorker.descripcion || "Sin descripción detallada.";
    document.getElementById("modalRates").textContent = selectedWorker.tarifas || "Preguntar por mensaje";
    
    // Configurar botón
    document.getElementById("btnOpenHire").onclick = () => abrirBooking(selectedWorker);

    // --- NUEVO: CARGAR FOTOS ---
    cargarFotosModal(id);
    // ---------------------------

    document.getElementById("detailModal").style.display = "flex";
}

// Función auxiliar para traer las fotos
async function cargarFotosModal(workerId) {
    const galleryDiv = document.getElementById("modalGallery");
    galleryDiv.innerHTML = "<p style='font-size:0.8rem; color:#666;'>Cargando evidencias...</p>";

    try {
        const res = await fetch(`${API_URL}/api/users/evidencia/${workerId}`);
        const fotos = await res.json();

        galleryDiv.innerHTML = "";

        if (fotos.length === 0) {
            galleryDiv.innerHTML = "<p style='font-size:0.8rem; color:#999; font-style:italic;'>Este trabajador aún no ha subido fotos.</p>";
            return;
        }

        fotos.forEach(f => {
            // Creamos una imagen pequeña
            const imgUrl = `${API_URL}/uploads/trabajos/${f.ruta_foto}`;
            
            const img = document.createElement("img");
            img.src = imgUrl;
            img.style.width = "80px";
            img.style.height = "80px";
            img.style.objectFit = "cover";
            img.style.borderRadius = "4px";
            img.style.cursor = "pointer";
            img.title = f.descripcion || "";
            
            // Al hacer clic, mostramos la foto en grande con SweetAlert
            img.onclick = () => {
                Swal.fire({
                    imageUrl: imgUrl,
                    imageAlt: 'Evidencia',
                    text: f.descripcion || '',
                    showConfirmButton: false,
                    showCloseButton: true
                });
            };

            galleryDiv.appendChild(img);
        });

    } catch (e) {
        console.error(e);
        galleryDiv.innerHTML = "<p style='color:red; font-size:0.8rem;'>Error al cargar fotos</p>";
    }
}

function abrirBooking(worker) {
    cerrarModal("detailModal"); // Cierra el detalle
    document.getElementById("bookingWorkerId").value = worker.id;
    document.getElementById("bookingTargetName").textContent = worker.nombre;
    
    // --- VALIDACIÓN DE FECHA MÍNIMA ---
    const dateInput = document.getElementById("bookDate");
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    dateInput.value = today; 
    // ----------------------------------

    document.getElementById("bookingModal").style.display = "flex";
}

// Hacemos global cerrarModal
window.cerrarModal = (id) => {
    document.getElementById(id).style.display = "none";
}

// 5. ENVIAR SOLICITUD DE CITA
document.getElementById("bookingForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return Swal.fire("Error", "Debes iniciar sesión para contratar.", "warning");

    // --- VALIDACIÓN DE FECHA ---
    const selectedDate = document.getElementById("bookDate").value;
    const today = new Date().toISOString().split('T')[0];

    if (selectedDate < today) {
        return Swal.fire("Fecha inválida", "No puedes agendar citas en el pasado.", "error");
    }

    const data = {
        trabajador_id: document.getElementById("bookingWorkerId").value,
        fecha: document.getElementById("bookDate").value,
        hora: document.getElementById("bookTime").value,
        direccion_servicio: document.getElementById("bookAddress").value,
        motivo: document.getElementById("bookReason").value
    };

    try {
        const res = await fetch(`${API_URL}/api/citas/crear`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token 
            },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            Swal.fire({
                title: '¡Solicitud Enviada!',
                text: 'El trabajador recibirá tu petición. Revisa tu calendario.',
                icon: 'success',
                confirmButtonColor: '#e37c2a',
                confirmButtonText: 'Ir a Calendario'
            }).then(() => {
                cerrarModal("bookingModal");
                window.location.href = "calendar.html";
            });
        } else {
            // Manejo de token expirado
            if (res.status === 401 || res.status === 403) {
                Swal.fire("Sesión expirada", "Por favor inicia sesión nuevamente.", "warning")
                .then(() => {
                    localStorage.clear();
                    window.location.href = "/login.html";
                });
                return;
            }

            const err = await res.json();
            Swal.fire("Ups...", err.error || "No se pudo agendar.", "error");
        }
    } catch (error) {
        console.error(error);
        Swal.fire("Error", "Fallo de conexión", "error");
    }
});

// --- FUNCIÓN PARA LLENAR DIRECCIÓN AUTOMÁTICAMENTE (HACERLA GLOBAL) ---
window.usarDireccionRegistrada = async function() {
    const token = localStorage.getItem("token");
    if (!token) return;

    const inputDir = document.getElementById("bookAddress");
    const originalPlaceholder = inputDir.placeholder || "Calle, Número, Colonia...";
    
    // Feedback visual
    inputDir.value = "Cargando dirección...";
    inputDir.disabled = true;

    try {
        const res = await fetch(`${API_URL}/api/users/profile`, {
            headers: { "Authorization": "Bearer " + token }
        });

        if (res.ok) {
            const user = await res.json();
            
            if (user.domicilio && user.domicilio.trim().length > 0) {
                inputDir.value = user.domicilio;
            } else {
                inputDir.value = "";
                Swal.fire("Aviso", "No tienes una dirección guardada en tu perfil.", "info");
            }
        } else {
            inputDir.value = "";
            console.error("Error al obtener perfil");
        }
    } catch (error) {
        console.error(error);
        inputDir.value = "";
        Swal.fire("Error", "No se pudo obtener tu dirección.", "error");
    } finally {
        inputDir.disabled = false;
        inputDir.placeholder = originalPlaceholder;
    }
};
document.getElementById("bookingForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return Swal.fire("Error", "Debes iniciar sesión.", "warning");

    // --- VALIDACIÓN FECHA ---
    const selectedDate = document.getElementById("bookDate").value;
    const today = new Date().toISOString().split('T')[0];
    if (selectedDate < today) return Swal.fire("Error", "Fecha inválida.", "error");

    // --- NUEVO: USAR FORMDATA PARA ENVIAR FOTO ---
    const formData = new FormData();
    formData.append("trabajador_id", document.getElementById("bookingWorkerId").value);
    formData.append("fecha", document.getElementById("bookDate").value);
    formData.append("hora", document.getElementById("bookTime").value);
    formData.append("direccion_servicio", document.getElementById("bookAddress").value);
    formData.append("motivo", document.getElementById("bookReason").value);
    
    // Adjuntar foto si existe
    const fileInput = document.getElementById("bookPhoto");
    if(fileInput.files.length > 0) {
        formData.append("foto_problema", fileInput.files[0]);
    }

    try {
        // Nota: Al usar FormData, NO ponemos Content-Type header manualmente
        const res = await fetch(`${API_URL}/api/citas/crear`, {
            method: "POST",
            headers: { "Authorization": "Bearer " + token },
            body: formData
        });

        if (res.ok) {
            Swal.fire({
                title: '¡Solicitud Enviada!',
                text: 'El trabajador verá tu foto y descripción.',
                icon: 'success',
                confirmButtonColor: '#e37c2a',
                confirmButtonText: 'Ir a Calendario'
            }).then(() => {
                window.location.href = "calendar.html"; // O dashboard
            });
        } else {
            const err = await res.json();
            Swal.fire("Error", err.error || "No se pudo agendar.", "error");
        }
    } catch (error) {
        console.error(error);
        Swal.fire("Error", "Fallo de conexión", "error");
    }
});