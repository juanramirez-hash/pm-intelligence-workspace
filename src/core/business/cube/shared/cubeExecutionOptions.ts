/**
 * Opciones técnicas para ejecutar una consulta del Business Cube.
 *
 * Estas opciones no describen el análisis solicitado.
 * Únicamente controlan el comportamiento del motor.
 */
export interface CubeExecutionOptions {
  /**
   * Permite utilizar resultados almacenados en caché.
   *
   * La caché todavía no está implementada.
   */
  readonly useCache?: boolean;

  /**
   * Tiempo máximo permitido para ejecutar la consulta,
   * expresado en milisegundos.
   *
   * El control de timeout todavía no está implementado.
   */
  readonly timeoutMs?: number;

  /**
   * Incluye grupos cuyo resultado sea cero.
   */
  readonly includeEmptyGroups?: boolean;

  /**
   * Número de decimales aplicados a los resultados numéricos.
   *
   * Si se omite, el motor conserva la precisión original.
   */
  readonly decimalPlaces?: number;
}