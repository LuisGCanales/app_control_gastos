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

function cargarLimites() {
  const predet = { dia: 700, semana: 3750, mes: 20000, compartido: 4000, tdc: 15000, inicioSemana: 1, inicioMes: 1, inicioTDC: 11 };
  const conf = JSON.parse(localStorage.getItem("limites")) || predet;

  ["dia", "semana", "mes", "compartido", "tdc"].forEach(c =>
    document.getElementById(`limite-${c}`).value = conf[c]
  );
  document.getElementById("inicio-semana").value = conf.inicioSemana;
  document.getElementById("inicio-mes").value = conf.inicioMes;
  document.getElementById("inicio-tdc").value = conf.inicioTDC;

  return conf;
}

// === VISTAS ===

const mostrarConfiguracion = () => {
  document.getElementById("vista-principal").style.display = "none";
  document.getElementById("vista-configuracion").style.display = "block";
};

function mostrarFijosPendientes() {
  document.getElementById("vista-principal").style.display = "none";
  document.getElementById("vista-fijos-pendientes").style.display = "block";
  renderizarFijosPendientes();
}

const volverAPrincipal = () => {
  ["vista-configuracion", "vista-tabla", "vista-fijos-pendientes", "modal-edicion-fijo", "vista-graficas"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
  document.getElementById("vista-principal").style.display = "block";
};
  
// === OPERACIONES CON GASTOS ===

function agregarGasto(e) {
  e.preventDefault();
  const monto = +document.getElementById("monto").value;
  const concepto = document.getElementById("concepto").value.trim();
  if (!monto || !concepto) return alert("Ingresa un monto y concepto válido.");

  const tdc = document.getElementById("tdc").checked;
  const compartido = document.getElementById("compartido").checked;
  const fijo = document.getElementById("fijo").checked;
  const fechaInput = document.getElementById("fecha-personalizada").value;
  const timestamp = document.getElementById("activar-fecha").checked && fechaInput
    ? `${fechaInput}T23:59:00`
    : obtenerFechaHoraLocal();

  const gastos = JSON.parse(localStorage.getItem("gastos")) || [];
  gastos.push({ monto, concepto, tdc, compartido, fijo, timestamp });
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
  actualizarResumen();
  mostrarVistaResumenBarras();
  actualizarSugerencias();
  volverAPrincipal();
}

function exportarCSV() {
  const gastos = JSON.parse(localStorage.getItem("gastos")) || [];
  const filas = [["timestamp", "monto", "concepto", "tdc", "compartido", "fijo"],
    ...gastos.map(g => [
      g.timestamp.replace("T", " "),
      g.monto,
      g.concepto,
      g.tdc ? "Si" : "No",
      g.compartido ? "Si" : "No",
      g.fijo ? "Si" : "No"
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
    const nuevos = evt.target.result.split("\n").slice(1).map(linea => {
      const [timestamp, monto, concepto, tdc, compartido, fijo] = linea.split(",");
      return {
        timestamp: timestamp.trim().replace(" ", "T"),
        monto: Number(monto),
        concepto,
        tdc: (tdc || "").trim() === "Si",
        compartido: (compartido || "").trim() === "Si",
        fijo: (fijo || "").trim() === "Si"
      };
    }).filter(g => g.timestamp);

    localStorage.setItem("gastos", JSON.stringify(nuevos));
    actualizarResumen();
    mostrarVistaResumenBarras();
    renderizarTablaGastos();
  };
  reader.readAsText(archivo);
}

// === INTERFAZ DE USUARIO ===

function actualizarResumen() {
  const gastos = (JSON.parse(localStorage.getItem("gastos")) || []);
  const conf = cargarLimites();
  const hoy = getToday();

  const rangos = {
    dia: [hoy, hoy],
    semana: [getWeekCustom(hoy, conf.inicioSemana), sumarDias(getWeekCustom(hoy, conf.inicioSemana), 7)],
    mes: [getMonthCustom(hoy, conf.inicioMes), getMonthCustom(sumarDias(getMonthCustom(hoy, conf.inicioMes), 32), conf.inicioMes)],
    tdc: [getMonthCustom(hoy, conf.inicioTDC), getMonthCustom(sumarDias(getMonthCustom(hoy, conf.inicioTDC), 32), conf.inicioTDC)]
  };

  let totales = { dia: 0, semana: 0, mes: 0, compartido: 0, tdc: 0 };

  for (const g of gastos) {
    const fecha = g.timestamp.slice(0, 10);

    if (!g.fijo && fecha === hoy) totales.dia += g.monto;
    if (!g.fijo && fecha >= rangos.semana[0] && fecha < rangos.semana[1]) totales.semana += g.monto;

    if (fecha >= rangos.mes[0] && fecha < rangos.mes[1]) {
      if (!g.fijo) totales.mes += g.monto;
      if (g.compartido) totales.compartido += g.monto;
    }

    if (fecha >= rangos.tdc[0] && fecha < rangos.tdc[1] && g.tdc) {
      totales.tdc += g.monto;
    }
  }

  ["dia", "semana", "mes", "compartido", "tdc"].forEach(c => {
    const total = totales[c];
    let disponible = conf[c] - total;

    if (c === "mes") {
      const pendientes = obtenerFijosPendientes()
        .filter(g => g.estado === "pendiente")
        .reduce((acc, g) => acc + g.monto, 0);

        // Gastos ingresados como "fijo" en la vista principal
        const fijosPagadosDesdeFormulario = gastos
          .filter(g => {
            const fecha = g.timestamp.slice(0, 10);
            return g.fijo && fecha >= rangos.mes[0] && fecha < rangos.mes[1];
          })
          .reduce((acc, g) => acc + g.monto, 0);

        disponible -= (pendientes + fijosPagadosDesdeFormulario);
    }

    document.getElementById(`total-${c}`).textContent = formatCurrency(total);
    const dispEl = document.getElementById(`disponible-${c}`);
    dispEl.textContent = formatCurrency(disponible);
    dispEl.classList.toggle("excedido", disponible < 0);
  });
}

function actualizarSugerencias() {
  const conceptos = [...new Set((JSON.parse(localStorage.getItem("gastos")) || []).map(g => g.concepto).filter(Boolean))].sort();
  const datalist = document.getElementById("sugerencias");
  datalist.innerHTML = "";
  conceptos.forEach(c => datalist.appendChild(Object.assign(document.createElement("option"), { value: c })));
}

// === TABLA DE GASTOS ===

function mostrarTabla() {
  document.getElementById("vista-principal").style.display = "none";
  document.getElementById("vista-tabla").style.display = "block";

  // Renderiza y asigna eventos
  renderizarTablaGastos();
  document.getElementById("filtro-fecha").addEventListener("input", renderizarTablaGastos);
  document.getElementById("filtro-fijos").addEventListener("change", renderizarTablaGastos);
  document.getElementById("filtro-variables").addEventListener("change", renderizarTablaGastos);
  document.getElementById("filtro-solo-tdc").addEventListener("change", renderizarTablaGastos);
  document.getElementById("filtro-solo-compartido").addEventListener("change", renderizarTablaGastos);
  document.getElementById("limpiar-filtros").addEventListener("click", () => {
    document.getElementById("filtro-fecha").value = "";
    document.getElementById("filtro-fijos").checked = false;
    document.getElementById("filtro-variables").checked = true;
    document.getElementById("filtro-solo-tdc").checked = false;
    document.getElementById("filtro-solo-compartido").checked = false;
    renderizarTablaGastos();
  });
}

function renderizarTablaGastos() {
  const gastos = JSON.parse(localStorage.getItem("gastos")) || [];

  // Filtros
  const fFecha = document.getElementById("filtro-fecha").value;
  const mostrarFijos = document.getElementById("filtro-fijos").checked;
  const mostrarVariables = document.getElementById("filtro-variables").checked;
  const soloTDC = document.getElementById("filtro-solo-tdc").checked;
  const soloCompartido = document.getElementById("filtro-solo-compartido").checked;

  // Filtrado activo
  const filtrados = gastos.filter(g => {
    const fecha = g.timestamp.slice(0, 10);
    const esFijo = g.fijo;
    const mostrarPorTipo = (esFijo && mostrarFijos) || (!esFijo && mostrarVariables);
    const pasaTDC = !soloTDC || g.tdc;
    const pasaCompartido = !soloCompartido || g.compartido;
    const pasaFecha = !fFecha || fecha === fFecha;
    return mostrarPorTipo && pasaTDC && pasaCompartido && pasaFecha;
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
        <td>${g.concepto}</td>
        <td class="${g.monto < 0 ? 'reintegro' : ''}">${formatCurrency(g.monto)}</td>
        <td class="centrado">${g.tdc ? "ꪜ" : ""}</td>
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

  document.getElementById("editar-concepto").value = gasto.concepto;
  document.getElementById("editar-monto").value = gasto.monto;
  document.getElementById("editar-tdc").checked = gasto.tdc;
  document.getElementById("editar-compartido").checked = gasto.compartido;
  document.getElementById("editar-fijo").checked = gasto.fijo || false;
  document.getElementById("editar-fecha").value = gasto.timestamp.slice(0, 10);
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
        <td>${g.concepto}</td>
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
    ["concepto", "monto", "fecha", "estado"],
    ...fijos.map(g => [
      g.concepto,
      g.monto,
      g.fecha,
      g.estado
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
    const nuevos = evt.target.result
      .split("\n")
      .slice(1) // omitir encabezado
      .map(linea => {
        const [concepto, monto, fecha, estado] = linea.split(",");
        return {
          concepto: concepto?.trim() ?? "",
          monto: +monto,
          fecha: fecha?.trim() ?? "",
          estado: estado?.trim() ?? "pendiente"
        };
      }).filter(g => g.concepto && g.fecha);

    guardarFijosPendientes(nuevos);
    renderizarFijosPendientes();
    actualizarResumen();
    mostrarVistaResumenBarras();
  };
  reader.readAsText(archivo);
  e.target.value = ""; // reinicia el input para permitir mismo archivo
}


// Visualización de gastos variables
function mostrarVistaGraficas() {
  document.getElementById("vista-tabla").style.display = "none";
  document.getElementById("vista-graficas").style.display = "block";

  const gastos = JSON.parse(localStorage.getItem("gastos")) || [];

  // Filtrar solo gastos variables
  const variables = gastos.filter(g => !g.fijo);

  // Agrupar por fecha
  const agrupados = {};
  variables.forEach(g => {
    const fecha = g.timestamp.slice(0, 10);
    agrupados[fecha] = (agrupados[fecha] || 0) + g.monto;
  });

  const fechasISO = Object.keys(agrupados).sort();
  const fechas = fechasISO.map(f => formatFechaCorta(f));

  const montos = fechasISO.map(f => agrupados[f]);

  const promedioAcumulativo = [];
  let suma = 0;

  for (let i = 0; i < montos.length; i++) {
    suma += montos[i];
    promedioAcumulativo.push(suma / (i + 1));
  }
  const ctx = document.getElementById("grafica-gastos-diarios").getContext("2d");

  if (window.graficoGastos) window.graficoGastos.destroy();  // limpiar si ya existe

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
          pointHoverRadius: 5,
          pointHitRadius: 10        
        },
        {
          label: "Promedio acumulativo",
          data: promedioAcumulativo,
          borderColor: "rgba(220, 20, 60, 1)",
          borderWidth: 1,
          tension: 0.2,
          pointRadius: 1.5,
          pointHoverRadius: 5,
          pointHitRadius: 10,
          fill: false
        }
      ]
    },
    options: {
      responsive: false,
      plugins: {
        tooltip: {
          usePointStyle: true,
          callbacks: {
            label: function(context) {
              const monto = context.parsed.y.toLocaleString("es-MX", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              });
              return ` Monto: $${monto}`;
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
}

// Visualización de resumen por categoría con barras apiladas
function mostrarVistaResumenBarras() {
  const conf = cargarLimites();
  const hoy = getToday();
  const gastos = JSON.parse(localStorage.getItem("gastos")) || [];
  const fijosPendientes = obtenerFijosPendientes().filter(g => g.estado === "pendiente");
  const fijosDesdeFormulario = gastos.filter(g => g.fijo && g.timestamp.slice(0, 10) >= getMonthCustom(hoy, conf.inicioMes) && g.timestamp.slice(0, 10) < getMonthCustom(sumarDias(getMonthCustom(hoy, conf.inicioMes), 32), conf.inicioMes));

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
    if (!g.fijo && fecha >= getWeekCustom(hoy, conf.inicioSemana) && fecha < sumarDias(getWeekCustom(hoy, conf.inicioSemana), 7))
      resumen.Semana.gasto += g.monto;
    if (!g.fijo && fecha >= getMonthCustom(hoy, conf.inicioMes) && fecha < getMonthCustom(sumarDias(getMonthCustom(hoy, conf.inicioMes), 32), conf.inicioMes))
      resumen.Mes.gasto += g.monto;
    if (g.tdc && fecha >= getMonthCustom(hoy, conf.inicioTDC) && fecha < getMonthCustom(sumarDias(getMonthCustom(hoy, conf.inicioTDC), 32), conf.inicioTDC))
      resumen.TDC.gasto += g.monto;
    if (g.compartido && fecha >= getMonthCustom(hoy, conf.inicioMes) && fecha < getMonthCustom(sumarDias(getMonthCustom(hoy, conf.inicioMes), 32), conf.inicioMes))
      resumen.Compartido.gasto += g.monto;
  });

  // Ajustar disponible mensual descontando fijos
  const totalFijosMensual = [...fijosPendientes, ...fijosDesdeFormulario].reduce((acc, g) => acc + g.monto, 0);
  resumen.Mes.limite -= totalFijosMensual;

  const categorias = Object.keys(resumen);
  const gastado = categorias.map(k => resumen[k].gasto);
  const disponible = categorias.map(k => resumen[k].limite - resumen[k].gasto);
  const totales = categorias.map((_, i) => Math.max(resumen[categorias[i]].limite, resumen[categorias[i]].gasto, 1));
  const normalizar = arr => arr.map((v, i) => Math.max(v, 0) / totales[i]);

  const ctx = document.getElementById("grafica-resumen-barras").getContext("2d");  
  if (window.graficoResumen) {
    window.graficoResumen.data.labels = categorias;
    window.graficoResumen.data.datasets[0].data = normalizar(gastado);
    window.graficoResumen.data.datasets[1].data = normalizar(disponible);
    window.graficoResumen.options.plugins.datalabels.formatter = crearFormatter(gastado, disponible);
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
          // backgroundColor: "rgba(229,115,115,1)"
          backgroundColor: "rgba(82, 52, 33, 0.7)"
        },
        {
          label: "Disponible",
          barThickness: 30,
          data: normalizar(disponible),
          // backgroundColor: "rgba(129,199,132,1)"
          backgroundColor: "rgba(63, 63, 63, 0.7)"
        }
      ]
    },
    plugins: [ChartDataLabels],
    options: {
      indexAxis: 'y',
      responsive: false,
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


// === INICIALIZACIÓN ===

document.addEventListener("DOMContentLoaded", () => {
  cargarLimites();
  actualizarResumen();
  mostrarVistaResumenBarras();
  actualizarSugerencias();

  document.getElementById("gasto-form").addEventListener("submit", agregarGasto);
  document.getElementById("config-form").addEventListener("submit", e => {
    e.preventDefault();
    const campos = ["dia", "semana", "mes", "compartido", "tdc"];
    const limites = Object.fromEntries(campos.map(c => [c, +document.getElementById(`limite-${c}`).value]));
    limites.inicioSemana = +document.getElementById("inicio-semana").value;
    limites.inicioMes = +document.getElementById("inicio-mes").value;
    limites.inicioTDC = +document.getElementById("inicio-tdc").value;
    localStorage.setItem("limites", JSON.stringify(limites));
    volverAPrincipal();
    actualizarResumen();
    mostrarVistaResumenBarras();
  });
  document.getElementById("form-fijos-pendientes").addEventListener("submit", e => {
    e.preventDefault();
    const concepto = document.getElementById("nuevo-fijo-concepto").value.trim();
    const monto = +document.getElementById("nuevo-fijo-monto").value;

    if (!concepto || !monto) return;

    const fijos = obtenerFijosPendientes();
    fijos.push({
      concepto,
      monto,
      fecha: document.getElementById("nuevo-fijo-fecha").value,
      estado: "pendiente"
    });

    guardarFijosPendientes(fijos);

    document.getElementById("form-fijos-pendientes").reset();
    renderizarFijosPendientes();
    actualizarResumen();
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
      estado: fijos[fijoEditandoIdx].estado
    };

    guardarFijosPendientes(fijos);
    cerrarFormularioEdicionFijo();
    renderizarFijosPendientes();
    actualizarResumen();
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
      actualizarResumen();
      mostrarVistaResumenBarras();
    }
  });

  document.getElementById("exportar-csv").addEventListener("click", exportarCSV);
  document.getElementById("importar-csv").addEventListener("change", importarCSV);
  document.getElementById("activar-fecha").addEventListener("change", e => {
    document.getElementById("fecha-personalizada").style.display = e.target.checked ? "block" : "none";
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
      todos[idx] = {
        concepto: document.getElementById("editar-concepto").value.trim(),
        monto: +document.getElementById("editar-monto").value,
        tdc: document.getElementById("editar-tdc").checked,
        compartido: document.getElementById("editar-compartido").checked,
        fijo: document.getElementById("editar-fijo").checked,
        timestamp: fecha === fechaOriginal
          ? gastoEditando.timestamp
          : `${fecha}T23:59:00`
      };
      localStorage.setItem("gastos", JSON.stringify(todos));
      cerrarFormularioEdicion();
      actualizarResumen();
      mostrarVistaResumenBarras();
      renderizarTablaGastos();
    }
  });

  // Eliminar gasto
  document.getElementById("btn-eliminar-gasto").addEventListener("click", () => {
    if (!gastoEditando) return;
    if (!confirm("¿Estás seguro de que quieres eliminar este gasto?")) return;

    const todos = JSON.parse(localStorage.getItem("gastos")) || [];
    const idx = todos.findIndex(g =>
      g.timestamp === gastoEditando.timestamp &&
      g.concepto === gastoEditando.concepto &&
      g.monto === gastoEditando.monto &&
      g.tdc === gastoEditando.tdc &&
      g.compartido === gastoEditando.compartido
    );
    if (idx !== -1) {
      todos.splice(idx, 1);
      localStorage.setItem("gastos", JSON.stringify(todos));
      cerrarFormularioEdicion();
      actualizarResumen();
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
  actualizarResumen();
  mostrarVistaResumenBarras();
});

  // Pagar gasto fjo
  document.getElementById("btn-pagar-fijo").addEventListener("click", () => {
    const idx = +document.getElementById("editar-fijo").dataset.idx;
    const fijos = obtenerFijosPendientes();
    const fijo = fijos[idx];

    // Prellenar formulario del modal de pago
    document.getElementById("pago-fijo-concepto").value = fijo.concepto;
    document.getElementById("pago-fijo-monto").value = fijo.monto;
    document.getElementById("pago-fijo-tdc").checked = false;
    document.getElementById("pago-fijo-compartido").checked = false;
    document.getElementById("pago-fijo-activar-fecha").checked = false;
    document.getElementById("pago-fijo-fecha-personalizada").value = "";

    document.getElementById("form-pago-fijo").dataset.fijoRelacionado = idx;

    // Mostrar modal
    document.getElementById("modal-edicion-fijo").style.display = "none";
    document.getElementById("modal-pago-fijo").style.display = "block";
  });

  // Form de pago fijo
  document.getElementById("form-pago-fijo").addEventListener("submit", e => {
    e.preventDefault();

    const concepto = document.getElementById("pago-fijo-concepto").value.trim();
    const monto = +document.getElementById("pago-fijo-monto").value;
    const tdc = document.getElementById("pago-fijo-tdc").checked;
    const compartido = document.getElementById("pago-fijo-compartido").checked;
    const usarFecha = document.getElementById("pago-fijo-activar-fecha").checked;
    const fechaInput = document.getElementById("pago-fijo-fecha-personalizada").value;

    const timestamp = usarFecha && fechaInput
      ? `${fechaInput}T23:59:00`
      : obtenerFechaHoraLocal();

    const gastos = JSON.parse(localStorage.getItem("gastos")) || [];
    gastos.push({ concepto, monto, tdc, compartido, fijo: true, timestamp });
    localStorage.setItem("gastos", JSON.stringify(gastos));

    // Marcar gasto fijo como pagado
    const idx = +document.getElementById("form-pago-fijo").dataset.fijoRelacionado;
    const fijos = obtenerFijosPendientes();
    fijos[idx].estado = "pagado";
    guardarFijosPendientes(fijos);

    cerrarModalPagoFijo();
    renderizarFijosPendientes();
    actualizarResumen();
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
    actualizarResumen();
    mostrarVistaResumenBarras();
  });

});
