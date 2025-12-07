import os
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Carpetas a ignorar
IGNORE_DIRS = {'node_modules', '.git', '.vscode', 'dist', 'build'}

print("=== INSPECCIÓN DEL PROYECTO BACKEND ===\n")

# -----------------------------
# 1. Listar estructura de carpetas
# -----------------------------
print("📁 Estructura del backend (ignorando node_modules):\n")

for root, dirs, files in os.walk(BASE_DIR):
    # --- MODIFICACIÓN: Filtrar carpetas ignoradas ---
    # Modificamos la lista 'dirs' en el lugar (in-place) para que os.walk no entre en ellas
    dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
    # -----------------------------------------------

    level = root.replace(BASE_DIR, "").count(os.sep)
    indent = "  " * level
    print(f"{indent}{os.path.basename(root)}/")
    for f in files:
        print(f"{indent}  - {f}")
print("\n========================================\n")

# -----------------------------
# 2. Buscar imports en los .js
# -----------------------------
print("🔍 Analizando imports en archivos .js...\n")

IMPORT_REGEX = re.compile(r'import\s+(?:[\w\{\},\s\*]+)\s+from\s+[\'"](.*?)[\'"]')

missing_files = []
duplicated_routes = {}

for root, dirs, files in os.walk(BASE_DIR):
    # --- MODIFICACIÓN: Filtrar carpetas ignoradas ---
    # Es CRÍTICO hacerlo aquí también para no analizar miles de archivos de librerías
    dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
    # -----------------------------------------------

    for file in files:
        if file.endswith(".js"):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, "r", encoding="utf8") as f:
                    content = f.read()

                imports = IMPORT_REGEX.findall(content)

                for imp in imports:
                    # Normalizar ruta
                    imp_path = imp
                    if imp_path.startswith("."):
                        resolved_path = os.path.abspath(os.path.join(root, imp_path))
                        resolved_path_js = resolved_path + ".js"

                        # Verificar existencia
                        if not os.path.exists(resolved_path) and not os.path.exists(resolved_path_js):
                            missing_files.append((file, imp, resolved_path_js))

                    # Detectar rutas duplicadas (conteo simple)
                    if "routes" in imp_path:
                        duplicated_routes.setdefault(imp_path, 0)
                        duplicated_routes[imp_path] += 1
            except Exception as e:
                print(f"⚠ No se pudo leer el archivo {file}: {e}")

print("=== RESULTADOS ===\n")

# -----------------------------
# 3. Reporte de archivos faltantes
# -----------------------------
print("❌ Archivos importados pero NO encontrados:\n")
if missing_files:
    for file, imp, path in missing_files:
        print(f"  - {file} importa '{imp}' → No existe: {path}")
else:
    print("  ✔ No hay imports rotos.")

print("\n----------------------------------------\n")

# -----------------------------
# 4. Reporte de rutas duplicadas
# -----------------------------
print("⚠ Rutas importadas múltiples veces:\n")
has_dupe = False
for route, count in duplicated_routes.items():
    if count > 1:
        has_dupe = True
        print(f"  - '{route}' importado {count} veces")

if not has_dupe:
    print("  ✔ No hay rutas duplicadas.")

print("\n----------------------------------------\n")

print("✅ INSPECCIÓN FINALIZADA")