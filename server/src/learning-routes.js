import { validateScenarioGraph } from './scenario-graph.js';
import { awardBadges, registerGameRoutes } from './gamification.js';
import { syncMissionCoins } from './shop-economy.js';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const slugFormat = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const sceneModes = ['chat','email','social','privacy','market','system'];
const playModes = ['chat','email','social','privacy','market','hybrid'];
function sanitizeNodeMeta(value) {
  const v = value && typeof value==='object' && !Array.isArray(value) ? value : {};
  return { x: Number.isFinite(v.x) ? Math.max(0,Math.min(2600,v.x)) : 30,
    y: Number.isFinite(v.y) ? Math.max(0,Math.min(2600,v.y)) : 40,
    avatar: ['orbit','pixel','spark','shield'].includes(v.avatar) ? v.avatar : 'orbit',
    attachment: typeof v.attachment==='string' ? v.attachment.slice(0,120) : '' };
}

function apiError(res, status, message) {
  return res.status(status).json({ error: message });
}
function safeString(value, min, max) {
  return typeof value === 'string' && value.trim().length >= min && value.trim().length <= max;
}
function validateMaterial(body) {
  return Boolean(body && safeString(body.slug, 3, 100) && slugFormat.test(body.slug)
    && safeString(body.title, 4, 140) && safeString(body.summary, 10, 320)
    && safeString(body.content, 30, 20000) && typeof body.isPublished === 'boolean');
}
function validateScenario(body) {
  if (!body || (body.playMode && !playModes.includes(body.playMode))
    || (body.chapterNumber != null && (!Number.isInteger(body.chapterNumber) || body.chapterNumber < 1 || body.chapterNumber > 5))
    || (body.difficulty && !['pemula','menengah','lanjutan'].includes(body.difficulty))
    || (body.estimatedMinutes != null && (!Number.isInteger(body.estimatedMinutes) || body.estimatedMinutes < 1 || body.estimatedMinutes > 45))
    || !uuid.test(body.materialId || '') || !safeString(body.slug, 3, 100)
    || !slugFormat.test(body.slug) || !safeString(body.title, 5, 140)
    || !safeString(body.description, 10, 1000) || !body.graph) return false;
  const { graph } = body;
  if (!Array.isArray(graph.nodes) || !Array.isArray(graph.choices) || graph.nodes.length < 3
    || graph.nodes.length > 60 || graph.choices.length > 180 || !safeString(graph.entryNodeId, 1, 80)) return false;
  if (!graph.nodes.every((n) => safeString(n.id, 1, 80) && safeString(n.title, 2, 150)
      && safeString(n.speaker, 2, 100) && safeString(n.message, 10, 3000)
      && ['message', 'result'].includes(n.node_type)
      && (n.scene_type == null || sceneModes.includes(n.scene_type))
      && (n.node_type === 'result' ? ['safe', 'recovered', 'risky'].includes(n.outcome) : n.outcome == null))) return false;
  if (!graph.choices.every((c) => safeString(c.id, 1, 80) && safeString(c.node_id, 1, 80)
      && safeString(c.next_node_id, 1, 80) && safeString(c.label, 3, 220)
      && safeString(c.evaluation, 10, 1000) && Number.isInteger(c.points)
      && c.points >= 0 && c.points <= 100 && Number.isInteger(c.position)
      && c.position >= 1)) return false;
  try {
    const paths = validateScenarioGraph(graph);
    if (paths.some((path) => path.score < 0 || path.score > 100)) return false;
    for (const node of graph.nodes) {
      const options = graph.choices.filter((c) => c.node_id === node.id);
      if (new Set(options.map((c) => c.position)).size !== options.length ||
          new Set(options.map((c) => c.id)).size !== options.length) return false;
    }
    return true;
  } catch { return false; }
}

async function attemptState(client, attempt, userId) {
  if (attempt.user_id !== userId) return null;
  const history = await client.query(`SELECT aa.sequence_no, aa.node_id, aa.choice_id, aa.choice_label,
    aa.points_awarded, aa.evaluation, n.speaker, n.message, n.title, n.scene_type, n.meta
    FROM public.attempt_answers aa JOIN public.chat_nodes n ON n.id = aa.node_id
    WHERE aa.attempt_id = $1 ORDER BY aa.sequence_no`, [attempt.id]);
  const currentId = history.rows.length ? (await client.query(
    'SELECT next_node_id FROM public.chat_choices WHERE id = $1', [history.rows.at(-1).choice_id]
  )).rows[0]?.next_node_id : attempt.entry_node_id;
  const current = (await client.query(`SELECT id, title, speaker, message, node_type, outcome, scene_type, meta
    FROM public.chat_nodes WHERE id = $1 AND scenario_id = $2`, [currentId, attempt.scenario_id])).rows[0];
  if (!current) throw new Error('Adegan simulasi tidak ditemukan.');
  const options = current.node_type === 'result' ? [] : (await client.query(`
    SELECT id, label, position FROM public.chat_choices WHERE scenario_id = $1 AND node_id = $2 ORDER BY position`,
  [attempt.scenario_id, current.id])).rows;
  const effectiveOutcome = current.node_type === 'result' && history.rows.length >= 5
    && current.outcome === 'safe' && attempt.final_score < 80 ? 'recovered' : current.outcome;
  return {
    id: attempt.id, status: attempt.status, finalScore: attempt.final_score,
    scenario: { id: attempt.scenario_id, title: attempt.scenario_title, description: attempt.scenario_description, playMode: attempt.play_mode, chapter: attempt.chapter_number },
    history: history.rows.map((item) => ({ sequence: item.sequence_no, speaker: item.speaker,
      message: item.message, title: item.title, sceneType: item.scene_type, meta: item.meta, choiceLabel: item.choice_label,
      points: item.points_awarded, evaluation: item.evaluation })),
    current: { ...current, outcome: effectiveOutcome, options }, startedAt: attempt.started_at, completedAt: attempt.completed_at,
  };
}

const attemptSelect = `SELECT a.*, s.entry_node_id, s.title AS scenario_title,
 s.description AS scenario_description, s.play_mode, s.chapter_number FROM public.attempts a
 JOIN public.scenarios s ON s.id = a.scenario_id WHERE a.id = $1`;

export function registerLearningRoutes(app, pool, requireUser, requireAdmin) {
  registerGameRoutes(app, pool, requireUser);
  app.get('/api/catalog', requireUser, async (_req, res) => {
    const { rows } = await pool.query(`SELECT m.id, m.slug, m.title, m.summary, m.content,
      m.created_at, COUNT(s.id)::integer AS scenario_count
      FROM public.materials m LEFT JOIN public.scenarios s ON s.material_id = m.id AND s.is_published = TRUE
      WHERE m.is_published = TRUE GROUP BY m.id ORDER BY m.created_at, m.title`);
    res.json({ materials: rows });
  });

  app.get('/api/materials/:id', requireUser, async (req, res) => {
    if (!uuid.test(req.params.id)) return apiError(res, 400, 'ID materi tidak valid.');
    const { rows } = await pool.query('SELECT id, title, slug, summary, content FROM public.materials WHERE id = $1 AND is_published = TRUE', [req.params.id]);
    if (!rows.length) return apiError(res, 404, 'Materi tidak ditemukan.');
    const scenarios = await pool.query(`SELECT id, title, description FROM public.scenarios
      WHERE material_id = $1 AND is_published = TRUE ORDER BY created_at`, [req.params.id]);
    res.json({ material: rows[0], scenarios: scenarios.rows });
  });

  app.get('/api/scenarios', requireUser, async (_req, res) => {
    const { rows } = await pool.query(`SELECT s.id, s.title, s.slug, s.description, s.material_id,
      m.title AS material_title, s.play_mode, s.chapter_number, s.difficulty, s.estimated_minutes FROM public.scenarios s JOIN public.materials m ON m.id = s.material_id
      WHERE s.is_published = TRUE AND m.is_published = TRUE ORDER BY s.created_at, s.title`);
    res.json({ scenarios: rows });
  });

  app.post('/api/scenarios/:id/attempts', requireUser, async (req, res) => {
    if (!uuid.test(req.params.id)) return apiError(res, 400, 'ID simulasi tidak valid.');
    const found = await pool.query(`SELECT s.id,s.chapter_number FROM public.scenarios s JOIN public.materials m ON m.id = s.material_id
      WHERE s.id = $1 AND s.is_published = TRUE AND m.is_published = TRUE`, [req.params.id]);
    if (!found.rowCount) return apiError(res, 404, 'Simulasi tidak tersedia.');
    if (Number(found.rows[0]?.chapter_number) === 5) {
      const prior = await pool.query(`SELECT COUNT(DISTINCT s.chapter_number)::integer AS total FROM public.attempts a
        JOIN public.scenarios s ON s.id=a.scenario_id WHERE a.user_id=$1 AND a.status='completed'
        AND s.chapter_number BETWEEN 1 AND 4`, [req.user.id]);
      if (prior.rows[0].total < 4) return apiError(res, 403, 'Selesaikan satu misi dari setiap empat topik untuk membuka final chapter.');
    }
    const { rows } = await pool.query(`INSERT INTO public.attempts (user_id, scenario_id) VALUES ($1, $2)
      RETURNING id`, [req.user.id, req.params.id]);
    res.status(201).json({ attemptId: rows[0].id });
  });

  app.get('/api/attempts', requireUser, async (req, res) => {
    const { rows } = await pool.query(`SELECT a.id, a.scenario_id, a.status, a.final_score,
      a.started_at, a.completed_at, s.title AS scenario_title
      FROM public.attempts a JOIN public.scenarios s ON s.id = a.scenario_id
      WHERE a.user_id = $1 ORDER BY a.started_at DESC LIMIT 100`, [req.user.id]);
    res.json({ attempts: rows });
  });

  app.get('/api/attempts/:id', requireUser, async (req, res) => {
    if (!uuid.test(req.params.id)) return apiError(res, 400, 'ID percobaan tidak valid.');
    const { rows } = await pool.query(attemptSelect, [req.params.id]);
    if (!rows.length || rows[0].user_id !== req.user.id) return apiError(res, 404, 'Percobaan tidak ditemukan.');
    res.json({ attempt: await attemptState(pool, rows[0], req.user.id) });
  });

  app.post('/api/attempts/:id/choices', requireUser, async (req, res) => {
    if (!uuid.test(req.params.id) || !uuid.test(req.body?.choiceId || '')) {
      return apiError(res, 400, 'Pilihan tidak valid.');
    }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(`${attemptSelect} FOR UPDATE OF a`, [req.params.id]);
      const attempt = rows[0];
      if (!attempt || attempt.user_id !== req.user.id) {
        await client.query('ROLLBACK');
        return apiError(res, 404, 'Percobaan tidak ditemukan.');
      }
      if (attempt.status !== 'in_progress') {
        await client.query('ROLLBACK');
        return apiError(res, 409, 'Latihan ini sudah selesai.');
      }
      const prior = await client.query(`SELECT aa.sequence_no, c.next_node_id FROM public.attempt_answers aa
        JOIN public.chat_choices c ON c.id = aa.choice_id WHERE aa.attempt_id = $1
        ORDER BY aa.sequence_no DESC LIMIT 1`, [attempt.id]);
      const nodeId = prior.rows.length ? prior.rows[0].next_node_id : attempt.entry_node_id;
      const nextSequence = prior.rows.length ? prior.rows[0].sequence_no + 1 : 1;
      const choice = (await client.query(`SELECT c.id, c.label, c.points, c.evaluation,
        n.id AS next_node_id, n.node_type, n.outcome FROM public.chat_choices c
        JOIN public.chat_nodes n ON n.id = c.next_node_id
        WHERE c.id = $1 AND c.node_id = $2 AND c.scenario_id = $3`,
      [req.body.choiceId, nodeId, attempt.scenario_id])).rows[0];
      if (!choice) {
        await client.query('ROLLBACK');
        return apiError(res, 409, 'Pilihan sudah tidak sesuai dengan langkah percakapan.');
      }
      await client.query(`INSERT INTO public.attempt_answers
        (attempt_id, scenario_id, node_id, choice_id, sequence_no, choice_label, points_awarded, evaluation)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [attempt.id, attempt.scenario_id, nodeId, choice.id, nextSequence,
        choice.label, choice.points, choice.evaluation]);
      if (choice.node_type === 'result') {
        await client.query(`UPDATE public.attempts SET status = 'completed', result_node_id = $1,
          final_score = (SELECT COALESCE(SUM(points_awarded), 0)::integer FROM public.attempt_answers WHERE attempt_id = $2),
          completed_at = now() WHERE id = $2`, [choice.next_node_id, attempt.id]);
      }
      if (choice.node_type === 'result') {
        await awardBadges(client, req.user.id);
        await syncMissionCoins(client, req.user.id);
      }
      await client.query('COMMIT');
      const latest = (await pool.query(attemptSelect, [attempt.id])).rows[0];
      res.json({ attempt: await attemptState(pool, latest, req.user.id) });
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally { client.release(); }
  });

  app.get('/api/leaderboard', requireUser, async (req, res) => {
    const [ranking, summary] = await Promise.all([
      pool.query(`SELECT u.id AS user_id, u.name, MAX(a.final_score)::integer AS best_score,
        COUNT(*)::integer AS total_completed FROM public.attempts a
        JOIN public.users u ON u.id = a.user_id WHERE a.status = 'completed' AND u.is_active = TRUE
        GROUP BY u.id ORDER BY best_score DESC, total_completed DESC, u.name ASC LIMIT 50`),
      pool.query(`SELECT COUNT(*)::integer AS total_attempts,
        COUNT(*) FILTER (WHERE status = 'completed')::integer AS completed,
        COALESCE(ROUND(AVG(final_score) FILTER (WHERE status = 'completed')),0)::integer AS average_score,
        COALESCE(MAX(final_score),0)::integer AS best_score FROM public.attempts WHERE user_id = $1`, [req.user.id]),
    ]);
    res.json({ ranking: ranking.rows, summary: summary.rows[0] });
  });

  app.get('/api/admin/attempts', requireUser, requireAdmin, async (req, res) => {
    const requestedPage = Number(req.query.page || 1);
    const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, 100000) : 1;
    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
    const pattern = `%${search}%`;
    const where = `FROM public.attempts a JOIN public.users u ON u.id = a.user_id
      JOIN public.scenarios s ON s.id = a.scenario_id
      WHERE (u.name ILIKE $1 OR u.email ILIKE $1 OR s.title ILIKE $1)`;
    const [counts, attempts] = await Promise.all([
      pool.query(`SELECT COUNT(*)::integer AS total, COUNT(DISTINCT a.user_id)::integer AS participants ${where}`, [pattern]),
      pool.query(`SELECT a.id, a.status, a.final_score, a.started_at, a.completed_at,
        s.title AS scenario_title, u.name AS user_name, u.email AS user_email
        ${where} ORDER BY a.started_at DESC, a.id DESC LIMIT 20 OFFSET $2`,
      [pattern, (page - 1) * 20]),
    ]);
    const total = counts.rows[0].total;
    res.json({ attempts: attempts.rows, total, participants: counts.rows[0].participants,
      page, totalPages: Math.max(1, Math.ceil(total / 20)) });
  });

  app.get('/api/admin/overview', requireUser, requireAdmin, async (_req, res) => {
    const [counts, attempts, materials, scenarios, members] = await Promise.all([
      pool.query(`SELECT (SELECT COUNT(*)::integer FROM public.users WHERE is_active = TRUE AND role = 'user') AS users,
        (SELECT COUNT(*)::integer FROM public.materials) AS materials,
        (SELECT COUNT(*)::integer FROM public.scenarios) AS scenarios,
        (SELECT COUNT(*)::integer FROM public.attempts WHERE status = 'completed') AS completed`),
      pool.query(`SELECT a.id, a.status, a.final_score, a.started_at, a.completed_at,
        s.title AS scenario_title, u.name AS user_name, u.email AS user_email
        FROM public.attempts a JOIN public.users u ON u.id = a.user_id JOIN public.scenarios s ON s.id = a.scenario_id
        ORDER BY a.started_at DESC LIMIT 100`),
      pool.query(`SELECT m.id, m.slug, m.title, m.summary, m.content, m.is_published,
        m.created_at, COUNT(s.id)::integer AS scenario_count FROM public.materials m
        LEFT JOIN public.scenarios s ON s.material_id = m.id GROUP BY m.id ORDER BY m.created_at DESC`),
      pool.query(`SELECT s.id, s.slug, s.title, s.description, s.is_published, s.material_id, s.play_mode, s.chapter_number, s.difficulty, s.estimated_minutes,
        m.title AS material_title FROM public.scenarios s JOIN public.materials m ON m.id = s.material_id
        ORDER BY s.created_at DESC`),
      pool.query(`SELECT id, name, email, role, is_active, created_at FROM public.users
        WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 100`),
    ]);
    res.json({ stats: counts.rows[0], attempts: attempts.rows, materials: materials.rows,
      scenarios: scenarios.rows, members: members.rows });
  });

  app.post('/api/admin/materials', requireUser, requireAdmin, async (req, res) => {
    if (!validateMaterial(req.body)) return apiError(res, 422, 'Periksa judul, slug, ringkasan, isi, dan status materi.');
    const b = req.body;
    try {
      const { rows } = await pool.query(`INSERT INTO public.materials
        (author_id, slug, title, summary, content, is_published) VALUES ($1,$2,$3,$4,$5,$6)
        RETURNING id`, [req.user.id, b.slug, b.title.trim(), b.summary.trim(), b.content.trim(), b.isPublished]);
      res.status(201).json({ id: rows[0].id });
    } catch (error) { if (error.code === '23505') return apiError(res, 409, 'Slug materi sudah digunakan.'); throw error; }
  });

  app.patch('/api/admin/materials/:id', requireUser, requireAdmin, async (req, res) => {
    if (!uuid.test(req.params.id) || !validateMaterial(req.body)) return apiError(res, 422, 'Data materi tidak valid.');
    const b = req.body;
    try {
      const { rowCount } = await pool.query(`UPDATE public.materials SET slug=$2, title=$3,
        summary=$4, content=$5, is_published=$6 WHERE id=$1`,
      [req.params.id, b.slug, b.title.trim(), b.summary.trim(), b.content.trim(), b.isPublished]);
      if (!rowCount) return apiError(res, 404, 'Materi tidak ditemukan.');
      res.json({ message: 'Materi diperbarui.' });
    } catch (error) { if (error.code === '23505') return apiError(res, 409, 'Slug materi sudah digunakan.'); throw error; }
  });

  app.get('/api/admin/scenarios/:id/graph', requireUser, requireAdmin, async (req, res) => {
    if (!uuid.test(req.params.id)) return apiError(res, 400, 'ID tidak valid.');
    const scenario = (await pool.query('SELECT * FROM public.scenarios WHERE id=$1', [req.params.id])).rows[0];
    if (!scenario) return apiError(res, 404, 'Simulasi tidak ditemukan.');
    const [nodes, choices, attempts] = await Promise.all([
      pool.query('SELECT node_key AS id,title,speaker,message,node_type,outcome,scene_type,meta FROM public.chat_nodes WHERE scenario_id=$1 ORDER BY created_at', [scenario.id]),
      pool.query(`SELECT c.id::text AS id, n.node_key AS node_id, dest.node_key AS next_node_id,
        c.label,c.points,c.evaluation,c.position FROM public.chat_choices c
        JOIN public.chat_nodes n ON n.id=c.node_id JOIN public.chat_nodes dest ON dest.id=c.next_node_id
        WHERE c.scenario_id=$1 ORDER BY c.position`, [scenario.id]),
      pool.query('SELECT COUNT(*)::integer AS total FROM public.attempts WHERE scenario_id=$1', [scenario.id]),
    ]);
    const entry = nodes.rows.length ? (await pool.query('SELECT node_key FROM public.chat_nodes WHERE id=$1', [scenario.entry_node_id])).rows[0] : null;
    res.json({ scenario, editable: !scenario.is_published && !attempts.rows[0].total,
      graph: { entryNodeId: entry?.node_key, nodes: nodes.rows, choices: choices.rows } });
  });

  app.put('/api/admin/scenarios/:id/graph', requireUser, requireAdmin, async (req, res) => {
    if (!uuid.test(req.params.id) || !validateScenario(req.body)) return apiError(res, 422, 'Graf perlu diperbaiki: pastikan semua jalur valid dan poin maksimal 100.');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const scenario = (await client.query('SELECT * FROM public.scenarios WHERE id=$1 FOR UPDATE', [req.params.id])).rows[0];
      if (!scenario) { await client.query('ROLLBACK'); return apiError(res, 404, 'Simulasi tidak ditemukan.'); }
      const played = await client.query('SELECT 1 FROM public.attempts WHERE scenario_id=$1 LIMIT 1', [scenario.id]);
      if (scenario.is_published || played.rowCount) {
        await client.query('ROLLBACK'); return apiError(res, 409, 'Simulasi sudah diterbitkan/dimainkan. Buat versi draf baru agar riwayat nilai tidak berubah.');
      }
      const b = req.body;
      const existing = await client.query('SELECT 1 FROM public.materials WHERE id=$1', [b.materialId]);
      if (!existing.rowCount) { await client.query('ROLLBACK'); return apiError(res, 404, 'Materi tidak ditemukan.'); }
      await client.query('UPDATE public.scenarios SET entry_node_id=NULL WHERE id=$1', [scenario.id]);
      await client.query('DELETE FROM public.chat_choices WHERE scenario_id=$1', [scenario.id]);
      await client.query('DELETE FROM public.chat_nodes WHERE scenario_id=$1', [scenario.id]);
      await client.query(`UPDATE public.scenarios SET material_id=$2,slug=$3,title=$4,description=$5,
        play_mode=$6,chapter_number=$7,difficulty=$8,estimated_minutes=$9 WHERE id=$1`,
      [scenario.id,b.materialId,b.slug,b.title.trim(),b.description.trim(),b.playMode||'chat',b.chapterNumber||1,b.difficulty||'pemula',b.estimatedMinutes||5]);
      const ids = new Map();
      for (const node of b.graph.nodes) {
        const { rows } = await client.query(`INSERT INTO public.chat_nodes
          (scenario_id,node_key,title,speaker,message,node_type,outcome,scene_type,meta)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
        [scenario.id,node.id,node.title.trim(),node.speaker.trim(),node.message.trim(),node.node_type,node.outcome,
          node.scene_type||'chat',sanitizeNodeMeta(node.meta)]);
        ids.set(node.id, rows[0].id);
      }
      for (const choice of b.graph.choices) {
        await client.query(`INSERT INTO public.chat_choices
          (scenario_id,node_id,next_node_id,choice_key,label,points,evaluation,position)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [scenario.id,ids.get(choice.node_id),ids.get(choice.next_node_id),
            choice.id,choice.label.trim(),choice.points,choice.evaluation.trim(),choice.position]);
      }
      await client.query('UPDATE public.scenarios SET entry_node_id=$2 WHERE id=$1', [scenario.id,ids.get(b.graph.entryNodeId)]);
      await client.query('COMMIT'); res.json({ id: scenario.id });
    } catch (error) {
      await client.query('ROLLBACK').catch(()=>{});
      if (error.code==='23505') return apiError(res,409,'Slug atau kunci adegan sudah digunakan.');
      throw error;
    } finally { client.release(); }
  });

  app.post('/api/admin/scenarios', requireUser, requireAdmin, async (req, res) => {
    if (!validateScenario(req.body)) return apiError(res, 422, 'Struktur simulasi tidak valid. Pastikan setiap jalur berakhir di hasil.');
    const b = req.body;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const m = await client.query('SELECT id FROM public.materials WHERE id=$1', [b.materialId]);
      if (!m.rowCount) {
        await client.query('ROLLBACK');
        return apiError(res, 404, 'Materi untuk simulasi tidak ditemukan.');
      }
      const { rows } = await client.query(`INSERT INTO public.scenarios
        (material_id, slug, title, description, is_published)
        VALUES ($1,$2,$3,$4,FALSE) RETURNING id`, [b.materialId, b.slug, b.title.trim(), b.description.trim()]);
      const scenarioId = rows[0].id;
      await client.query(`UPDATE public.scenarios SET play_mode=$2,chapter_number=$3,difficulty=$4,estimated_minutes=$5 WHERE id=$1`,
        [scenarioId,b.playMode||'chat',b.chapterNumber||1,b.difficulty||'pemula',b.estimatedMinutes||5]);
      const ids = new Map();
      for (const node of b.graph.nodes) {
        const insert = await client.query(`INSERT INTO public.chat_nodes
          (scenario_id, node_key, title, speaker, message, node_type, outcome, scene_type, meta)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
        [scenarioId, node.id, node.title.trim(), node.speaker.trim(), node.message.trim(), node.node_type, node.outcome,
          node.scene_type||'chat',sanitizeNodeMeta(node.meta)]);
        ids.set(node.id, insert.rows[0].id);
      }
      for (const choice of b.graph.choices) {
        await client.query(`INSERT INTO public.chat_choices
          (scenario_id,node_id,next_node_id,choice_key,label,points,evaluation,position)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [scenarioId, ids.get(choice.node_id), ids.get(choice.next_node_id), choice.id,
          choice.label.trim(), choice.points, choice.evaluation.trim(), choice.position]);
      }
      await client.query('UPDATE public.scenarios SET entry_node_id=$1 WHERE id=$2', [ids.get(b.graph.entryNodeId), scenarioId]);
      await client.query('COMMIT');
      res.status(201).json({ id: scenarioId });
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      if (error.code === '23505') return apiError(res, 409, 'Slug atau kunci adegan sudah digunakan.');
      throw error;
    } finally { client.release(); }
  });

  app.patch('/api/admin/scenarios/:id', requireUser, requireAdmin, async (req, res) => {
    if (!uuid.test(req.params.id) || typeof req.body?.isPublished !== 'boolean') {
      return apiError(res, 422, 'Status simulasi tidak valid.');
    }
    const { rowCount } = await pool.query('UPDATE public.scenarios SET is_published=$2 WHERE id=$1',
      [req.params.id, req.body.isPublished]);
    if (!rowCount) return apiError(res, 404, 'Simulasi tidak ditemukan.');
    res.json({ message: 'Status simulasi diperbarui.' });
  });
}

export { validateMaterial, validateScenario };
