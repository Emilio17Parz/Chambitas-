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
