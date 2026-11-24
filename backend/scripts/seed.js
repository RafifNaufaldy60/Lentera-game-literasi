import { randomBytes } from 'node:crypto';
import { phishingMaterial, phishingScenario } from '../seeds/phishing-paket.js';
import { extraPackages } from '../seeds/extra-paket.js';
import { DatabaseTaskError, runDatabaseTask, setupTransaction } from '../src/database-tasks.js';
import { hashPassword } from '../src/passwords.js';
import { loadScenarioGraph, validateScenarioGraph } from '../src/scenario-graph.js';

await runDatabaseTask('Data awal', async (client) => {
  for (const { scenario } of extraPackages) validateScenarioGraph(scenario);
  validateScenarioGraph(phishingScenario);
  const created = await setupTransaction(client, async () => {
    const existing = await client.query('SELECT id FROM public.scenarios WHERE slug = $1', [phishingScenario.slug]);
    if (existing.rowCount) {
      validateScenarioGraph(await loadScenarioGraph(client, existing.rows[0].id));
      return false;
    }

    const email = 'admin.simulasi@example.invalid';
    let admin = (await client.query('SELECT id, role FROM public.users WHERE email = $1', [email])).rows[0];
    if (!admin) {
      const passwordHash = await hashPassword(randomBytes(32).toString('hex'));
      admin = (await client.query(`INSERT INTO public.users (name, email, password_hash, role, is_active)
        VALUES ($1, $2, $3, 'admin', FALSE) RETURNING id, role`, ['Penulis Simulasi (fiktif)', email, passwordHash])).rows[0];
    }
    if (admin.role !== 'admin') throw new DatabaseTaskError('Email penulis data awal sudah digunakan oleh akun non-admin.');

    await client.query(`INSERT INTO public.materials (author_id, slug, title, summary, content, is_published)
      VALUES ($1, $2, $3, $4, $5, TRUE) ON CONFLICT (slug) DO NOTHING`,
    [admin.id, phishingMaterial.slug, phishingMaterial.title, phishingMaterial.summary, phishingMaterial.content]);
    const material = (await client.query('SELECT id, author_id FROM public.materials WHERE slug = $1', [phishingMaterial.slug])).rows[0];
    if (material.author_id !== admin.id) throw new DatabaseTaskError('Slug materi data awal sudah digunakan oleh penulis lain.');

    const scenario = (await client.query(`INSERT INTO public.scenarios (material_id, slug, title, description)
      VALUES ($1, $2, $3, $4) RETURNING id`, [material.id, phishingScenario.slug, phishingScenario.title, phishingScenario.description])).rows[0];
    const nodeIds = new Map();
    for (const node of phishingScenario.nodes) {
      const inserted = await client.query(`INSERT INTO public.chat_nodes (scenario_id, node_key, title, speaker, message, node_type, outcome)
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [scenario.id, node.id, node.title, node.speaker, node.message, node.node_type, node.outcome]);
      nodeIds.set(node.id, inserted.rows[0].id);
    }
    for (const choice of phishingScenario.choices) {
      await client.query(`INSERT INTO public.chat_choices (scenario_id, node_id, next_node_id, choice_key, label, points, evaluation, position)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [scenario.id, nodeIds.get(choice.node_id), nodeIds.get(choice.next_node_id), choice.id, choice.label, choice.points, choice.evaluation, choice.position]);
    }
    await client.query('UPDATE public.scenarios SET entry_node_id = $1, is_published = TRUE WHERE id = $2', [nodeIds.get(phishingScenario.entryNodeId), scenario.id]);
    validateScenarioGraph(await loadScenarioGraph(client, scenario.id));
    return true;
  });
  console.log(created ? 'Data awal dibuat: 1 materi, 1 simulasi, 6 adegan, 5 pilihan.' : 'Data awal sudah ada dan valid; tidak ada perubahan.');
});

await runDatabaseTask('Materi dan simulasi tambahan', async (client) => {
  const total = await setupTransaction(client, async () => {
    const admin = (await client.query("SELECT id FROM public.users WHERE email = 'admin.simulasi@example.invalid' AND role='admin'")).rows[0];
    if (!admin) throw new DatabaseTaskError('Jalankan seed data awal terlebih dahulu.');
    let created = 0;
    for (const { material, scenario } of extraPackages) {
      const existing = await client.query('SELECT id FROM public.scenarios WHERE slug=$1', [scenario.slug]);
      if (existing.rowCount) {
        validateScenarioGraph(await loadScenarioGraph(client, existing.rows[0].id));
        continue;
      }
      await client.query(`INSERT INTO public.materials (author_id,slug,title,summary,content,is_published)
        VALUES ($1,$2,$3,$4,$5,TRUE) ON CONFLICT (slug) DO NOTHING`,
      [admin.id, material.slug, material.title, material.summary, material.content]);
      const materialId = (await client.query('SELECT id FROM public.materials WHERE slug=$1', [material.slug])).rows[0]?.id;
      if (!materialId) throw new DatabaseTaskError('Materi baru tidak ditemukan.');
      const inserted = await client.query(`INSERT INTO public.scenarios (material_id,slug,title,description)
        VALUES ($1,$2,$3,$4) RETURNING id`, [materialId, scenario.slug, scenario.title, scenario.description]);
      const scenarioId = inserted.rows[0].id;
      const ids = new Map();
      for (const node of scenario.nodes) {
        const { rows } = await client.query(`INSERT INTO public.chat_nodes
          (scenario_id,node_key,title,speaker,message,node_type,outcome)
          VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [scenarioId, node.id, node.title, node.speaker, node.message, node.node_type, node.outcome]);
        ids.set(node.id, rows[0].id);
      }
      for (const choice of scenario.choices) {
        await client.query(`INSERT INTO public.chat_choices
          (scenario_id,node_id,next_node_id,choice_key,label,points,evaluation,position)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [scenarioId, ids.get(choice.node_id), ids.get(choice.next_node_id), choice.id,
          choice.label, choice.points, choice.evaluation, choice.position]);
      }
      await client.query('UPDATE public.scenarios SET entry_node_id=$1, is_published=TRUE WHERE id=$2',
        [ids.get(scenario.entryNodeId), scenarioId]);
      validateScenarioGraph(await loadScenarioGraph(client, scenarioId));
      created++;
    }
    return created;
  });
  console.log(total ? `${total} simulasi tambahan dan materi diterbitkan.` : 'Simulasi tambahan sudah tersedia; data lama dipertahankan.');
});
