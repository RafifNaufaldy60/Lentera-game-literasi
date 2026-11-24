import assert from 'node:assert/strict';
import test from 'node:test';
import { phishingScenario } from '../seeds/phishing-paket.js';
import { validateScenarioGraph } from '../src/scenario-graph.js';

test('semua jalur simulasi berakhir dengan hasil dan skor yang berbeda', () => {
  const paths = validateScenarioGraph(phishingScenario);
  assert.deepEqual(paths.map(({ outcome, score }) => ({ outcome, score })), [
    { outcome: 'safe', score: 100 },
    { outcome: 'recovered', score: 50 },
    { outcome: 'risky', score: 0 },
  ]);
  const initialChoices = phishingScenario.choices.filter((choice) => choice.node_id === phishingScenario.entryNodeId);
  assert.deepEqual(initialChoices.map((choice) => choice.label), [
    'Cek resi lewat aplikasi resmi', 'Balas pesan untuk meminta penjelasan',
  ]);
  assert.equal(new Set(initialChoices.map((choice) => choice.next_node_id)).size, 2);
});

test('menolak pilihan dengan tujuan yang tidak ada', () => {
  const graph = structuredClone(phishingScenario);
  graph.choices[0].next_node_id = 'tidak_ada';
  assert.throws(() => validateScenarioGraph(graph), /tidak ditemukan/);
});

test('menolak siklus percakapan', () => {
  const graph = structuredClone(phishingScenario);
  graph.choices[2].next_node_id = graph.entryNodeId;
  assert.throws(() => validateScenarioGraph(graph), /siklus/);
});

test('menolak percakapan buntu', () => {
  const graph = structuredClone(phishingScenario);
  graph.choices = graph.choices.filter((choice) => choice.node_id !== 'cek_resi_resmi');
  assert.throws(() => validateScenarioGraph(graph), /tidak memiliki jalan/);
});

test('menolak pilihan lanjutan dari adegan hasil', () => {
  const graph = structuredClone(phishingScenario);
  graph.choices.push({ ...graph.choices[0], id: 'pilihan_tambahan', node_id: 'hasil_aman' });
  assert.throws(() => validateScenarioGraph(graph), /pilihan lanjutan/);
});

test('menolak adegan yang tidak dapat dicapai', () => {
  const graph = structuredClone(phishingScenario);
  graph.nodes.push({ ...graph.nodes[0], id: 'terpisah' });
  assert.throws(() => validateScenarioGraph(graph), /tidak dapat dicapai/);
});
