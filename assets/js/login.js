const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const correo = document.getElementById("correo").value;
        const contraseña = document.getElementById("contraseña").value;
        const tipo_usuario = document.getElementById("tipo").value;

        try {
            const res = await fetch("http://localhost:3000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ correo, contraseña }),
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error || "Error en el inicio de sesión");
                return;
            }

            // Guardar sesión
            localStorage.setItem("token", data.token);
            localStorage.setItem("tipo_usuario", data.tipo);
            localStorage.setItem("nombre_usuario", data.nombre);

            // Redirección por rol
            if (data.tipo === "cliente") {
                window.location.href = "/clientes/providers.html";
            } else {
                window.location.href = "/trabajadores/dashboard.html";
            }

        } catch (err) {
            console.error(err);
            alert("No se pudo conectar al servidor.");
        }
    });
}
