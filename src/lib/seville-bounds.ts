/**
 * Caja envolvente de la provincia de Sevilla. Drivy arranca solo aquí (CEU Fernando III
 * en Bormujos), así que no tiene sentido que el buscador de direcciones ofrezca sitios de
 * Madrid o de Francia: son ruido para el usuario y datos basura para el matching.
 *
 * Los límites cubren la provincia de sobra —de Guadalcanal al norte a Lebrija al sur, de
 * la sierra de Huelva al oeste a Estepa al este— con un margen deliberado. Es preferible
 * aceptar de más (un pueblo justo al otro lado del límite provincial) que rechazar una
 * dirección legítima de un estudiante.
 *
 * Espejo exacto en supabase/migrations/0020_restrict_coordinates_to_seville.sql, que es
 * donde se aplica de verdad: viajes y reservas se insertan directamente desde el navegador
 * vía RLS, así que una comprobación solo en el cliente se saltaría llamando a la API de
 * Supabase. Si se tocan estos números, cambiarlos en ambos sitios.
 */
export const SEVILLE_BOUNDS = {
  south: 36.72,
  west: -6.55,
  north: 38.14,
  east: -4.32,
} as const;

export function isWithinSeville(lat: number, lng: number): boolean {
  return (
    lat >= SEVILLE_BOUNDS.south &&
    lat <= SEVILLE_BOUNDS.north &&
    lng >= SEVILLE_BOUNDS.west &&
    lng <= SEVILLE_BOUNDS.east
  );
}

export const OUTSIDE_SEVILLE_MESSAGE =
  "Por ahora Drivy solo funciona en la provincia de Sevilla. Elige una dirección de la zona.";
