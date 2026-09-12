/**
 * Permite que `node --test` cargue directamente los módulos de `src/`.
 *
 * Node 22+ ya ejecuta TypeScript sin transpilar (borra los tipos y listo), así que no hace
 * falta ni framework de test ni bundler. Lo único que no sabe hacer es resolver dos cosas
 * que TypeScript da por supuestas:
 *
 *   - los imports sin extensión (`./geo` en vez de `./geo.ts`),
 *   - el alias `@/` que apunta a `src/` (ver "paths" en tsconfig.json).
 *
 * Estas veinte líneas cubren ambas. Se carga con `--import`, antes que los tests:
 *   node --import ./tests/ts-resolver.mjs --test "tests/**\/*.test.ts"
 */
import { registerHooks } from "node:module";

const projectRoot = new URL("../", import.meta.url);

registerHooks({
  resolve(specifier, context, nextResolve) {
    const resolved = specifier.startsWith("@/")
      ? new URL(`src/${specifier.slice(2)}`, projectRoot).href
      : specifier;

    let result;
    try {
      result = nextResolve(resolved, context);
    } catch (error) {
      if (error.code !== "ERR_MODULE_NOT_FOUND") throw error;
      result = nextResolve(`${resolved}.ts`, context);
    }

    // Sin `type: "module"` en el package.json raíz —que no se toca porque afectaría a la
    // build de Next— Node tendría que intentar leer cada .ts como CommonJS y reinterpretarlo
    // al fallar. Todo `src/` es ESM, así que se lo decimos y nos ahorramos el aviso.
    return result.url.endsWith(".ts") ? { ...result, format: "module-typescript" } : result;
  },
});
