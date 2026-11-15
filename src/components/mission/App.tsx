import React, { useEffect, useMemo, useRef, useState } from 'react';

async function api(action:string, args:any){
  const r = await fetch("/actions",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action,args})});
  const j = await r.json();
  if(!r.ok || j.error) throw new Error(j.error||`Request failed (${r.status})`);
  return j.data;
}
const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms));
type Tab={id:string;title:string;space:string;page:string;fav:string;pinned?:boolean;domain:string};
type Ev={a:string;t:string;page:string;url:string;msg:string;cost?:number;twin?:boolean;g?:number;at?:string;k?:string};
type Agent={n:string;e:string;r:string;cap:string[];lim:number;rep:number;bal:number;sc?:string};

const TH:Record<string,{accent:string;accent2:string;bg:string;glow:string;card:string}> = {
  'Google':{accent:'#4285F4',accent2:'#34A853',bg:'#0B0F19',glow:'rgba(66,133,244,.42)',card:'#131A2A'},
  'Nova Aurora':{accent:'#0358F7',accent2:'#FD02F5',bg:'#070913',glow:'rgba(3,88,247,.42)',card:'#121527'},
  'Midnight Iris':{accent:'#7B61FF',accent2:'#00D4FF',bg:'#0B071A',glow:'rgba(123,97,255,.45)',card:'#171029'},
  'Solar Flare':{accent:'#FA3D1D',accent2:'#FFD400',bg:'#160B08',glow:'rgba(250,61,29,.42)',card:'#211209'},
  'Ocean Glass':{accent:'#00B8C7',accent2:'#5092C7',bg:'#051418',glow:'rgba(0,184,199,.4)',card:'#0B1D25'},
  'Neo Mint':{accent:'#00C48C',accent2:'#A8FF3E',bg:'#07130F',glow:'rgba(0,196,140,.38)',card:'#0F211A'},
  'Cyber Peach':{accent:'#FF6B9D',accent2:'#FFB86B',bg:'#17101A',glow:'rgba(255,107,157,.4)',card:'#221A26'},
  'Mono Chrome':{accent:'#E8E8E8',accent2:'#8A8A8A',bg:'#0A0A0A',glow:'rgba(255,255,255,.22)',card:'#151515'},
  'Dia Sunglow':{accent:'#FFAA00',accent2:'#FF5E9A',bg:'#181008',glow:'rgba(255,170,0,.38)',card:'#241B0C'},
};
const SPACES=[
  {name:'Work',accent:'#4285F4',icon:'💼',desc:'Shipping the browser'},
  {name:'Personal',accent:'#EA4335',icon:'🌸',desc:'Life, music & play'},
  {name:'Research',accent:'#34A853',icon:'🔬',desc:'Agents at work'},
  {name:'Focus',accent:'#FBBC04',icon:'🎯',desc:'One thing at a time'},
];
const APPS:[string,string,string,string,string][]=[
  ['Gmail','✉','#EA4335','inbox','mail.google.com'],['Calendar','📅','#4285F4','cal','calendar.google.com'],['Drive','🔺','#FBBC04','drive','drive.google.com'],['Docs','📄','#4285F4','docs','docs.google.com'],['Sheets','📊','#34A853','sheets','sheets.google.com'],['Meet','🎥','#34A853','meet','meet.google.com'],['Maps','🗺','#EA4335','maps','maps.google.com'],['YouTube','▶','#FF0000','yt','youtube.com'],['Photos','🌼','#FBBC04','photos','photos.google.com'],['Keep','💡','#FBBC04','keep','keep.google.com'],['Translate','🌐','#4285F4','tr','translate.google.com'],['Search','🔍','#4285F4','srch','google.com'],['Slides','🎞','#FBBC04','slides','slides.google.com'],['Forms','📝','#8B5CF6','forms','forms.google.com'],['News','📰','#4285F4','news','news.google.com'],['Chat','💬','#34A853','chat','chat.google.com'],
];
const PINNED=APPS.slice(0,12);
const AG:Record<string,Agent>={
  orch:{n:'Nova Prime',e:'🦄',r:'Orchestrator',cap:['plan','delegate','recover'],lim:.5,rep:99,bal:1},
  scout:{n:'Scout Fox',e:'🦊',r:'Browser recon',cap:['browse','extract','tabs'],lim:.5,rep:96,bal:.5},
  ana:{n:'Professor Octo',e:'🐙',r:'Analyst',cap:['compare','rank','cite'],lim:.5,rep:94,bal:.5},
  sent:{n:'Sentinel Owl',e:'🦉',r:'Policy guard',cap:['approve','block','audit'],lim:0,rep:100,bal:0},
  buy:{n:'Bee Buyer',e:'🐝',r:'x402 payments',cap:['pay','vault','receipt'],lim:5,rep:97,bal:5},
  scr:{n:'Scribe Turtle',e:'🐢',r:'Workspace: Drive, Docs, Calendar, Gmail',cap:['drive','docs','calendar','email'],sc:'drive.file · docs.create · calendar.events · gmail.send',lim:.5,rep:95,bal:.5},
};
const STEPS:Ev[]=[
  {a:'orch',t:'plan',page:'home',url:'agenet://mission-control',msg:'Split the mission into 4 tasks and spawned Scout, Octo, Bee and Scribe.'},
  {a:'scout',t:'act',page:'search',url:'mcpserver.in/search?q=postgres',msg:'Opened the registry and searched “postgres mcp server”.'},
  {a:'scout',t:'act',page:'search',url:'mcpserver.in/search?q=postgres',msg:'Read 12 listings in parallel tabs: license, uptime, price.'},
  {a:'ana',t:'think',page:'repo',url:'mcpserver.in/s/pg-mcp-gateway',msg:'Ranked all 12. Winner: pg-mcp-gateway (MIT, 99.9% uptime, 2 USDC).'},
  {a:'sent',t:'gate',page:'pay',url:'mcpserver.in/s/pg-mcp-gateway/buy',msg:'2.00 USDC is above the 1.00 auto-approve policy. Human checkpoint required.'},
  {a:'buy',t:'pay',page:'pay',url:'mcpserver.in/s/pg-mcp-gateway/buy',cost:2,msg:'Server replied HTTP 402. Signed an x402 payment of 2.00 USDC.'},
  {a:'buy',t:'act',page:'done',url:'mcpserver.in/keys/new',msg:'API key received. Stored in the vault, never shown to a model.'},
  {a:'sent',t:'gate',k:'oauth',page:'drive',url:'accounts.google.com/consent (simulated)',msg:'Scribe Turtle needs Google Workspace access. A consent screen was shown to you.'},
  {a:'scr',t:'act',g:1,page:'drive',url:'drive.google.com/drive/my-drive',msg:'Saved the receipt to Drive as “MCP key receipt”.'},
  {a:'scr',t:'act',g:1,page:'docs',url:'docs.google.com/document/d/mission-summary',msg:'Wrote the mission summary in Docs.'},
  {a:'scr',t:'act',g:1,page:'cal',url:'calendar.google.com/r/eventedit',msg:'Added “Review API key rotation” to Calendar for next month.'},
  {a:'scr',t:'act',g:1,page:'mail',url:'mail.google.com/mail/u/0/#compose',msg:'Emailed you the summary with the receipt and the Docs link.'},
  {a:'orch',t:'done',page:'done',url:'agenet://receipt',msg:'Mission complete. Receipt hash '},
];
const POS:Record<string,[number,number]>={home:[38,45],search:[30,55],repo:[62,35],pay:[55,62],done:[45,32],mail:[50,45],github:[40,40],drive:[45,50],docs:[45,45],cal:[50,40],inbox:[40,45]};
const TRD:Record<string,Record<string,string>>={'hello':{hi:'नमस्ते',es:'hola',fr:'bonjour'},'thank you':{hi:'धन्यवाद',es:'gracias',fr:'merci'},'good morning':{hi:'सुप्रभात',es:'buenos días',fr:'bonjour'}};

const did=(k:string)=>{let h=7;for(const c of 'agenet'+k)h=(h*33+c.charCodeAt(0))>>>0;return 'did:agenet:z6Mk'+h.toString(36).padStart(7,'0')};
function TranslateWidget(){
  const [val,setVal]=useState(''); const [lang,setLang]=useState('hi'); const [out,setOut]=useState('Try: hello, thank you, good morning');
  return <div className="mt-2 flex flex-wrap gap-2">
    <input value={val} onChange={e=>setVal(e.target.value)} placeholder="hello" className="flex-1 min-w-[110px] bg-white/10 border border-white/10 rounded-full px-3 py-2.5 text-sm min-h-[44px]"/>
    <select value={lang} onChange={e=>setLang(e.target.value)} className="bg-white/10 border border-white/10 rounded-full px-2 text-sm min-h-[44px]"><option value="hi">Hindi</option><option value="es">Spanish</option><option value="fr">French</option></select>
    <button onClick={()=>setOut((TRD[val.trim().toLowerCase()]?.[lang])||'Demo supports: hello, thank you, good morning')} className="px-4 rounded-full text-white text-sm font-bold min-h-[44px]" style={{background:'var(--accent)'}}>Go</button>
    <output className="w-full text-sm text-white/70">{out}</output>
  </div>;
}
const row=(a:string,b:string,c?:string)=><div className="flex gap-3 items-center bg-white/5 rounded-xl p-2.5 mt-2 text-sm"><span className="text-lg">{a}</span><span className="flex-1 min-w-0 truncate">{b}</span><span className="text-xs text-white/45 shrink-0">{c||''}</span></div>;
const W=(t:string,b:React.ReactNode)=><div className="glass rounded-[22px] p-4 min-w-0"><b className="text-sm">{t}</b>{b}</div>;
const pgx=(t:string,b:React.ReactNode)=><div className="p-4 sm:p-8 max-w-[900px] mx-auto"><h2 className="text-2xl font-bold">{t}</h2>{b}</div>;
const hl=(c:boolean,t:string)=><div className="glass rounded-2xl p-3 mt-2 text-sm" style={c?{borderColor:'var(--accent)'}:undefined}>{t}</div>;

export default function App(){
  const [theme,setTheme]=useState('Google');
  const [dark,setDark]=useState(true);
  const [space,setSpace]=useState('Work');
  const [sidebar,setSidebar]=useState(true);
  const [zen,setZen]=useState(false);
  const [focusMode,setFocusMode]=useState(false);
  const [split,setSplit]=useState(1);
  const [rtab,setRtab]=useState<'mission'|'rec'|'set'>('mission');
  const [twin,setTwin]=useState(false);
  const [active,setActive]=useState('t1');
  const [tabs,setTabs]=useState<Tab[]>([
    {id:'t1',title:'New Tab',space:'Work',page:'home',fav:'✦',pinned:true,domain:'agentic://new-tab'},
    {id:'t2',title:'agentic-browser · GitHub',space:'Work',page:'github',fav:'🐙',domain:'github.com/agentic-browser'},
    {id:'t3',title:'Inbox',space:'Personal',page:'inbox',fav:'✉',domain:'mail.google.com'},
    {id:'t4',title:'New Tab',space:'Research',page:'home',fav:'✦',domain:'agentic://new-tab'},
    {id:'t5',title:'New Tab',space:'Focus',page:'home',fav:'✦',domain:'agentic://new-tab'},
  ]);
  const [ev,setEv]=useState<Ev[]>([]);
  const [view,setView]=useState<number|null>(null);
  const [running,setRunning]=useState(false);
  const [missions,setMissions]=useState(0);
  const [toasts,setToasts]=useState<{id:number;msg:string}[]>([]);
  const [missionInput,setMissionInput]=useState('Find the best Postgres MCP server and buy API access');
  const [tq,setTq]=useState('');
  const [hq,setHq]=useState('');
  const [paletteOpen,setPaletteOpen]=useState(false);
  const [paletteQ,setPaletteQ]=useState('');
  const [launcherOpen,setLauncherOpen]=useState(false);
  const [passportId,setPassportId]=useState<string|null>(null);
  const [gate,setGate]=useState<null|'pay'|'oauth'>(null);
  const [settings,setSettings]=useState({breathing:true,trackers:true,autonap:true});
  const [tasks,setTasks]=useState<{id:string;text:string;done:boolean;recordId?:string}[]>([
    {id:'task-1',text:'Rehearse the demo',done:false},{id:'task-2',text:'Record a 60 s video',done:false},{id:'task-3',text:'Submit the project',done:false},
  ]);
  const [keep,setKeep]=useState<{id:string;text:string;recordId?:string}[]>([
    {id:'keep-1',text:'Pitch: agents that browse, pay and answer to you'},
    {id:'keep-2',text:'Ask judges what they would want to approve'},
  ]);
  const [keepInput,setKeepInput]=useState('');
  const [apiStatus,setApiStatus]=useState('');
  const gateResolve=useRef<((v:boolean)=>void)|null>(null);
  const toastId=useRef(0);
  const t0Ref=useRef(Date.now());

  const K = view===null ? ev.length : view;
  const CUR = ev[K-1];
  const th = TH[theme];
  const spent=(k:number,id?:string)=>ev.slice(0,k).reduce((s,e)=>s+(e.cost&&!e.twin&&(!id||e.a===id)?e.cost:0),0);
  const hsh=()=>{let h=5381;for(const e of ev)for(const c of e.msg)h=((h<<5)+h+c.charCodeAt(0))>>>0;return '0x'+h.toString(16).padStart(8,'0')};

  function toast(m:string){const id=++toastId.current; setToasts(t=>[...t,{id,msg:m}]); setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),3200);}
  function push(s:Ev,x?:Partial<Ev>){ setEv(prev=>[...prev,{...s,...x,at:((Date.now()-t0Ref.current)/1000).toFixed(1)}]); setView(null); }

  useEffect(()=>{
    (async()=>{
      try{
        const [k,t]=await Promise.all([api('records.list',{collection:'keep_notes'}), api('records.list',{collection:'tasks'})]);
        if(k.records?.length) setKeep(k.records.map((r:any)=>({id:r.value.id||r.id,text:r.value.text,recordId:r.id})));
        if(t.records?.length) setTasks(t.records.map((r:any)=>({id:r.value.id||r.id,text:r.value.text,done:!!r.value.done,recordId:r.id})));
        setApiStatus('Saved');
      }catch{ setApiStatus('Offline — changes stay in this session'); }
    })();
  },[]);
  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{ if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault(); setPaletteOpen(v=>!v);} if(e.key==='Escape'){setPaletteOpen(false); setLauncherOpen(false); setPassportId(null);} };
    window.addEventListener('keydown',h); return ()=>window.removeEventListener('keydown',h);
  },[]);
  useEffect(()=>{
    const r=document.documentElement; const bg = dark? th.bg : '#F2F3F8';
    r.style.setProperty('--accent',th.accent); r.style.setProperty('--accent2',th.accent2); r.style.setProperty('--bg',bg);
    r.style.setProperty('--card', dark? th.card : '#FFFFFF'); r.style.setProperty('--glow',th.glow);
    r.style.setProperty('--muted', dark? '#9AA0BC':'#66708A'); r.style.setProperty('--text', dark? '#F4F5FF':'#11182E');
    document.documentElement.style.background=bg;
  },[theme,dark,th]);

  const spaceTabs=()=>tabs.filter(t=>t.space===space);
  function goSpace(n:string){ setSpace(n); const f=tabs.filter(t=>t.space===n)[0]; if(f) setActive(f.id); toast('Space switched to '+n); }
  function closeTab(id:string){
    const filtered=tabs.filter(t=>t.id!==id);
    let next=filtered;
    if(!filtered.filter(t=>t.space===space).length) next=[...filtered,{id:'n'+Date.now(),title:'New Tab',space,page:'home',fav:'✦',domain:'agentic://new-tab'}];
    setTabs(next);
    if(active===id){ const f=next.filter(t=>t.space===space)[0]; if(f) setActive(f.id); }
    toast('Tab closed');
  }
  function openPage(title:string,pg:string,dom:string){
    const id='o'+Date.now(); setTabs(t=>[...t,{id,title,space,page:pg,fav:(APPS.find(a=>a[0]===title)||[0,'✦'])[1],domain:dom}]); setActive(id); toast('Opened '+title);
  }
  function hsearch(){ const q=(hq||'').trim()||'agentic browsers'; openPage('Search: '+q.slice(0,18),'srch','google.com/search?q='+encodeURIComponent(q)); }
  function goMission(){ setRtab('mission'); }
  async function addKeep(v?:string){
    const text=(v??keepInput).trim(); if(!text) return; const id=`keep-${Date.now()}`;
    setKeep(k=>[{id,text},...k]);
    setKeepInput(''); toast('Note added to Keep');
    try{ const rec=await api('records.create',{collection:'keep_notes',value:{id,text,done:false},idempotency_key:`keep-${id}`}); setKeep(k=>k.map(x=>x.id===id?{...x,recordId:rec.id}:x)); setApiStatus('Saved'); }catch{ setApiStatus('Offline — changes stay in this session'); }
  }
  async function togTask(i:number){
    const t=tasks[i]; if(!t) return; const next=!t.done;
    setTasks(v=>v.map((x,idx)=>idx===i?{...x,done:next}:x));
    try{
      if(t.recordId) await api('records.replace',{collection:'tasks',id:t.recordId,value:{id:t.id,text:t.text,done:next}});
      else { const rec=await api('records.create',{collection:'tasks',value:{id:t.id,text:t.text,done:next},idempotency_key:`task-${t.id}`}); setTasks(v=>v.map(x=>x.id===t.id?{...x,recordId:rec.id}:x)); }
      setApiStatus('Saved');
    }catch{ setApiStatus('Offline — changes stay in this session'); }
  }

  async function run(){
    if(running) return; setRunning(true); setEv([]); setView(null); t0Ref.current=Date.now(); setMissions(m=>m+1);
    let ag=tabs.find(t=>t.id==='agent');
    if(!ag){ ag={id:'agent',title:'Agent session',space:'Research',page:'home',fav:'🦊',domain:'agenet://mission'}; setTabs(prev=>[...prev,ag!]); }
    setSpace('Research'); setActive('agent'); setRtab('mission');
    let noG=0;
    for(const s of STEPS){
      await sleep(1000);
      if(s.t==='gate'){
        push(s);
        const ok=await new Promise<boolean>(r=>{ gateResolve.current=r; setGate(s.k==='oauth'?'oauth':'pay'); });
        setGate(null); gateResolve.current=null;
        if(s.k==='oauth'){
          if(ok) push({a:'sent',t:'act',page:'drive',url:s.url,msg:'You allowed Drive, Docs, Calendar and Gmail send, limited to items this mission creates.'});
          else { noG=1; push({a:'sent',t:'deny',page:'drive',url:s.url,msg:'You denied Google access. Scribe Turtle will skip Drive, Docs, Calendar and Gmail.'}); }
          continue;
        }
        if(!ok){ push({a:'sent',t:'deny',page:'pay',url:s.url,msg:'Human denied the payment. Bee Buyer and Scribe stood down.'}); await sleep(900); push({a:'orch',t:'done',page:'home',url:'agenet://receipt',msg:'Mission stopped by human. No funds moved. Receipt hash '+hsh()}); break; }
        push({a:'sent',t:'act',page:'pay',url:s.url,msg:'Human approved. Released the spend limit for this one payment.'}); continue;
      }
      if(s.g){ if(noG) continue; if(twin){ push({...s,twin:true,msg:'[Twin] Would have: '+s.msg}); continue; } }
      if(s.t==='pay'&&twin){ push({...s,twin:true,msg:'[Twin] Simulated the 402 and signature. No funds moved.'}); continue; }
      push(s.t==='done'?{...s,msg:s.msg+hsh()+'.'}:s);
    }
    setRunning(false);
  }

  const scribeDone = ev.slice(0,K).some(e=>e.a==='scr');
  const driveHasReceipt = ev.slice(0,K).some(e=>e.a==='scr'&&e.page==='drive');



  function pageContent(tab:Tab){
    const isAgent=tab.id==='agent'; const e=isAgent?CUR:null; const p=isAgent?(e?e.page:'home'):tab.page;
    if(p==='home') return <div className="p-4 sm:p-7 max-w-[980px] mx-auto">
      <div className="flex flex-wrap items-center gap-2 mb-4 text-sm"><span className="glass px-3 py-1.5 rounded-full">{new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'})}</span><span className="glass px-3 py-1.5 rounded-full">⛅ 31° · demo</span><span className="glass px-3 py-1.5 rounded-full">📅 Demo day rehearsal · 4:00 PM</span></div>
      <div className="relative overflow-hidden rounded-[28px] p-5 sm:p-8" style={{background:'linear-gradient(120deg,#4285F4,#8AB4F8,#E8F0FE,#FBBC04,#EA4335,#34A853)',color:'#0A0A0A'}}><div className="grain absolute inset-0 opacity-20"/><div className="relative"><span className="text-xs font-bold bg-black/15 px-2.5 py-1 rounded-full">HOME • AGENTS ONLINE</span><h1 className="text-[clamp(30px,6vw,58px)] leading-[0.95] font-bold mt-4">Touch grass.<br/>But faster.</h1><p className="mt-3 max-w-[520px] font-medium text-black/70">Your agents browse, pay and write. You approve the risky bits — in one breathing window.</p>
      <div className="flex flex-wrap gap-2 mt-5"><input value={hq} onChange={e=>setHq(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')hsearch()}} placeholder="Search or ask an agent…" className="flex-1 min-w-[200px] bg-white/90 rounded-full px-4 py-3 text-sm text-black placeholder:text-black/50 min-h-[44px]"/><button onClick={()=>toast('Voice search (demo)')} className="bg-white/90 text-black w-11 h-11 rounded-full" aria-label="Voice search">🎤</button><button onClick={()=>toast('Lens (demo)')} className="bg-white/90 text-black w-11 h-11 rounded-full" aria-label="Search by image">📷</button><button onClick={hsearch} className="bg-white/90 text-black px-5 py-3 rounded-full text-sm font-bold min-h-[44px]">Search</button><button onClick={goMission} className="bg-black text-white px-5 py-3 rounded-full text-sm font-bold min-h-[44px]">Ask agents →</button></div></div></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">{[['Agents online','6 of 100'],['Missions run',String(missions)],['USDC spent',spent(ev.length).toFixed(2)],['Human gates',String(ev.filter(x=>x.t==='gate').length)]].map(x=><div key={x[0]} className="glass p-4 rounded-2xl"><div className="text-2xl font-bold">{x[1]}</div><div className="text-xs text-white/50 mt-1">{x[0]}</div></div>)}</div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3 mt-4">
        {W('Weather · your city (demo)',<div className="flex items-center gap-3 mt-2"><span className="text-4xl">⛅</span><span><b className="text-2xl block">31°</b><span className="text-xs text-white/50">Partly cloudy · H 33° L 26°</span></span></div>)}
        {W('Calendar',<>{row('📅','Demo day rehearsal','4:00 PM')}{row('📅','Pitch review','Tomorrow')}<button onClick={()=>toast('Scribe Turtle will prep notes (demo)')} className="text-xs glass px-3 py-2 rounded-full mt-3 min-h-[44px]">🐢 Prep with an agent</button></>)}
        {W('Tasks',<>{tasks.map((t,i)=><button key={t.id} onClick={()=>togTask(i)} className="w-full flex gap-2 items-center text-left text-sm mt-2 min-h-[44px]"><span className="w-5 h-5 rounded-md border grid place-items-center shrink-0" style={{background:t.done?'var(--accent)':'transparent'}}>{t.done?'✓':''}</span><span className={t.done?'line-through opacity-50':''}>{t.text}</span></button>)}<span className="block text-xs text-white/40 mt-2">{apiStatus}</span></>)}
        {W('Keep',<>{keep.slice(0,2).map((n,i)=><div key={n.id} className="rounded-xl p-2.5 text-xs text-black mt-2" style={{background:['#FFF475','#CCFF90'][i]}}>{n.text}</div>)}<button onClick={()=>openPage('Keep','keep','keep.google.com')} className="text-xs glass px-3 py-2 rounded-full mt-3 min-h-[44px]">Open Keep →</button></>)}
        {W('Drive · recent',<>{row('📄','Pitch script','2m')}{row('📊','Budget','1h')}{row('🎞','Demo deck','Mon')}</>)}
        {W('Translate',<TranslateWidget/>)}
        {W('Discover',<>{row('📰','Browser agents go mainstream','news')}{row('📰','Why humans stay in the loop','news')}</>)}
        {W('Agents on call',<><div className="flex flex-wrap gap-2 mt-2">{Object.values(AG).map(a=><span key={a.n} className="text-xl" title={a.n}>{a.e}</span>)}</div><button onClick={goMission} className="text-xs glass px-3 py-2 rounded-full mt-3 min-h-[44px]">Delegate a mission →</button></>)}
        {W('Meet',row('🎥','Standup with agents','10:00'))}
      </div>
    </div>;
    if(p==='github') return <div className="p-4 sm:p-8 max-w-[940px] mx-auto"><div className="flex items-center gap-2"><span className="text-3xl">🐙</span><h1 className="text-2xl sm:text-3xl font-bold">agentic / <span style={{color:'var(--accent)'}}>browser</span></h1><span className="text-xs border rounded-full px-2 py-1">Public</span></div><p className="text-white/65 mt-2 max-w-[620px]">Arc’s sidebar + Dia’s polish, with agents that browse, pay and answer to you.</p><div className="grid sm:grid-cols-4 gap-3 mt-5">{[['Rust','Core'],['x402','Payments'],['DID','Identity'],['Replay','Audit']].map(x=><div key={x[0]} className="glass p-3 rounded-2xl"><div className="font-bold">{x[0]}</div><div className="text-xs text-white/50">{x[1]}</div></div>)}</div></div>;
    if(p==='search') return pgx('Registry results',<>{hl(false,'pg-mcp-gateway · MIT · 99.9% uptime · 2 USDC')}{hl(false,'sql-bridge · Apache-2.0 · 98.1% uptime · 5 USDC')}{hl(false,'dbmcp-lite · GPL-3.0 · 95% uptime · free')}</>);
    if(p==='repo') return pgx('pg-mcp-gateway',<>{hl(true,'Ranked first of 12 on license, uptime and price.')}{hl(false,'Hosted gateway, India-first region, 40 ms median latency.')}</>);
    if(p==='pay') return pgx('Checkout · HTTP 402',<>{hl(true,'Payment required: 2.00 USDC (x402)')}{hl(false, e&&e.t==='pay'?(e.twin?'Digital Twin: signature simulated only.':'Signed and sent from Bee Buyer’s wallet.'):'Waiting for a signature.')}</>);
    if(p==='mail') return pgx('Compose',<>{hl(true,'To: you · Subject: Mission receipt')}{hl(false,'Summary, chosen server, cost and receipt hash attached.')}</>);
    if(p==='inbox') return pgx('Inbox',<>{row('✉','Mission receipt — Scribe Turtle','now')}{row('📅','Invitation: Demo day rehearsal','9:00')}{row('🧾','Your x402 receipt (simulated)','Yesterday')}{row('🔔','Security alert: new sign-in blocked','Mon')}</>);
    if(p==='cal') return pgx('Calendar · This week',<>{scribeDone && <div className="glass rounded-2xl p-3 mt-2 text-sm" style={{borderLeft:'4px solid #FBBC04'}}><b>Review API key rotation (added by Scribe Turtle)</b><div className="text-xs text-white/50">Next month · 10:00 AM</div></div>}{[['Demo day rehearsal','Today 4:00 PM','#4285F4'],['Pitch review with mentors','Tomorrow 11:00 AM','#EA4335'],['Submit the project','Friday 6:00 PM','#34A853']].map(x=><div key={x[0]} className="glass rounded-2xl p-3 mt-2 text-sm" style={{borderLeft:`4px solid ${x[2]}`}}><b>{x[0]}</b><div className="text-xs text-white/50">{x[1]}</div></div>)}</>);
    if(p==='drive') return pgx('Drive',<div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">{driveHasReceipt && <div className="glass rounded-2xl p-4 text-center text-sm"><div className="text-3xl">✅</div>MCP key receipt (new)</div>}{[['📄','Pitch script'],['📊','Budget'],['🎞','Demo deck'],['📁','Receipts'],['📄','Judging notes'],['🖼','Logo options']].map(x=><div key={x[1]} className="glass rounded-2xl p-4 text-center text-sm"><div className="text-3xl">{x[0]}</div>{x[1]}</div>)}</div>);
    if(p==='docs') return scribeDone ? pgx('Mission summary',<div className="glass rounded-2xl p-5 mt-4 text-sm leading-7" style={{borderColor:'var(--accent)'}}>Goal: find the best Postgres MCP server and buy API access.<br/>Chosen: pg-mcp-gateway (MIT, 99.9% uptime).<br/>Spent: {spent(K).toFixed(2)} USDC, approved by you.<br/>Written by Scribe Turtle.</div>) : pgx('Pitch script',<div className="glass rounded-2xl p-5 mt-4 text-sm leading-7 text-white/80">Agents that browse, pay and answer to you.<br/>1. Launch a mission.<br/>2. Watch Scout Fox read the registry.<br/>3. Approve the payment at the checkpoint.<br/>4. Rewind the whole mission in Replay.</div>);
    if(p==='sheets') return pgx('Budget',<div className="overflow-x-auto mt-4"><table className="w-full text-sm glass rounded-2xl overflow-hidden"><thead><tr className="bg-white/10"><th className="p-2 text-left">Item</th><th className="p-2">USDC</th><th className="p-2">Gate</th></tr></thead><tbody>{[['MCP key','2.00','Human'],['Search API','0.40','Auto'],['Translate','0.10','Auto']].map(r=><tr key={r[0]}><td className="p-2">{r[0]}</td><td className="p-2 text-center mono">{r[1]}</td><td className="p-2 text-center">{r[2]}</td></tr>)}</tbody></table></div>);
    if(p==='meet') return pgx('Meet',<><p className="text-sm text-white/60 mt-1">Start a meeting with your agents.</p><div className="flex flex-wrap gap-2 mt-4">{Object.values(AG).map(a=><span key={a.n} className="glass px-3 py-2 rounded-full text-sm">{a.e} {a.n}</span>)}</div><button onClick={()=>toast('Meeting started (demo)')} className="mt-4 px-5 py-2.5 rounded-full text-white text-sm font-bold min-h-[44px]" style={{background:'var(--accent)'}}>New meeting</button></>);
    if(p==='maps') return pgx('Maps',<><p className="text-sm text-white/60 mt-2">A map is not available.</p><div className="glass rounded-2xl p-4 mt-4"><b className="text-sm">Saved places</b>{row('📍','Demo location — saved in this prototype','Simulated')}{row('🏁','Demo destination — saved in this prototype','Simulated')}<button onClick={()=>toast('Directions are simulated in this demo')} className="mt-3 px-4 py-2.5 rounded-full text-sm font-bold glass min-h-[44px]">Get directions (demo)</button></div></>);
    if(p==='yt') return pgx('Watch next',<div className="grid sm:grid-cols-2 gap-4 mt-4">{[['How agents pay with x402','linear-gradient(135deg,#4285F4,#34A853)'],['Browser agents, explained','linear-gradient(135deg,#EA4335,#FBBC04)'],['Human-in-the-loop AI','linear-gradient(135deg,#8B5CF6,#4285F4)'],['Demo day tips','linear-gradient(135deg,#FBBC04,#EA4335)']].map(v=><div key={v[0]}><div className="h-32 rounded-2xl grid place-items-center text-3xl" style={{background:v[1]}}>▶</div><b className="block mt-2 text-sm">{v[0]}</b></div>)}</div>);
    if(p==='photos') return pgx('Photos',<div className="grid grid-cols-3 gap-2 mt-4">{['#4285F4','#EA4335','#FBBC04','#34A853','#8B5CF6','#FF6B9D'].map(c=><div key={c} className="h-24 rounded-xl" style={{background:`linear-gradient(135deg,${c},#E8F0FE)`}}/>)}</div>);
    if(p==='keep') return pgx('Keep',<><div className="flex gap-2 mt-3"><input value={keepInput} onChange={e=>setKeepInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')addKeep()}} placeholder="Take a note…" className="flex-1 min-w-0 bg-white/10 border border-white/10 rounded-full px-4 py-2.5 text-sm min-h-[44px]"/><button onClick={()=>addKeep()} className="px-4 rounded-full text-white text-sm font-bold min-h-[44px]" style={{background:'var(--accent)'}}>Add</button></div><div className="grid sm:grid-cols-2 gap-3 mt-4">{keep.map((n,i)=><div key={n.id} className="rounded-2xl p-3 text-sm text-black" style={{background:['#FFF475','#CCFF90','#A7FFEB','#CBF0F8'][i%4]}}>{n.text}</div>)}</div><p className="text-xs text-white/40 mt-2">{apiStatus}</p></>);
    if(p==='tr') return pgx('Translate',<TranslateWidget/>);
    if(p==='srch') return pgx(`Results for “${hq||'agentic browsers'}”`,<><p className="text-xs text-white/40">Simulated results</p>{row('🔗','agent-browser — browser automation CLI for AI agents','github.com')}{row('🔗','x402 — HTTP-native payments','docs')}{row('🔗','Human-in-the-loop agent design','article')}</>);
    if(['slides','forms','news','chat'].includes(p)) return pgx(p[0].toUpperCase()+p.slice(1),<>{row('•','Sample item one','today')}{row('•','Sample item two','yesterday')}{row('•','Sample item three','Mon')}</>);
    return pgx(e&&e.t==='done'?'Mission complete':'API key issued',hl(true,e&&e.t==='done'?'Every step is in the flight recorder. Open the Recorder tab and drag to rewind.':'Key stored in the vault. Models only see a handle.'));
  }

  const panes=useMemo(()=>{
    const sp=spaceTabs(); const act=tabs.find(t=>t.id===active)||sp[0]; if(!act) return [];
    const i0=Math.max(0,sp.findIndex(t=>t.id===act.id)); const out:Tab[]=[]; for(let i=0;i<split;i++) out.push(sp[(i0+i)%sp.length]); return out;
  },[tabs,active,space,split]);

  function runPaletteItem(item:typeof paletteItems[number]){
    if(item.kind==='tab'){
      const tab=tabs.find(t=>t.id===item.key);
      if(tab){setSpace(tab.space); setActive(tab.id);}
      return;
    }
    switch(item.key){
      case 'launch': goMission(); void run(); break;
      case 'zen': setZen(v=>!v); toast('Zen mode toggled'); break;
      case 'theme': {const k=Object.keys(TH); setTheme(k[(k.indexOf(theme)+1)%k.length]); toast('Theme changed'); break;}
      case 'split': setSplit(2); toast('2 panes — split view'); break;
      case 'rec': setRtab('rec'); toast('Recorder opened'); break;
    }
  }

  const commands=[
    ['Launch mission','launch'],['Toggle Zen Mode','zen'],['Next theme','theme'],
    ['Split View — 2 panes','split'],['Open Recorder','rec'],
  ] as [string,string][];
  // Render only serializable metadata. Execute callbacks from user events, not render-time filters.
  const paletteItems=[
    ...commands.filter(x=>x[0].toLowerCase().includes(paletteQ.toLowerCase()))
      .map(([title,key])=>({title,key,kind:'command' as const})),
    ...tabs.filter(t=>t.title.toLowerCase().includes(paletteQ.toLowerCase()))
      .map(t=>({title:t.title,key:t.id,kind:'tab' as const})),
  ];

  const bgStyle = dark? th.bg : '#F2F3F8';
  const panelBg = dark? 'rgba(255,255,255,.035)' : 'rgba(255,255,255,.7)';

  return <div data-safe-area-inset-root style={{boxSizing:'border-box',paddingTop:'var(--safe-area-inset-top)',minHeight:'100vh',background:bgStyle,color:dark?'#F4F5FF':'#11182E'}} className="overflow-x-clip relative">
    {settings.breathing && !zen && <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden"><div className="breathe absolute -top-[180px] left-[8%] w-[520px] h-[520px] rounded-full blur-[110px] opacity-50" style={{background:'conic-gradient(from 0deg,#4285F4,#8AB4F8,#E8F0FE,#FBBC04,#EA4335,#34A853,#4285F4)'}}/><div className="breathe absolute bottom-[-140px] right-[2%] w-[420px] h-[420px] rounded-full blur-[100px] opacity-30" style={{background:'linear-gradient(120deg,#EA4335,#4285F4,#FBBC04)'}}/></div>}
    <div className="relative z-10 flex flex-col min-h-[100dvh]">
      <header data-safe-area-sticky-top style={{top:'var(--safe-area-inset-top)'}} className="sticky z-40 flex items-center gap-2 px-3 sm:px-4 py-2 border-b border-white/10 flex-wrap" >
        <div className="flex gap-1.5 shrink-0"><span className="w-3 h-3 rounded-full bg-[#FF5F57]"/><span className="w-3 h-3 rounded-full bg-[#FEBC2E]"/><span className="w-3 h-3 rounded-full bg-[#28C840]"/></div>
        <button onClick={()=>setSidebar(v=>!v)} className="hidden sm:grid w-11 h-11 place-items-center rounded-lg hover:bg-white/10" aria-label="Toggle sidebar">▥</button>
        <div className="min-w-0"><div className="font-bold truncate text-[14px] sm:text-[15px]"><span style={{color:'#4285F4'}}>●</span><span style={{color:'#EA4335'}}>●</span><span style={{color:'#FBBC04'}}>●</span><span style={{color:'#34A853'}}>●</span> Google Agentic Browser</div><div className="text-[11px] text-white/45 hidden sm:block">Concept demo • not an official Google product • simulated pages and payments</div></div>
        <div className="ml-auto flex flex-wrap items-center gap-1">
          <button onClick={()=>{setSplit(s=>s===1?2:1); toast(split===1?'2 panes — split view':'Single pane');}} className="px-3 py-2 rounded-full text-xs glass min-h-[44px]">Split View</button>
          <button onClick={goMission} className="px-3 py-2 rounded-full text-xs text-white min-h-[44px]" style={{background:'var(--accent)'}}>✦ Agents</button>
          <button onClick={()=>{setFocusMode(v=>!v); toast(focusMode?'Focus mode off':'Focus mode on — distractions dimmed');}} className="px-3 py-2 rounded-full text-xs glass min-h-[44px]">Focus 🎯</button>
          <button onClick={()=>{setZen(v=>!v); toast(zen?'Zen mode off':'Zen mode on');}} className="px-3 py-2 rounded-full text-xs glass min-h-[44px]">Zen 🌙</button>
          <button onClick={()=>setRtab('set')} className="px-3 py-2 rounded-full text-xs glass min-h-[44px]">Settings</button>
          <button onClick={()=>setLauncherOpen(true)} className="px-3 py-2 rounded-full text-xs glass min-h-[44px]" aria-label="Google apps" title="Google apps">⠿</button>
          <button onClick={()=>setPaletteOpen(true)} className="px-3 py-2 rounded-full text-xs text-black font-bold min-h-[44px]" style={{background:'var(--warn)'}}>⌘K</button>
        </div>
      </header>
      <div className="gbar h-[3px] w-full" style={{background:'linear-gradient(90deg,#4285F4,#EA4335,#FBBC04,#34A853,#4285F4)',opacity:running?1:0,transition:'opacity .3s'}}/>

      <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
        {!zen && sidebar && <aside className="w-[268px] lg:w-[288px] shrink-0 hidden md:flex flex-col border-r border-white/10 p-3 gap-3 overflow-y-auto" style={{background:panelBg}}>
          <div><button onClick={()=>setPaletteOpen(true)} className="w-full glass rounded-2xl px-3 py-2.5 flex items-center gap-2 text-left min-h-[44px]">🔍<input value={tq} onChange={e=>setTq(e.target.value)} onClick={e=>e.stopPropagation()} placeholder="Search tabs, actions…  ⌘K" className="bg-transparent flex-1 min-w-0 text-sm placeholder:text-white/40"/><kbd className="text-[10px] border border-white/20 rounded px-1.5 py-0.5">⌘K</kbd></button>
            <div className="flex items-center justify-between mt-4 px-1"><b className="text-xs tracking-widest text-white/50">SPACES</b><button onClick={()=>toast('New space created — Space 5')} className="text-xs px-2 py-2 rounded-full bg-white/10 min-h-[44px]">+ New Space</button></div>
            <div className="grid grid-cols-4 gap-1.5 mt-2">{SPACES.map(s=><button key={s.name} onClick={()=>goSpace(s.name)} className="rounded-2xl p-2 text-center border transition min-h-[52px]" style={{borderColor:space===s.name?s.accent:'rgba(255,255,255,.08)',background:space===s.name?s.accent+'22':'rgba(255,255,255,.03)'}}><div className="text-xl">{s.icon}</div><div className="text-[11px] font-bold mt-1">{s.name}</div></button>)}</div>
            <div className="text-[11px] text-white/45 px-1 mt-2">{SPACES.find(s=>s.name===space)?.desc} • {spaceTabs().length} tabs</div>
          </div>
          <div><div className="flex justify-between px-1"><b className="text-xs tracking-widest text-white/50">PINNED</b><span className="text-xs text-white/40">12 apps</span></div><div className="grid grid-cols-4 gap-2 mt-2">{PINNED.map(p=><button key={p[0]} onClick={()=>openPage(p[0],p[3],p[4])} className="rounded-2xl p-2 glass text-center hover:-translate-y-0.5 transition min-h-[52px]"><div className="w-9 h-9 mx-auto rounded-xl grid place-items-center text-lg" style={{background:p[2]+'28',border:`1px solid ${p[2]}55`}}>{p[1]}</div><div className="text-[11px] mt-1.5 truncate">{p[0]}</div></button>)}</div></div>
          <div className="flex-1 min-h-[170px]"><b className="text-xs tracking-widest text-white/50 px-1">TABS</b><div className="space-y-1 mt-2">{spaceTabs().filter(t=>t.title.toLowerCase().includes(tq.toLowerCase())).map(t=><div key={t.id} className="group flex items-center gap-2 rounded-xl px-2 py-2 border min-h-[44px]" style={{background:t.id===active?'var(--accent)':'rgba(255,255,255,.04)',borderColor:t.id===active?'var(--accent)':'transparent'}}><button onClick={()=>setActive(t.id)} className="flex-1 min-w-0 text-left flex gap-2 items-center"><span>{t.fav}</span><span className="truncate text-[13px]">{t.title}</span></button><button onClick={()=>closeTab(t.id)} aria-label={`Close ${t.title}`} className="w-11 h-11 grid place-items-center">✕</button></div>)||<div className="text-sm text-white/50 p-3">No tabs match.</div>}</div></div>
          <button onClick={goMission} className="w-full rounded-2xl p-3 text-left text-white flex gap-2 items-center min-h-[52px]" style={{background:'linear-gradient(90deg,var(--accent),var(--accent2))'}}><span className="text-2xl">🦄</span><span><b className="block text-sm">Nova Prime</b><span className="text-xs opacity-80">Your orchestrator</span></span><span className="ml-auto">→</span></button>
          <div className="glass rounded-2xl p-3"><div className="grid grid-cols-3 gap-2 text-center text-[11px]">{[['Agents','6'],['USDC',spent(K).toFixed(2)],['Gates',String(ev.slice(0,K).filter(e=>e.t==='gate').length)]].map(x=><div key={x[0]} className="bg-white/5 rounded-xl p-2"><b className="block mt-1">{x[1]}</b>{x[0]}</div>)}</div></div>
        </aside>}

        <main className="flex-1 min-w-0 flex flex-col min-h-[620px] pb-6">
          <div className="px-3 sm:px-4 pt-3 flex flex-wrap items-center gap-2">
            <div className="flex gap-1 overflow-x-auto no-scrollbar max-w-full">{spaceTabs().map(t=><button key={t.id} onClick={()=>setActive(t.id)} className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-full text-[13px] border min-h-[44px]" style={{background:t.id===active?'var(--accent)':'rgba(255,255,255,.05)',borderColor:t.id===active?'var(--accent)':'rgba(255,255,255,.08)'}}><span>{t.fav}</span><span className="max-w-[130px] truncate">{t.title}</span></button>)}</div>
            <button onClick={()=>openPage('New Tab','home','agentic://new-tab')} className="w-11 h-11 rounded-full glass grid place-items-center shrink-0" aria-label="New tab">+</button>
            <div className="ml-auto flex items-center gap-1 bg-white/5 rounded-full p-1 shrink-0">{[1,2,3,4].map(n=><button key={n} onClick={()=>{setSplit(n); toast(n===1?'Single pane':n+' panes — split view');}} className="px-3 py-2 rounded-full text-xs min-h-[44px]" style={{background:split===n?'white':'transparent',color:split===n?'black':'inherit'}}>{n}</button>)}</div>
          </div>
          <div className="flex-1 p-3 sm:p-4 min-h-0">
            <div className={`grid gap-3 ${split===1?'grid-cols-1':split===2?'grid-cols-1 lg:grid-cols-2':split===3?'grid-cols-1 md:grid-cols-2 xl:grid-cols-3':'grid-cols-1 md:grid-cols-2'}`}>
              {panes.map((tab,i)=>{
                const isAgent=tab.id==='agent'; const e=isAgent?CUR:null; const pos=e?POS[e.page]||POS.home:null;
                return <section key={tab.id+'-'+i} className="rounded-[24px] overflow-hidden flex flex-col min-h-[520px]" style={{background:dark?'rgba(16,19,36,.88)':'white',border:'1px solid rgba(255,255,255,.12)',boxShadow:'0 24px 60px rgba(0,0,0,.25)'}}>
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-white/5 min-h-[48px]"><button onClick={()=>toast('Back in this demo')} className="w-11 h-11 grid place-items-center" aria-label="Back">‹</button><button onClick={()=>toast('Forward in this demo')} className="w-11 h-11 grid place-items-center" aria-label="Forward">›</button><button onClick={()=>toast('Page reloaded')} className="w-11 h-11 grid place-items-center" aria-label="Reload">↻</button><div className="flex-1 min-w-0 flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-2 text-xs truncate"><span className="text-emerald-400">🔒</span><span className="truncate">{isAgent&&e?e.url:tab.domain}</span></div>{isAgent&&<span className="text-[10px] px-2 py-1 rounded-full bg-white/10">{view===null?(running?'LIVE':'DONE'):'REPLAY '+K+'/'+ev.length}</span>}</div>
                  <div className={`relative flex-1 overflow-y-auto ${focusMode&&i>0?'opacity-35 blur-[1px]':''}`}>{pageContent(tab)}{e&&pos&&<div aria-hidden className="absolute text-[28px] pointer-events-none" style={{left:`${pos[0]}%`,top:`${pos[1]}%`,transition:'left .8s ease, top .8s ease',filter:'drop-shadow(0 4px 8px rgba(0,0,0,.4))'}}>{AG[e.a].e}</div>}</div>
                </section>;
              })}
            </div>
          </div>
          <footer className="px-3 sm:px-4 pb-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/50 justify-between"><span>Concept prototype, not affiliated with or endorsed by Google • simulated pages, DIDs and payments • agents act only with your approval.</span><span className="mono">x402 USDC • Sentinel Owl policy ON • Flight recorder ON</span></footer>
        </main>

        {!zen && <aside className="w-full lg:w-[350px] shrink-0 flex flex-col border-t lg:border-t-0 lg:border-l border-white/10" style={{background:panelBg}}>
          <div className="p-3 flex gap-1">{([['mission','Agents','✦'],['rec','Recorder','⏺'],['set','Settings','⚙']] as const).map(t=><button key={t[0]} onClick={()=>setRtab(t[0])} className="flex-1 py-2.5 rounded-xl text-[13px] font-bold min-h-[44px]" style={{background:rtab===t[0]?'var(--accent)':'rgba(255,255,255,.06)'}}>{t[1]}</button>)}</div>
          <div className="flex-1 overflow-y-auto px-3 pb-3 min-h-0">
            {rtab==='mission' && <div>
              <div className="rounded-2xl p-4 text-white" style={{background:'linear-gradient(135deg,var(--accent),var(--accent2))'}}><b className="text-lg">Nova Prime</b><p className="text-sm opacity-85 mt-1">Give a goal. Agents browse, pay and write. You approve the risky bits.</p><div className="flex flex-wrap gap-1.5 mt-3"><button onClick={()=>setMissionInput('Find the best Postgres MCP server and buy API access')} className="bg-white/20 hover:bg-white/30 px-2.5 py-2 rounded-full text-xs min-h-[44px]">Buy an MCP server</button><button onClick={()=>{setTwin(v=>!v); toast('Digital Twin '+(twin?'off':'on — dry run'));}} className="bg-white/20 hover:bg-white/30 px-2.5 py-2 rounded-full text-xs min-h-[44px]">Twin: {twin?'ON':'off'}</button></div></div>
              <div className="mt-4 flex gap-2"><input value={missionInput} onChange={e=>setMissionInput(e.target.value)} className="flex-1 min-w-0 bg-white/10 border border-white/10 rounded-full px-3 py-2.5 text-sm min-h-[44px]"/><button onClick={run} disabled={running} className="px-4 rounded-full text-white text-sm font-bold shrink-0 min-h-[44px] disabled:opacity-50" style={{background:'var(--accent)'}}>{running?'Running…':'Run'}</button></div>
              {twin && <p className="text-xs mt-2 px-1"><span className="bg-white/10 px-2 py-1 rounded-full">Twin badge · dry run — no funds moved</span></p>}
              <div className="space-y-2 mt-4">{Object.entries(AG).map(([id,a])=><button key={id} onClick={()=>setPassportId(id)} className="w-full glass rounded-2xl p-3 flex gap-3 items-center text-left min-h-[64px]" style={CUR&&CUR.a===id?{borderColor:'var(--accent)'}:undefined}><span className="text-2xl">{a.e}</span><span className="min-w-0"><b className="text-sm block">{a.n}</b><span className="text-[11px] text-white/50 block truncate">{a.r} · {did(id).slice(0,20)}…</span></span><span className="ml-auto mono text-xs text-right">{(a.bal-spent(K,id)).toFixed(2)}<span className="block text-[10px] text-white/40">USDC</span></span></button>)}</div>
            </div>}
            {rtab==='rec' && <div>
              <div className="flex items-center gap-2 text-xs text-white/60"><span>Mission Replay</span><input type="range" min={0} max={ev.length} value={K} onChange={e=>setView(+e.target.value>=ev.length?null:+e.target.value)} disabled={running||!ev.length} className="flex-1 min-h-[44px]" style={{accentColor:'var(--accent)'}}/><button onClick={()=>setView(null)} className="glass px-2 py-2 rounded-full min-h-[44px]">Live</button></div>
              <div className="space-y-2 mt-3">{ev.length?ev.map((e,i)=><button key={i} onClick={()=>{if(!running){setView(i+1);}}} className="w-full glass rounded-2xl p-3 flex gap-2 text-left text-xs min-h-[52px]" style={i===K-1?{borderColor:'var(--accent)'}:e.t==='gate'?{borderColor:'var(--warn)'}:e.t==='deny'?{borderColor:'var(--danger)'}:undefined}><span>{AG[e.a].e}</span><span className="flex-1"><b>{AG[e.a].n}</b> {e.msg}{e.twin?' [Twin]':''}</span><span className="mono text-white/40">{e.at}s</span></button>):<p className="text-sm text-white/50 p-2">No mission yet. Every action, payment and approval will be recorded here.</p>}</div>
            </div>}
            {rtab==='set' && <div><b className="text-xl">Settings</b><div className="mt-3 space-y-2">{([['breathing','Breathing Light'],['trackers','Tracker Blocking'],['autonap','Auto-Nap Tabs']] as const).map(k=><button key={k[0]} onClick={()=>{setSettings(s=>({...s,[k[0]]:!s[k[0]]})); toast(`${k[1]} ${settings[k[0]]?'off':'on'}`);}} className="w-full glass p-3 rounded-2xl flex justify-between items-center text-left min-h-[52px]"><span><b className="text-sm block">{k[1]}</b><span className="text-xs text-white/50">{settings[k[0]]?'Enabled':'Paused'}</span></span><span className="w-11 h-6 rounded-full p-0.5 flex shrink-0" style={{background:settings[k[0]]?'var(--accent)':'rgba(255,255,255,.2)',justifyContent:settings[k[0]]?'flex-end':'flex-start'}}><span className="w-5 h-5 bg-white rounded-full block"/></span></button>)}</div>
              <div className="mt-4"><b className="text-sm">Theme — 8 gradients</b><div className="grid grid-cols-2 gap-2 mt-2">{Object.keys(TH).map(n=><button key={n} onClick={()=>{setTheme(n); toast('Theme: '+n);}} className="rounded-xl p-2.5 text-left text-xs font-bold border text-white min-h-[44px]" style={{background:`linear-gradient(135deg,${TH[n].accent},${TH[n].accent2})`,borderColor:theme===n?'white':'transparent'}}>{n}{theme===n?' ✓':''}</button>)}</div><button onClick={()=>setDark(v=>!v)} className="w-full glass py-2.5 rounded-xl text-sm mt-3 min-h-[44px]">{dark?'☀ Light':'🌙 Dark'}</button></div>
            </div>}
          </div>
        </aside>}
      </div>
    </div>

    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] space-y-2 w-[min(92vw,420px)] pointer-events-none">{toasts.map(t=><div key={t.id} className="mx-auto w-fit px-4 py-3 rounded-lg text-sm shadow-2xl slide-up" style={{background:'#323232',color:'#fff'}}>{t.msg}</div>)}</div>

    {gate && <div className="fixed inset-0 z-[70] bg-black/70 grid place-items-center p-4">
      {gate==='pay' ? <div className="w-full max-w-[460px] rounded-[24px] p-5 slide-up" style={{background:dark?'#151830':'white'}}><b className="text-xl">🦉 Human approval checkpoint</b><p className="text-sm mt-2 text-white/75">Bee Buyer wants to pay <b>2.00 USDC</b> via x402 to <span className="mono">mcpserver.in</span> for the pg-mcp-gateway API key.{twin?' Digital Twin is on, so nothing will really be spent.':''}</p><div className="flex gap-2 mt-4"><button onClick={()=>gateResolve.current?.(true)} className="px-4 py-2.5 rounded-full text-white text-sm font-bold min-h-[44px]" style={{background:'var(--accent)'}}>Approve once</button><button onClick={()=>gateResolve.current?.(false)} className="glass px-4 py-2.5 rounded-full text-sm min-h-[44px]">Deny</button></div></div>
      : <div className="w-full max-w-[420px] rounded-[28px] p-6 slide-up" style={{background:'#fff',color:'#202124'}}><div className="text-center text-sm"><span style={{color:'#4285F4'}}>●</span><span style={{color:'#EA4335'}}>●</span><span style={{color:'#FBBC04'}}>●</span><span style={{color:'#34A853'}}>●</span> <b>Google Account access</b><div className="text-[11px]" style={{color:'#80868b'}}>Simulated consent screen</div></div><h3 className="text-xl mt-4" style={{fontWeight:500}}>Scribe Turtle wants access to your Google Account</h3><p className="text-sm mt-2" style={{color:'#5f6368'}}>It will only touch items it creates during this mission.</p><div className="mt-3 space-y-2 text-sm">{[['🔺','Save files to Drive'],['📄','Create Google Docs'],['📅','Add Calendar events'],['✉','Send email as you']].map(x=><div key={x[1]} className="flex gap-3 items-center rounded-xl p-2.5" style={{background:'#f1f3f4'}}><span>{x[0]}</span>{x[1]}</div>)}</div><div className="flex justify-end gap-2 mt-5"><button onClick={()=>gateResolve.current?.(false)} className="px-5 py-2.5 rounded-full text-sm font-medium min-h-[44px]" style={{color:'#1a73e8'}}>Deny</button><button onClick={()=>gateResolve.current?.(true)} className="px-5 py-2.5 rounded-full text-sm font-medium text-white min-h-[44px]" style={{background:'#1a73e8'}}>Allow</button></div></div>}
    </div>}

    {passportId && (()=>{const a=AG[passportId]; const n=ev.slice(0,K).filter(e=>e.a===passportId).length; return <div className="fixed inset-0 z-[70] bg-black/70 grid place-items-center p-4" onClick={()=>setPassportId(null)}><div className="w-full max-w-[460px] rounded-[24px] p-5 slide-up" style={{background:dark?'#151830':'white'}} onClick={e=>e.stopPropagation()}><b className="text-xl">{a.e} {a.n} · Agent Passport</b><div className="mono text-xs text-white/50 mt-2 break-all">{did(passportId)}</div><p className="text-sm mt-3 text-white/75">{a.r}. Spend limit {a.lim.toFixed(2)} USDC per mission. Reputation {a.rep}/100. Actions this mission: {n}.</p>{a.sc&&<div className="mt-2 text-xs mono text-white/60">OAuth scopes: {a.sc}</div>}<div className="mt-3 flex flex-wrap gap-1.5">{a.cap.map(c=><span key={c} className="text-xs bg-white/10 px-2 py-1 rounded-full">{c}</span>)}</div><button onClick={()=>setPassportId(null)} className="mt-4 glass px-4 py-2.5 rounded-full text-sm min-h-[44px]">Close</button></div></div>;})()}

    {launcherOpen && <div className="fixed inset-0 z-[70] bg-black/60 p-3 sm:p-6" onClick={e=>{if(e.target===e.currentTarget)setLauncherOpen(false);}}><div className="ml-auto max-w-[360px] rounded-[24px] p-4 slide-up glass" style={{background:dark?'#151830':'white'}}><div className="grid grid-cols-3 gap-2">{APPS.map(p=><button key={p[0]} onClick={()=>{setLauncherOpen(false); openPage(p[0],p[3],p[4]);}} className="rounded-2xl p-3 hover:bg-white/10 text-center min-h-[64px]"><div className="text-2xl">{p[1]}</div><div className="text-xs mt-1">{p[0]}</div></button>)}</div><p className="text-[11px] text-white/40 mt-3">Concept demo · not affiliated with Google</p></div></div>}

    {paletteOpen && <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm p-3 sm:p-6" onClick={e=>{if(e.target===e.currentTarget)setPaletteOpen(false);}}><div className="max-w-[640px] mx-auto rounded-[24px] overflow-hidden slide-up" style={{background:dark?'#151830':'white'}}><div className="flex items-center gap-2 px-4 py-4 border-b border-white/10">⌘<input autoFocus value={paletteQ} onChange={e=>setPaletteQ(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&paletteItems[0]){const item=paletteItems[0]; setPaletteOpen(false); setPaletteQ(''); runPaletteItem(item);}}} placeholder="Type a command, tab, or mission…" className="flex-1 bg-transparent text-lg min-w-0 min-h-[44px]"/></div><div className="max-h-[55vh] overflow-y-auto p-2">{paletteItems.map((x,i)=><button key={x.title+i} onClick={()=>{setPaletteOpen(false); setPaletteQ(''); runPaletteItem(x);}} className="w-full text-left px-3 py-3 rounded-xl hover:bg-white/10 min-h-[44px]">{x.title}</button>)||<div className="p-4 text-white/50 text-sm">No matches.</div>}</div></div></div>}
  </div>;
}
