// Detectar si hay token
const token = localStorage.getItem("token");
const tipo = localStorage.getItem("tipo_usuario");

// Referencias al DOM
const logoutBtn = document.getElementById("logoutBtn");
const nav = document.querySelector(".main-nav");

// -------------------------
// 1. Si NO hay sesión
// -------------------------
if (!token) {
    if (logoutBtn) logoutBtn.style.display = "none";

    if (nav) {
        nav.innerHTML = `
            <a href="index.html" data-nav="inicio">Inicio</a>
            <a href="login.html" data-nav="login">Iniciar sesión</a>
            <a href="register.html" data-nav="registro">Registrarme</a>
        `;
    }
}
// -------------------------
// 2. Si SÍ hay sesión
// -------------------------
else {
    if (nav) {
        if (tipo === "cliente") {
            nav.innerHTML = `
                <a href="index.html" data-nav="inicio">Inicio</a>
                <a href="/clientes/providers.html" data-nav="proveedores">Proveedores</a>
                <a href="/clientes/calendar.html" data-nav="calendario">Calendario</a>
                <a href="/clientes/reviews.html" data-nav="reseñas">Reseñas</a>
                <a href="profile.html" data-nav="perfil">Perfil</a>
                <a href="/clientes/dashboard.html" data-nav="panel">Dashboard</a>
                <button class="btn btn-sm" id="logoutBtn">Cerrar Sesión</button>
            `;
        } 
        else if (tipo === "trabajador") {
            nav.innerHTML = `
                <a href="index.html" data-nav="inicio">Inicio</a>
                <a href="/trabajadores/clients.html" data-nav="clientes">Clientes</a>
                <a href="/trabajadores/calendar.html" data-nav="calendario">Calendario</a>
                <a href="/trabajadores/reviews.html" data-nav="reseñas">Reseñas</a>
                <a href="profile.html" data-nav="perfil">Perfil</a>
                <a href="/trabajadores/dashboard.html" data-nav="panel">Dashboard</a>
                <button class="btn btn-sm" id="logoutBtn">Cerrar Sesión</button>
            `;
        }
    }
}

// -------------------------
// 3. Cerrar sesión
// -------------------------
document.addEventListener("click", (e) => {
    if (e.target.id === "logoutBtn") {
        localStorage.removeItem("token");
        localStorage.removeItem("tipo_usuario");
        localStorage.removeItem("nombre_usuario");

        // La barra al inicio le dice: "Vete a la carpeta raíz, no busques aquí dentro"
        window.location.href = "/login.html";
    }
});

// --- LÓGICA DEL MENÚ HAMBURGUESA ---
document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.querySelector(".menu-toggle");
    const siteHeader = document.querySelector(".site-header");
    const navLinks = document.querySelectorAll(".main-nav a");

    if (menuToggle && siteHeader) {
        // Al hacer clic en el botón de hamburguesa
        menuToggle.addEventListener("click", () => {
            siteHeader.classList.toggle("open");
        });

        // Opcional: Cerrar menú al hacer clic en un enlace (mejor UX en móvil)
        navLinks.forEach(link => {
            link.addEventListener("click", () => {
                siteHeader.classList.remove("open");
            });
        });
    }
});
/* =========================================
   SISTEMA DE NOTIFICACIONES (LOGO)
   ========================================= */
document.addEventListener("DOMContentLoaded", () => {
    // 1. Inyectar HTML del Dropdown y Badge si no existen
    const brandDiv = document.querySelector(".brand");
    if (brandDiv) {
        // Badge
        const badge = document.createElement("div");
        badge.id = "notifBadge";
        badge.className = "notif-badge";
        badge.innerText = "0";
        brandDiv.appendChild(badge);

        // Dropdown
        const dropdown = document.createElement("div");
        dropdown.id = "notifDropdown";
        dropdown.className = "notif-dropdown";
        dropdown.innerHTML = `
            <h4>🔔 Notificaciones</h4>
            <div id="notifContent">
                <p>No tienes mensajes nuevos.</p>
            </div>
        `;
        document.body.appendChild(dropdown); // Lo agregamos al body para posicionarlo mejor o dentro del container

        // 2. Modificar comportamiento del Logo
        const logoLink = brandDiv.querySelector("a");
        if (logoLink) {
            logoLink.addEventListener("click", (e) => {
                e.preventDefault(); // Evitar ir al home
                toggleNotifDropdown();
            });
        }
    }
});

function toggleNotifDropdown() {
    const drop = document.getElementById("notifDropdown");
    const isVisible = drop.style.display === "block";
    drop.style.display = isVisible ? "none" : "block";
}

// Función global para actualizar notificaciones desde el Dashboard
window.actualizarNotificacionesUI = (totalSinLeer) => {
    const badge = document.getElementById("notifBadge");
    const content = document.getElementById("notifContent");
    const drop = document.getElementById("notifDropdown");

    if (totalSinLeer > 0) {
        // Mostrar Badge
        badge.style.display = "flex";
        badge.innerText = totalSinLeer;
        
        // Actualizar contenido del dropdown
        content.innerHTML = `
            <p>Tienes <strong>${totalSinLeer}</strong> mensaje(s) sin leer en tus citas.</p>
            <a href="dashboard.html" class="notif-btn-action" onclick="document.getElementById('notifDropdown').style.display='none'">
                Ir al Dashboard
            </a>
        `;
    } else {
        badge.style.display = "none";
        content.innerHTML = "<p>✅ Estás al día. No hay mensajes nuevos.</p>";
    }
};

// Cerrar dropdown si hago clic fuera
document.addEventListener("click", (e) => {
    const drop = document.getElementById("notifDropdown");
    const brand = document.querySelector(".brand");
    if (drop && drop.style.display === "block" && !brand.contains(e.target) && !drop.contains(e.target)) {
        drop.style.display = "none";
    }
});