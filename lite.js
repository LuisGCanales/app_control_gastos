function getToday() {
  return new Date().toISOString().slice(0,10)
}

function format(n){
  return Math.round(n).toLocaleString()
}

function getInicioSemana(){

  const inicio = localStorage.getItem("inicioSemana")

  if(!inicio){
    const hoy = getToday()
    localStorage.setItem("inicioSemana", hoy)
    return new Date(hoy)
  }

  return new Date(inicio)

}

function getFinSemana(){

  const inicio = getInicioSemana()

  const fin = new Date(inicio)

  fin.setDate(fin.getDate()+6)

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

function calcularGastoDia(){

  const gastos = JSON.parse(localStorage.getItem("gastos")) || []

  const hoy = getToday()

  return gastos
  .filter(g => g.timestamp.slice(0,10) === hoy)
  .reduce((a,b)=>a+b.monto,0)

}

function calcularGastoSemana(){

  const gastos = JSON.parse(localStorage.getItem("gastos")) || []

  const inicio = getInicioSemana()

  const fin = getFinSemana()

  return gastos.filter(g => {

    const fecha = new Date(g.timestamp)

    return fecha >= inicio && fecha <= fin

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

  const gastoDia = calcularGastoDia()

  const gastoSemana = calcularGastoSemana()

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

function registrarGasto(monto,concepto,medio){

  const gastos = JSON.parse(localStorage.getItem("gastos")) || []

  const liquidez = JSON.parse(localStorage.getItem("liquidez")) || {}

  const gasto = {

    id: generarID(),

    monto,

    concepto,

    medio,

    fijo:false,

    nota:"",

    timestamp: new Date().toISOString()

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

  const concepto = document.getElementById("concepto").value

  const medio = document.getElementById("medio-pago").value

  if(!monto) return

  registrarGasto(monto,concepto,medio)

  e.target.reset()

  actualizarResumen()

})

document.addEventListener("DOMContentLoaded", () => {

  cargarMediosPago()

  actualizarResumen()

})