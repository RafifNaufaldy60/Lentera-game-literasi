export function validateScenarioGraph({ entryNodeId, nodes, choices }) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  if (byId.size !== nodes.length || !byId.has(entryNodeId)) {
    throw new Error('Adegan awal tidak ditemukan atau ID adegan berulang.');
  }
  if (new Set(choices.map((choice) => choice.id)).size !== choices.length) {
    throw new Error('ID pilihan berulang.');
  }

  const outgoing = new Map(nodes.map((node) => [node.id, []]));
  for (const choice of choices) {
    if (!byId.has(choice.node_id) || !byId.has(choice.next_node_id)) {
      throw new Error('Pilihan mengarah ke adegan yang tidak ditemukan.');
    }
    if (!Number.isInteger(choice.points) || !choice.label?.trim() || !choice.evaluation?.trim()) {
      throw new Error('Pilihan harus memiliki poin, teks, dan evaluasi.');
    }
    outgoing.get(choice.node_id).push(choice);
  }

  const visited = new Set();
  const visiting = new Set();
  const cache = new Map();
  function walk(id) {
    if (visiting.has(id)) throw new Error('Percakapan memiliki siklus tanpa akhir.');
    if (cache.has(id)) return cache.get(id);
    const node = byId.get(id);
    const options = outgoing.get(id);
    visiting.add(id);
    visited.add(id);
    let results;
    if (node.node_type === 'result') {
      if (options.length || !['safe', 'recovered', 'risky'].includes(node.outcome)) {
        throw new Error('Adegan hasil harus memiliki konsekuensi dan tidak memiliki pilihan lanjutan.');
      }
      results = [{ resultNodeId: id, outcome: node.outcome, score: 0 }];
    } else {
      if (node.node_type !== 'message' || !options.length) {
        throw new Error('Adegan percakapan tidak memiliki jalan menuju hasil.');
      }
      results = options.flatMap((choice) => walk(choice.next_node_id).map((result) => ({
        ...result, score: choice.points + result.score,
      })));
    }
    visiting.delete(id);
    cache.set(id, results);
    return results;
  }

  const paths = walk(entryNodeId);
  if (visited.size !== nodes.length) throw new Error('Ada adegan yang tidak dapat dicapai dari adegan awal.');
  return paths;
}

export async function loadScenarioGraph(client, scenarioId) {
  const scenario = await client.query('SELECT entry_node_id FROM public.scenarios WHERE id = $1', [scenarioId]);
  const nodes = await client.query('SELECT id, node_key, title, node_type, outcome FROM public.chat_nodes WHERE scenario_id = $1', [scenarioId]);
  const choices = await client.query('SELECT id, node_id, next_node_id, label, points, evaluation FROM public.chat_choices WHERE scenario_id = $1 ORDER BY node_id, position', [scenarioId]);
  return { entryNodeId: scenario.rows[0]?.entry_node_id, nodes: nodes.rows, choices: choices.rows };
}
