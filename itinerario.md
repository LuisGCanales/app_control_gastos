## ✅ **FASE 0: Preparación**

Antes de iniciar:

* [ ] Comenta o elimina llamadas a `actualizarCategoriaTDCEnLiquidez()` en todo el código.
* [ ] Verifica que `"TDC"` ya exista como categoría de liquidez si deseas mantenerla activa.
* [ ] Haz un backup de `localStorage` con los gastos actuales (por si necesitas restaurar).

---

## 🧩 **FASE 1: Reemplazo del campo `tdc` por `medio` en nuevo gasto**

### 🔧 Cambios

1. [ ] Quitar switch `TDC` del formulario de gasto (`#gasto-form`)
2. [ ] Agregar `<select id="medio-pago">` con categorías de `obtenerLiquidez()`
3. [ ] Modificar `agregarGasto()` para:

   * Guardar `medio` en vez de `tdc`
   * Restar automáticamente el monto al medio correspondiente
4. [ ] Verificar limpieza del formulario al finalizar

### ✅ Prueba

* Registrar gasto con medio válido → monto se descuenta de esa categoría en `liquidez`
* Ver en `localStorage.gastos[]` que `medio` fue registrado correctamente

---

## 🧩 **FASE 2: Mostrar el `medio` en la tabla de gastos**

### 🔧 Cambios

1. [ ] En `renderizarTablaGastos()`:

   * Eliminar columna `tdc`
   * Agregar columna `medio`
2. [ ] En `<thead>` HTML de la tabla, actualizar encabezados

### ✅ Prueba

* Registrar gastos con diferentes medios
* Confirmar que aparecen correctamente en la tabla con su medio asignado

---

## 🧩 **FASE 3: Filtro por medio de pago**

### 🔧 Cambios

1. [ ] Eliminar checkbox `#filtro-solo-tdc`
2. [ ] Agregar `<select id="filtro-medio">` (por ejemplo: `Todos`, `Efectivo`, `BBVA`, etc.)
3. [ ] En `renderizarTablaGastos()`, aplicar filtro si está seleccionado un medio específico
4. [ ] Al limpiar filtros, restablecer `filtro-medio` a `"Todos"`

### ✅ Prueba

* Seleccionar diferentes medios → tabla debe reflejar solo esos gastos
* Combinar con otros filtros (fecha, fijos/variables, compartido)
* Verificar comportamiento al limpiar filtros

---

## 🧩 **FASE 4: Migrar exportación / importación CSV**

### 🔧 Cambios

1. [ ] En `exportarCSV()`:

   * Quitar `tdc`
   * Agregar columna `medio`
2. [ ] En `importarCSV()`:

   * Leer columna `medio`
   * Establecer `medio` como string (no booleano)

### ✅ Prueba

* Exportar gastos → verificar que columna `medio` aparece correctamente
* Reimportar → confirmar que `localStorage.gastos` mantiene el campo `medio`

---

## 🧩 **FASE 5: Edición de gasto con `medio`**

### 🔧 Cambios

1. [ ] En `#form-editar`:

   * Eliminar checkbox `editar-tdc`
   * Agregar `<select id="editar-medio">` prellenado
2. [ ] En `abrirFormularioEdicion(gasto)`:

   * Prellenar `editar-medio` con `gasto.medio`
3. [ ] En `submit` de edición:

   * Revertir el monto al medio anterior
   * Descontar el monto del nuevo medio

### ✅ Prueba

* Editar gasto cambiando monto y/o medio → verificar impacto correcto en `liquidez`
* Verificar que no se duplica ni borra mal ningún gasto
* Confirmar que edición se guarda correctamente

---

## 🧩 **FASE 6: Eliminar gasto y revertir liquidez**

### 🔧 Cambios

1. [ ] En listener `btn-eliminar-gasto`, obtener el `medio` y sumar su monto de vuelta en `liquidez`

### ✅ Prueba

* Eliminar gasto con `medio` → monto se reintegra correctamente a la categoría

---

## 🧩 **FASE 7: Adaptar pago de gastos fijos**

### 🔧 Cambios

1. [ ] En modal `#form-pago-fijo`:

   * Eliminar checkbox `tdc`
   * Agregar `<select id="medio-pago-fijo">`
2. [ ] En `submit` del formulario:

   * Usar `medio` al registrar gasto
   * Descontar monto de la liquidez correspondiente

### ✅ Prueba

* Pagar un gasto fijo con diferentes medios → verificar sincronización con liquidez
* Confirmar que aparece como gasto fijo pagado correctamente

---

## 🧩 **FASE 8: Resumen de barras (mostrar TDC como medio)**

### 🔧 Cambios

1. [ ] En `mostrarVistaResumenBarras()`:

   * Cambiar `g.tdc` → `g.medio === "TDC"`
   * Mantener uso de `limite.tdc`, `inicioTDC`
2. [ ] Asegurar que si no hay gasto con `"TDC"`, aún se muestre la barra vacía

### ✅ Prueba

* Verificar que se actualiza la barra de TDC con base en los gastos registrados
* Ajustar límites de TDC desde configuración y verificar impacto en barra

---

## 🧩 **FASE 9: Eliminación total de `tdc` y `actualizarCategoriaTDCEnLiquidez()`**

### 🔧 Cambios

1. [ ] Eliminar todos los campos `tdc` de:

   * Formularios
   * Lógica de carga/guardado
   * `localStorage`
2. [ ] Eliminar función `actualizarCategoriaTDCEnLiquidez()` y sus llamadas

### ✅ Prueba

* Verificar que la app funciona sin ninguna referencia a `tdc`
* Confirmar que `"TDC"` ahora se comporta como una categoría normal sincronizada por `medio`

---

## 🚀 CONSIDERACIONES FINALES

* Cada fase puede ejecutarse y probarse de forma independiente.
* Puedes trabajar con un backup de datos reales o un entorno de pruebas.
* Deja trazas temporales en consola si necesitas confirmar sincronización correcta por cada acción.

---

## ✅ Revisión del Punto 8: **Vista de Liquidez**

### 🎯 Objetivo

Asegurar que la sincronización entre gastos y categorías de liquidez **funciona correctamente** desde la perspectiva del usuario y se refleja en esta vista.

---

## 🔎 Cosas que **sí debes verificar o hacer**

### 1. **Sincronización tras registrar o editar un gasto**

* [ ] Cada vez que se registra un gasto con `medio = "BBVA"`, el monto debe restarse de esa categoría.
* [ ] Si editas un gasto y cambias el medio o monto, la liquidez debe actualizarse correctamente:

  * Se **devuelve el monto original al medio anterior**
  * Se **resta el nuevo monto al nuevo medio**

---

### 2. **Sincronización tras eliminar un gasto**

* [ ] Eliminar un gasto debe devolver el monto a la categoría de `medio` correspondiente.

---

### 3. **Que la categoría `"TDC"` exista y se muestre correctamente**

* [ ] Asegúrate de que esté presente en `liquidez` como cualquier otra.
* [ ] Que se actualice correctamente cuando registres gastos con `medio = "TDC"`.

---

### 4. **Actualización de `<select>` de medios en formularios**

* [ ] Cada vez que se agregue, edite o elimine una categoría en la vista de liquidez, los `<select>` de:

  * Formulario de gasto nuevo
  * Formulario de edición
  * Formulario de pago de gasto fijo
    deben actualizar sus opciones automáticamente.

---

### 5. **Probar edición de montos directamente**

* [ ] Al editar un monto en la vista de liquidez, asegúrate de que:

  * Se refleje inmediatamente en el resumen de barras y al calcular límites.
  * No se desincronice si ya había gastos registrados con esa categoría.

---

### 6. **Verifica que la categoría no pueda eliminarse si tiene gastos asignados (opcional)**

* Esto es una mejora que podrías considerar:

  * Bloquear la eliminación si existen gastos con `medio === esa categoría`
  * O permitirla pero dejar gastos "huérfanos" sin medio

---
