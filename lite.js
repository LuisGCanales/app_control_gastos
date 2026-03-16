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

function format(n){
  return Math.round(n).toLocaleString()
}

// Fecha de inicio de semana personalizada
const getInicioSemana = (fecha, inicio) => {
  const d = new crearFechaLocal(fecha);
  const diff = (d.getDay() - inicio + 7) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return toLocalISODate(d);
};

function getFinSemana(inicioSemana){

  const fin = sumarDias(inicioSemana, 6);
  return fin
}

function cargarMediosPago(){

  const select = document.getElementById("medio-pago")

  const liquidez = JSON.parse(localStorage.getItem("liquidez")) || []

  select.innerHTML = ""

  liquidez.forEach(item => {

    const option = document.createElement("option")

    option.value = item.categoria

    option.textContent = item.categoria

    select.appendChild(option)

  })

}

function calcularGastoDia(gastos){

  const hoy = getToday();

  return gastos
  .filter(g => !g.fijo && g.timestamp.slice(0,10) === hoy)
  .reduce((a,b)=>a+b.monto,0)

}

function calcularGastoSemana(gastos, limites){
  
  const inicio = getInicioSemana(getToday(), limites.inicioSemana || 0)

  const fin = getFinSemana(inicio)

  return gastos.filter(g => {

    const fecha = g.timestamp.slice(0,10)

    return !g.fijo && fecha >= inicio && fecha <= fin

  })
  .reduce((a,b)=>a+b.monto,0)

}

function colorDisponible(el, valor){

  if(valor >= 0){
    el.style.color = "#32ad13"   // verde
  } else {
    el.style.color = "#d22"      // rojo
  }

}

function actualizarResumen(){

  const limites = JSON.parse(localStorage.getItem("limites")) || {}

  const gastos = JSON.parse(localStorage.getItem("gastos")) || []

  const gastoDia = calcularGastoDia(gastos)

  const gastoSemana = calcularGastoSemana(gastos, limites)

  const restanteDia = (limites.dia || 0) - gastoDia

  const restanteSemana = (limites.semana || 0) - gastoSemana

  const elDiaRestante = document.getElementById("dia-restante")
  const elSemRestante = document.getElementById("sem-restante")

  document.getElementById("dia-gastado").textContent = format(gastoDia)

  elDiaRestante.textContent = format(restanteDia)
  elSemRestante.textContent = format(restanteSemana)

  colorDisponible(elDiaRestante, restanteDia)
  colorDisponible(elSemRestante, restanteSemana)

  document.getElementById("sem-gastado").textContent = format(gastoSemana)


}

function generarID(){

  return crypto.randomUUID()

}

function registrarGasto(monto,concepto,medio,nota){

  const gastos = JSON.parse(localStorage.getItem("gastos")) || []

  const liquidez = JSON.parse(localStorage.getItem("liquidez")) || {}

  const gasto = {

    id: generarID(),
    monto,
    concepto,
    medio,
    compartido:false,
    fijo:false,
    timestamp: obtenerFechaHoraLocal(),
    nota: nota || ""
  }

  gastos.push(gasto)

  localStorage.setItem("gastos", JSON.stringify(gastos))

  if(liquidez[medio] !== undefined){

    liquidez[medio] -= monto

    localStorage.setItem("liquidez", JSON.stringify(liquidez))

  }

}

document.getElementById("gasto-form").addEventListener("submit", e => {

  e.preventDefault()

  const monto = parseFloat(document.getElementById("monto").value)

  const concepto = document.getElementById("concepto").value.trim()

  const medio = document.getElementById("medio-pago").value

  const nota = document.getElementById("nota-gasto").value.trim()

  if(!monto) return
  if(!concepto) return

  registrarGasto(monto,concepto,medio,nota)

  e.target.reset()
  
  actualizarResumen()

})

document.addEventListener("DOMContentLoaded", () => {

  cargarMediosPago()

  actualizarResumen()

})