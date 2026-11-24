import test from 'node:test';
import assert from 'node:assert/strict';
import { extraPackages } from '../seeds/extra-paket.js';
import { validateScenarioGraph } from '../src/scenario-graph.js';
import { validateMaterial, validateScenario } from '../src/learning-routes.js';

for (const { material, scenario } of extraPackages) {
  test(`alur ${scenario.slug} memiliki akhir aman, pemulihan, dan berisiko`, () => {
    const routes = validateScenarioGraph(scenario);
    assert.deepEqual(routes.map((p) => p.score).sort((a, b) => a - b), [0, 40, 100]);
    assert.deepEqual(routes.map((p) => p.outcome).sort(), ['recovered', 'risky', 'safe']);
    assert.ok(validateMaterial({ ...material, isPublished: true }));
  });
}

test('input materi yang tidak lengkap atau slug tidak aman ditolak', () => {
  assert.equal(validateMaterial({ slug: 'a b', title: 'Contoh', summary: 'Ringkasan cukup panjang', content: 'Konten tentang keamanan digital yang panjang', isPublished: true }), false);
  assert.equal(validateMaterial(null), false);
});

test('skenario admin harus punya jalur valid dan skor tidak melewati 100', () => {
  const scenario = extraPackages[0].scenario;
  const base = { materialId: '12345678-1234-4234-8234-123456789123', slug: 'skenario-uji', title: 'Skenario uji', description: 'Kisah percakapan yang bisa dijalankan', graph: scenario };
  assert.equal(validateScenario(base), true);
  assert.equal(validateScenario({ ...base, graph: { ...scenario, choices: scenario.choices.map((c) => ({ ...c, points: 100 })) } }), false);
  assert.equal(validateScenario({ ...base, graph: { ...scenario, entryNodeId: 'tak_ada' } }), false);
});
