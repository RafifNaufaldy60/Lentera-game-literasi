import { phishingScenario } from '../seeds/phishing-paket.js';
import { DatabaseTaskError, runDatabaseTask } from '../src/database-tasks.js';
import { loadScenarioGraph, validateScenarioGraph } from '../src/scenario-graph.js';

const expectedTables = ['users', 'materials', 'scenarios', 'chat_nodes', 'chat_choices', 'attempts', 'attempt_answers', 'schema_migrations', 'user_sessions', 'user_profiles', 'badge_definitions', 'user_badges'];

await runDatabaseTask('Pemeriksaan database', async (client) => {
  await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  let report;
  try {
    const database = await client.query('SELECT current_database() AS database_name');
    const tables = await client.query(`SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name`);
    if (expectedTables.some((name) => !tables.rows.some((row) => row.table_name === name))) {
      throw new DatabaseTaskError('Struktur database belum lengkap. Jalankan db:migrate.');
    }
    const counts = [];
    for (const table of expectedTables) {
      const result = await client.query(`SELECT count(*) AS row_count FROM public.${table}`);
      counts.push({ table_name: table, row_count: result.rows[0].row_count });
    }
    const scenario = (await client.query(`SELECT s.id, s.is_published, u.role AS author_role
      FROM public.scenarios s JOIN public.materials m ON m.id = s.material_id
      JOIN public.users u ON u.id = m.author_id WHERE s.slug = $1`, [phishingScenario.slug])).rows[0];
    if (!scenario?.is_published || scenario.author_role !== 'admin') {
      throw new DatabaseTaskError('Simulasi data awal belum tersedia atau penulisnya bukan admin.');
    }
    const paths = validateScenarioGraph(await loadScenarioGraph(client, scenario.id));
    const choices = await client.query(`SELECT c.label AS pilihan, n.node_key AS tujuan_adegan,
      n.title AS judul_adegan, c.points AS poin
      FROM public.scenarios s
      JOIN public.chat_choices c ON c.node_id = s.entry_node_id AND c.scenario_id = s.id
      JOIN public.chat_nodes n ON n.id = c.next_node_id AND n.scenario_id = s.id
      WHERE s.id = $1 ORDER BY c.position`, [scenario.id]);
    if (choices.rowCount !== 2 || choices.rows[0].tujuan_adegan === choices.rows[1].tujuan_adegan) {
      throw new DatabaseTaskError('Dua pilihan awal harus memiliki tujuan percakapan yang berbeda.');
    }
    const campaign = await client.query(`SELECT COUNT(*)::integer AS total FROM public.scenarios
      WHERE slug = ANY($1::text[]) AND is_published=TRUE`, [[
      'email-beasiswa-palsu','komentar-yang-menyakitkan','jejak-profil-terbuka',
      'konsol-impian-diskon-besar','digital-crisis-final'
    ]]);
    if (campaign.rows[0].total !== 5) {
      throw new DatabaseTaskError('Kampanye lima misi belum lengkap. Jalankan db:seed:game.');
    }
    const badgeCatalog = await client.query('SELECT COUNT(*)::integer AS total FROM public.badge_definitions');
    if (badgeCatalog.rows[0].total < 8) {
      throw new DatabaseTaskError('Katalog badge belum lengkap. Jalankan db:migrate.');
    }
    const avatarsConstraint = await client.query(`SELECT pg_get_constraintdef(oid) AS definition
      FROM pg_constraint WHERE conrelid = 'public.user_profiles'::regclass
      AND conname = 'user_profiles_avatar_key_check'`);
    if (!avatarsConstraint.rows[0]?.definition.includes('neon-yuki')) {
      throw new DatabaseTaskError('Pilihan avatar baru belum aktif. Jalankan db:migrate untuk menerapkan 004_cyber_avatars.sql.');
    }
    const passwords = await client.query(`SELECT count(*) AS invalid_count FROM public.users
      WHERE password_hash !~ '^scrypt[$]131072[$]8[$]1[$][0-9a-f]{32}[$][0-9a-f]{128}$'`);
    if (passwords.rows[0].invalid_count !== '0') throw new DatabaseTaskError('Format hash password tidak valid.');
    const migrations = await client.query('SELECT filename FROM public.schema_migrations ORDER BY filename');
    report = { database: database.rows[0].database_name, tables: tables.rows, counts, choices: choices.rows, paths, migrations: migrations.rows };
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }

  console.log(`Database: ${report.database}`);
  console.log(`Tabel: ${report.tables.map((row) => row.table_name).join(', ')}`);
  console.table(report.counts);
  console.log('Pilihan dari adegan awal:');
  console.table(report.choices);
  console.log(`Validasi jalur: ${report.paths.length} jalur, semuanya mencapai adegan hasil.`);
  console.table(report.paths.map((path) => ({ hasil: path.outcome, skor_akhir: path.score })));
  console.log(`Migrasi tercatat: ${report.migrations.map((row) => row.filename).join(', ')}`);
  console.log('Kampanye lima misi, katalog badge, dan pilihan tujuh avatar: lengkap.');
  console.log('Pemeriksaan hash password: lulus.');
});
