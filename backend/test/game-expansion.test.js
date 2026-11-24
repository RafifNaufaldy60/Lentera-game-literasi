import assert from 'node:assert/strict';
import test from 'node:test';
import { campaignStories, makeCampaignGraph } from '../seeds/game-campaign.js';
import { validateScenarioGraph } from '../src/scenario-graph.js';
import { validateScenario } from '../src/learning-routes.js';
import { awardBadges } from '../src/gamification.js';

const materialId='11111111-1111-4111-8111-111111111111';

test('lima misi baru mempunyai lima keputusan, seluruh jalur berakhir, dan skor tidak melampaui 100',()=>{
  assert.equal(campaignStories.length,5);
  for(const story of campaignStories){
    const graph=makeCampaignGraph(story),paths=validateScenarioGraph(graph);
    assert.equal(story.steps.length,5,story.slug);
    assert.equal(graph.nodes.length,12,story.slug);
    assert.equal(graph.choices.length,20,story.slug);
    assert.equal(paths.length,48,story.slug);
    assert.equal(Math.max(...paths.map((p)=>p.score)),100);
    assert.equal(Math.min(...paths.map((p)=>p.score)),0);
    assert.deepEqual(new Set(paths.map((p)=>p.outcome)),new Set(['safe','recovered','risky']));
    assert.ok(validateScenario({materialId,slug:story.slug,title:story.title,
      description:story.description,playMode:story.playMode,chapterNumber:story.chapter,
      difficulty:'menengah',estimatedMinutes:8,graph}),story.slug);
  }
});

test('graf tidak valid tidak dapat diterbitkan lewat editor cerita',()=>{
  const story=campaignStories[0],g=makeCampaignGraph(story);
  const base={materialId,title:story.title,description:story.description,slug:story.slug,
    playMode:story.playMode,chapterNumber:story.chapter,difficulty:'menengah',estimatedMinutes:8,graph:g};
  assert.equal(validateScenario({...base,chapterNumber:9}),false);
  assert.equal(validateScenario({...base,playMode:'inject-script'}),false);
  assert.equal(validateScenario({...base,graph:{...g,choices:g.choices.slice(1)}}),false);
  assert.equal(validateScenario({...base,graph:{...g,choices:g.choices.map((c)=>({...c,points:100}))}}),false);
});

test('badge tidak bergantung pada jumlah replay dan hadiah sesuai topik yang dituntaskan',async()=>{
  const saved=[];
  const mock={query:async(sql,args)=>{
    if(sql.includes('SELECT a.final_score'))return {rows:[
      {final_score:100,chapter_number:1,outcome:'safe'},{final_score:80,chapter_number:1,outcome:'safe'},
      {final_score:71,chapter_number:2,outcome:'safe'},{final_score:72,chapter_number:3,outcome:'recovered'},
      {final_score:75,chapter_number:4,outcome:'safe'},{final_score:10,chapter_number:5,outcome:'risky'},
    ]};
    saved.push(args[1]);return {rows:[]};
  }};
  await awardBadges(mock,materialId);
  assert.equal(saved.length,1);
  assert.deepEqual(new Set(saved[0]),new Set(['first-step','phishing-eye','kind-heart','privacy-keeper',
    'smart-shopper','high-score','four-topics','final-guardian']));
});
