/** Cyber Coins never affect educational scores or the existing XP progression. */
export function cumulativeMissionCoins(score) {
  if (!Number.isInteger(score) || score < 0 || score > 100) throw new RangeError('Skor misi harus 0–100.');
  return 18 + Math.floor(score * 22 / 100);
}

/** Each user+scenario can earn at most 40 CC across all replays. */
export function coinImprovement(previousBest, nextScore) {
  if (previousBest != null && nextScore <= previousBest) return 0;
  return cumulativeMissionCoins(nextScore) - (previousBest == null ? 0 : cumulativeMissionCoins(previousBest));
}

/** Call inside a transaction; wallet row serializes reward and purchase requests. */
export async function syncMissionCoins(client, userId) {
  await client.query('INSERT INTO public.coin_wallets(user_id) VALUES($1) ON CONFLICT DO NOTHING', [userId]);
  const wallet = await client.query('SELECT balance FROM public.coin_wallets WHERE user_id=$1 FOR UPDATE', [userId]);
  const best = await client.query(`SELECT DISTINCT ON (a.scenario_id)
    a.scenario_id, a.id AS attempt_id, a.final_score, s.title
    FROM public.attempts a JOIN public.scenarios s ON s.id=a.scenario_id
    WHERE a.user_id=$1 AND a.status='completed' AND a.final_score BETWEEN 0 AND 100
    ORDER BY a.scenario_id,a.final_score DESC,a.completed_at DESC,a.id`, [userId]);
  const progress = await client.query('SELECT scenario_id,best_score FROM public.coin_reward_progress WHERE user_id=$1', [userId]);
  const known = new Map(progress.rows.map((row) => [row.scenario_id, Number(row.best_score)]));
  let earned = 0;
  for (const row of best.rows) {
    const score = Number(row.final_score);
    const prior = known.get(row.scenario_id);
    const reward = coinImprovement(prior, score);
    if (reward <= 0) {
      if (prior != null && score > prior) {
        await client.query('UPDATE public.coin_reward_progress SET best_score=$3,updated_at=now() WHERE user_id=$1 AND scenario_id=$2', [userId,row.scenario_id,score]);
      }
      continue;
    }
    await client.query(`INSERT INTO public.coin_reward_progress(user_id,scenario_id,best_score,coins_awarded)
      VALUES($1,$2,$3,$4) ON CONFLICT (user_id,scenario_id) DO UPDATE
      SET best_score=EXCLUDED.best_score, coins_awarded=public.coin_reward_progress.coins_awarded+EXCLUDED.coins_awarded,updated_at=now()`,
    [userId,row.scenario_id,score,reward]);
    await client.query(`INSERT INTO public.coin_transactions(user_id,amount,kind,attempt_id,description)
      VALUES($1,$2,'mission',$3,$4)`, [userId,reward,row.attempt_id,`Peningkatan misi: ${row.title}`]);
    earned += reward;
  }
  if (earned) await client.query('UPDATE public.coin_wallets SET balance=balance+$2,updated_at=now() WHERE user_id=$1', [userId,earned]);
  return Number(wallet.rows[0].balance) + earned;
}

export const SHOP_CATEGORIES = ['frame','chat','companion','background','title','stickers'];
export const SHOP_ASSETS = ['frame','chat','companion','background','nameplate','stickers'];
export const SHOP_ACCENTS = ['cyan','violet','pink','gold','mint'];
export function validateShopItem(item) {
  const text = (value,min,max) => typeof value === 'string' && value.trim().length >= min && value.trim().length <= max;
  return Boolean(item && text(item.id,3,60) && /^[a-z][a-z0-9-]{2,59}$/.test(item.id)
    && text(item.name,3,80) && text(item.description,8,240)
    && SHOP_CATEGORIES.includes(item.category) && SHOP_ASSETS.includes(item.assetKey)
    && SHOP_ACCENTS.includes(item.accent) && Number.isInteger(item.price)
    && item.price >= 0 && item.price <= 100000 && typeof item.isActive === 'boolean');
}
