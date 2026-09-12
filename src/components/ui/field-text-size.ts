/**
 * Tamaño de letra del texto que el usuario escribe, en inputs, textareas y selects.
 *
 * Los 16px de móvil no son una decisión de diseño, son un requisito del navegador. Safari en
 * iOS —y algunos Android— hacen zoom automático al enfocar un campo cuyo `font-size` esté por
 * debajo de 16px, para que se pueda leer lo que se teclea. La página entera se agranda, se
 * descoloca, y al salir del campo se queda así. Los tres componentes usaban `text-sm` (14px),
 * de modo que pasaba en todos los formularios de la app: registro, login, publicar viaje,
 * buscar, reservar, chat, perfil y valoraciones.
 *
 * La tentación es arreglarlo con `maximum-scale=1` o `user-scalable=no` en el viewport. Eso
 * quita el síntoma y de paso le quita el zoom a quien lo necesita para leer, así que no.
 * El tamaño de letra es el arreglo de verdad.
 *
 * El corte va en `lg` (1024px) y no en `md` (768px) a propósito: 768px es justo el ancho de
 * un iPad en vertical, que también es táctil y también haría zoom. A partir de 1024px ya no
 * hay ningún navegador que lo haga, y ahí el campo recupera los 14px del diseño.
 */
export const FIELD_TEXT_SIZE = "text-base lg:text-sm";
