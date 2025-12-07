// assets/js/auth-guard.js
(function () {
    console.log("🛡️ AuthGuard v2 cargado"); // Console log para verificar que se actualizó

    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole"); 
    
    // Rutas
    const path = window.location.pathname; 
    const page = path.split("/").pop();   
    const publicPages = ["index.html", "login.html", "register.html", ""];

    // 1. Si es página pública, no hacemos nada
    if (publicPages.includes(page) && path.split("/").length <= 2) {
        return; 
    }

    // 2. Si no hay token, mandar al login
    if (!token) {
        console.warn("⛔ Sin sesión. Redirigiendo.");
        window.location.href = "/login.html"; // RUTA ABSOLUTA
        return;
    }

    // 3. Protección de carpetas (Trabajador vs Cliente)
    const isTrabajadorZone = path.includes("/trabajadores/");
    const isClienteZone = path.includes("/clientes/");

    if (isTrabajadorZone && role !== "trabajador") {
        window.location.href = (role === "cliente") ? "/clientes/dashboard.html" : "/login.html";
        return;
    }

    if (isClienteZone && role !== "cliente") {
        window.location.href = (role === "trabajador") ? "/trabajadores/dashboard.html" : "/login.html";
        return;
    }

    // 4. LÓGICA DE CERRAR SESIÓN (LOGOUT)
    // Esperamos a que el DOM cargue para buscar el botón
    document.addEventListener("DOMContentLoaded", () => {
        const logoutBtn = document.getElementById("logoutBtn");
        
        if (logoutBtn) {
            // Eliminamos listeners anteriores clonando el botón (truco para evitar duplicados)
            const newBtn = logoutBtn.cloneNode(true);
            logoutBtn.parentNode.replaceChild(newBtn, logoutBtn);

            newBtn.addEventListener("click", (e) => {
                e.preventDefault();
                console.log("👋 Cerrando sesión...");
                
                // Borrar datos
                localStorage.clear();

                // --- AQUÍ ESTÁ EL ARREGLO ---
                // Usamos "/" al inicio para ir a la RAÍZ del servidor
               window.location.href = window.location.origin + "/login.html"; 
               alert("Voy a intentar ir a: " + rutaDestino);
            });
        }
    });

})();