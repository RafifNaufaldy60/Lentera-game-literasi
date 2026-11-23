import { acceptedPlayerAvatarKeys, defaultPlayerAvatarKey } from '../../shared/avatar-options.js';
const chapterTopics = [
  { number: 1, title: 'Sinyal Palsu', topic: 'phishing', tagline: 'Jangan tertipu pesan yang mendesak.', color: 'yellow' },
  { number: 2, title: 'Ruang Komentar', topic: 'cyberbullying', tagline: 'Satu respons bisa melindungi teman.', color: 'pink' },
  { number: 3, title: 'Jejak Terbuka', topic: 'doxing', tagline: 'Data pribadi bukan bahan tontonan.', color: 'mint' },
  { number: 4, title: 'Tawaran Kilat', topic: 'penipuan online', tagline: 'Harga murah bukan alasan untuk terburu-buru.', color: 'sky' },
  { number: 5, title: 'Digital Crisis', topic: 'final chapter', tagline: 'Semua pelajaran bertemu di satu krisis.', color: 'coral' },
];

export async function awardBadges(client, userId) {
  const { rows } = await client.query(`
    SELECT a.final_score, s.chapter_number, r.outcome FROM public.attempts a
    JOIN public.scenarios s ON s.id=a.scenario_id
    JOIN public.chat_nodes r ON r.id=a.result_node_id
    WHERE a.user_id=$1 AND a.status='completed'`, [userId]);
  if (!rows.length) return [];
  const earned = new Set(['first-step']);
  if (rows.some((r) => r.final_score >= 90)) earned.add('high-score');
  const mapping = ['phishing-eye', 'kind-heart', 'privacy-keeper', 'smart-shopper'];
  for (const [i, key] of mapping.entries()) {
    if (rows.some((r) => r.chapter_number === i + 1 && r.final_score >= 70 && r.outcome !== 'risky')) earned.add(key);
  }
  if ([1, 2, 3, 4].every((n) => rows.some((r) => r.chapter_number === n))) earned.add('four-topics');
  if (rows.some((r) => r.chapter_number === 5)) earned.add('final-guardian');
  await client.query(`INSERT INTO public.user_badges (user_id,badge_key)
    SELECT $1, badge_key FROM public.badge_definitions WHERE badge_key = ANY($2::text[])
    ON CONFLICT DO NOTHING`, [userId, [...earned]]);
  return [...earned];
}

export async function userProfile(client, userId) {
  const [settings, summary, badges, chapters] = await Promise.all([
    client.query('SELECT avatar_key,sound_enabled FROM public.user_profiles WHERE user_id=$1', [userId]),
    client.query(`WITH best AS (SELECT scenario_id,MAX(final_score)::integer AS score
      FROM public.attempts WHERE user_id=$1 AND status='completed' GROUP BY scenario_id)
      SELECT COALESCE(SUM(score+40),0)::integer AS xp,COUNT(*)::integer AS unique_missions,
      COALESCE(MAX(score),0)::integer AS best_score FROM best`, [userId]),
    client.query(`SELECT b.badge_key,b.title,b.description,b.icon_key,b.accent,ub.awarded_at
      FROM public.user_badges ub JOIN public.badge_definitions b USING (badge_key)
      WHERE ub.user_id=$1 ORDER BY ub.awarded_at,b.title`, [userId]),
    client.query(`SELECT DISTINCT s.chapter_number FROM public.attempts a
      JOIN public.scenarios s ON s.id=a.scenario_id WHERE a.user_id=$1 AND a.status='completed'`, [userId]),
  ]);
  const xp = summary.rows[0].xp;
  const finished = new Set(chapters.rows.map((r) => r.chapter_number));
  return {
    settings: settings.rows[0] || { avatar_key: defaultPlayerAvatarKey, sound_enabled: false },
    xp, level: Math.floor(xp / 300) + 1, levelProgress: xp % 300, levelGoal: 300,
    uniqueMissions: summary.rows[0].unique_missions, bestScore: summary.rows[0].best_score,
    badges: badges.rows,
    chapters: chapterTopics.map((c) => ({ ...c, completed: finished.has(c.number),
      unlocked: c.number < 5 || [1,2,3,4].every((n) => finished.has(n)) })),
  };
}

export function registerGameRoutes(app, pool, requireUser) {
  app.get('/api/game/profile', requireUser, async (req, res) => {
    await awardBadges(pool, req.user.id);
    res.json({ profile: await userProfile(pool, req.user.id) });
  });
  app.patch('/api/game/profile', requireUser, async (req, res) => {
    const { avatarKey, soundEnabled } = req.body || {};
    if (!acceptedPlayerAvatarKeys.includes(avatarKey) || typeof soundEnabled !== 'boolean') {
      return res.status(422).json({ error: 'Pilihan avatar atau pengaturan suara tidak valid.' });
    }
    await pool.query(`INSERT INTO public.user_profiles(user_id,avatar_key,sound_enabled)
      VALUES ($1,$2,$3) ON CONFLICT (user_id) DO UPDATE SET avatar_key=EXCLUDED.avatar_key,
      sound_enabled=EXCLUDED.sound_enabled,updated_at=now()`, [req.user.id, avatarKey, soundEnabled]);
    res.json({ profile: await userProfile(pool, req.user.id) });
  });
  app.get('/api/game/chapters', requireUser, async (req, res) => {
    const profile = await userProfile(pool, req.user.id);
    const { rows } = await pool.query(`SELECT s.id,s.title,s.slug,s.description,s.chapter_number,s.play_mode,s.difficulty,
      s.estimated_minutes,COUNT(a.id)::integer AS your_attempts,
      MAX(a.final_score)::integer AS best_score
      FROM public.scenarios s JOIN public.materials m ON m.id=s.material_id
      LEFT JOIN public.attempts a ON a.scenario_id=s.id AND a.user_id=$1 AND a.status='completed'
      WHERE s.is_published AND m.is_published
      GROUP BY s.id ORDER BY s.chapter_number,s.created_at`, [req.user.id]);
    res.json({ chapters: profile.chapters.map((chapter) => ({ ...chapter,
      scenarios: rows.filter((s) => s.chapter_number === chapter.number) })) });
  });
}
