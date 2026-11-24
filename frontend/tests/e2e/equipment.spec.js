import { test, expect } from '@playwright/test';

const items = [
  ['frame-nyan','Nyan Circuit','frame','frame','violet'],
  ['chat-holo','Holo Messenger','chat','chat','violet'],
  ['pet-nyan','Neko Byte','companion','companion','cyan'],
  ['bg-mooncity','Moon City','background','background','pink'],
  ['title-signal','Signal Scout','title','nameplate','gold'],
  ['sticker-shield','Guardian Sticker','stickers','stickers','mint'],
  ['frame-pulse','Pulse Halo','frame','frame','cyan'],
].map(([id,name,category,asset_key,accent])=>({id,name,category,asset_key,accent,description:'Item pengujian koleksi.'}));

test('semua kosmetik yang dimiliki tampil di profil, dapat diganti, dilepas, dan bertahan setelah refresh', async ({page})=>{
  const user={id:'fixture-user',name:'Pemain Uji',role:'user'};
  const state={balance:42,inventory:items,equipment:{}};
  const profile={profile:{settings:{avatar_key:'neon-luna',sound_enabled:false},level:1,levelProgress:20,levelGoal:100,uniqueMissions:1,badges:[]}};
  await page.route('**/api/**',async route=>{
    const path=new URL(route.request().url()).pathname;
    let data={};
    if(path==='/api/auth/session') data={user,csrfToken:'fixture'};
    else if(path==='/api/game/profile') data=profile;
    else if(path==='/api/shop/me') data=state;
    else if(path==='/api/shop/history') data={transactions:[]};
    else if(path==='/api/shop/equip'){
      const {slot,itemId}=route.request().postDataJSON();
      if(itemId===null) delete state.equipment[slot];
      else { const item=items.find(i=>i.id===itemId&&i.category===slot); if(!item) return route.fulfill({status:403,json:{error:'Item tidak dimiliki'}}); state.equipment[slot]={...item,item_id:item.id,slot}; }
      data=state;
    }
    await route.fulfill({json:data});
  });
  await page.goto('/inventaris');
  for(const item of items.slice(0,6)){
    const card=page.locator('.inventory-card').filter({has:page.getByRole('heading',{name:item.name,exact:true})});
    await card.getByRole('button',{name:'Pakai item'}).click();
    await expect(card.getByRole('button',{name:'Lepas item'})).toBeVisible();
  }
  await page.getByRole('link',{name:'Lihat profil'}).click();
  const assertEquipment=async()=>{
    for(const item of items.slice(0,6)) await expect(page.locator(`.profile-panel [data-equipped-${item.category}="${item.id}"]`)).toBeVisible();
    await expect(page.locator('.profile-id .equipped-frame-art')).toHaveAttribute('src','/shop/frame.webp');
    await expect(page.locator('.profile-chat-preview')).toHaveClass(/chat-theme-holo/);
    await expect(page.locator('.equipment-slots dd')).toHaveCount(6);
  };
  await assertEquipment();
  await page.reload();
  await assertEquipment();
  for(const width of [320,390,768,1440]){
    await page.setViewportSize({width,height:900});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  await page.goto('/inventaris');
  const replacement=page.locator('.inventory-card').filter({has:page.getByRole('heading',{name:'Pulse Halo',exact:true})});
  await replacement.getByRole('button',{name:'Pakai item'}).click();
  await expect(replacement.getByRole('button',{name:'Lepas item'})).toBeVisible();
  await page.getByRole('link',{name:'Lihat profil'}).click();
  await expect(page.locator('.profile-id [data-equipped-frame="frame-pulse"]')).toBeVisible();
  await page.goto('/inventaris');
  for(const item of [...items.slice(1,6),items[6]]){
    const card=page.locator('.inventory-card').filter({has:page.getByRole('heading',{name:item.name,exact:true})});
    await card.getByRole('button',{name:'Lepas item'}).click();
    await expect(card.getByRole('button',{name:'Pakai item'})).toBeVisible();
  }
  await page.getByRole('link',{name:'Lihat profil'}).click();
  await expect(page.getByText('Belum ada item dipakai.')).toBeVisible();
  await expect(page.locator('.profile-panel [data-equipped-frame],.profile-panel [data-equipped-background],.profile-panel [data-equipped-title],.profile-panel [data-equipped-chat],.profile-panel [data-equipped-companion],.profile-panel [data-equipped-stickers]')).toHaveCount(0);
});
