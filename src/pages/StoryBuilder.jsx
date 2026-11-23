import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useAuth } from '../auth/AuthContext.js';
import { api } from '../lib/api.js';
import { useResource } from '../hooks/useResource.js';
import { ErrorState, Icon, LoadingState } from '../components/Icons.jsx';

const starter={
  entryNodeId:'start',
  nodes:[
    {id:'start',title:'Pesan awal',speaker:'Pengirim tak dikenal',message:'Halo, ada informasi penting untuk akunmu. Apa yang akan kamu lakukan sekarang?',node_type:'message',outcome:null,scene_type:'chat',meta:{x:40,y:220,avatar:'orbit',attachment:''}},
    {id:'safe',title:'Akhir aman',speaker:'Evaluasi',message:'Kamu berhenti dan melakukan verifikasi lewat layanan resmi. Keputusan ini membantu melindungi akun.',node_type:'result',outcome:'safe',scene_type:'system',meta:{x:520,y:70}},
    {id:'risk',title:'Akhir berisiko',speaker:'Evaluasi',message:'Kamu terjebak dalam situasi fiktif yang berisiko. Tinjau evaluasi untuk mengenali tanda bahayanya.',node_type:'result',outcome:'risky',scene_type:'system',meta:{x:520,y:390}},
  ],
  choices:[
    {id:'verify',node_id:'start',next_node_id:'safe',label:'Verifikasi melalui aplikasi resmi',points:100,evaluation:'Memeriksa kanal resmi membantu mencegah penipuan.',position:1},
    {id:'trust',node_id:'start',next_node_id:'risk',label:'Langsung percaya kepada pengirim',points:0,evaluation:'Mempercayai identitas tanpa verifikasi meningkatkan risiko.',position:2},
  ],
};
const defaults={materialId:'',title:'',slug:'',description:'',playMode:'chat',chapterNumber:1,difficulty:'pemula',estimatedMinutes:5};
const playModes=[['chat','Percakapan'],['email','Inbox email'],['social','Media sosial'],['privacy','Investigasi jejak'],['market','Marketplace'],['hybrid','Gabungan']];
const sceneTypes=[['chat','Chat'],['email','Email'],['social','Post komentar'],['privacy','Bukti digital'],['market','Produk toko'],['system','Sistem']];
const slugify=(s)=>s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-').replace(/-+/g,'-');
function copyGraph(graph){return JSON.parse(JSON.stringify(graph));}
function newKey(prefix){return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;}
function layOutLegacyGraph(graph) {
  // Migrasi 001 tidak menyimpan koordinat. Susun graf lama otomatis hanya bila belum ada posisi.
  const hasPositions = graph.nodes.every((node) => Number.isFinite(node.meta?.x) && Number.isFinite(node.meta?.y));
  const allOverlapping = hasPositions && new Set(graph.nodes.map((node) => `${node.meta.x}:${node.meta.y}`)).size === 1 && graph.nodes.length > 1;
  if (hasPositions && !allOverlapping) return graph;
  const depth = new Map([[graph.entryNodeId, 0]]);
  const queue = [graph.entryNodeId];
  while (queue.length) {
    const id = queue.shift();
    for (const choice of graph.choices.filter((item) => item.node_id === id)) {
      if (!depth.has(choice.next_node_id)) {
        depth.set(choice.next_node_id, (depth.get(id) || 0) + 1);
        queue.push(choice.next_node_id);
      }
    }
  }
  const layers = new Map();
  for (const node of graph.nodes) {
    const level = Math.min(depth.get(node.id) ?? 0, 8);
    const group = layers.get(level) || [];
    group.push(node.id);
    layers.set(level, group);
  }
  return { ...graph, nodes: graph.nodes.map((node) => {
    if (!allOverlapping && Number.isFinite(node.meta?.x) && Number.isFinite(node.meta?.y)) return node;
    const level = Math.min(depth.get(node.id) ?? 0, 8);
    return { ...node, meta: { ...node.meta, x: 45 + level * 295, y: 60 + layers.get(level).indexOf(node.id) * 170 } };
  }) };
}


export default function StoryBuilder(){
  const {id}=useParams(),navigate=useNavigate();
  const {csrfToken,refreshSession}=useAuth();
  const overview=useResource('/admin/overview');
  const [editingId,setEditingId]=useState(id||null),[form,setForm]=useState(defaults),[graph,setGraph]=useState(()=>copyGraph(starter));
  const [selected,setSelected]=useState('start'),[preview,setPreview]=useState(false),[previewNode,setPreviewNode]=useState('start');
  const [editable,setEditable]=useState(true),[loading,setLoading]=useState(Boolean(id)),[saving,setSaving]=useState(false);
  const [failure,setFailure]=useState(''),[notice,setNotice]=useState('');
  const drag=useRef(null);
  useEffect(()=>{document.title='Story Builder | Lentera';},[]);
  useEffect(()=>{
    if(!id){setLoading(false);return;}
    let active=true;setLoading(true);
    api(`/admin/scenarios/${id}/graph`).then(({scenario,graph:g,editable:canEdit})=>{
      if(!active)return;
      setEditingId(id);setEditable(canEdit);setForm({materialId:scenario.material_id,title:scenario.title,slug:scenario.slug,
        description:scenario.description,playMode:scenario.play_mode,chapterNumber:scenario.chapter_number,
        difficulty:scenario.difficulty,estimatedMinutes:scenario.estimated_minutes});
      setGraph(layOutLegacyGraph(g));setSelected(g.entryNodeId);setPreviewNode(g.entryNodeId);
    }).catch(e=>active&&setFailure(e.message)).finally(()=>active&&setLoading(false));
    return()=>{active=false};
  },[id]);
  const node=graph.nodes.find((n)=>n.id===selected);
  const live=graph.nodes.find((n)=>n.id===previewNode);
  const liveChoices=graph.choices.filter((c)=>c.node_id===previewNode).sort((a,b)=>a.position-b.position);
  const outgoing=graph.choices.filter((c)=>c.node_id===selected).sort((a,b)=>a.position-b.position);
  const pathWarning=useMemo(()=>{
    const ids=new Set(graph.nodes.map((n)=>n.id));
    const messages=graph.nodes.filter((n)=>n.node_type==='message');
    if(!ids.has(graph.entryNodeId))return 'Adegan awal belum dipilih.';
    if(messages.some((n)=>!graph.choices.some((c)=>c.node_id===n.id)))return 'Ada adegan tanpa pilihan lanjutan.';
    if(graph.choices.some((c)=>!ids.has(c.node_id)||!ids.has(c.next_node_id)))return 'Ada pilihan dengan tujuan tidak tersedia.';
    if(!graph.nodes.some((n)=>n.node_type==='result'))return 'Tambahkan adegan hasil.';
    return '';
  },[graph]);
  function patchNode(changes){setGraph((g)=>({...g,nodes:g.nodes.map((n)=>n.id===selected?{...n,...changes}:n)}));}
  function patchMeta(changes){patchNode({meta:{...node.meta,...changes}});}
  function patchChoice(id,changes){setGraph((g)=>({...g,choices:g.choices.map((c)=>c.id===id?{...c,...changes}:c)}));}
  function addNode(type){
    const key=newKey(type==='result'?'akhir':'adegan');
    const item={id:key,title:type==='result'?'Akhir cerita baru':'Pesan berikutnya',speaker:type==='result'?'Evaluasi':'Karakter',
      message:type==='result'?'Keputusan yang kamu ambil dalam latihan fiktif ini memiliki konsekuensi. Tinjau pilihanmu.':'Sebuah pesan baru muncul. Perhatikan informasi sebelum memilih tindakan yang tepat.',
      node_type:type,outcome:type==='result'?'recovered':null,scene_type:type==='result'?'system':form.playMode==='hybrid'?'chat':form.playMode,
      meta:{x:Math.min(1250,300+graph.nodes.length*55),y:60+(graph.nodes.length%3)*175,avatar:'orbit',attachment:''}};
    setGraph((g)=>({...g,nodes:[...g.nodes,item]}));setSelected(key);
  }
  function removeNode(){if(graph.nodes.length<=3||selected===graph.entryNodeId)return;
    setGraph((g)=>({...g,nodes:g.nodes.filter((n)=>n.id!==selected),choices:g.choices.filter((c)=>c.node_id!==selected&&c.next_node_id!==selected)}));
    setSelected(graph.entryNodeId);
  }
  function addChoice(){
    if(!node||node.node_type==='result')return;
    const firstTarget=graph.nodes.find((n)=>n.id!==selected);
    if(!firstTarget)return;
    setGraph((g)=>({...g,choices:[...g.choices,{id:newKey('pilihan'),node_id:selected,next_node_id:firstTarget.id,
      label:'Periksa situasi sebelum merespons',points:0,evaluation:'Pertimbangkan dampak keputusanmu terhadap keselamatan digital.',position:outgoing.length+1}]}));
  }
  function removeChoice(key){setGraph((g)=>({...g,choices:g.choices.filter((c)=>c.id!==key)}));}
  function moveNode(event){
    if(!drag.current||!editable)return;
    const {id,startX,startY,x,y}=drag.current;
    const nextX=Math.min(2500,Math.max(0,x+event.clientX-startX));
    const nextY=Math.min(1400,Math.max(0,y+event.clientY-startY));
    setGraph((g)=>({...g,nodes:g.nodes.map((n)=>n.id===id?{...n,meta:{...n.meta,x:nextX,y:nextY}}:n)}));
  }
  function duplicate(){setEditingId(null);setEditable(true);setForm((f)=>({...f,title:`${f.title} (versi baru)`,slug:`${f.slug}-versi-${Date.now().toString(36)}`}));setNotice('Salinan draf siap disimpan sebagai simulasi baru.');navigate('/admin/editor',{replace:true});}
  async function save(event){
    event.preventDefault();setFailure('');setNotice('');setSaving(true);
    try{
      const result=await api(editingId?`/admin/scenarios/${editingId}/graph`:'/admin/scenarios',
        {method:editingId?'PUT':'POST',csrfToken,body:{...form,graph}});
      setNotice('Graf cerita tersimpan sebagai draf. Tinjau dan terbitkan melalui Kelola Simulasi.');
      if(!editingId){setEditingId(result.id);navigate(`/admin/editor/${result.id}`,{replace:true});}
    }catch(error){setFailure(error.message);if(error.code==='CSRF_EXPIRED')await refreshSession({silent:true});}
    finally{setSaving(false);}
  }
  if(overview.loading||loading)return <LoadingState label="Membuka editor percabangan…"/>;
  if(overview.error)return <ErrorState error={overview.error} retry={overview.reload}/>;
  return <div className="app-page builder-page">
    <div className="builder-top"><Link to="/admin/simulasi" className="back-link"><Icon name="arrow-left" size={16}/> Kelola simulasi</Link><span className="builder-tag"><Icon name="layers" size={16}/> VISUAL STORY BUILDER</span></div>
    <div className="builder-title"><div><p className="eyebrow">STUDIO KREATOR / EDITOR CERITA</p><h1>Rangkai cerita,<br/><span>tentukan konsekuensi.</span></h1><p>Hubungkan pesan, pilihan, dan akhir cerita. Klik node untuk mengedit atau seret kepala node untuk memindahkannya.</p></div><div className="builder-top-actions"><button className="button secondary" type="button" onClick={()=>{setPreview(!preview);setPreviewNode(graph.entryNodeId);}}><Icon name="play" size={17}/>{preview?'Tutup preview':'Preview cerita'}</button>{!editable&&<button type="button" className="button primary" onClick={duplicate}>Duplikat sebagai draf</button>}</div></div>
    {failure&&<p className="notice error" role="alert">{failure}</p>}{notice&&<p className="notice success" role="status">{notice}</p>}
    {!editable&&<p className="notice">Skenario ini sudah diterbitkan atau pernah dimainkan. Graf dikunci untuk menjaga riwayat penilaian. Gunakan <strong>Duplikat sebagai draf</strong> untuk membuat versi baru.</p>}
    <form onSubmit={save} className="builder-form"><section className="builder-settings" aria-label="Pengaturan cerita">
      <h2>Informasi misi</h2><div className="builder-fields">
      <label>Materi terkait<select required disabled={!editable} value={form.materialId} onChange={(e)=>setForm({...form,materialId:e.target.value})}><option value="">Pilih materi</option>{overview.data.materials.map((m)=><option value={m.id} key={m.id}>{m.title}</option>)}</select></label>
      <label>Judul cerita<input required disabled={!editable} minLength={5} maxLength={140} value={form.title} onChange={(e)=>setForm({...form,title:e.target.value,slug:editingId?form.slug:slugify(e.target.value)})}/></label>
      <label>Slug<input required disabled={!editable} minLength={3} maxLength={100} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={(e)=>setForm({...form,slug:e.target.value})}/></label>
      <label>Deskripsi<textarea required disabled={!editable} minLength={10} maxLength={1000} rows={3} value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})}/></label>
      <div className="builder-compact"><label>Mode<select disabled={!editable} value={form.playMode} onChange={(e)=>setForm({...form,playMode:e.target.value})}>{playModes.map(([key,value])=><option key={key} value={key}>{value}</option>)}</select></label>
      <label>Chapter<select disabled={!editable} value={form.chapterNumber} onChange={(e)=>setForm({...form,chapterNumber:Number(e.target.value)})}>{[1,2,3,4,5].map((n)=><option key={n} value={n}>Chapter {n}</option>)}</select></label></div>
      <div className="builder-compact"><label>Kesulitan<select disabled={!editable} value={form.difficulty} onChange={(e)=>setForm({...form,difficulty:e.target.value})}><option value="pemula">Pemula</option><option value="menengah">Menengah</option><option value="lanjutan">Lanjutan</option></select></label>
      <label>Estimasi menit<input required disabled={!editable} type="number" min="1" max="45" value={form.estimatedMinutes} onChange={(e)=>setForm({...form,estimatedMinutes:Number(e.target.value)})}/></label></div>
      </div></section>
      <section className="builder-workspace"><div className="builder-toolbar"><div><h2>Peta adegan</h2><p>{graph.nodes.length} adegan · {graph.choices.length} pilihan</p></div>{editable&&<div><button className="button secondary" type="button" onClick={()=>addNode('message')}>+ Pesan</button><button className="button secondary" type="button" onClick={()=>addNode('result')}>+ Ending</button></div>}</div>
        <div className="node-viewport" aria-label="Peta percabangan cerita, dapat digulir ke samping"><div className="node-stage">
          <svg className="node-wires" viewBox="0 0 2850 1750" aria-hidden="true">{graph.choices.map((choice)=>{const a=graph.nodes.find((n)=>n.id===choice.node_id),b=graph.nodes.find((n)=>n.id===choice.next_node_id);if(!a||!b)return null;const x=(a.meta?.x??0)+218,y=(a.meta?.y??0)+55,tx=b.meta?.x??0,ty=(b.meta?.y??0)+55;return <path key={choice.id} d={`M${x} ${y} C ${x+70} ${y},${tx-70} ${ty},${tx} ${ty}`} stroke={choice.points>0?'#18a985':'#f48b64'} strokeWidth="2.5" fill="none" opacity=".72"/>;})}</svg>
          {graph.nodes.map((n)=>{const active=selected===n.id;return <div key={n.id} className={`graph-node ${n.node_type==='result'?'graph-end':''} ${active?'selected':''}`} style={{left:n.meta?.x??0,top:n.meta?.y??0}}>
            <button type="button" className="node-handle" onClick={()=>setSelected(n.id)} onPointerDown={(e)=>{if(!editable)return;drag.current={id:n.id,startX:e.clientX,startY:e.clientY,x:n.meta?.x||0,y:n.meta?.y||0};e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={moveNode} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}>
              <span>{n.node_type==='result'?'AKHIR CERITA':'PESAN'}</span><span>{n.id===graph.entryNodeId?'AWAL':'☷'}</span></button>
            <button type="button" className="node-content" onClick={()=>setSelected(n.id)}><strong>{n.title}</strong><small>{n.message}</small></button>
            <div className="node-foot">{n.node_type==='result'?n.outcome:sceneTypes.find(([m])=>m===n.scene_type)?.[1]||'Chat'}<span>{graph.choices.filter((c)=>c.node_id===n.id).length} jalur</span></div>
          </div>})}</div></div>
      </section>
      <aside className="builder-inspector"><h2>Inspector</h2><p className="inspector-hint">{node?`Mengedit ${node.title}`:'Pilih adegan pada peta.'}</p>{node&&<>
        <label>ID adegan<input disabled value={node.id}/></label>
        <label>Judul<input required disabled={!editable} value={node.title} onChange={(e)=>patchNode({title:e.target.value})} minLength={2} maxLength={150}/></label>
        <label>Pembicara<input required disabled={!editable} value={node.speaker} onChange={(e)=>patchNode({speaker:e.target.value})} minLength={2} maxLength={100}/></label>
        <label>Isi pesan<textarea required disabled={!editable} value={node.message} onChange={(e)=>patchNode({message:e.target.value})} rows={5} minLength={10} maxLength={3000}/></label>
        <label>Jenis tampilan<select disabled={!editable||node.node_type==='result'} value={node.scene_type||'chat'} onChange={(e)=>patchNode({scene_type:e.target.value})}>{sceneTypes.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
        {node.node_type==='result'?<label>Hasil<select disabled={!editable} value={node.outcome} onChange={(e)=>patchNode({outcome:e.target.value})}><option value="safe">Aman</option><option value="recovered">Pemulihan</option><option value="risky">Berisiko</option></select></label>:<>
          <label>Avatar pembicara<select disabled={!editable} value={node.meta?.avatar||'orbit'} onChange={(e)=>patchMeta({avatar:e.target.value})}><option value="orbit">Orbit · Kuning</option><option value="pixel">Pixel · Ungu</option><option value="spark">Spark · Mint</option><option value="shield">Nova · Biru</option></select></label>
          <label>Lampiran fiktif (opsional)<input disabled={!editable} maxLength={120} value={node.meta?.attachment||''} onChange={(e)=>patchMeta({attachment:e.target.value})} placeholder="Contoh: Invoice_FIKTIF.pdf"/></label>
          <div className="inspector-options"><div><h3>Cabang pilihan</h3>{editable&&<button type="button" className="text-link" onClick={addChoice}>+ Tambah pilihan</button>}</div>
            {outgoing.map((c)=><div key={c.id} className="choice-editor"><label>Teks pilihan<input required disabled={!editable} value={c.label} minLength={3} maxLength={220} onChange={(e)=>patchChoice(c.id,{label:e.target.value})}/></label>
              <label>Ke adegan<select disabled={!editable} value={c.next_node_id} onChange={(e)=>patchChoice(c.id,{next_node_id:e.target.value})}>{graph.nodes.filter((target)=>target.id!==selected).map((target)=><option key={target.id} value={target.id}>{target.title}</option>)}</select></label>
              <label>Poin<input disabled={!editable} type="number" min="0" max="100" value={c.points} onChange={(e)=>patchChoice(c.id,{points:Number(e.target.value)})}/></label>
              <label>Evaluasi<textarea required disabled={!editable} minLength={10} maxLength={1000} rows={2} value={c.evaluation} onChange={(e)=>patchChoice(c.id,{evaluation:e.target.value})}/></label>
              {editable&&<button className="text-button danger-text" type="button" onClick={()=>removeChoice(c.id)}>Hapus pilihan</button>}</div>)}
          </div>
        </>}
        {editable&&selected!==graph.entryNodeId&&<button className="text-button danger-text" type="button" onClick={removeNode}>Hapus adegan ini</button>}
        {editable&&<button className="text-button" type="button" onClick={()=>setGraph((g)=>({...g,entryNodeId:selected}))}>Jadikan adegan awal</button>}
      </>}
      </aside>
      <div className="builder-save"><div><strong>{pathWarning?'Periksa graf sebelum menyimpan':'Semua adegan harus menuju ending'}</strong><p>{pathWarning||'Poin tertinggi per jalur maksimal 100. Sistem memvalidasi ulang di server.'}</p></div><button className="button primary" disabled={saving||!editable} type="submit"><Icon name="check"/>{saving?'Menyimpan…':'Simpan graf sebagai draf'}</button></div>
    </form>
    {preview&&<div className="preview-shade" role="presentation" onClick={()=>setPreview(false)}><section className="preview-panel" role="dialog" aria-modal="true" aria-label="Pratinjau cerita" onClick={(e)=>e.stopPropagation()}><div className="preview-heading"><strong>Preview cerita: {form.title||'Tanpa judul'}</strong><button type="button" className="text-button" onClick={()=>setPreview(false)}>Tutup</button></div>
      {live?<><p className="preview-speaker">{live.speaker}</p><p className="preview-message">{live.message}</p>{live.node_type==='result'?<div><strong>Ending: {live.outcome}</strong><button type="button" className="button secondary" onClick={()=>setPreviewNode(graph.entryNodeId)}>Ulangi preview</button></div>:
        <div className="preview-choices">{liveChoices.map((c)=><button key={c.id} type="button" className="reply-button" onClick={()=>setPreviewNode(c.next_node_id)}>{c.label} <Icon name="chevron-right" size={16}/></button>)}</div>}</>:<p>Node tidak ditemukan.</p>}
      <p className="preview-disclaimer">Preview lokal, tidak mengubah nilai peserta.</p></section></div>}
  </div>;
}
