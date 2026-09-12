/**
 * Test de regresión del orden de recogida (src/lib/route-planner.ts).
 *
 * De dónde sale: `planPickupRoute` fue durante un tiempo un vecino-más-cercano, que elige
 * siempre la parada más próxima a la posición actual e ignora hacia dónde vas. En un
 * trayecto a la universidad eso produce rutas absurdas. Se sustituyó por búsqueda exacta
 * (todas las permutaciones), y al simular un viaje real de principio a fin con 3 pasajeros
 * la diferencia entre ambos algoritmos con las MISMAS coordenadas resultó ser de 25 km:
 * 33,08 km el óptimo frente a 58,16 km el heurístico.
 *
 * Volver al heurístico —o introducir cualquier poda que se coma el óptimo— es una regresión
 * silenciosa: la app seguiría devolviendo un orden perfectamente plausible, sólo que peor.
 * Esa es la razón de que este test exista, y de que el escenario de 25 km esté clavado aquí
 * con las coordenadas exactas que lo destaparon.
 *
 * El oráculo (fuerza bruta y vecino-más-cercano, incluido el Haversine) está reimplementado
 * en este archivo a propósito. Importarlo de `src/lib/` sería comparar el código consigo
 * mismo y el test no probaría nada.
 *
 * No toca Supabase ni la red: es una función pura sobre coordenadas.
 *   npm test
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { planPickupRoute } from "../src/lib/route-planner";
import type { PickupStop } from "../src/lib/route-planner";

interface Punto {
  lat: number;
  lng: number;
}

// --- Escenario real: viaje Sevilla Este → CEU Bormujos con 3 recogidas -----------------
// Coordenadas tal cual quedaron guardadas en `trips` y `bookings` durante la simulación.
const ORIGEN: Punto = { lat: 37.3974028, lng: -5.9224799 }; // Sevilla Este
const DESTINO: Punto = { lat: 37.3692527, lng: -6.0868379 }; // CEU San Pablo, Bormujos

const PARADAS: PickupStop[] = [
  { passengerId: "pasajero1", label: "Mairena del Aljarafe", location: { lat: 37.350923, lng: -6.0520363 } },
  { passengerId: "pasajero2", label: "Alcalá de Guadaíra", location: { lat: 37.3387, lng: -5.839 } },
  { passengerId: "pasajero3", label: "Bellavista", location: { lat: 37.3239, lng: -5.9683 } },
];

// --- Oráculo independiente ------------------------------------------------------------
const RADIO_TIERRA_KM = 6371;
const aRadianes = (grados: number) => (grados * Math.PI) / 180;

function haversineKm(a: Punto, b: Punto): number {
  const dLat = aRadianes(b.lat - a.lat);
  const dLng = aRadianes(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(aRadianes(a.lat)) * Math.cos(aRadianes(b.lat));
  return 2 * RADIO_TIERRA_KM * Math.asin(Math.sqrt(h));
}

/** Longitud de origen → paradas (en ese orden) → destino. */
function longitudKm(origen: Punto, destino: Punto, paradas: PickupStop[]): number {
  let total = 0;
  let actual = origen;
  for (const parada of paradas) {
    total += haversineKm(actual, parada.location);
    actual = parada.location;
  }
  return total + haversineKm(actual, destino);
}

function permutaciones<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];
  const resultado: T[][] = [];
  items.forEach((item, i) => {
    const resto = [...items.slice(0, i), ...items.slice(i + 1)];
    for (const cola of permutaciones(resto)) resultado.push([item, ...cola]);
  });
  return resultado;
}

/** El óptimo global, probando todos los órdenes posibles. */
function ordenOptimo(origen: Punto, destino: Punto, paradas: PickupStop[]) {
  let mejor = paradas;
  let mejorKm = Infinity;
  for (const candidato of permutaciones(paradas)) {
    const km = longitudKm(origen, destino, candidato);
    if (km < mejorKm) {
      mejorKm = km;
      mejor = candidato;
    }
  }
  return { orden: mejor.map((p) => p.passengerId), km: mejorKm };
}

/** El heurístico que había antes, y al que no se debe volver. */
function ordenVecinoMasCercano(origen: Punto, destino: Punto, paradas: PickupStop[]) {
  const pendientes = [...paradas];
  const orden: PickupStop[] = [];
  let actual = origen;

  while (pendientes.length > 0) {
    let iMasCerca = 0;
    let kmMasCerca = Infinity;
    pendientes.forEach((parada, i) => {
      const km = haversineKm(actual, parada.location);
      if (km < kmMasCerca) {
        kmMasCerca = km;
        iMasCerca = i;
      }
    });
    const [siguiente] = pendientes.splice(iMasCerca, 1) as [PickupStop];
    orden.push(siguiente);
    actual = siguiente.location;
  }

  return { orden: orden.map((p) => p.passengerId), km: longitudKm(origen, destino, orden) };
}

const HORA = new Date("2026-09-12T08:00:00.000Z");
const EPSILON_KM = 1e-9;

// --- Tests ----------------------------------------------------------------------------

test("el escenario de referencia sigue distinguiendo los dos algoritmos", () => {
  const optimo = ordenOptimo(ORIGEN, DESTINO, PARADAS);
  const vecino = ordenVecinoMasCercano(ORIGEN, DESTINO, PARADAS);

  // Si esto dejase de cumplirse, el test de abajo pasaría sin demostrar nada.
  assert.notDeepEqual(
    optimo.orden,
    vecino.orden,
    "el escenario ya no discrimina: ambos algoritmos dan el mismo orden"
  );
  assert.ok(
    vecino.km - optimo.km > 20,
    `la diferencia entre ambos debería rondar los 25 km, es de ${(vecino.km - optimo.km).toFixed(2)}`
  );

  // Los números concretos que se midieron contra la base de datos real.
  assert.deepEqual(optimo.orden, ["pasajero2", "pasajero3", "pasajero1"]);
  assert.deepEqual(vecino.orden, ["pasajero3", "pasajero1", "pasajero2"]);
  assert.ok(Math.abs(optimo.km - 33.08) < 0.01, `óptimo ${optimo.km.toFixed(2)} km, esperado 33,08`);
  assert.ok(Math.abs(vecino.km - 58.16) < 0.01, `vecino ${vecino.km.toFixed(2)} km, esperado 58,16`);
});

test("planPickupRoute devuelve el óptimo global, no el del vecino más cercano", () => {
  const optimo = ordenOptimo(ORIGEN, DESTINO, PARADAS);
  const vecino = ordenVecinoMasCercano(ORIGEN, DESTINO, PARADAS);
  const plan = planPickupRoute(ORIGEN, DESTINO, PARADAS, HORA);
  const orden = plan.stops.map((parada) => parada.passengerId);

  assert.deepEqual(orden, optimo.orden, "la app no devolvió el orden óptimo");
  assert.notDeepEqual(orden, vecino.orden, "la app volvió al vecino más cercano: REGRESIÓN");
  assert.ok(
    Math.abs(plan.totalDistanceKm - optimo.km) < EPSILON_KM,
    `distancia ${plan.totalDistanceKm.toFixed(4)} km frente al óptimo ${optimo.km.toFixed(4)} km`
  );
});

test("el orden va numerado y las ETA son monótonas", () => {
  const plan = planPickupRoute(ORIGEN, DESTINO, PARADAS, HORA);

  assert.deepEqual(
    plan.stops.map((parada) => parada.order),
    [1, 2, 3]
  );
  for (let i = 1; i < plan.stops.length; i++) {
    const anterior = plan.stops[i - 1]!;
    const actual = plan.stops[i]!;
    assert.ok(
      actual.etaMinutesFromStart >= anterior.etaMinutesFromStart,
      "las ETA acumuladas deben crecer a lo largo de la ruta"
    );
  }
  assert.ok(plan.googleMapsUrl.includes("waypoints="), "falta el enlace profundo a Google Maps");
});

test("casos límite: sin paradas y con una sola", () => {
  const sinParadas = planPickupRoute(ORIGEN, DESTINO, [], HORA);
  assert.equal(sinParadas.stops.length, 0);
  assert.ok(Math.abs(sinParadas.totalDistanceKm - haversineKm(ORIGEN, DESTINO)) < EPSILON_KM);

  const unaParada = planPickupRoute(ORIGEN, DESTINO, [PARADAS[0]!], HORA);
  assert.deepEqual(
    unaParada.stops.map((p) => p.passengerId),
    ["pasajero1"]
  );
});

/**
 * El escenario fijo demuestra que hoy no hay regresión; esto demuestra que no la hay en
 * general. Un vecino-más-cercano falla aquí en cuanto sale una configuración cruzada, así
 * que cubre también las podas mal hechas que sólo rompen en algunos casos.
 *
 * Aleatorio pero con semilla fija: el mismo conjunto de 400 configuraciones en cada
 * ejecución, para que un fallo sea siempre reproducible.
 */
test("con cualquier configuración de 2 a 6 paradas, el resultado es el óptimo global", () => {
  let semilla = 20260912;
  const aleatorio = () => {
    semilla = (semilla * 1103515245 + 12345) % 2147483648;
    return semilla / 2147483648;
  };
  // La provincia de Sevilla, que es donde Drivy opera (src/lib/seville-bounds.ts).
  const enSevilla = (): Punto => ({
    lat: 36.72 + aleatorio() * (38.14 - 36.72),
    lng: -6.55 + aleatorio() * (-4.32 + 6.55),
  });

  let peorDesviacionKm = 0;
  let casosEnQueElVecinoFalla = 0;

  for (let caso = 0; caso < 400; caso++) {
    const origen = enSevilla();
    const destino = enSevilla();
    const cuantas = 2 + Math.floor(aleatorio() * 5);
    const paradas: PickupStop[] = Array.from({ length: cuantas }, (_, i) => ({
      passengerId: `p${i}`,
      label: `p${i}`,
      location: enSevilla(),
    }));

    const optimo = ordenOptimo(origen, destino, paradas);
    const plan = planPickupRoute(origen, destino, paradas, HORA);
    const desviacion = plan.totalDistanceKm - optimo.km;

    assert.ok(
      desviacion < 1e-6,
      `caso ${caso} (${cuantas} paradas): la app da ${plan.totalDistanceKm.toFixed(
        3
      )} km y el óptimo es ${optimo.km.toFixed(3)} km`
    );
    peorDesviacionKm = Math.max(peorDesviacionKm, Math.abs(desviacion));

    if (ordenVecinoMasCercano(origen, destino, paradas).km > optimo.km + 1e-6) {
      casosEnQueElVecinoFalla++;
    }
  }

  assert.ok(peorDesviacionKm < 1e-6);
  // Si el heurístico acertase en casi todos, el fuzz no estaría probando gran cosa.
  assert.ok(
    casosEnQueElVecinoFalla > 100,
    `sólo ${casosEnQueElVecinoFalla} de 400 casos distinguen ambos algoritmos`
  );
});
