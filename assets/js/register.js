const API_URL = "http://localhost:4000";

document.addEventListener("DOMContentLoaded", () => {
    // Lógica de Tabs
    const tabs = document.querySelectorAll(".tab");
    const panels = {
        trabajador: document.getElementById("formTrabajador"),
        cliente: document.getElementById("formCliente")
    };

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            const role = tab.getAttribute("data-role-tab");
            Object.values(panels).forEach(form => form.style.display = "none");
            if(panels[role]) panels[role].style.display = "block"; 
        });
    });

    function mostrarMensaje(msg, tipo) {
        const div = document.getElementById("mensajeFeedback");
        div.textContent = msg;
        div.style.display = "block";
        div.className = "mensaje-estado " + (tipo === "error" ? "mensaje-error" : "mensaje-exito");
        div.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    async function handleRegister(e) {
        e.preventDefault();
        const form = e.target;
        
        // --- TRUCO DE DIRECCIÓN: Unimos los campos ---
        const calle = form.querySelector(".calle").value.trim();
        const numero = form.querySelector(".numero").value.trim();
        const colonia = form.querySelector(".colonia").value.trim();
        const ciudad = form.querySelector(".ciudad").value.trim();

        // Creamos la dirección exacta para que el Mapa no falle
        // Ej: "Av Reforma 222, Juarez, CDMX, Mexico"
        const direccionFull = `${calle} ${numero}, ${colonia}, ${ciudad}, México`;

        // Lo metemos en el input oculto que se llama 'domicilio'
        form.querySelector(".domicilio-final").value = direccionFull;
        // ----------------------------------------------

        const formData = new FormData(form);

        // Validaciones...
        const ineFile = formData.get('ine');
        if (!ineFile || ineFile.size === 0) {
            mostrarMensaje("Por favor, adjunta tu INE o documento.", "error");
            return;
        }

        mostrarMensaje("Enviando datos...", "exito");
        const btnSubmit = form.querySelector("button");
        const originalText = btnSubmit.textContent;
        btnSubmit.disabled = true;
        btnSubmit.textContent = "Procesando...";

        try {
            const res = await fetch(`${API_URL}/api/auth/register`, {
                method: "POST",
                body: formData 
            });
            const data = await res.json();

            if (!res.ok) {
                mostrarMensaje(data.error || data.message || "Error al registrar.", "error");
                btnSubmit.disabled = false;
                btnSubmit.textContent = originalText;
                return;
            }

            mostrarMensaje("¡Registro exitoso! Redirigiendo...", "exito");
            setTimeout(() => { window.location.href = "login.html"; }, 2000);

        } catch (err) {
            console.error(err);
            mostrarMensaje("Error de conexión.", "error");
            btnSubmit.disabled = false;
            btnSubmit.textContent = originalText;
        }
    }

    if (panels.trabajador) panels.trabajador.addEventListener("submit", handleRegister);
    if (panels.cliente) panels.cliente.addEventListener("submit", handleRegister);
});