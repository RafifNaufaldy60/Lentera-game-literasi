import test from 'node:test';
import assert from 'node:assert/strict';
import { cumulativeMissionCoins, coinImprovement, validateShopItem } from '../src/shop-economy.js';

test('misi pertama memberi 18–40 CC menurut skor',()=>{
  assert.equal(cumulativeMissionCoins(0),18);
  assert.equal(cumulativeMissionCoins(50),29);
  assert.equal(cumulativeMissionCoins(100),40);
});
test('perbaikan skor memberi selisih, bukan reward penuh',()=>{
  assert.equal(coinImprovement(null,0),18);
  assert.equal(coinImprovement(null,100),40);
  assert.equal(coinImprovement(40,70),7);
  assert.equal(coinImprovement(100,100),0);
  assert.equal(coinImprovement(90,30),0);
  assert.equal(coinImprovement(0,100),22);
});
test('skor tidak sah ditolak',()=>{
  for(const n of [-1,101,1.1,NaN])assert.throws(()=>cumulativeMissionCoins(n));
});
const item={id:'frame-neo',name:'Bingkai Neo',description:'Bingkai bergaya cyber dengan neon.',category:'frame',assetKey:'frame',accent:'cyan',price:80,isActive:true};
test('item valid dapat dipasang ke katalog',()=>{
  assert.equal(validateShopItem(item),true);
});
test('input admin menolak ID asing, harga negatif, aset luar, dan kategori baru',()=>{
  for (const patch of [{id:'../../local'},{price:-5},{price:4.3},{assetKey:'https://other.site/x'},{category:'score-booster'},{isActive:'true'}]) {
    assert.equal(validateShopItem({...item,...patch}),false,JSON.stringify(patch));
  }
});

test('rekonsiliasi reward bersifat idempoten dan hanya membayar kenaikan skor terbaik', async () => {
  const { syncMissionCoins } = await import('../src/shop-economy.js');
  const state = { balance: 0, progress: new Map(), ledger: [], attempts: [
    { scenario_id: 'misi-a', attempt_id: 'percobaan-1', final_score: 50, title: 'Sinyal Palsu' },
  ] };
  const client = { async query(sql, params=[]) {
    if (sql.startsWith('INSERT INTO public.coin_wallets')) return { rows:[], rowCount:1 };
    if (sql.startsWith('SELECT balance FROM public.coin_wallets')) return { rows:[{balance:state.balance}], rowCount:1 };
    if (sql.includes('SELECT DISTINCT ON')) return { rows:state.attempts };
    if (sql.startsWith('SELECT scenario_id,best_score')) return { rows:[...state.progress].map(([scenario_id,best_score])=>({scenario_id,best_score})) };
    if (sql.includes('INSERT INTO public.coin_reward_progress')) { state.progress.set(params[1],params[2]);return {rows:[]}; }
    if (sql.startsWith('UPDATE public.coin_reward_progress')) { state.progress.set(params[1],params[2]);return {rows:[]}; }
    if (sql.includes('INSERT INTO public.coin_transactions')) { state.ledger.push(params[1]);return {rows:[]}; }
    if (sql.startsWith('UPDATE public.coin_wallets')) { state.balance+=params[1];return {rows:[]}; }
    throw Error(`SQL tidak dimock: ${sql.slice(0,70)}`);
  } };
  assert.equal(await syncMissionCoins(client,'pemain-1'),29);
  assert.equal(await syncMissionCoins(client,'pemain-1'),29);
  assert.deepEqual(state.ledger,[29]);
  state.attempts=[{scenario_id:'misi-a',attempt_id:'percobaan-2',final_score:100,title:'Sinyal Palsu'}];
  assert.equal(await syncMissionCoins(client,'pemain-1'),40);
  assert.deepEqual(state.ledger,[29,11]);
  assert.equal(await syncMissionCoins(client,'pemain-1'),40);
  assert.equal(state.ledger.reduce((a,b)=>a+b,0),state.balance);
});
