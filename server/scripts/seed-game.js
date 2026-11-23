import { runDatabaseTask, setupTransaction } from '../src/database-tasks.js';
import { validateScenarioGraph } from '../src/scenario-graph.js';
import { campaignStories, makeCampaignGraph } from '../seeds/game-campaign.js';

await runDatabaseTask('Kampanye Lentera', async (client) => {
  const number = await setupTransaction(client, async () => {
    let created=0;
    for (const story of campaignStories) {
      const graph=makeCampaignGraph(story);
      validateScenarioGraph(graph);
      const prior=await client.query('SELECT id FROM public.scenarios WHERE slug=$1', [story.slug]);
      if (prior.rowCount) continue;
      const m=(await client.query('SELECT id FROM public.materials WHERE slug=$1', [story.material])).rows[0];
      if (!m) throw new Error(`Materi ${story.material} belum tersedia. Jalankan db:seed dahulu.`);
      const {rows}=await client.query(`INSERT INTO public.scenarios
        (material_id,slug,title,description,play_mode,chapter_number,difficulty,estimated_minutes)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`, [m.id,story.slug,story.title,story.description,
          story.playMode,story.chapter,story.chapter===5?'lanjutan':'menengah',story.chapter===5?12:8]);
      const scenarioId=rows[0].id, ids=new Map();
      for (const n of graph.nodes) {
        const {rows:r}=await client.query(`INSERT INTO public.chat_nodes
          (scenario_id,node_key,title,speaker,message,node_type,outcome,scene_type,meta)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
        [scenarioId,n.id,n.title,n.speaker,n.message,n.node_type,n.outcome,n.scene_type,n.meta]);
        ids.set(n.id,r[0].id);
      }
      for (const c of graph.choices) {
        await client.query(`INSERT INTO public.chat_choices
          (scenario_id,node_id,next_node_id,choice_key,label,points,evaluation,position)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8)`, [scenarioId,ids.get(c.node_id),ids.get(c.next_node_id),
            c.id,c.label,c.points,c.evaluation,c.position]);
      }
      await client.query('UPDATE public.scenarios SET entry_node_id=$2,is_published=TRUE WHERE id=$1', [scenarioId,ids.get(graph.entryNodeId)]);
      created++;
    }
    return created;
  });
  console.log(number ? `${number} misi kampanye dibuat. Data lama dipertahankan.` : 'Kampanye sudah tersedia, tidak ada duplikasi.');
});
