// Buenos Aires (06) - partidos del GBA (1er y 2do cordón)
const GBA_IDS = new Set([
  '06028', // Almirante Brown
  '06035', // Avellaneda
  '06091', // Berazategui
  '06260', // Esteban Echeverría
  '06270', // Ezeiza
  '06274', // Florencio Varela
  '06371', // General San Martín
  '06408', // Hurlingham
  '06410', // Ituzaingó
  '06412', // José C. Paz
  '06427', // La Matanza
  '06434', // Lanús
  '06490', // Lomas de Zamora
  '06515', // Malvinas Argentinas
  '06539', // Merlo
  '06560', // Moreno
  '06568', // Morón
  '06658', // Quilmes
  '06749', // San Fernando
  '06756', // San Isidro
  '06760', // San Miguel
  '06805', // Tigre
  '06840', // Tres de Febrero
  '06861', // Vicente López
]);

const ZONA_ESPECIAL = {
  '14': { '14014': 'cordobaCapital' },
  '82': { '82084': 'rosario' },
};

export function getZona(provinciaId, localidadId) {
  if (provinciaId === '02') return 'caba';

  if (provinciaId === '06') {
    return GBA_IDS.has(localidadId) ? 'gba' : 'interior';
  }

  const especiales = ZONA_ESPECIAL[provinciaId];
  if (especiales && especiales[localidadId]) {
    return especiales[localidadId];
  }

  return 'interior';
}

const aseguradoras = {
  sancor: { tasaBase: 0.032, descuentoFijo: 0 },
  laSegunda: { tasaBase: 0.036, descuentoFijo: 8000 },
};

const factorCobertura = {
  terceros: 1.0,
  todoRiesgoConFranquicia: 1.4,
  todoRiesgoSinFranquicia: 1.65,
};

// factor por zona geográfica (aprox realista)
const factorZona = {
  caba: 1.35,
  gba: 1.25,
  cordobaCapital: 1.05,
  rosario: 1.10,
  interior: 0.90, // resto de localidades del país
};

export function cotizar(valorAutoARS, cobertura, aseguradora, provincia, localidad) {
  const { tasaBase, descuentoFijo } = aseguradoras[aseguradora];
  const zona = getZona(provincia, localidad); // mapeás provincia+localidad a una clave de factorZona
  const premioAnual = valorAutoARS * tasaBase * factorCobertura[cobertura] * factorZona[zona];
  const valor = Math.round(premioAnual / 12 - descuentoFijo);
  renderizar(aseguradora, cobertura, valor);
}

function renderizar(aseguradora, cobertura, valor) {
  let cell;
  if(aseguradora === "sancor") {
    if(cobertura === "terceros") {
      cell = document.querySelector(".sancorOne");
    } else if (cobertura === "todoRiesgoConFranquicia") {
      cell = document.querySelector(".sancorTwo");
    } else {
      cell = document.querySelector(".sancorThree");
    }
  } else {
      if(cobertura === "terceros") {
          cell = document.querySelector(".laSegOne");
        } else if (cobertura === "todoRiesgoConFranquicia") {
          cell = document.querySelector(".laSegTwo");
        } else {
          cell = document.querySelector(".laSegThree");
        }
      }
  cell.innerText = `$${valor.toString()}.-`;

}

