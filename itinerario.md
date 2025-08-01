# ✅ ITINERARIO PARA IMPORTACIÓN CON UUID

---

## 🔒 FASE 0 — Preparación

### Objetivo:

Asegurar que cualquier gasto futuro registrado manual o importado tenga un `id` (UUID).

### Acciones:

* [ ] Agregar el campo `id: crypto.randomUUID()` al crear cualquier nuevo gasto desde la app.
* [ ] Asegurar que `exportarCSV()` incluya una columna `"id"` como primera columna.
* [ ] **No modificar gastos existentes sin UUID.**

✅ Esta fase garantiza que de aquí en adelante todos los datos son UUID-consistentes.

---

## 🧩 FASE 1 — Validación estricta al importar CSV

### Objetivo:

Prevenir importaciones corruptas o malformadas.

### Acciones:

* [ ] Al leer cada línea del CSV, verificar que exista un campo `id` con valor válido (ej. UUID v4).
* [ ] Si **al menos un gasto** no tiene `id` válido:

  * Mostrar `alert("El archivo contiene gastos sin ID válido. No se importará nada.")`
  * Cancelar toda la importación (no se modifica `localStorage`).

✅ Esto asegura integridad completa antes de modificar el estado de la app.

---

## 🔄 FASE 2 — Agregar solo los gastos nuevos (por `id`)

### Objetivo:

Evitar duplicados y actualizar solo lo necesario.

### Acciones:

* [ ] Obtener los UUID ya presentes en `localStorage.gastos`.
* [ ] Comparar con los del CSV importado.
* [ ] Agregar solo los que no estén presentes.
* [ ] Actualizar liquidez al agregar cada uno (usando `g.medio` y `g.monto`).

✅ Esto mantiene sincronización correcta y evita duplicidad o errores invisibles.

---

## 👁 FASE 3 — Detectar y mostrar gastos “extra” en localStorage

### Objetivo:

Permitir al usuario decidir si elimina los gastos que ya no están en el CSV (ideal para limpiar o corregir).

### Acciones:

* [ ] Crear un `Set` de UUIDs del CSV.
* [ ] Identificar en `localStorage.gastos` aquellos gastos cuyo `id` **no** está en ese conjunto.
* [ ] Si existen:

  * Abrir un **modal con tabla interactiva** que contenga:

    * ✅ Primera columna con checkboxes (preseleccionados)
    * ✅ Encabezado con “seleccionar/deseleccionar todos”
    * ✅ Columnas: Fecha, Concepto, Monto, Medio, Compartido, Fijo, Nota (como la tabla principal, sin el ✎)

---

## 🧼 FASE 4 — Confirmar y aplicar eliminación de gastos locales no presentes

### Objetivo:

Permitir limpieza asistida y reversión automática en liquidez.

### Acciones:

* [ ] Al confirmar:

  * Recorrer los `id` seleccionados
  * Eliminar esos gastos de `localStorage.gastos`
  * Reintegrar su monto en la categoría de `liquidez` correspondiente (`medio`)

✅ Esto cierra el ciclo de sincronización completa.

---

## 🧪 PRUEBAS RECOMENDADAS (tras cada fase)

| Fase | Pruebas                                                                          |
| ---- | -------------------------------------------------------------------------------- |
| 0    | Registrar nuevos gastos → deben tener `id` único                                 |
| 1    | Importar archivo sin `id` → alerta, no se modifica nada                          |
| 2    | Importar archivo con 1 gasto nuevo → se agrega y descuenta de liquidez           |
| 3    | Al importar, si hay gastos extra → se abre modal con tabla detallada             |
| 4    | Al confirmar eliminación → gastos se eliminan y liquidez se ajusta correctamente |

