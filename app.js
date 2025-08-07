// === UTILIDADES GENERALES ===

// A partir de una ISO string crea un objeto date en zona horaria local
function crearFechaLocal(isoDateStr) {
  const [año, mes, dia] = isoDateStr.split("-").map(Number);
  return new Date(año, mes - 1, dia); // Este sí es local, sin UTC
}

// Función auxiliar para transformar un objeto date a formato YYYY-MM-DD
const toLocalISODate = date => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// Fecha actual en formato YYYY-MM-DD
const getToday = () => {
  const d = new Date();
  return toLocalISODate(d);
};

// Formato de moneda
const formatCurrency = value =>
  `$${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

// Formato "20 Junio 2025"
const formatFecha = iso => {
  const [año, mes, dia] = iso.slice(0, 10).split("-");
  const nombreMes = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
                     "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"][+mes - 1];
  return `${+dia} ${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)} ${año}`;
};

// Formato "20 Jun"
const formatFechaCorta = iso => {
  const [año, mes, dia] = iso.slice(0, 10).split("-");
  const mesesCortos = ["Ene", "Feb", "Mar", "Abr", "May", "Jun",
                       "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${parseInt(dia, 10)} ${mesesCortos[parseInt(mes, 10) - 1]}`;
};

function formatFechaConDia(iso) {
  const [año, mes, dia] = iso.slice(0, 10).split("-");
  const nombreMes = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ][+mes - 1];
  const nombreDia = [
    "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"
  ][new crearFechaLocal(iso).getDay()];
  return `${nombreDia} - ${+dia} ${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)} ${año}`;
}

// Fecha de inicio de semana personalizada
const getWeekCustom = (fecha, inicio) => {
  const d = new crearFechaLocal(fecha);
  const diff = (d.getDay() - inicio + 7) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return toLocalISODate(d);
};

// Fecha de inicio de mes personalizada
const getMonthCustom = (fecha, inicio) => {
  const d = new crearFechaLocal(fecha);
  let [año, mes, dia] = [d.getFullYear(), d.getMonth(), d.getDate()];
  if (dia < inicio) mes -= 1;
  if (mes < 0) { mes = 11; año -= 1; }
  const diasEnMes = new Date(año, mes + 1, 0).getDate();
  const diaSeguro = Math.min(inicio, diasEnMes);
  return toLocalISODate(new Date(año, mes, diaSeguro));
};

// Fecha y hora local sin conversión UTC
const obtenerFechaHoraLocal = () => {
  const now = new Date();
  const [a, m, d, h, min] = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0")
  ];
  return `${a}-${m}-${d}T${h}:${min}:00`;
};

// Sumar días a una fecha ISO
const sumarDias = (fechaStr, dias) => {
  const d = new crearFechaLocal(fechaStr);
  d.setDate(d.getDate() + dias);
  return toLocalISODate(d);
};

// === CONFIGURACIÓN ===

// Distribución anterior

// const distribucionSemanalPorDefecto = {
//   0: 0,        // Domingo        0 %
//   1: 0.4 / 3,  // Lunes       13.3 %
//   2: 0.4 / 3,  // Martes      13.3 %
//   3: 0.5 / 3,  // Miércoles   16.7 %
//   4: 0.4 / 3,  // Jueves      13.3 %
//   5: 0.8 / 3,  // Viernes     26.7 %
//   6: 0.5 / 3   // Sábado      16.7 %
// };

// Distribución actual

const distribucionSemanalPorDefecto = {
  0: 0,        // Domingo         0 %
  1: 0.1361,   // Lunes       13.61 %
  2: 0.1361,   // Martes      13.61 %
  3: 0.17,     // Miércoles   17.00 %
  4: 0.1361,   // Jueves      13.61 %
  5: 0.2517,   // Viernes     25.17 %
  6: 0.17      // Sábado      17.00 %
};

function obtenerDistribucionSemanal() {
  return JSON.parse(localStorage.getItem("distribucionSemanal")) || distribucionSemanalPorDefecto;
}

function guardarDistribucionSemanal(obj) {
  localStorage.setItem("distribucionSemanal", JSON.stringify(obj));
}


// Liquidez disponible contando sólo los gastos de hasta un día anterior
function calcularLiquidezDisponible() {
  const liquidez = obtenerLiquidez();
  const totalLiquidez = liquidez.reduce((acc, item) => acc + item.monto, 0);

  const fijosPendientes = obtenerFijosPendientes().filter(g => g.estado === "pendiente");

  const totalFijosPendientes = fijosPendientes.reduce((acc, g) => acc + g.monto, 0);

  const gastos = JSON.parse(localStorage.getItem("gastos")) || [];
  const gastosVariables = gastos.filter(g => !g.fijo);
  const gastosVariablesDia = gastosVariables.filter(g => g.timestamp.slice(0, 10) === getToday());
  const totalGastosVarDia = gastosVariablesDia.reduce((acc, g) => acc + g.monto, 0);
  
  return Math.max(0, totalLiquidez - totalFijosPendientes + totalGastosVarDia);
}

function obtenerDiasResiduales(fechaInicioISO, totalDiasPeriodo) {
  const diasResiduales = [];

  const diasCompletos = Math.floor(totalDiasPeriodo / 7);
  const diasTotales = totalDiasPeriodo;

  for (let i = diasCompletos * 7; i < diasTotales; i++) {
    const fecha = crearFechaLocal(fechaInicioISO);
    fecha.setDate(fecha.getDate() + i);
    diasResiduales.push(fecha.getDay()); // 0 = domingo, 1 = lunes, ..., 6 = sábado
  }

  return diasResiduales;
}
 
function actualizarLimitesDesdeLiquidez() {
  
  const limites = cargarLimites();
  const distribucion = obtenerDistribucionSemanal();
  
  const hoy = getToday();
  
  const fechaFin = getMonthCustom(sumarDias(hoy, 32), limites.inicioMes);
  
  const diasPeriodo = (crearFechaLocal(fechaFin) - crearFechaLocal(hoy)) / (1000 * 60 * 60 * 24);
  const semanasCompletas = Math.floor(diasPeriodo / 7); 
  const diasResiduales = obtenerDiasResiduales(hoy, diasPeriodo);
  const sumaProporcionesResiduales = diasResiduales.reduce((acc, d) => acc + distribucion[d], 0);  
  const liquidezDisponible = calcularLiquidezDisponible(); // ← nueva función
  const divisor = semanasCompletas + sumaProporcionesResiduales;    
  const limiteSemanal = liquidezDisponible / divisor;
  
  // Obtener liquidez actual
  const liquidez = obtenerLiquidez();
  const totalLiquidez = liquidez.reduce((acc, item) => acc + item.monto, 0);

  // Obtener gastos del periodo
  const fechaInicioPeriodo = getMonthCustom(hoy, limites.inicioMes);
  const gastos = JSON.parse(localStorage.getItem("gastos")) || [];
  const gastosPeriodo = gastos.filter(g => g.timestamp.slice(0, 10) >= fechaInicioPeriodo);
  const totalgastosPeriodo = gastosPeriodo.reduce((acc, g) => acc + g.monto, 0);

  // Obtener liquidez al inicio del periodo
  const liquidezInicial = totalLiquidez + totalgastosPeriodo

  // Actualiza y guarda los nuevos límites
  limites.mes = Math.floor(liquidezInicial);
  limites.semana = Math.floor(limiteSemanal);
  localStorage.setItem("limites", JSON.stringify(limites));

  // Forzar recálculo de límite diario hoy
  localStorage.removeItem("limites_dia_aplicado");
  cargarLimites();
  mostrarVistaResumenBarras();
}

function actualizarLimitesDesdeLiquidezConFeedback() {
  actualizarLimitesDesdeLiquidez();
  const msg = document.getElementById("limites-feedback");
  msg.textContent = "✅ Límites actualizados";
  setTimeout(() => msg.textContent = "", 2500);
}


function calcularLimiteDinamicoDiario({ gastos, limiteSemanal, distribucion, inicioSemana }) {
  const hoy = new Date();
  const diaHoy = hoy.getDay();

  // Determina día de inicio de semana más reciente
  const inicio = new Date(hoy);
  const offset = (diaHoy - inicioSemana + 7) % 7;
  inicio.setDate(hoy.getDate() - offset);
  inicio.setHours(0, 0, 0, 0);

  // Días en orden de la semana desde inicio
  const diasSemana = [...Array(7)].map((_, i) => (inicio.getDay() + i) % 7);

  // Día actual en índice relativo al ciclo semanal
  const hoyRelativo = (diaHoy - inicioSemana + 7) % 7;

  const diasFaltantes = diasSemana.slice(hoyRelativo);

  // Filtrar gastos de esta semana
  const fechaInicioISO = toLocalISODate(inicio);

  const fechaFinISO = toLocalISODate(new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 7));

  const gastosSemana = gastos.filter(g => g.timestamp.slice(0, 10) >= fechaInicioISO && g.timestamp.slice(0, 10) < fechaFinISO);

  // Agrupar gasto por día de la semana
  const gastoPorDia = {};
  gastosSemana.forEach(g => {
    const fecha = crearFechaLocal(g.timestamp.slice(0, 10));
    const dia = fecha.getDay();
    gastoPorDia[dia] = (gastoPorDia[dia] || 0) + g.monto;
  });

  // Gasto acumulado hasta ayer
  const gastoAcumulado = diasSemana
    .slice(0, hoyRelativo) // días anteriores
    .reduce((acc, d) => acc + (gastoPorDia[d] || 0), 0);

  const restante = limiteSemanal - gastoAcumulado;

  const sumaPorcentajesRestantes = diasFaltantes.reduce((acc, d) => acc + distribucion[d], 0);

  const limiteDiario = (distribucion[diaHoy] / sumaPorcentajesRestantes) * restante;

  return limiteDiario;
}

function cargarLimites() {
  const predet = { dia: 700, semana: 3000, mes: 30000, compartido: 3000, tdc: 30000, inicioSemana: 6, inicioMes: 12, inicioTDC: 12, inicioCompartido: 1 };
  const hoy = getToday()
  const ultimaFechaAplicada = localStorage.getItem("limites_dia_aplicado");

  const conf = JSON.parse(localStorage.getItem("limites")) || predet;

  // Si es un nuevo día, actualiza el límite diario automáticamente
  if (hoy !== ultimaFechaAplicada) {
    const gastos = (JSON.parse(localStorage.getItem("gastos")) || []).filter(g => !g.fijo);
    const limiteCalculado = calcularLimiteDinamicoDiario({
      gastos,
      limiteSemanal: conf.semana,
      distribucion: obtenerDistribucionSemanal(),
      inicioSemana: conf.inicioSemana
    });
    conf.dia = Math.max(0, Math.round(limiteCalculado)); // evita negativos
    localStorage.setItem("limites", JSON.stringify(conf));
    localStorage.setItem("limites_dia_aplicado", hoy); 
  }
  ["dia", "semana", "mes", "compartido", "tdc"].forEach(c =>
    document.getElementById(`limite-${c}`).value = conf[c]
  );
  document.getElementById("inicio-semana").value = conf.inicioSemana;
  document.getElementById("inicio-mes").value = conf.inicioMes;
  document.getElementById("inicio-tdc").value = conf.inicioTDC;
  document.getElementById("inicio-compartido").value = conf.inicioCompartido;

  return conf;
}

// === VISTAS ===

const mostrarConfiguracion = () => {
  document.getElementById("vista-principal").style.display = "none";
  document.getElementById("resumen").style.display = "none";
  document.getElementById("vista-configuracion").style.display = "block";
  history.pushState({ vista: "vista-configuracion" }, "", "#vista-configuracion");
};

function mostrarFijosPendientes() {
  document.getElementById("vista-principal").style.display = "none";
  document.getElementById("resumen").style.display = "none";
  document.getElementById("vista-fijos-pendientes").style.display = "block";
  renderizarFijosPendientes();
  history.pushState({ vista: "vista-fijos-pendientes" }, "", "#vista-fijos-pendientes");
}

const volverAPrincipal = () => {
  ["vista-configuracion", "vista-tabla", "vista-fijos-pendientes", "modal-edicion-fijo", "modal-edicion", "vista-graficas", "vista-liquidez"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
  document.getElementById("vista-principal").style.display = "block";
  document.getElementById("resumen").style.display = "block";
};

function mostrarVistaDistribucionSemanal() {
  document.querySelectorAll("section.container").forEach(s => s.style.display = "none");
  document.getElementById("vista-distribucion-semanal").style.display = "block";
  renderizarDistribucionSemanal();
  history.pushState({ vista: "vista-distribucion-semanal" }, "", "#vista-distribucion-semanal");
}

function cerrrarVistaDistribucionSemanal() {
  document.getElementById("vista-distribucion-semanal").style.display = "none";
  document.getElementById("vista-configuracion").style.display = "block";
}

function mostrarEditorDistribucion() {
  document.getElementById("vista-distribucion-semanal").style.display = "none";
  document.getElementById("modal-editar-distribucion").style.display = "block";

  const distribucion = obtenerDistribucionSemanal();
  const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

  const tbody = document.getElementById("tabla-form-distribucion");
  tbody.innerHTML = "";

  for (let i = 0; i < 7; i++) {
    const porcentaje = (distribucion[i] || 0) * 100;
    const row = `
      <tr>
        <td>${dias[i]}</td>
        <td>
          <input type="number" min="0" max="100" step="0.01"
            id="input-dia-${i}" value="${porcentaje.toFixed(2)}"
            style="width: 80px; text-align: right;" /> %
        </td>
      </tr>`;
    tbody.insertAdjacentHTML("beforeend", row);
  }

  history.pushState({ vista: "modal-editar-distribucion" }, "", "#modal-editar-distribucion");

}

function cerrarEdicionDistribucion() {
  document.getElementById("modal-editar-distribucion").style.display = "none";
  document.getElementById("vista-distribucion-semanal").style.display = "block";
}

// === OPERACIONES CON GASTOS ===

function agregarGasto(e) {
  e.preventDefault();
  const monto = +document.getElementById("monto").value;
  const concepto = document.getElementById("concepto").value.trim();
  if (!monto || !concepto) return alert("Ingresa un monto y concepto válido.");

  const medio = document.getElementById("medio-pago").value.trim();
  if (!medio) return alert("Selecciona un medio de pago válido.");

  const compartido = document.getElementById("compartido").checked;
  const fechaInput = document.getElementById("fecha-personalizada").value;
  const timestamp = document.getElementById("activar-fecha").checked && fechaInput
    ? `${fechaInput}T23:59:00`
    : obtenerFechaHoraLocal();

  const nota = document.getElementById("nota-gasto").value.trim();
  const gastos = JSON.parse(localStorage.getItem("gastos")) || [];
  gastos.push({ 
  id: crypto.randomUUID(),
  monto, 
  concepto, 
  medio, 
  compartido, 
  fijo: false, 
  timestamp, 
  nota 
  });


  const liquidez = obtenerLiquidez();
  const idx = liquidez.findIndex(item => item.categoria === medio);
  if (idx !== -1) {
    liquidez[idx].monto -= monto;
    guardarLiquidez(liquidez);
  }

  localStorage.setItem("gastos", JSON.stringify(gastos));

  // Si viene de gasto fijo: marcar como pagado
  const idxRelacionado = document.getElementById("gasto-form").dataset.fijoRelacionado;
  if (idxRelacionado !== undefined) {
    const fijos = obtenerFijosPendientes();
    fijos[+idxRelacionado].estado = "pagado";
    guardarFijosPendientes(fijos);
    delete document.getElementById("gasto-form").dataset.fijoRelacionado;
    renderizarFijosPendientes();
  }

  document.getElementById("gasto-form").reset();
  autoExpand({ target: document.getElementById("nota-gasto") });
  document.getElementById("fecha-personalizada").style.display = "none";
  mostrarVistaResumenBarras();
  actualizarSugerencias();
  volverAPrincipal();
}

// Usar comillas en campos que puedan contener comas para evitar conflictos con
// la estructura del CSV
function escaparCampoCSV(campo) {
  if (campo == null) return "";
  const str = String(campo).replaceAll('"', '""'); // escapa comillas dobles
  return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str}"` : str;
}

function dividirLineasCSV(raw) {
  const lineas = [];
  let buffer = "";
  let enComillas = false;

  for (let linea of raw.split("\n")) {
    buffer += (buffer ? "\n" : "") + linea;

    const numComillas = (buffer.match(/"/g) || []).length;
    enComillas = numComillas % 2 !== 0;

    if (!enComillas) {
      lineas.push(buffer);
      buffer = "";
    }
  }

  if (buffer) lineas.push(buffer); // última línea incompleta
  return lineas;
}


function parsearLineaCSV(linea) {
  const resultado = [];
  let valor = "";
  let enComillas = false;

  for (let i = 0; i < linea.length; i++) {
    const char = linea[i];
    const sig = linea[i + 1];

    if (char === '"' && enComillas && sig === '"') {
      valor += '"';
      i++; // saltar comilla doble
    } else if (char === '"') {
      enComillas = !enComillas;
    } else if (char === "," && !enComillas) {
      resultado.push(valor);
      valor = "";
    } else {
      valor += char;
    }
  }
  resultado.push(valor); // último valor
  return resultado;
}

function exportarCSV() {
  const gastos = JSON.parse(localStorage.getItem("gastos")) || [];
  const filas = [
    ["id", "fecha", "monto", "concepto", "medio", "compartido", "fijo", "nota"],
    ...gastos.map(g => [
      g.id || "",
      g.timestamp.slice(0, 10),
      g.monto,
      escaparCampoCSV(g.concepto),
      g.medio || "",
      g.compartido ? "Si" : "",
      g.fijo ? "Si" : "",
      escaparCampoCSV(g.nota || "")
    ])
  ];

  const contenidoCSV = "\uFEFF" + filas.map(f => f.join(",")).join("\n") + "\n";
  const blob = new Blob([contenidoCSV], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `gastos_${getToday()}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function importarCSV(e) {
  const archivo = e.target.files[0];
  if (!archivo) return;

  const reader = new FileReader();
  reader.onload = evt => {
    const lineas = dividirLineasCSV(evt.target.result)
      .slice(1)
      .filter(l => l.trim() !== "");
    const idsEnCSV = new Set();
    const nuevos = [];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    for (let i = 0; i < lineas.length; i++) {
      const campos = parsearLineaCSV(lineas[i]);

      const [id, timestamp, monto, concepto, medio, compartido, fijo, nota] = campos.map(c => c?.trim() ?? "");

      const lineaNumero = i + 2;

      if (!id) {
        alert(`❌ Error en línea ${lineaNumero}: Falta el campo "id"`);
        return;
      }

      if (!uuidRegex.test(id)) {
        alert(`❌ Error en línea ${lineaNumero}: ID "${id}" no tiene formato UUID válido`);
        return;
      }

      if (idsEnCSV.has(id)) {
        alert(`❌ Error en línea ${lineaNumero}: ID duplicado "${id}" en el CSV`);
        return;
      }

      idsEnCSV.add(id);

      nuevos.push({
        id,
        timestamp: timestamp.replace(" ", "T"),
        monto: Number(monto),
        concepto,
        medio,
        compartido: compartido === "Si",
        fijo: fijo === "Si",
        nota
      });
      
    }

    const gastosActuales = JSON.parse(localStorage.getItem("gastos")) || [];
    const idsLocales = new Set(gastosActuales.map(g => g.id));
    const gastosExtraLocales = gastosActuales.filter(g => !idsEnCSV.has(g.id));
    const gastosNuevos = nuevos.filter(g => !idsLocales.has(g.id));

    const actualizados = [...gastosActuales];
    const liquidez = obtenerLiquidez();

    for (const gasto of gastosNuevos) {
      actualizados.push(gasto);

      // Actualizar liquidez
      const i = liquidez.findIndex(l => l.categoria === gasto.medio);
      if (i !== -1) {
        liquidez[i].monto -= gasto.monto;
      }
    }

    localStorage.setItem("gastos", JSON.stringify(actualizados));

    if (gastosExtraLocales.length > 0) {
      mostrarModalSobrantes(gastosExtraLocales);
    }

    guardarLiquidez(liquidez);

    // Se recalcula el límite diario dinámico
    const hoy = getToday();
    const ultimaAplicacion = localStorage.getItem("limites_dia_aplicado");

    if (hoy === ultimaAplicacion) {
      const conf = JSON.parse(localStorage.getItem("limites"));
      const gastos = nuevos.filter(g => !g.fijo);

      const nuevoLimite = calcularLimiteDinamicoDiario({
        gastos,
        limiteSemanal: conf.semana,
        distribucion: obtenerDistribucionSemanal(),
        inicioSemana: conf.inicioSemana
      });

      conf.dia = Math.max(0, Math.round(nuevoLimite));
      localStorage.setItem("limites", JSON.stringify(conf));
    }

    // Actualizar vista
    mostrarVistaResumenBarras();
    renderizarTablaGastos();
  };
  reader.readAsText(archivo);
  e.target.value = "";
}

// === INTERFAZ DE USUARIO ===

function actualizarSugerencias() {
  const conceptos = [...new Set((JSON.parse(localStorage.getItem("gastos")) || []).map(g => g.concepto).filter(Boolean))].sort();
  const datalist = document.getElementById("sugerencias");
  datalist.innerHTML = "";
  conceptos.forEach(c => datalist.appendChild(Object.assign(document.createElement("option"), { value: c })));
}

// === TABLA DE GASTOS ===

function mostrarTabla() {
  document.getElementById("vista-principal").style.display = "none";
  document.getElementById("resumen").style.display = "none";
  document.getElementById("vista-tabla").style.display = "block";

  // Renderiza y asigna eventos
  renderizarTablaGastos();
  actualizarEtiquetaSwitchTabla(document.getElementById("switch-tabla-periodo-actual").checked);
  document.getElementById("filtro-fecha").addEventListener("input", renderizarTablaGastos);
  document.getElementById("filtro-fijos").addEventListener("change", renderizarTablaGastos);
  document.getElementById("filtro-variables").addEventListener("change", renderizarTablaGastos);
  document.getElementById("filtro-medio").addEventListener("change", renderizarTablaGastos);
  document.getElementById("filtro-solo-compartido").addEventListener("change", renderizarTablaGastos);
  document.getElementById("limpiar-filtros").addEventListener("click", () => {
    document.getElementById("filtro-fecha").value = "";
    document.getElementById("filtro-fijos").checked = false;
    document.getElementById("filtro-variables").checked = true;
    document.getElementById("filtro-medio").value = "";
    document.getElementById("filtro-solo-compartido").checked = false;
    renderizarTablaGastos();
  });
  history.pushState({ vista: "vista-tabla" }, "", "#vista-tabla");
}

function renderizarTablaGastos() {
  const mostrarPeriodoActual = document.getElementById("switch-tabla-periodo-actual")?.checked ?? false;
  const hoy = getToday();
  const conf = cargarLimites();
  const inicioPeriodo = getMonthCustom(hoy, conf.inicioMes);
  const finPeriodo = getMonthCustom(sumarDias(getMonthCustom(hoy, conf.inicioMes), 32), conf.inicioMes);

  let gastos = JSON.parse(localStorage.getItem("gastos")) || [];

  if (mostrarPeriodoActual) {
    gastos = gastos.filter(g => {
      const fechaLocal = toLocalISODate(new Date(g.timestamp));
      return fechaLocal >= inicioPeriodo && fechaLocal < finPeriodo;
    });
  }

  // Filtros
  const fFecha = document.getElementById("filtro-fecha").value;
  const mostrarFijos = document.getElementById("filtro-fijos").checked;
  const mostrarVariables = document.getElementById("filtro-variables").checked;
  const filtroMedio = document.getElementById("filtro-medio").value;
  const soloCompartido = document.getElementById("filtro-solo-compartido").checked;

  // Filtrado activo
  const filtrados = gastos.filter(g => {
    const fecha = g.timestamp.slice(0, 10);
    const esFijo = g.fijo;
    const mostrarPorTipo = (esFijo && mostrarFijos) || (!esFijo && mostrarVariables);
    const pasaMedio = !filtroMedio || g.medio === filtroMedio;
    const pasaCompartido = !soloCompartido || g.compartido;
    const pasaFecha = !fFecha || fecha === fFecha;
    return mostrarPorTipo && pasaCompartido && pasaFecha && pasaMedio;
  });

  // Agrupar por fecha
  const agrupados = {};
  filtrados.forEach(g => {
    const fecha = g.timestamp.slice(0, 10);
    if (!agrupados[fecha]) agrupados[fecha] = [];
    agrupados[fecha].push(g);
  });

  const tbody = document.querySelector("#tabla-gastos tbody");
  tbody.innerHTML = "";

  // Ordenar fechas y renderizar
  Object.keys(agrupados).sort().forEach(fecha => {
    const gastosDelDia = agrupados[fecha];
    const subtotal = gastosDelDia.reduce((acc, g) => acc + g.monto, 0);

    const trTitulo = document.createElement("tr");
    trTitulo.className = "separador-dia";
    trTitulo.innerHTML = `
      <td colspan="6">
        <div style="display: flex; justify-content: space-between;">
          <span>📅 ${formatFechaConDia(fecha)}</span>
          <span style="font-size: 0.95em;">${formatCurrency(subtotal)}</span>
        </div>
      </td>`;
    tbody.appendChild(trTitulo);

    gastosDelDia.forEach(g => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>
          ${g.concepto}
          ${g.nota ? `<span class="nota-icono" onclick="mostrarNotaToast(decodeURIComponent('${encodeURIComponent(g.nota)}'))"> 📝</span>` : ""}
        </td>
        <td class="${g.monto < 0 ? 'reintegro' : ''}">${formatCurrency(g.monto)}</td>
        <td class="centrado">${g.medio || "-"}</td>
        <td class="centrado">${g.compartido ? "ꪜ" : ""}</td>
        <td class="centrado">${g.fijo ? "ꪜ" : ""}</td>
        <td class="centrado">
          <span class="btn-editar" data-idx="${gastos.indexOf(g)}" title="Editar">
            <svg xmlns="http://www.w3.org/2000/svg" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round" class="feather feather-edit">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </span>
        </td>`;
      tbody.appendChild(tr);
    });
  });

  // Asignar eventos a botones de edición
  document.querySelectorAll(".btn-editar").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = +btn.dataset.idx;
      abrirFormularioEdicion(gastos[idx]);
    });
  });
}

// === EDICIÓN DE GASTOS ===

let gastoEditando = null;

function abrirFormularioEdicion(gasto) {
  gastoEditando = gasto;
  document.getElementById("vista-tabla").style.display = "none";
  document.getElementById("modal-edicion").style.display = "block";
  
  actualizarOpcionesMedioPago("editar-medio");

  document.getElementById("editar-concepto").value = gasto.concepto;
  document.getElementById("editar-monto").value = gasto.monto;
  document.getElementById("editar-medio").value = gasto.medio || "";
  document.getElementById("editar-compartido").checked = gasto.compartido;
  document.getElementById("editar-fijo").checked = gasto.fijo || false;
  document.getElementById("editar-fecha").value = gasto.timestamp.slice(0, 10);
  document.getElementById("editar-nota").value = gasto.nota || "";
  autoExpand({ target: document.getElementById("editar-nota") });
  history.pushState({ vista: "modal-edicion" }, "", "#modal-edicion");
}

function cerrarFormularioEdicion() {
  document.getElementById("modal-edicion").style.display = "none";
  document.getElementById("vista-tabla").style.display = "block";
}

// === GASTOS FIJOS PENDIENTES ===

function obtenerFijosPendientes() {
  return JSON.parse(localStorage.getItem("gastosPendientesFijos")) || [];
}

function guardarFijosPendientes(arr) {
  localStorage.setItem("gastosPendientesFijos", JSON.stringify(arr));
}

function estadoEmoji(estado) {
  switch (estado) {
    case "pendiente": return "🔴";
    case "pagado": return "✅";
    case "pospuesto": return "🕒";
    default: return "";
  }
}

function renderizarFijosPendientes() {
  const mostrarPendientes = document.getElementById("filtro-fijo-pendiente").checked;
  const mostrarPagados = document.getElementById("filtro-fijo-pagado").checked;
  const mostrarPospuestos = document.getElementById("filtro-fijo-pospuesto").checked;

  const fijosOriginales = obtenerFijosPendientes();
  const fijosFiltrados = fijosOriginales.filter(g =>
    (mostrarPendientes && g.estado === "pendiente") ||
    (mostrarPagados && g.estado === "pagado") ||
    (mostrarPospuestos && g.estado === "pospuesto")
  );

  const fijos = [...fijosFiltrados].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  const tbody = document.querySelector("#tabla-fijos-pendientes tbody");
  tbody.innerHTML = "";

  // Agrupar por fecha
  const agrupados = {};
  fijos.forEach(g => {
    const fecha = g.fecha;
    if (!agrupados[fecha]) agrupados[fecha] = [];
    agrupados[fecha].push(g);
  });

  Object.keys(agrupados).sort().forEach(fecha => {
    const gastosDelDia = agrupados[fecha];

    const trSeparador = document.createElement("tr");
    trSeparador.className = "separador-dia-fijos";
    trSeparador.innerHTML = `<td colspan="4">📅 ${formatFecha(fecha)}</td>`;
    tbody.appendChild(trSeparador);

    gastosDelDia.forEach(g => {
      const idxReal = fijosOriginales.findIndex(f =>
        f.concepto === g.concepto &&
        f.monto === g.monto &&
        f.fecha === g.fecha &&
        f.estado === g.estado
      );

      const tr = document.createElement("tr");
      tr.className = "fila-fijo";
      tr.innerHTML = `
        <td>
          ${g.concepto}
          ${g.nota ? `<span class="nota-icono" onclick="mostrarNotaToast(decodeURIComponent('${encodeURIComponent(g.nota)}'))"> 📝</span>` : ""}
        </td>
        <td>${formatCurrency(g.monto)}</td>
        <td class="estado ${g.estado}">${estadoEmoji(g.estado)}</td>
        <td class="centrado">
          <span class="btn-editar" data-idx="${idxReal}" title="Editar">✎</span>
        </td>
      `;
      tbody.appendChild(tr);
    });
  });
  
  // Botones de edición
  document.querySelectorAll("#tabla-fijos-pendientes .btn-editar").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = +btn.dataset.idx;
      abrirEdicionFijo(idx);
    });
  });

  // Resúmen con total de Gastos fijos  pagados / pendientes
  const totalPendientes = fijos.filter(g => g.estado === "pendiente")
    .reduce((sum, g) => sum + g.monto, 0);
  const totalPagados = fijos.filter(g => g.estado === "pagado")
    .reduce((sum, g) => sum + g.monto, 0);

  document.getElementById("resumen-fijos").innerHTML = `
    <div>Total pagados ✅: $${totalPagados.toLocaleString("es-MX", {minimumFractionDigits: 2})}</div>
    <div>Total pendientes 🔴: $${totalPendientes.toLocaleString("es-MX", {minimumFractionDigits: 2})}</div>
  `;

}

// Variable auxiliar
let fijoEditandoIdx = null;

function abrirEdicionFijo(idx) {
  const fijos = obtenerFijosPendientes();
  const g = fijos[idx];
  fijoEditandoIdx = idx;

  document.getElementById("vista-fijos-pendientes").style.display = "none";
  document.getElementById("modal-edicion-fijo").style.display = "block";

  document.getElementById("editar-fijo-concepto").value = g.concepto;
  document.getElementById("editar-fijo-monto").value = g.monto;
  document.getElementById("editar-fijo-fecha").value = g.fecha;
  document.getElementById("editar-fijo-nota").value = g.nota || "";
  autoExpand({ target: document.getElementById("editar-fijo-nota") });
  document.getElementById("editar-fijo").dataset.idx = idx;

  // Mostrar botón correspondiente según el estado
  const btnPosponer = document.getElementById("btn-posponer-fijo");
  const btnReactivar = document.getElementById("btn-reactivar-fijo");
  const btnPagar = document.getElementById("btn-pagar-fijo");

  if (g.estado === "pendiente") {
    btnPosponer.style.display = "inline-block";
    btnReactivar.style.display = "none";
    btnPagar.style.display = "inline-block";
  } else if (g.estado === "pospuesto") {
    btnPosponer.style.display = "none";
    btnReactivar.style.display = "inline-block";
    btnPagar.style.display = "inline-block";
  } else {
    btnPosponer.style.display = "none";
    btnReactivar.style.display = "none";
    btnPagar.style.display = "none"; 
  }
  history.pushState({ vista: "modal-edicion-fijo" }, "", "#modal-edicion-fijo");
}

function cerrarFormularioEdicionFijo() {
  document.getElementById("modal-edicion-fijo").style.display = "none";
  document.getElementById("vista-fijos-pendientes").style.display = "block";
}


function cerrarModalEdicionFijo() {
  document.getElementById("modal-edicion-fijo").style.display = "none";
  document.getElementById("vista-fijos-pendientes").style.display = "block";
  document.getElementById("editar-fijo").dataset.idx = ""; // Limpia el índice
}

function cerrarModalPagoFijo() {
  document.getElementById("modal-pago-fijo").style.display = "none";
  document.getElementById("form-pago-fijo").reset();
  delete document.getElementById("form-pago-fijo").dataset.fijoRelacionado;

  // ✅ Mostrar vista deseada
  document.getElementById("vista-fijos-pendientes").style.display = "block";
}


function exportarFijosCSV() {
  const fijos = obtenerFijosPendientes();
  const filas = [
    ["concepto", "monto", "fecha", "estado", "nota"],
    ...fijos.map(g => [
      escaparCampoCSV(g.concepto),
      g.monto,
      g.fecha,
      g.estado,
      escaparCampoCSV(g.nota) || ""
    ])
  ];

  const blob = new Blob([filas.map(f => f.join(",")).join("\n")], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `gastos_fijos_${getToday()}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function importarFijosCSV(e) {
  const archivo = e.target.files[0];
  if (!archivo) return;

  const reader = new FileReader();
  reader.onload = evt => {
    const nuevos = dividirLineasCSV(evt.target.result)
      .slice(1) // omitir encabezado
      .map(linea => {
        const [concepto, monto, fecha, estado, nota] = parsearLineaCSV(linea);
        return {
          concepto: concepto?.trim() ?? "",
          monto: +monto,
          fecha: fecha?.trim() ?? "",
          estado: estado?.trim() ?? "pendiente",
          nota: nota?.trim() ?? ""
        };
      }).filter(g => g.concepto && g.fecha);

    guardarFijosPendientes(nuevos);
    renderizarFijosPendientes();
    mostrarVistaResumenBarras();
  };
  reader.readAsText(archivo);
  e.target.value = ""; // reinicia el input para permitir mismo archivo
}


// Visualización de gastos variables
function mostrarVistaGraficas() {
  document.getElementById("vista-tabla").style.display = "none";
  document.getElementById("vista-graficas").style.display = "block";

  if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock("landscape").catch((err) => {
      console.log("No se pudo bloquear la orientación:", err);
    });
  }

  document.getElementById("switch-periodo-actual").addEventListener("change", mostrarVistaGraficas);
  const checked = document.getElementById("switch-periodo-actual").checked;
  document.getElementById("label-historico").className = checked ? "strike" : "bold";
  document.getElementById("label-periodo").className = checked ? "bold" : "strike";

  const gastos = JSON.parse(localStorage.getItem("gastos")) || [];
  const variables = gastos.filter(g => !g.fijo);

  const conf = cargarLimites();
  const hoy = getToday();
  const inicioPeriodo = getMonthCustom(hoy, conf.inicioMes);
  const finPeriodo = getMonthCustom(sumarDias(inicioPeriodo, 32), conf.inicioMes);
  const mostrarPeriodoActual = document.getElementById("switch-periodo-actual")?.checked ?? false;

  const agrupados = {};
  variables.forEach(g => {
    const fecha = g.timestamp.slice(0, 10);
    agrupados[fecha] = (agrupados[fecha] || 0) + g.monto;
  });

  // Todas las fechas posibles
  const todasFechas = variables.map(g => g.timestamp.slice(0, 10)).sort();
  const inicio = crearFechaLocal(todasFechas[0]);
  const fin = crearFechaLocal(getToday());

  const fechasISOcompleto = [];
  for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
    fechasISOcompleto.push(toLocalISODate(d));
  }

  const fechasISO = mostrarPeriodoActual
    ? fechasISOcompleto.filter(f => f >= inicioPeriodo && f < finPeriodo)
    : fechasISOcompleto;

  const fechas = fechasISO.map(f => formatFechaCorta(f));
  const montos = fechasISO.map(f => agrupados[f] || 0);

  // Promedio acumulativo solo para días mostrados
  const promedioAcumulativo = [];
  let suma = 0;
  for (let i = 0; i < montos.length; i++) {
    suma += montos[i];
    promedioAcumulativo.push(suma / (i + 1));
  }

  // Promedio móvil a 7 días calculado con histórico
  const promedioMovilCompleto = fechasISOcompleto.map((_, i) => {
    if (i < 6) return null;
    const ventana = fechasISOcompleto.slice(i - 6, i + 1);
    const suma = ventana.reduce((acc, fecha) => acc + (agrupados[fecha] || 0), 0);
    return suma / 7;
  });

  const promedioMovil = fechasISO.map(f => promedioMovilCompleto[fechasISOcompleto.indexOf(f)]);

  // Límite diario ajustado
  const limiteSemanal = conf.semana;
  const limiteDiarioAjustado = limiteSemanal / 7;

  const dataLimite = [
    { x: fechas[0], y: limiteDiarioAjustado },
    { x: fechas[fechas.length - 1], y: limiteDiarioAjustado }
  ];

  const ctx = document.getElementById("grafica-gastos-diarios").getContext("2d");

  if (window.graficoGastos) window.graficoGastos.destroy();

  const canvas = document.getElementById("grafica-gastos-diarios");
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  window.graficoGastos = new Chart(ctx, {
    type: 'line',
    data: {
      labels: fechas,
      datasets: [
        {
          label: "Gasto variable diario",
          data: montos,
          fill: true,
          backgroundColor: "rgba(76, 175, 80, 0.15)",
          borderColor: "#4CAF50",
          borderWidth: 1,
          tension: 0.2,
          pointRadius: 2,
          pointHoverRadius: 10,
          pointHitRadius: 20
        },
        ...(!mostrarPeriodoActual ? [{
          label: "Promedio acumulativo",
          data: promedioAcumulativo,
          borderColor: "rgba(220, 20, 60, 1)",
          borderWidth: 1,
          tension: 0.2,
          pointRadius: 1.5,
          pointHoverRadius: 10,
          pointHitRadius: 20,
          fill: false
        }] : [{
          label: "Promedio acumulativo",
          data: promedioAcumulativo,
          borderColor: "rgba(220, 20, 60, 1)",
          borderWidth: 1,
          tension: 0.2,
          pointRadius: 1.5,
          pointHoverRadius: 10,
          pointHitRadius: 20,
          fill: false
        }]),
        {
          label: "Promedio móvil (7 días)",
          data: promedioMovil,
          borderColor: "#2196F3",
          borderWidth: 1,
          tension: 0.2,
          pointRadius: 1.5,
          pointHoverRadius: 10,
          pointHitRadius: 20,
          fill: false
        },
        {
          label: "Límite diario ajustado",
          data: dataLimite,
          borderColor: "orange",
          borderDash: [6, 6],
          borderWidth: 0.7,
          pointRadius: 2.5,
          pointBackgroundColor: "orange",
          pointHoverRadius: 10,
          pointHitRadius: 20,
          pointHoverBackgroundColor: "orange",
          fill: false,
          tension: 0,
          spanGaps: true
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          usePointStyle: true,
          callbacks: {
            title: function(context) {
              const fechaISO = fechasISO.sort()[context[0].dataIndex];
              const fecha = crearFechaLocal(fechaISO);
              const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
              const nombreDia = dias[fecha.getDay()];
              return [`${formatFechaCorta(fechaISO)} (${nombreDia})`];
            },
            label: function(context) {
              const monto = context.parsed.y?.toLocaleString("es-MX", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              });
              return monto ? `   $${monto}` : null;
            }
          }
        },
        legend: {
          labels: {
            usePointStyle: true,
            boxWidth: 12,
            padding: 16,
            pointStyle: 'line'
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: "Fecha" },
          ticks: { autoSkip: false }
        },
        y: {
          title: { display: true, text: "Monto ($)" },
          grid: {
            color: "rgba(255, 255, 255, 0.05)",
            lineWidth: 1
          },
          ticks: {
            stepSize: 1000
          }
        }
      }
    }
  });

  history.pushState({ vista: "vista-graficas" }, "", "#vista-graficas");
}

function cerrarVistaGraficas() {
  document.getElementById("vista-graficas").style.display = "none";
  document.getElementById("vista-tabla").style.display = "block";
  
  if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock("portrait").catch((err) => {
      console.log("No se pudo volver a bloquear a portrait:", err);
    });
  }
}

// Visualización de resumen por categoría con barras apiladas
function mostrarVistaResumenBarras() {
  const conf = cargarLimites();
  const hoy = getToday();
  const gastos = JSON.parse(localStorage.getItem("gastos")) || [];
  const fijosPendientes = obtenerFijosPendientes().filter(g => g.estado === "pendiente");
  const fijosDesdeFormulario = gastos.filter(g => g.fijo && g.timestamp.slice(0, 10) >= getMonthCustom(hoy, conf.inicioMes) && g.timestamp.slice(0, 10) < getMonthCustom(sumarDias(getMonthCustom(hoy, conf.inicioMes), 32), conf.inicioMes));

  const rangos = {
    dia: [hoy, hoy],
    semana: [getWeekCustom(hoy, conf.inicioSemana), sumarDias(getWeekCustom(hoy, conf.inicioSemana), 7)],
    mes: [getMonthCustom(hoy, conf.inicioMes), getMonthCustom(sumarDias(getMonthCustom(hoy, conf.inicioMes), 32), conf.inicioMes)],
    tdc: [getMonthCustom(hoy, conf.inicioTDC), getMonthCustom(sumarDias(getMonthCustom(hoy, conf.inicioTDC), 32), conf.inicioTDC)],
    compartido: [getMonthCustom(hoy, conf.inicioCompartido), getMonthCustom(sumarDias(getMonthCustom(hoy, conf.inicioCompartido), 32), conf.inicioCompartido)]
  };

  const resumen = {
    Día: { gasto: 0, limite: conf.dia },
    Semana: { gasto: 0, limite: conf.semana },
    Mes: { gasto: 0, limite: conf.mes },
    TDC: { gasto: 0, limite: conf.tdc },
    Compartido: { gasto: 0, limite: conf.compartido }
  };

  gastos.forEach(g => {
    const fecha = g.timestamp.slice(0, 10);
    if (!g.fijo && fecha === hoy) resumen.Día.gasto += g.monto;
    if (!g.fijo && fecha >= rangos.semana[0] && fecha < rangos.semana[1])
      resumen.Semana.gasto += g.monto;
    if (fecha >= rangos.mes[0] && fecha < rangos.mes[1]) {
      if (!g.fijo) resumen.Mes.gasto += g.monto;
    }
    if (fecha >= rangos.compartido[0] && fecha < rangos.compartido[1]) {      
      if (g.compartido) resumen.Compartido.gasto += g.monto;
    }
    if (g.medio === "TDC" && fecha >= rangos.tdc[0] && fecha < rangos.tdc[1])
      resumen.TDC.gasto += g.monto;
  });

  // Ajustar disponible mensual descontando fijos
  const totalFijosMensual = [...fijosPendientes, ...fijosDesdeFormulario].reduce((acc, g) => acc + g.monto, 0);
  resumen.Mes.limite -= totalFijosMensual;

  const categorias = Object.keys(resumen);
  const gastado = categorias.map(k => resumen[k].gasto);
  const disponible = categorias.map(k => resumen[k].limite - resumen[k].gasto);
  const totales = categorias.map((_, i) => Math.max(resumen[categorias[i]].limite, resumen[categorias[i]].gasto, 1));
  const normalizar = arr => arr.map((v, i) => totales[i] > 0 ? Math.max(v, 0) / totales[i] : 0);

  const ctx = document.getElementById("grafica-resumen-barras").getContext("2d");  

  if (window.graficoResumen) {
    window.graficoResumen.data.labels = categorias;
    window.graficoResumen.data.datasets[0].data = normalizar(gastado);
    window.graficoResumen.data.datasets[1].data = normalizar(disponible);
    window.graficoResumen.options.plugins.datalabels.formatter = crearFormatter(gastado, disponible);
    window.graficoResumen.options.plugins.datalabels.color = context => {
      const label = context.dataset.label;
      const index = context.dataIndex;
      const value = label === "Gastado" ? gastado[index] : disponible[index];
      return value < 0 ? '#FE170D' : '#fff';
    };
    window.graficoResumen.update();
    return;
  }
 

  function crearFormatter(gastado, disponible) {
    return (value, context) => {
      const index = context.dataIndex;
      const label = context.dataset.label;
      const realValue = label === "Gastado" ? gastado[index] : disponible[index];
      return `$${realValue.toLocaleString("es-MX", { minimumFractionDigits: 0 })}`;
    };
  }

  window.graficoResumen = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: categorias,
      datasets: [
        {
          label: "Gastado",
          barThickness: 30,

          data: normalizar(gastado),
          backgroundColor: "rgba(83, 51, 43, 0.5)"
        },
        {
          label: "Disponible",
          barThickness: 30,
          data: normalizar(disponible),
          backgroundColor: "rgba(26, 32, 41, 0.6)"
        }
      ]
    },
    plugins: [ChartDataLabels],
    options: {
      indexAxis: 'y',
      responsive: true,
      scales: {
        x: {
          stacked: true,
          max: 1,
          ticks: {
            callback: value => `${(value * 100).toFixed(0)}%`
          },
        },
        y: {
          stacked: true,
          ticks: {
            display: false
          },
          grid: {
            drawTicks: false 
          }
        }
      },
      animation: {
        duration: 1500, 
        easing: 'easeOutCubic',
        from: undefined,
        x: {
          duration: 1500,
          type: 'number',
          easing: 'easeOutCubic',
          from: undefined // 500
        }
      },
      plugins: {
        annotation: {
          annotations: categorias.map((label, i) => ({
            type: 'label',
            content: label,
            xValue: 0,
            yValue: i,
            position: {
              x: 'start',
              y: 'center'
            },
            font: {
              size: 12,
              weight: 'normal'
            },
            color: '#bbb',
            xAdjust: 0,
            yAdjust: -22
          }))
        },
        datalabels: {
          display: context => context.dataset.label === "Gastado" || context.dataset.label === "Disponible",
          color: context => {
            const label = context.dataset.label;
            const index = context.dataIndex;
            const value = label === "Gastado" ? gastado[index] : disponible[index];
            return value < 0 ? '#FE170D' : '#fff';
          },
          font: {
            size: 13,
            weight: 'bold'
          },
          textStrokeColor: '#000',
          textStrokeWidth: 0.1,
          anchor: context => context.dataset.label === "Gastado" ? 'start' : 'end',
          align: context => context.dataset.label === "Gastado" ? 'end' : 'start',
          offset: 0,
          formatter: crearFormatter(gastado, disponible),
          clip: false
        },
        legend: {
          labels: {
            usePointStyle: true,
            pointStyle: 'rect',
            color: '#eee'
          }
        },
        tooltip: {
          enabled: false
        }
      }
    }
  });
}

function mostrarNotaToast(nota) {
  const tooltip = document.getElementById("tooltip-nota");
  
  tooltip.classList.remove("desaparecer"); // en caso de que venga de una animación anterior
  tooltip.innerHTML = `<strong>Nota:</strong><br>${nota.replace(/\n/g, "<br>")}`;
  tooltip.style.display = "block";
  tooltip.style.opacity = "1";

  tooltip.onclick = () => {
    tooltip.classList.add("desaparecer");
  };

  tooltip.addEventListener("animationend", function cerrar() {
    if (tooltip.classList.contains("desaparecer")) {
      tooltip.style.display = "none";
      tooltip.removeEventListener("animationend", cerrar); // evitar múltiples bindings
    }
  });
}

function actualizarEtiquetaSwitchTabla(periodoActualActivo) {
  const label = document.getElementById("switch-label-tabla");
  if (periodoActualActivo) {
    label.innerHTML = `
      <span class="strike">Histórico</span> /
      <span class="bold">Periodo actual</span>`;
  } else {
    label.innerHTML = `
      <span class="bold">Histórico</span> /
      <span class="strike">Periodo actual</span>`;
  }
}

// Vista de liquidez

function obtenerLiquidez() {
  return JSON.parse(localStorage.getItem("liquidez")) || [];
}

function guardarLiquidez(arr) {
  localStorage.setItem("liquidez", JSON.stringify(arr));
  actualizarOpcionesMedioPago();
  actualizarOpcionesFiltroMedio();
}

function mostrarVistaLiquidez() {
  document.getElementById("vista-principal").style.display = "none";
  document.getElementById("resumen").style.display = "none";
  document.getElementById("vista-liquidez").style.display = "block";
  renderizarGraficaLiquidez();
  history.pushState({ vista: "vista-liquidez" }, "", "#vista-liquidez");
}

function abrirModalLiquidez() {
  document.getElementById("vista-liquidez").style.display = "none";
  document.getElementById("modal-liquidez").style.display = "block";
  renderizarTablaLiquidez();
}

function cerrarModalLiquidez() {
  document.getElementById("modal-liquidez").style.display = "none";
  document.getElementById("vista-liquidez").style.display = "block";
  renderizarGraficaLiquidez();
}

function renderizarTablaLiquidez() {

  const liquidez = obtenerLiquidez();
  const tbody = document.querySelector("#tabla-liquidez tbody");
  tbody.innerHTML = "";

  liquidez.forEach((item, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.categoria}</td>
      <td>${formatCurrency(item.monto)}</td>
      <td class="centrado">
        <span class="btn-editar" data-idx="${idx}" title="Editar">
          <svg xmlns="http://www.w3.org/2000/svg" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" class="feather feather-edit">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </span>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.querySelectorAll("#tabla-liquidez .btn-editar").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = +btn.dataset.idx;
      abrirModalEdicionLiquidez(idx);
    });
  });

}

let graficoLiquidez;

function renderizarGraficaLiquidez() {

  const liquidez = obtenerLiquidez();
  const total = liquidez.reduce((acc, el) => acc + el.monto, 0);
  document.getElementById("total-liquidez").textContent = `Total: ${formatCurrency(total)}`;

  const ctx = document.getElementById("grafica-liquidez").getContext("2d");
  if (graficoLiquidez) graficoLiquidez.destroy();

  colors = ["#04ab79ff", "#D2C1B6", "#09daffff", "#d0184cff", "#6f00ffff"]

  graficoLiquidez = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Monto ($)'],
      datasets:  [...liquidez]
      .sort((a, b) => b.monto - a.monto) 
      .map((item, i) => ({
        label: item.categoria,
        data: [item.monto],
        backgroundColor: colors[i]
      }))
    },
    options: {
      indexAxis: 'x',
      responsive: false,      
      layout: {
        padding: {
          right: 10,
          left: -5
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`
          }
        },
        legend: {
          position: 'right',
          align: 'center',
          labels: {
            boxWidth: 10,
            padding: 7
          }
        },
        datalabels: {
          color: '#fff',
          font: { weight: 'bold' },
          formatter: value => value > 0
            ? `$${value.toLocaleString("es-MX", { minimumFractionDigits: 0 })}`
            : ''
        }
      },
      scales: {
        x: {
          stacked: true
        },
        y: { stacked: true }
      }
    },
    plugins: [ChartDataLabels]
  });
}


let idxEditandoLiquidez = null;

function abrirModalEdicionLiquidez(idx) {
  const liquidez = obtenerLiquidez();
  const item = liquidez[idx];
  idxEditandoLiquidez = idx;

  document.getElementById("editar-liquidez-categoria").value = item.categoria;
  document.getElementById("editar-liquidez-monto").value = item.monto;

  document.getElementById("modal-liquidez").style.display = "none";
  document.getElementById("modal-edicion-liquidez").style.display = "block";
  history.pushState({ vista: "modal-liquidez" }, "", "#modal-liquidez");
}

function cerrarModalEdicionLiquidez() {
  document.getElementById("modal-edicion-liquidez").style.display = "none";
  document.getElementById("modal-liquidez").style.display = "block";
  idxEditandoLiquidez = null;
}

document.getElementById("form-editar-liquidez").addEventListener("submit", e => {
  e.preventDefault();
  const liquidez = obtenerLiquidez();
  const nuevoMonto = parseFloat(document.getElementById("editar-liquidez-monto").value);
  if (isNaN(nuevoMonto)) return;

  liquidez[idxEditandoLiquidez].monto = nuevoMonto;
  guardarLiquidez(liquidez);
  cerrarModalEdicionLiquidez();
  renderizarTablaLiquidez();
  mostrarVistaResumenBarras();
});

document.getElementById("btn-eliminar-liquidez").addEventListener("click", () => {
  const categoria = document.getElementById("editar-liquidez-categoria").value;
  const confirmar = confirm(`¿Eliminar la categoría "${categoria}"? Esta acción no se puede deshacer.`);

  if (!confirmar) return;

  const liquidez = obtenerLiquidez();
  liquidez.splice(idxEditandoLiquidez, 1);
  guardarLiquidez(liquidez);
  cerrarModalEdicionLiquidez();
  renderizarTablaLiquidez();
  mostrarVistaResumenBarras();
});


function renderizarDistribucionSemanal() {
  const distribucion = obtenerDistribucionSemanal();
  const conf = cargarLimites();
  const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const hoy = crearFechaLocal(getToday());
  const diaHoy = hoy.getDay();

  const tbodyOriginal = document.querySelector("#tabla-distribucion-original tbody");
  const tbodyAjustada = document.querySelector("#tabla-distribucion-ajustada tbody");

  tbodyOriginal.innerHTML = "";
  tbodyAjustada.innerHTML = "";

  const limiteSemanal = conf.semana;

  document.getElementById("limite-semanal-actual").textContent =
  `Límite semanal actual: ${formatCurrency(limiteSemanal)}`;

  // --- Tabla Original ---
  let total = 0;
  for (let i = 0; i < 7; i++) {
    const prop = distribucion[i] || 0;
    const monto = prop * limiteSemanal;
    total += monto;

    const row = `
      <tr>
        <td>${dias[i]}</td>
        <td>${(prop * 100).toFixed(2)}%</td>
        <td>${formatCurrency(monto)}</td>
      </tr>`;
    tbodyOriginal.insertAdjacentHTML("beforeend", row);
  }

  // --- Tabla Ajustada ---
  const gastos = (JSON.parse(localStorage.getItem("gastos")) || []).filter(g => !g.fijo);
  const fechaInicio = crearFechaLocal(getToday());
  const offset = (diaHoy - conf.inicioSemana + 7) % 7;
  fechaInicio.setDate(hoy.getDate() - offset);
  fechaInicio.setHours(0, 0, 0, 0);
  
  const fechaFin = new Date(fechaInicio);

  fechaFin.setDate(fechaFin.getDate() + 7)
  
  const fechaFinISO = toLocalISODate(fechaFin);
  const fechaInicioISO = toLocalISODate(fechaInicio);

  const gastosSemana = gastos.filter(g =>
    g.timestamp.slice(0, 10) >= fechaInicioISO && g.timestamp.slice(0, 10) < fechaFinISO
  );

  const gastoPorDia = {};
  gastosSemana.forEach(g => {
    const fecha = crearFechaLocal(g.timestamp.slice(0, 10));
    const dia = fecha.getDay();
    gastoPorDia[dia] = (gastoPorDia[dia] || 0) + g.monto;
  });

  const diasSemana = [...Array(7)].map((_, i) => (fechaInicio.getDay() + i) % 7);
  const hoyRelativo = (diaHoy - conf.inicioSemana + 7) % 7;
  const diasFaltantes = diasSemana.slice(hoyRelativo);
  const gastoAcumulado = diasSemana
    .slice(0, hoyRelativo)
    .reduce((acc, d) => acc + (gastoPorDia[d] || 0), 0);
  const restante = limiteSemanal - gastoAcumulado;
  const sumaProporcionesRestantes = diasFaltantes.reduce((acc, d) => acc + distribucion[d], 0);

  diasFaltantes.forEach(d => {
    const propRel = distribucion[d] / sumaProporcionesRestantes;
    const monto = propRel * restante;
    const nuevaProp = monto / limiteSemanal;
    const row = `
      <tr>
        <td>${dias[d]}</td>
        <td>${(nuevaProp * 100).toFixed(2)}%</td>
        <td>${formatCurrency(monto)}</td>
      </tr>`;
    tbodyAjustada.insertAdjacentHTML("beforeend", row);
  });
}

function autoExpand(e) {
  const el = e.target;
  el.style.height = "auto";
  el.style.height = (el.scrollHeight) + "px";
}


function actualizarOpcionesMedioPago(selectId = "medio-pago") {
  const select = document.getElementById(selectId);
  if (!select) return;

  const liquidez = obtenerLiquidez();
  const medios = liquidez.map(item => item.categoria);

  select.innerHTML = `<option value="">Selecciona medio...</option>`;
  medios.forEach(m => {
    const option = document.createElement("option");
    option.value = m;
    option.textContent = m;
    select.appendChild(option);
  });
}


function actualizarOpcionesFiltroMedio() {
  const select = document.getElementById("filtro-medio");
  if (!select) return;

  const liquidez = obtenerLiquidez();
  const medios = liquidez.map(l => l.categoria);

  select.innerHTML = `<option value="">Todos</option>`;
  medios.forEach(m => {
    const option = document.createElement("option");
    option.value = m;
    option.textContent = m;
    select.appendChild(option);
  });
}

function mostrarModalSobrantes(gastos) {
  document.querySelectorAll("section.container").forEach(s => s.style.display = "none");

  const tbody = document.getElementById("tabla-sobrantes");
  tbody.innerHTML = "";

  gastos.forEach(g => {
    const fecha = g.timestamp.slice(0, 10);
    const fila = `
      <tr>
        <td><input type="checkbox" class="check-sobrante" data-id="${g.id}" checked></td>
        <td>${fecha}</td>
        <td>${g.concepto}</td>
        <td>${formatCurrency(g.monto)}</td>
        <td>${g.medio || "-"}</td>
        <td class="centrado">${g.compartido ? "ꪜ" : ""}</td>
        <td class="centrado">${g.fijo ? "ꪜ" : ""}</td>
      </tr>`;
    tbody.insertAdjacentHTML("beforeend", fila);
  });

  document.getElementById("modal-eliminar-sobrantes").style.display = "block";
  history.pushState({ vista: "modal-eliminar-sobrantes" }, "", "#modal-eliminar-sobrantes");

  const checkTodos = document.getElementById("check-todos-sobrantes");
  checkTodos.checked = true;
  checkTodos.addEventListener("change", () => {
    document.querySelectorAll(".check-sobrante").forEach(chk => {
      chk.checked = checkTodos.checked;
    });
  });
}

function cerrarModalSobrantes() {
  document.getElementById("modal-eliminar-sobrantes").style.display = "none";
  document.getElementById("vista-tabla").style.display = "block";
}

// === INICIALIZACIÓN ===

document.addEventListener("DOMContentLoaded", () => {
  cargarLimites();
  mostrarVistaResumenBarras();
  actualizarSugerencias();
  actualizarOpcionesMedioPago();
  actualizarOpcionesFiltroMedio();


  if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock("portrait").catch((err) => {
      console.log("No se pudo volver a bloquear a portrait:", err);
    });
  }

  document.getElementById("gasto-form").addEventListener("submit", agregarGasto);
  document.getElementById("config-form").addEventListener("submit", e => {
    e.preventDefault();
    const campos = ["dia", "semana", "mes", "compartido", "tdc"];
    const limites = Object.fromEntries(campos.map(c => [c, +document.getElementById(`limite-${c}`).value]));
    limites.inicioSemana = +document.getElementById("inicio-semana").value;
    limites.inicioMes = +document.getElementById("inicio-mes").value;
    limites.inicioTDC = +document.getElementById("inicio-tdc").value;
    limites.inicioCompartido = +document.getElementById("inicio-compartido").value;
    localStorage.setItem("limites", JSON.stringify(limites));
    volverAPrincipal();
    mostrarVistaResumenBarras();
  });
  document.getElementById("form-fijos-pendientes").addEventListener("submit", e => {
    e.preventDefault();
    const concepto = document.getElementById("nuevo-fijo-concepto").value.trim();
    const monto = +document.getElementById("nuevo-fijo-monto").value;

    if (!concepto || !monto) return;

    const fijos = obtenerFijosPendientes();
    const nota = document.getElementById("nota-fijo").value.trim();

    fijos.push({
      concepto,
      monto,
      fecha: document.getElementById("nuevo-fijo-fecha").value,
      estado: "pendiente",
      nota
    });

    guardarFijosPendientes(fijos);

    document.getElementById("form-fijos-pendientes").reset();
    renderizarFijosPendientes();
    mostrarVistaResumenBarras();
  });

  ["filtro-fijo-pendiente", "filtro-fijo-pagado", "filtro-fijo-pospuesto"].forEach(id => {
    document.getElementById(id).addEventListener("change", renderizarFijosPendientes);
  });

  document.getElementById("form-editar-fijo").addEventListener("submit", e => {
    e.preventDefault();
    const fijos = obtenerFijosPendientes();

    fijos[fijoEditandoIdx] = {
      concepto: document.getElementById("editar-fijo-concepto").value.trim(),
      monto: +document.getElementById("editar-fijo-monto").value,
      fecha: document.getElementById("editar-fijo-fecha").value,
      estado: fijos[fijoEditandoIdx].estado,
      nota: document.getElementById("editar-fijo-nota").value.trim() || ""

    };

    guardarFijosPendientes(fijos);
    cerrarFormularioEdicionFijo();
    renderizarFijosPendientes();
    mostrarVistaResumenBarras();
  });

  document.getElementById("btn-eliminar-fijo").addEventListener("click", () => {
    if (fijoEditandoIdx === null) return;

    const fijos = obtenerFijosPendientes();
    if (!fijos[fijoEditandoIdx]) return;

    if (confirm(`¿Eliminar el gasto fijo "${fijos[fijoEditandoIdx].concepto}"?`)) {
      fijos.splice(fijoEditandoIdx, 1);
      guardarFijosPendientes(fijos);
      cerrarFormularioEdicionFijo();
      renderizarFijosPendientes();
      mostrarVistaResumenBarras();
    }
  });

  document.getElementById("exportar-csv").addEventListener("click", exportarCSV);
  document.getElementById("importar-csv").addEventListener("change", importarCSV);
  document.getElementById("activar-fecha").addEventListener("change", e => {
    document.getElementById("fecha-personalizada").style.display = e.target.checked ? "block" : "none";
  });

  document.getElementById("pago-fijo-activar-fecha").addEventListener("change", e => {
    document.getElementById("pago-fijo-fecha-personalizada").style.display = e.target.checked ? "block" : "none";
  });

  // Guardar edición
  document.getElementById("form-editar").addEventListener("submit", e => {
    e.preventDefault();
    if (!gastoEditando) return;

    const todos = JSON.parse(localStorage.getItem("gastos")) || [];
    const idx = todos.findIndex(g =>
      g.timestamp === gastoEditando.timestamp &&
      g.concepto === gastoEditando.concepto &&
      g.monto === gastoEditando.monto
    );

    if (idx !== -1) {
      const fecha = document.getElementById("editar-fecha").value;
      const fechaOriginal = gastoEditando.timestamp.slice(0, 10);

      const nuevoGasto = {
        id: gastoEditando.id,
        concepto: document.getElementById("editar-concepto").value.trim(),
        monto: +document.getElementById("editar-monto").value,
        medio: document.getElementById("editar-medio").value.trim(),
        compartido: document.getElementById("editar-compartido").checked,
        fijo: document.getElementById("editar-fijo").checked,
        timestamp: fecha === fechaOriginal
          ? gastoEditando.timestamp
          : `${fecha}T23:59:00`,
        nota: document.getElementById("editar-nota").value.trim()
      };

      const gastoAnterior = todos[idx];
      const liquidez = obtenerLiquidez();

      // Revertir al medio anterior
      if (gastoAnterior.medio) {
        const iPrev = liquidez.findIndex(l => l.categoria === gastoAnterior.medio);
        if (iPrev !== -1) liquidez[iPrev].monto += gastoAnterior.monto;
      }

      // Descontar del nuevo medio
      if (nuevoGasto.medio) {
        const iNew = liquidez.findIndex(l => l.categoria === nuevoGasto.medio);
        if (iNew !== -1) liquidez[iNew].monto -= nuevoGasto.monto;
      }

      guardarLiquidez(liquidez);

      todos[idx] = nuevoGasto;
      localStorage.setItem("gastos", JSON.stringify(todos));

      cerrarFormularioEdicion();
      mostrarVistaResumenBarras();
      renderizarTablaGastos();
    }
  });

  // Eliminar gasto
  document.getElementById("btn-eliminar-gasto").addEventListener("click", () => {
    if (!gastoEditando) return;
    if (!confirm("¿Estás seguro de que quieres eliminar este gasto?")) return;

    const todos = JSON.parse(localStorage.getItem("gastos")) || [];
    const idx = todos.findIndex(g => g.id === gastoEditando.id);

    const gasto = todos[idx];

    // Revertir monto al medio anterior
    if (gasto.medio) {
      const liquidez = obtenerLiquidez();
      const i = liquidez.findIndex(item => item.categoria === gasto.medio);
      if (i !== -1) {
        liquidez[i].monto += gasto.monto;
        guardarLiquidez(liquidez);
      }
    }

    if (idx !== -1) {
      todos.splice(idx, 1);
      localStorage.setItem("gastos", JSON.stringify(todos));
      cerrarFormularioEdicion();
      mostrarVistaResumenBarras();
      renderizarTablaGastos();
    }
  });

  // Posponer gasto fijo
document.getElementById("btn-posponer-fijo").addEventListener("click", () => {
  const idx = +document.getElementById("editar-fijo").dataset.idx;
  const fijos = obtenerFijosPendientes();

  if (!fijos[idx]) return alert("Error: gasto fijo no encontrado.");

  fijos[idx].estado = "pospuesto";
  guardarFijosPendientes(fijos); // <-- importante: usar la función que guarda
  cerrarModalEdicionFijo();
  renderizarFijosPendientes();
  mostrarVistaResumenBarras();
});

  // Pagar gasto fjo
  document.getElementById("btn-pagar-fijo").addEventListener("click", () => {
    const idx = +document.getElementById("editar-fijo").dataset.idx;
    const fijos = obtenerFijosPendientes();
    const fijo = fijos[idx];
 
    actualizarOpcionesMedioPago("medio-pago-fijo");

    // Prellenar formulario del modal de pago
    document.getElementById("pago-fijo-concepto").value = fijo.concepto;
    document.getElementById("pago-fijo-monto").value = fijo.monto;
    document.getElementById("medio-pago-fijo").value = "";
    document.getElementById("pago-fijo-compartido").checked = false;
    document.getElementById("pago-fijo-activar-fecha").checked = false;
    document.getElementById("pago-fijo-fecha-personalizada").value = "";
    document.getElementById("pago-fijo-fecha-personalizada").style.display = "none";
    document.getElementById("pago-fijo-nota").value = fijo.nota || "";

    document.getElementById("form-pago-fijo").dataset.fijoRelacionado = idx;

    // Mostrar modal
    document.getElementById("modal-edicion-fijo").style.display = "none";
    document.getElementById("modal-pago-fijo").style.display = "block";
    history.pushState({ vista: "modal-pago-fijo" }, "", "#modal-pago-fijo");

  });

  // Form de pago fijo
  document.getElementById("form-pago-fijo").addEventListener("submit", e => {
    e.preventDefault();

    const concepto = document.getElementById("pago-fijo-concepto").value.trim();
    const monto = +document.getElementById("pago-fijo-monto").value;
    const medio = document.getElementById("medio-pago-fijo").value.trim();
    const compartido = document.getElementById("pago-fijo-compartido").checked;
    const usarFecha = document.getElementById("pago-fijo-activar-fecha").checked;
    const fechaInput = document.getElementById("pago-fijo-fecha-personalizada").value;
    const nota = document.getElementById("pago-fijo-nota").value.trim();

    const timestamp = usarFecha && fechaInput
      ? `${fechaInput}T23:59:00`
      : obtenerFechaHoraLocal();

    const gastos = JSON.parse(localStorage.getItem("gastos")) || [];
    const nuevoGasto = {
      id: crypto.randomUUID(),
      concepto,
      monto,
      medio,
      compartido,
      fijo: true,
      timestamp,
      nota
    };    
    gastos.push(nuevoGasto);
    localStorage.setItem("gastos", JSON.stringify(gastos));

    // Descontar de liquidez
    const liquidez = obtenerLiquidez();
    const idxMedio = liquidez.findIndex(item => item.categoria === medio);
    if (idxMedio !== -1) {
      liquidez[idxMedio].monto -= monto;
      guardarLiquidez(liquidez);
    }

    // Marcar gasto fijo como pagado
    const idx = +document.getElementById("form-pago-fijo").dataset.fijoRelacionado;
    const fijos = obtenerFijosPendientes();
    fijos[idx].estado = "pagado";
    guardarFijosPendientes(fijos);

    cerrarModalPagoFijo();
    renderizarFijosPendientes();
    mostrarVistaResumenBarras();
  });

  document.getElementById("btn-reactivar-fijo").addEventListener("click", () => {
    const idx = +document.getElementById("editar-fijo").dataset.idx;
    const fijos = obtenerFijosPendientes();

    if (!fijos[idx]) return alert("Error: gasto fijo no encontrado.");

    fijos[idx].estado = "pendiente";
    guardarFijosPendientes(fijos);
    cerrarModalEdicionFijo();
    renderizarFijosPendientes();
    mostrarVistaResumenBarras();
  });

  window.addEventListener("popstate", () => {
    const visible = document.querySelector("section[style*='display: block']");

    if (!visible) return;

    if (visible.id === "vista-distribucion-semanal") {
      cerrrarVistaDistribucionSemanal();
      return;
    }

    if (visible.id === "modal-editar-distribucion") {
      cerrarEdicionDistribucion();
      return;
    }
    
    if (visible.id === "modal-edicion") {
      cerrarFormularioEdicion();
      return;
    }

    if (visible.id === "tabla-sobrantes") {
      cerrarModalSobrantes();
      return;
    }
    
    if (visible.id === "vista-graficas") {
      cerrarVistaGraficas();
      return;
    }

    if (visible.id === "modal-edicion-fijo") {
      cerrarFormularioEdicionFijo();
      return;
    }

    if (visible.id === "modal-pago-fijo") {
      cerrarModalPagoFijo();
      return;
    }

    if (visible.id === "modal-liquidez") {
      cerrarModalLiquidez();
      return;
    }

    if (visible.id === "modal-edicion-liquidez") {
      cerrarModalEdicionLiquidez();
      return;
    }

    if (visible.id !== "vista-principal") {
      volverAPrincipal();
      return;
    }

  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      const graficaVisible = document.getElementById("vista-graficas").style.display === "block";
      const resumenVisible = document.getElementById("vista-principal").style.display === "block" &&
                            document.getElementById("resumen").style.display === "block";

      if (graficaVisible) mostrarVistaGraficas();
      if (resumenVisible) mostrarVistaResumenBarras();
    }
  });

  window.addEventListener("pageshow", () => {
    const graficaVisible = document.getElementById("vista-graficas").style.display === "block";
    const resumenVisible = document.getElementById("vista-principal").style.display === "block" &&
                          document.getElementById("resumen").style.display === "block";

    if (graficaVisible) mostrarVistaGraficas();
    if (resumenVisible) mostrarVistaResumenBarras();
  });

  document.getElementById("switch-tabla-periodo-actual").addEventListener("change", () => {
    const checked = document.getElementById("switch-tabla-periodo-actual").checked;
    actualizarEtiquetaSwitchTabla(checked);
    renderizarTablaGastos(); // vuelve a renderizar filtrando
  });

  // Vista de liquidez
  document.getElementById("form-liquidez").addEventListener("submit", e => {
    e.preventDefault();
    const categoria = document.getElementById("nueva-categoria").value.trim();
    const monto = +document.getElementById("monto-categoria").value;
    if (!categoria || isNaN(monto)) return;

    const liquidez = obtenerLiquidez();
    const idx = liquidez.findIndex(el => el.categoria.toLowerCase() === categoria.toLowerCase());

    if (idx !== -1) {
      liquidez[idx].monto = monto;
    } else {
      liquidez.push({ categoria, monto });
    }

    guardarLiquidez(liquidez);
    document.getElementById("form-liquidez").reset();
    renderizarTablaLiquidez();
    renderizarGraficaLiquidez(); // actualiza gráfica
  });

  document.getElementById("form-editar-distribucion").addEventListener("submit", e => {
    e.preventDefault();

    const nuevaDistribucion = {};
    let suma = 0;

    for (let i = 0; i < 7; i++) {
      const input = document.getElementById(`input-dia-${i}`);
      const valor = parseFloat(input.value) || 0;
      suma += valor;
      nuevaDistribucion[i] = valor / 100;
    }

    const msg = document.getElementById("distribucion-feedback");
    if (Math.abs(suma - 100) > 0.01) {
      msg.textContent = `❌ La suma es ${suma.toFixed(2)}%. Debe ser exactamente 100%.`;
      return;
    }
    msg.textContent = "";

    guardarDistribucionSemanal(nuevaDistribucion);

    // Recalcular límite diario dinámico desde hoy
    const hoy = getToday();
    const gastos = (JSON.parse(localStorage.getItem("gastos")) || []).filter(g => !g.fijo);
    const conf = JSON.parse(localStorage.getItem("limites"));

    const nuevoLimite = calcularLimiteDinamicoDiario({
      gastos,
      limiteSemanal: conf.semana,
      distribucion: nuevaDistribucion,
      inicioSemana: conf.inicioSemana
    });

    conf.dia = Math.max(0, Math.round(nuevoLimite));
    localStorage.setItem("limites", JSON.stringify(conf));
    localStorage.setItem("limites_dia_aplicado", hoy);

    cerrarEdicionDistribucion();
    renderizarDistribucionSemanal();
    mostrarVistaResumenBarras();
  });

  document.querySelectorAll("textarea").forEach(area => {
    area.addEventListener("input", autoExpand);
  });

  document.getElementById("form-eliminar-sobrantes").addEventListener("submit", e => {
    e.preventDefault();

    const seleccionados = Array.from(document.querySelectorAll(".check-sobrante:checked"))
      .map(chk => chk.dataset.id);

    if (seleccionados.length === 0) {
      if (!confirm("No seleccionaste ningún gasto para eliminar. ¿Deseas conservar todos los gastos extra en localStorage?")) return;

      cerrarModalSobrantes();
      return;
    }

    if (!confirm(`¿Eliminar ${seleccionados.length} gasto(s) seleccionados y reintegrar su liquidez?`)) return;

    let gastos = JSON.parse(localStorage.getItem("gastos")) || [];
    const liquidez = obtenerLiquidez();

    // Filtrar y revertir liquidez
    const eliminados = gastos.filter(g => seleccionados.includes(g.id));
    eliminados.forEach(g => {
      const idx = liquidez.findIndex(l => l.categoria === g.medio);
      if (idx !== -1) {
        liquidez[idx].monto += g.monto;
      }
    });

    // Eliminar gastos
    gastos = gastos.filter(g => !seleccionados.includes(g.id));

    // Guardar
    localStorage.setItem("gastos", JSON.stringify(gastos));
    guardarLiquidez(liquidez);

    cerrarModalSobrantes();
    renderizarTablaGastos();
    mostrarVistaResumenBarras();
  });


});
