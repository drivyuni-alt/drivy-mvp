/**
 * Vuelca la base de datos a JSON, una tabla por fichero, en `backups/<fecha>/`.
 *
 *   DRIVY_DB_URL="postgresql://..." npm run backup
 *
 * La cadena de conexión es la del **Session pooler** de Supabase (Project Settings →
 * Database → Connection string → Session pooler). No sirve la conexión directa
 * `db.<ref>.supabase.co`: sólo resuelve por IPv6 y muchas redes no tienen salida IPv6.
 *
 * Esto complementa a `supabase/migrations/`, que ya versiona la ESTRUCTURA. Migraciones +
 * este volcado = reconstrucción completa.
 *
 * ────────────────────────────────────────────────────────────────────────────────────
 * ATENCIÓN — el volcado contiene datos personales reales
 *
 * Incluye emails, mensajes de chat y los hashes de contraseña de `auth.users`. La carpeta
 * `backups/` está en .gitignore y NO debe subirse nunca a GitHub ni compartirse. Trátalo
 * como tratarías la base de datos misma.
 *
 * De `auth.users` se exportan sólo las columnas necesarias para restaurar. Se dejan fuera
 * a propósito los tokens de un solo uso (`confirmation_token`, `recovery_token`,
 * `email_change_token_*`, `phone_change_token`, `reauthentication_token`): son
 * credenciales vivas, no hacen falta para restaurar, y guardarlas sólo añade exposición.
 * `confirmed_at` tampoco se exporta porque es una columna generada por Postgres.
 * ────────────────────────────────────────────────────────────────────────────────────
 */
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const AUTH_USER_COLUMNS = [
  "instance_id",
  "id",
  "aud",
  "role",
  "email",
  "encrypted_password",
  "email_confirmed_at",
  "invited_at",
  "last_sign_in_at",
  "raw_app_meta_data",
  "raw_user_meta_data",
  "created_at",
  "updated_at",
  "phone",
  "phone_confirmed_at",
  "banned_until",
  "is_sso_user",
  "deleted_at",
  "is_anonymous",
];

async function run() {
  const connectionString = process.env.DRIVY_DB_URL;
  if (!connectionString) {
    console.error("Falta DRIVY_DB_URL. Ejemplo:\n  DRIVY_DB_URL=\"postgresql://...\" npm run backup");
    process.exit(1);
  }

  const outDir =
    process.argv[2] ??
    path.join("backups", new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19));

  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  await mkdir(outDir, { recursive: true });

  const manifest = { exportedAt: new Date().toISOString(), tables: [] };

  const { rows: tables } = await client.query(`
    select table_name from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE'
    order by table_name
  `);

  for (const { table_name } of tables) {
    const { rows } = await client.query(`select * from public.${table_name}`);
    await writeFile(path.join(outDir, `${table_name}.json`), JSON.stringify(rows, null, 2), "utf8");
    manifest.tables.push({ name: `public.${table_name}`, rowCount: rows.length });
    console.log(`  public.${table_name}: ${rows.length} filas`);
  }

  // Las cuentas de acceso viven en el esquema `auth`, fuera de `public`. Sin ellas una
  // restauración deja los perfiles pero nadie puede iniciar sesión — que es exactamente el
  // agujero que tenía el backup del 28 de julio.
  const { rows: authUsers } = await client.query(
    `select ${AUTH_USER_COLUMNS.join(", ")} from auth.users order by created_at`
  );
  await writeFile(
    path.join(outDir, "auth_users.json"),
    JSON.stringify(authUsers, null, 2),
    "utf8"
  );
  manifest.tables.push({ name: "auth.users", rowCount: authUsers.length });
  console.log(`  auth.users: ${authUsers.length} filas`);

  await writeFile(path.join(outDir, "_manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
  await client.end();

  console.log(`\nBackup guardado en: ${outDir}`);
  console.log("Contiene datos personales y hashes de contraseña — no lo subas a ningún sitio.");
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
