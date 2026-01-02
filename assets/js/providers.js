const API_URL = "https://chambitas-backend-ncie.onrender.com";
let allWorkers = []; 

document.addEventListener("DOMContentLoaded", () => {
    cargarTrabajadores();
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

// 2. DIBUJAR TARJETAS (CON TELÉFONO Y FOTO DE PERFIL)
function renderWorkers(lista) {
    const grid = document.getElementById("workersGrid");
    grid.innerHTML = "";

    if (lista.length === 0) {
        grid.innerHTML = "<p>No se encontraron trabajadores.</p>";
        return;
    }

    lista.forEach(w => {
        const card = document.createElement("div");
        card.className = "worker-card";
        
        // Verificamos si tiene foto de perfil, si no, usamos el icono por defecto
        const fotoPerfil = w.foto_perfil 
            ? `<img src="${API_URL}/uploads/perfiles/${w.foto_perfil}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">` 
            : '👤';

        card.innerHTML = `
            <div class="worker-header">
                <div class="worker-avatar">${fotoPerfil}</div>
            </div>
            <div class="worker-body">
                <h3>${w.nombre} ${w.apellidos || ''}</h3>
                <span class="worker-tag">${w.oficio || 'General'}</span>
                
                <p style="color:#1f5478; font-size:0.85rem; font-weight:bold; margin-top:10px; margin-bottom:5px;">
                    📞 Tel: ${w.telefono || 'No disponible'}
                </p>

                <p style="color:#666; font-size:0.9rem; margin-top:5px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                    ${w.descripcion || 'Sin descripción disponible.'}
                </p>
                <button class="btn btn-primary btn-sm" style="width:100%; margin-top:15px;" onclick="verDetalle(${w.id})">Ver Perfil</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// 3. FILTRADO Y AYUDANTES
function filtrarTrabajadores() {
    const nameFilter = normalizar(document.getElementById("searchName").value);
    const jobFilter = document.getElementById("searchJob").value;

    const filtrados = allWorkers.filter(w => {
        const nombreCompleto = normalizar(`${w.nombre} ${w.apellidos}`);
        const oficioWorker = normalizar(w.oficio || "");
        const descWorker = normalizar(w.descripcion || "");
        const matchName = nombreCompleto.includes(nameFilter);
        let matchJob = jobFilter === "" || obtenerPalabrasClave(jobFilter).some(k => oficioWorker.includes(k) || descWorker.includes(k));
        return matchName && matchJob;
    });
    renderWorkers(filtrados);
}

function normalizar(texto) {
    return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function obtenerPalabrasClave(categoria) {
    const cat = normalizar(categoria);
    if (cat.includes("plomer")) return ["plom", "fontan", "tuber"];
    if (cat.includes("electric")) return ["electri", "luz", "cabl"];
    if (cat.includes("albanil")) return ["albanil", "construp", "muro", "piso"];
    if (cat.includes("limpieza")) return ["limpie", "aseo", "domestic"];
    if (cat.includes("carpint")) return ["carpint", "mueble", "madera"];
    if (cat.includes("jardin")) return ["jardin", "pasto", "podar"];
    if (cat.includes("pint")) return ["pint", "imperme"];
    return [cat];
}

// 4. MODALES Y DETALLES
let selectedWorker = null;

window.verDetalle = (id) => {
    selectedWorker = allWorkers.find(w => w.id === id);
    if(!selectedWorker) return;

    document.getElementById("modalName").textContent = `${selectedWorker.nombre} ${selectedWorker.apellidos || ''}`;
    document.getElementById("modalJob").textContent = selectedWorker.oficio || 'General';
    document.getElementById("modalDesc").textContent = selectedWorker.carta_presentacion || selectedWorker.descripcion || "Sin descripción.";
    document.getElementById("modalRates").textContent = selectedWorker.tarifas || "Consultar por chat";
    
    document.getElementById("btnOpenHire").onclick = () => abrirBooking(selectedWorker);
    cargarFotosModal(id);
    document.getElementById("detailModal").style.display = "flex";
}

async function cargarFotosModal(workerId) {
    const galleryDiv = document.getElementById("modalGallery");
    galleryDiv.innerHTML = "<p style='font-size:0.8rem; color:#666;'>Cargando evidencias...</p>";
    try {
        const res = await fetch(`${API_URL}/api/users/evidencia/${workerId}`);
        const fotos = await res.json();
        galleryDiv.innerHTML = "";
        if (fotos.length === 0) {
            galleryDiv.innerHTML = "<p style='font-size:0.8rem; color:#999;'>Sin fotos previas.</p>";
            return;
        }
        fotos.forEach(f => {
            const imgUrl = `${API_URL}/uploads/trabajos/${f.ruta_foto}`;
            const img = document.createElement("img");
            img.src = imgUrl;
            img.style.width = "80px"; img.style.height = "80px"; img.style.objectFit = "cover"; img.style.borderRadius = "4px"; img.style.cursor = "pointer";
            img.onclick = () => Swal.fire({ imageUrl: imgUrl, text: f.descripcion || '', showConfirmButton: false, showCloseButton: true });
            galleryDiv.appendChild(img);
        });
    } catch (e) { console.error(e); }
}

// 5. FLUJO DE CONTRATACIÓN (UNIFICADO PARA EVITAR DOBLE SOLICITUD)
function abrirBooking(worker) {
    cerrarModal("detailModal");
    document.getElementById("bookingWorkerId").value = worker.id;
    document.getElementById("bookingTargetName").textContent = worker.nombre;
    const dateInput = document.getElementById("bookDate");
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    dateInput.value = today; 
    document.getElementById("bookingModal").style.display = "flex";
}

window.cerrarModal = (id) => {
    document.getElementById(id).style.display = "none";
}

// --- ÚNICO EVENTO DE ENVÍO USANDO FORMDATA ---
document.getElementById("bookingForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return Swal.fire("Error", "Debes iniciar sesión.", "warning");

    const formData = new FormData();
    formData.append("trabajador_id", document.getElementById("bookingWorkerId").value);
    formData.append("fecha", document.getElementById("bookDate").value);
    formData.append("hora", document.getElementById("bookTime").value);
    formData.append("direccion_servicio", document.getElementById("bookAddress").value);
    formData.append("motivo", document.getElementById("bookReason").value);
    
    const fileInput = document.getElementById("bookPhoto");
    if(fileInput.files.length > 0) {
        formData.append("foto_problema", fileInput.files[0]);
    }

    try {
        const res = await fetch(`${API_URL}/api/citas/crear`, {
            method: "POST",
            headers: { "Authorization": "Bearer " + token },
            body: formData
        });

        if (res.ok) {
            Swal.fire({ title: '¡Solicitud Enviada!', icon: 'success' })
            .then(() => {
                cerrarModal("bookingModal");
                window.location.href = "calendar.html";
            });
        } else {
            const err = await res.json();
            Swal.fire("Error", err.error || "Fallo al agendar", "error");
        }
    } catch (error) {
        console.error(error);
        Swal.fire("Error", "Error de red", "error");
    }
});

window.usarDireccionRegistrada = async function() {
    const token = localStorage.getItem("token");
    if (!token) return;
    const inputDir = document.getElementById("bookAddress");
    inputDir.value = "Cargando...";
    try {
        const res = await fetch(`${API_URL}/api/users/profile`, {
            headers: { "Authorization": "Bearer " + token }
        });
        if (res.ok) {
            const user = await res.json();
            inputDir.value = user.domicilio || "";
        }
    } catch (e) { inputDir.value = ""; }
};