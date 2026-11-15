import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Plus, X, Pin, Lock, Command, LayoutGrid, Zap, Wallet, Shield, Users, Briefcase, Home, FlaskConical, Heart, Sparkles, Check, Ban, Bell, ChevronDown, ChevronRight, Play, Pause, Timer, MessageSquare, FileText, CreditCard, ArrowUpRight, Globe, Github, Youtube, BookOpen, Newspaper, Figma, Mail, Music, Trello, Code2, Download, RefreshCw, Eye, EyeOff, Sun, Moon, Send, Mic, MoreHorizontal, CircleDollarSign, ShoppingBag, Receipt, Repeat, AlertTriangle, Bot, SlidersHorizontal, Layers, Maximize2, Minimize2, Clock, TrendingUp, Target, CheckCircle2, Copy, Calendar, MapPin, Trash2, Activity, Settings, Star } from 'lucide-react';

async function api(action:string, args:any){
  const r = await fetch("/actions",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action,args})});
  const j = await r.json();
  if(!r.ok || j.error) throw new Error(j.error||`Request failed (${r.status})`);
  return j.data;
}
type Note={id:string; text:string; done:boolean; recordId?:string};
type Order={id:string; name:string; amount:number; status:string; date:string; recordId?:string};
type Approval={id:number; title:string; amount:number; detail:string; risk:string; autoIn?:number};
type Tx={id:number; name:string; amount:number; cat:string; rule:string; space:string; time:string; icon:string};
type ChatMsg={role:string; text:string; kind?: 'text'|'plan'|'meeting'|'order'|'approvals'|'sources'; chips?:string[]};

const SPACES=[
 {name:'Work',icon:Layers,color:'#4285F4',desc:'Projects & docs'},{name:'Money',icon:Wallet,color:'#34A853',desc:'Payments & budgets'},
 {name:'Family',icon:Heart,color:'#EA4335',desc:'Shared & home'},{name:'Business',icon:Briefcase,color:'#FBBC05',desc:'Clients & invoices'},
 {name:'Research',icon:BookOpen,color:'#8b5cf6',desc:'Reading & sources'},{name:'Focus',icon:Timer,color:'#06b6d4',desc:'Deep work'},
];
const BROWSER_TABS=[
 {id:'home',title:'Nova Home',domain:'google.agentic/home',fav:'G',space:'Personal'},
 {id:'github',title:'mantrakp04/ardia',domain:'github.com/mantrakp04/ardia',fav:'⬢',space:'Work'},
 {id:'linear',title:'Linear Launch Board',domain:'linear.app/launch',fav:'◍',space:'Work'},
 {id:'notion',title:'Notion Product Docs',domain:'notion.so/product',fav:'N',space:'Work'},
 {id:'youtube',title:'YouTube Lo-fi Focus',domain:'youtube.com/lofi',fav:'▶',space:'Focus'},
];
const INITIAL_TX:Tx[]=[
 {id:1,name:'Notion',amount:499,cat:'Productivity',rule:'Auto-tagged · Work',space:'Work',time:'09:12',icon:'N'},
 {id:2,name:'Swiggy',amount:642,cat:'Food',rule:'Ask First · Family',space:'Family',time:'12:40',icon:'S'},
 {id:3,name:'Uber',amount:318,cat:'Travel',rule:'Auto · Work',space:'Work',time:'13:05',icon:'U'},
 {id:4,name:'Figma',amount:1299,cat:'Design',rule:'Approved · Business',space:'Business',time:'14:22',icon:'F'},
 {id:5,name:'BookMyShow',amount:890,cat:'Entertainment',rule:'Ask First · Personal',space:'Personal',time:'18:10',icon:'B'},
 {id:6,name:'DMart',amount:1840,cat:'Groceries',rule:'Auto · Family',space:'Family',time:'19:45',icon:'D'},
];
const INITIAL_APPROVALS:Approval[]=[
 {id:1,title:'Pay ₹642 · Swiggy',amount:642,detail:'Food delivery · Family · Low risk',risk:'Low'},
 {id:2,title:'Pay ₹1,299 · Amazon',amount:1299,detail:'Order · Personal · Medium risk',risk:'Medium'},
 {id:3,title:'Pay ₹8,000 · Rent share',amount:8000,detail:'Monthly share · Family · High stakes',risk:'High'},
];
const INITIAL_FEED=[
 {id:1,time:'09:02',source:'Gmail',conf:'high',text:'Checked Gmail for marketing report',why:'You asked for the latest report. Found 2 unread messages matching “marketing report” from the last 24 hours.'},
 {id:2,time:'09:12',source:'Drive',conf:'low',text:'Flagged invoice #4218',why:'Vendor submitted a duplicate line item matching 3 previous submissions. Confidence is low because the total differs by ₹40.'},
 {id:3,time:'09:28',source:'Calendar',conf:'high',text:'Proposed meeting Fri 3pm',why:'Checked Calendar — Fri 3pm is free, no overlap with standup, and all attendees are available.'},
 {id:4,time:'10:04',source:'Search',conf:'high',text:'Grounded answer with 3 sources',why:'Used Gemini grounding to check current pricing and docs before answering, instead of relying on memory.'},
 {id:5,time:'10:31',source:'Calendar',conf:'low',text:'Suggested moving standup to 10:30',why:'One attendee has a tentative hold at 10:00. Low confidence — the hold has no title or location.'},
 {id:6,time:'11:15',source:'Gmail',conf:'high',text:'Drafted reply to vendor',why:'Draft only — no message was sent. The draft quotes invoice #4218 and asks for a corrected line item.'},
];
const CONNECT=[
 {name:'Gmail',scope:'gmail.readonly',desc:'Read mail to find reports, receipts and drafts.',status:'Connected'},
 {name:'Calendar',scope:'calendar.events',desc:'Read events to propose times without conflicts.',status:'Connected'},
 {name:'Drive',scope:'drive.file',desc:'Open only files you pick or mention.',status:'Connected'},
 {name:'Search',scope:'Gemini grounding',desc:'Ground answers in current web sources.',status:'Connected'},
 {name:'YouTube',scope:'youtube.readonly',desc:'Find focus music and saved videos.',status:'Request Access'},
 {name:'Photos',scope:'photos.readonly',desc:'Find trip photos when you ask for them.',status:'Request Access'},
];
const ROADMAP=[
 {phase:'Phase 1 — MVP',title:'Search, Gmail, Calendar, Drive',items:['Gemini summaries of any tab','Gmail + Drive search with WHY explanations','Calendar proposals with conflict checks','Guarded payments with approvals'],status:'In progress'},
 {phase:'Phase 2 — Media + IoT',title:'YouTube, Photos, Home',items:['YouTube focus player + PiP','Photos search by trip or person','Home routines that ask before acting','Quota-aware media requests'],status:'Planned'},
 {phase:'Phase 3 — Mobile + Enterprise',title:'Maps, AMAPI, Cloud',items:['Mobile companion with the same approvals','Enterprise controls + audit export','Admin-managed scopes and consent','Workspace MCP with is_agentic clients'],status:'Planned'},
];
const PLAN_STEPS=[
 'Check Calendar for Friday — find the free blocks',
 'Draft the plan in order: focus, meetings, errands',
 'Check Drive for the Friday report you need',
 'Propose times and ask for approval before booking',
 'Turn the approved plan into 4 to-dos',
];

export default function App(){
  const [activeTab,setActiveTab]=useState('home');
  const [tabs,setTabs]=useState(BROWSER_TABS);
  const [space,setSpace]=useState('All');
  const [rightTab,setRightTab]=useState<'Gemini'|'Features'|'Wallet'|'Connect'>('Gemini');
  const [mobileView,setMobileView]=useState<'home'|'money'|'gemini'|'activity'|'more'>('home');
  const [balance,setBalance]=useState(184250);
  const [spent,setSpent]=useState(42180);
  const [savedAmt]=useState(28400);
  const [txs,setTxs]=useState(INITIAL_TX);
  const [approvals,setApprovals]=useState<Approval[]>(INITIAL_APPROVALS);
  const [audit,setAudit]=useState<string[]>(['09:00 · Wallet synced · Balance ₹1,84,250 · Agent','09:12 · Notion ₹499 approved by Pay Guardian · Agent','12:40 · Swiggy ₹642 flagged · Ask First · Supervised']);
  const [toasts,setToasts]=useState<{id:number;msg:string}[]>([]);
  const [palette,setPalette]=useState(false); const [paletteQ,setPaletteQ]=useState('');
  const [notes,setNotes]=useState<Note[]>([{id:'n1',text:'Review Linear launch board before standup',done:false},{id:'n2',text:'Cancel unused trial — Sub Watcher flagged it',done:false},{id:'n3',text:'Book Japan Trip stays after approval',done:true}]);
  const [noteInput,setNoteInput]=useState('');
  const [orders,setOrders]=useState<Order[]>([{id:'ORD-1042',name:'Notion Team Plan',amount:499,status:'Paid',date:'Today'},{id:'ORD-1041',name:'Figma Pro',amount:1299,status:'Paid',date:'Yesterday'}]);
  const [orderName,setOrderName]=useState(''); const [orderAmt,setOrderAmt]=useState('499');
  const [apiStatus,setApiStatus]=useState('Connecting…');
  const [geminiInput,setGeminiInput]=useState(''); const [askBox,setAskBox]=useState('');
  const [geminiMsgs,setGeminiMsgs]=useState<ChatMsg[]>([{role:'ai',text:'Hi, I’m Gemini. Ask me to summarize this tab, approve payments, plan my Friday, book a meeting, or create an order.',kind:'text',chips:['Summarize this page','Plan my Friday','Book a meeting','Create an order']}]);
  const [thinking,setThinking]=useState(false);
  const [sheet,setSheet]=useState<null|'gemini'|'activity'|'more'|'compliance'|'consent'|'erase'>(null);
  const [autonomy,setAutonomy]=useState<'Full Autonomy'|'Supervised Autonomy'|'Approval Required'>('Supervised Autonomy');
  const [feedFilter,setFeedFilter]=useState('All');
  const [feed,setFeed]=useState(INITIAL_FEED);
  const [planSteps,setPlanSteps]=useState(PLAN_STEPS.map((t,i)=>({id:i,text:t,done:false})));
  const [planApproved,setPlanApproved]=useState(false); const [planEditing,setPlanEditing]=useState(false); const [planEditText,setPlanEditText]=useState('');
  const [executing,setExecuting]=useState(false); const [execIndex,setExecIndex]=useState(-1);
  const [meetDate,setMeetDate]=useState('Fri'); const [meetTime,setMeetTime]=useState('3:00 PM'); const [meetConfirmed,setMeetConfirmed]=useState(false);
  const [minimize,setMinimize]=useState(true);
  const [consentLog,setConsentLog]=useState<string[]>(['10:02 · gmail.readonly granted · You','10:02 · calendar.events granted · You','10:02 · drive.file granted · You']);
  const [gmailModify,setGmailModify]=useState(false);
  const [traffic,setTraffic]=useState<'Green'|'Yellow'|'Red'>('Green');
  const [expandedPhase,setExpandedPhase]=useState(0);
  const [focusSec,setFocusSec]=useState(25*60); const [focusRunning,setFocusRunning]=useState(false);
  const [playing,setPlaying]=useState(false); const [pip,setPip]=useState(false);
  const [showPipOnScroll,setShowPipOnScroll]=useState(false);
  const [quotaOn,setQuotaOn]=useState(true);
  const [txQ,setTxQ]=useState('');
  const [widgetOrderName,setWidgetOrderName]=useState('Gemini Order'); const [widgetOrderAmt,setWidgetOrderAmt]=useState('499');
  const toastId=useRef(0);
  const active = tabs.find(t=>t.id===activeTab) || tabs[0];
  const fmt=(n:number)=>`₹${n.toLocaleString('en-IN')}`;

  useEffect(()=>{ const h=()=>setShowPipOnScroll(window.scrollY>320); window.addEventListener('scroll',h); return ()=>window.removeEventListener('scroll',h); },[]);
  useEffect(()=>{ if(!focusRunning) return; const t=setInterval(()=>setFocusSec(s=>Math.max(0,s-1)),1000); return ()=>clearInterval(t); },[focusRunning]);
  useEffect(()=>{ if(!executing) return; const t=setInterval(()=>{ setExecIndex(i=>{ if(i>=planSteps.length-1){ setExecuting(false); return i; } return i+1; }); },1100); return ()=>clearInterval(t); },[executing,planSteps.length]);
  useEffect(()=>{ const t=setInterval(()=>{ setApprovals(list=>list.map(a=>a.autoIn&&a.autoIn>0?{...a,autoIn:a.autoIn-1}:a)); },1000); return ()=>clearInterval(t); },[]);
  useEffect(()=>{
    (async()=>{
      try{
        const [n,o]=await Promise.all([api('records.list',{collection:'notes'}), api('records.list',{collection:'orders'})]);
        if(n.records?.length) setNotes(n.records.map((r:any)=>({id:r.value.id||r.id, text:r.value.text, done:!!r.value.done, recordId:r.id})));
        if(o.records?.length) setOrders(o.records.map((r:any)=>({id:r.value.id, name:r.value.name, amount:r.value.amount, status:r.value.status, date:r.value.date, recordId:r.id})));
        setApiStatus('Saved to workspace');
      }catch{ setApiStatus('Offline — changes stay in this session'); }
    })();
  },[]);
  useEffect(()=>{ const h=(e:KeyboardEvent)=>{ if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault(); setPalette(v=>!v);} if(e.key==='Escape'){setPalette(false); setSheet(null);} }; window.addEventListener('keydown',h); return ()=>window.removeEventListener('keydown',h); },[]);

  function toast(msg:string){ const id=++toastId.current; setToasts(t=>[...t,{id,msg}]); setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),3400); }
  function log(msg:string){ setAudit(a=>[`${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} · ${msg}`,...a].slice(0,14)); }
  function approve(a:Approval, auto=false){
    setApprovals(v=>v.filter(x=>x.id!==a.id)); setBalance(b=>b-a.amount); setSpent(s=>s+a.amount);
    setTxs(t=>[{id:Date.now(),name:a.title.split('·')[1]?.trim()||'Payment',amount:a.amount,cat:'Approved',rule:auto?'Auto-approved · Supervised':a.risk==='High'?'Approved by you':'Approved',space:'Money',time:new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}),icon:'✓'},...t]);
    log(`${a.title} ${auto?'auto-approved · Supervised':'approved · You'}`); toast(`Approved ${a.title}`);
  }
  useEffect(()=>{
    // Demo-only countdown: defer updates so no state changes occur during effect setup.
    const timer = window.setTimeout(()=>{
      approvals.forEach(a=>{ if(a.autoIn===0) approve(a,true); });
    },0);
    return ()=>window.clearTimeout(timer);
  },[approvals]);

  function deny(a:Approval){ setApprovals(v=>v.filter(x=>x.id!==a.id)); log(`${a.title} rejected · You`); toast(`Rejected ${a.title}`); }
  function approveAll(){ if(!approvals.length){toast('No pending approvals'); return;} const total=approvals.reduce((x,y)=>x+y.amount,0); setBalance(b=>b-total); setSpent(s=>s+total); setApprovals([]); log(`All ${approvals.length} approvals approved · You`); toast(`Approved ${approvals.length} payments`); }
  function requestApproval(name:string,amt:number){
    const na:Approval={id:Date.now(),title:`Pay ₹${amt} · ${name}`,amount:amt,detail:`Guarded checkout · ${autonomy} · ${amt<=1000?'Low risk':amt<=2000?'Medium risk':'High risk'}`,risk:amt<=1000?'Low':amt<=2000?'Medium':'High'};
    if(autonomy==='Full Autonomy'){ setBalance(b=>b-amt); setSpent(s=>s+amt); setTxs(t=>[{id:Date.now(),name,amount:amt,cat:'Approved',rule:'Logged silently · Full Autonomy',space:'Money',time:'Now',icon:'✓'},...t]); log(`Guarded checkout logged silently · ${name} ₹${amt} · Agent`); toast(`Logged silently — Full Autonomy: ${name} ₹${amt}`); return; }
    if(autonomy==='Supervised Autonomy' && amt<=1000){ setApprovals(v=>[{...na,autoIn:5},...v]); log(`Supervised auto-approval started · ${name} ₹${amt} · 5s countdown`); toast('Supervised: auto-approving in 5s — tap the item to stop it'); return; }
    setApprovals(v=>[na,...v]); log(`Approval requested · ${name} ₹${amt} · You`); toast(`Approval created for ${name} ₹${amt}`); setRightTab('Wallet'); setMobileView('money');
  }
  async function createOrder(nameArg?:string, amtArg?:number){
    const name=(nameArg||orderName||widgetOrderName).trim()||'New Order'; const amt=(amtArg ?? Number(orderAmt||widgetOrderAmt)) || 499; const id=`ORD-${1043+orders.length}`;
    const local:Order={id,name,amount:amt,status:'Paid',date:'Today'};
    setOrders(o=>[local,...o]); setTxs(t=>[{id:Date.now(),name,amount:amt,cat:'Order',rule:'Created in Money OS',space:'Business',time:'Now',icon:'◍'},...t]); setBalance(b=>b-amt); setSpent(s=>s+amt); log(`Order created ${id} · ${name} ₹${amt} · You`); toast(`Order ${id} created — ₹${amt}`);
    setOrderName(''); setOrderAmt('499');
    try{ const rec=await api('records.create',{collection:'orders',value:{id,name,amount:amt,status:'Paid',date:'Today'},idempotency_key:`order-${id}`}); setOrders(o=>o.map(x=>x.id===id?{...x,recordId:rec.id}:x)); setApiStatus('Saved to workspace'); }catch{ setApiStatus('Offline — changes stay in this session'); }
  }
  async function refundOrder(o:Order){ setOrders(v=>v.map(x=>x.id===o.id?{...x,status:'Refunded'}:x)); setBalance(b=>b+o.amount); log(`Refund issued ${o.id} ₹${o.amount} · You`); toast(`Refunded ${o.id}`);
    if(o.recordId){ try{ await api('records.replace',{collection:'orders',id:o.recordId,value:{id:o.id,name:o.name,amount:o.amount,status:'Refunded',date:o.date}});}catch{} }
  }
  async function addNote(){
    const text=noteInput.trim(); if(!text) return; const id=`n${Date.now()}`; const local:Note={id,text,done:false}; setNotes(n=>[local,...n]); setNoteInput(''); toast('Note added'); log('Quick note added · You');
    try{ const rec=await api('records.create',{collection:'notes',value:{id,text,done:false},idempotency_key:`note-${id}`}); setNotes(n=>n.map(x=>x.id===id?{...x,recordId:rec.id}:x)); setApiStatus('Saved to workspace'); }catch{ setApiStatus('Offline — changes stay in this session'); }
  }
  async function toggleNote(n:Note){ setNotes(v=>v.map(x=>x.id===n.id?{...x,done:!x.done}:x)); if(n.recordId){ try{ await api('records.replace',{collection:'notes',id:n.recordId,value:{id:n.id,text:n.text,done:!n.done}});}catch{} } }
  async function deleteNote(n:Note){ setNotes(v=>v.filter(x=>x.id!==n.id)); toast('Note deleted'); if(n.recordId){ try{ await api('records.delete',{collection:'notes',id:n.recordId});}catch{} } }
  function closeTab(id:string){ if(tabs.length<=1) return; const nt=tabs.filter(t=>t.id!==id); setTabs(nt); if(activeTab===id) setActiveTab(nt[0].id); toast('Tab closed'); }
  function newTab(){ const id=`tab${Date.now()}`; setTabs(t=>[...t,{id,title:'New Tab',domain:'google.agentic/new',fav:'G',space:'Personal'}]); setActiveTab(id); toast('New tab opened'); }
  function cleanTabs(){ const keep=tabs.filter(t=>t.id==='home'||t.id===activeTab); setTabs(keep); toast(`Cleaned up tabs — kept ${keep.length}`); log('Tabs cleaned up · Agent'); }

  function askGemini(text?:string){
    const q=(text||geminiInput||askBox).trim(); if(!q) return;
    setRightTab('Gemini'); setMobileView('gemini'); setSheet(null);
    setGeminiMsgs(m=>[...m,{role:'user',text:q,kind:'text'}]); setGeminiInput(''); setAskBox(''); setThinking(true);
    setTimeout(()=>{
      const l=q.toLowerCase(); let reply:ChatMsg;
      if(l.includes('plan')||l.includes('friday')) reply={role:'ai',text:'Here is a Friday plan I can execute. Review the steps, edit if needed, then approve — nothing is booked until you approve.',kind:'plan'};
      else if(l.includes('meeting')||l.includes('book')) reply={role:'ai',text:'Let’s book it. Pick a date and a time — I checked Calendar and these slots are free. Confirm only when you are ready.',kind:'meeting'};
      else if(l.includes('order')||l.includes('create')) reply={role:'ai',text:'Here is the order form. It creates a real order in Money OS and updates your balance.',kind:'order'};
      else if(l.includes('approve')||l.includes('payment')||l.includes('pay')) reply={role:'ai',text:`You have ${approvals.length} pending approvals totalling ₹${approvals.reduce((a,b)=>a+b.amount,0).toLocaleString('en-IN')}. Approve or reject each one below — every action is logged.`,kind:'approvals'};
      else if(l.includes('summar')) reply={role:'ai',text:`Summary of ${active.title} (${active.domain}): the page is about focused work and clear next steps. (1) What matters now, (2) what to decide, (3) what to pay or file. Want me to turn this into to-dos?`,kind:'sources',chips:['Google Agentic docs','Tab content','Money OS']};
      else reply={role:'ai',text:'Here is a grounded-style answer:',kind:'sources',chips:['Gemini grounding','Calendar','Drive']};
      setGeminiMsgs(m=>[...m,reply]); setThinking(false);
      if(l.includes('summar')) log('Gemini summarized tab · Agent');
    },750);
  }
  function startPlan(){ setPlanApproved(true); setExecuting(true); setExecIndex(0); log('Plan approved · You'); toast('Plan approved — executing'); }
  function finishPlan(){ const done=planSteps.map(s=>({...s,done:true})); setPlanSteps(done); setExecuting(false); log('Plan executed · Agent'); toast('Plan complete — to-dos created'); }
  useEffect(()=>{ if(execIndex>=planSteps.length-1 && executing){ const t=setTimeout(finishPlan,900); return ()=>clearTimeout(t); } },[execIndex,executing]);

  async function eraseData(){
    const ids=notes.filter(n=>n.recordId).map(n=>n.recordId!);
    for(const id of ids){ try{ await api('records.delete',{collection:'notes',id}); }catch{} }
    setNotes([]); setGeminiMsgs([{role:'ai',text:'Hi, I’m Gemini. Your notes, chat and audit log were erased. Ask me anything to start fresh.',kind:'text'}]); setAudit([`${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} · Data erased at your request · You`]); setConsentLog(c=>[...c,`${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} · Data erased · You`]); setSheet(null); toast('Your notes, chat and audit log were erased');
  }

  const mm=String(Math.floor(focusSec/60)).padStart(2,'0'); const ss=String(focusSec%60).padStart(2,'0');
  const filteredFeed=feed.filter(f=>feedFilter==='All'||f.source===feedFilter);
  const filteredTx=useMemo(()=>txs.filter(t=>(space==='All'||t.space===space)&&(t.name+t.cat).toLowerCase().includes(txQ.toLowerCase())),[txs,space,txQ]);
  const suggested = activeTab==='money' ? ['Approve pending payments','Create a ₹499 order','Summarize spend today'] : ['Summarize this page','Plan my Friday','Book a meeting'];
  // Filter only serializable command metadata during render; execute actions on click.
  const commands=[
    {label:'New Tab',key:'new-tab'},{label:'Approve all payments',key:'approve-all'},
    {label:'Plan my Friday',key:'plan'},{label:'Book a meeting',key:'meeting'},
    {label:'Create order ₹499',key:'order'},{label:'Open Money OS',key:'money'},
    {label:'Clean up tabs',key:'clean'},{label:'Erase my data',key:'erase'},
  ].filter(c=>c.label.toLowerCase().includes(paletteQ.toLowerCase()));
  function runCommand(key:string){
    switch(key){
      case 'new-tab': newTab(); break;
      case 'approve-all': approveAll(); break;
      case 'plan': askGemini('Plan my Friday'); break;
      case 'meeting': askGemini('Book a meeting'); break;
      case 'order': createOrder('Gemini Order',499); break;
      case 'money': setMobileView('money'); setActiveTab('money'); break;
      case 'clean': cleanTabs(); break;
      case 'erase': setSheet('erase'); break;
    }
  }
  function goHome(){ setActiveTab('home'); setMobileView('home'); window.scrollTo({top:0,behavior:'smooth'}); }
  function goMoney(){ setActiveTab('money'); setMobileView('money'); window.scrollTo({top:0,behavior:'smooth'}); }

  function Widget({msg}:{msg:ChatMsg}){
    if(msg.kind==='plan') return <div className="mt-2 space-y-2">
      <div className="text-sm font-bold">Plan — Friday</div>
      {planSteps.map((s,i)=><label key={s.id} className={`flex gap-2 items-start rounded-xl border border-white/10 p-3 text-sm ${executing&&execIndex===i?'border-blue-400 bg-blue-500/10':''}`}><input type="checkbox" checked={s.done||(executing&&i<execIndex)} onChange={()=>setPlanSteps(v=>v.map(x=>x.id===s.id?{...x,done:!x.done}:x))} className="mt-0.5 w-5 h-5 accent-emerald-500"/><span className="flex-1">{s.text}</span>{executing&&execIndex===i&&<span className="text-blue-300 animate-pulse">● Executing</span>}{s.done&&<Check size={16} className="text-emerald-400"/>}</label>)}
      {!planApproved ? <div className="flex flex-wrap gap-2"><button onClick={startPlan} className="google-bg text-white px-4 py-3 rounded-full text-sm font-bold min-h-[48px]">Approve Plan</button><button onClick={()=>{setPlanEditing(!planEditing); setPlanEditText('');}} className="chip px-4 py-3 rounded-full text-sm min-h-[48px]">Edit steps</button></div> : <p className="text-sm text-emerald-300">Plan approved. {executing?'Executing…':'Execution complete.'}</p>}
      {planEditing && <div className="flex gap-2"><input value={planEditText} onChange={e=>setPlanEditText(e.target.value)} placeholder="Add a step…" className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-full px-3 py-3 text-sm min-h-[48px]"/><button onClick={()=>{ if(!planEditText.trim()) return; setPlanSteps(v=>[...v,{id:Date.now(),text:planEditText.trim(),done:false}]); setPlanEditText(''); }} className="google-bg text-white px-4 rounded-full text-sm font-bold min-h-[48px]">Add</button></div>}
    </div>;
    if(msg.kind==='meeting') return <div className="mt-2 space-y-3">
      <div><div className="text-sm font-bold mb-2">Date</div><div className="flex gap-2 flex-wrap">{['Thu','Fri','Mon'].map(d=><button key={d} onClick={()=>setMeetDate(d)} className={`px-4 py-3 rounded-full text-sm min-h-[48px] ${meetDate===d?'bg-white text-black font-bold':'chip'}`}>{d}</button>)}</div></div>
      <div><div className="text-sm font-bold mb-2">Time</div><div className="flex gap-2 flex-wrap">{['10:00 AM','2:00 PM','3:00 PM','4:30 PM'].map(t=><button key={t} onClick={()=>setMeetTime(t)} className={`px-4 py-3 rounded-full text-sm min-h-[48px] ${meetTime===t?'bg-white text-black font-bold':'chip'}`}>{t}</button>)}</div></div>
      {!meetConfirmed ? <button onClick={()=>{setMeetConfirmed(true); log(`Meeting booked ${meetDate} ${meetTime} · You`); toast(`Meeting confirmed — ${meetDate} ${meetTime}`);}} className="bg-emerald-500 text-white w-full py-3 rounded-full text-sm font-bold min-h-[48px]">Confirm — {meetDate} · {meetTime}</button> : <p className="text-sm text-emerald-300 flex gap-1 items-center"><Check size={16}/> Confirmed for {meetDate} at {meetTime}. Nothing was sent — this is a sandbox draft.</p>}
    </div>;
    if(msg.kind==='order') return <div className="mt-2 space-y-2"><input value={widgetOrderName} onChange={e=>setWidgetOrderName(e.target.value)} placeholder="Order name" className="w-full bg-white/5 border border-white/10 rounded-full px-3 py-3 text-sm min-h-[48px]"/><input value={widgetOrderAmt} onChange={e=>setWidgetOrderAmt(e.target.value)} inputMode="numeric" placeholder="Amount" className="w-full bg-white/5 border border-white/10 rounded-full px-3 py-3 text-sm min-h-[48px]"/><button onClick={()=>createOrder(widgetOrderName,Number(widgetOrderAmt)||499)} className="google-bg text-white w-full py-3 rounded-full text-sm font-bold min-h-[48px]">Create order</button></div>;
    if(msg.kind==='approvals') return <div className="mt-2 space-y-2">{approvals.length===0?<p className="text-sm">All clear.</p>:approvals.map(a=><div key={a.id} className="rounded-xl border border-white/10 p-3 flex justify-between gap-2 items-center"><div><div className="text-sm font-bold">{a.title}</div><div className="text-xs opacity-60">{a.detail}</div></div><div className="flex gap-1"><button onClick={()=>approve(a)} className="bg-emerald-500 text-white px-3 py-2.5 rounded-full text-sm font-bold min-h-[44px]">Approve</button><button onClick={()=>deny(a)} className="bg-red-500 text-white px-3 py-2.5 rounded-full text-sm font-bold min-h-[44px]">Reject</button></div></div>)}</div>;
    if(msg.kind==='sources') return <div className="mt-3 space-y-2"><ul className="list-disc pl-5 text-sm space-y-1"><li>Start with the highest-stakes item first, then the quick wins.</li><li>Keep approvals in one queue so nothing is paid twice.</li><li>Ask Gemini for a plan before booking anything high-stakes.</li></ul><div className="flex flex-wrap gap-2">{(msg.chips||[]).map(c=><span key={c} className="chip px-3 py-2 rounded-full text-xs">{c} · grounded</span>)}</div></div>;
    return null;
  }
  function GeminiPanel(){ return <div className="flex flex-col min-h-0 flex-1">
    <div className="flex-1 overflow-y-auto px-1 py-1 space-y-2.5 min-h-[240px]">{geminiMsgs.map((m,i)=><div key={i} className={`rounded-2xl px-3 py-3 text-[15px] leading-relaxed ${m.role==='user'?'bg-blue-600 text-white ml-6':'bg-white/5 border border-white/10'}`}><div>{m.text}</div>{Widget({msg:m})}</div>)}{thinking&&<div className="bg-white/5 rounded-2xl px-3 py-3 think flex gap-1"><span/><span/><span/></div>}</div>
    <div className="flex gap-2 overflow-x-auto no-scrollbar py-3">{suggested.map(s=><button key={s} onClick={()=>askGemini(s)} className="chip px-3 py-2.5 rounded-full text-sm whitespace-nowrap min-h-[44px]">{s}</button>)}</div>
    <div className="flex gap-2"><input value={geminiInput} onChange={e=>setGeminiInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&askGemini()} placeholder="Ask Gemini…" className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-full px-4 py-3 text-[15px] min-h-[48px]"/><button aria-label="Send to Gemini" onClick={()=>askGemini()} className="google-bg text-white w-12 h-12 rounded-full flex items-center justify-center shrink-0"><Send size={18}/></button></div>
  </div>; }

  function ActivityPanel(){ return <div className="space-y-4">
    <div><h3 className="font-bold text-[16px] flex gap-2 items-center"><Activity size={20}/> Agent Activity Feed / Decision Log</h3><p className="text-sm text-[var(--muted)] mt-1">Every action shows why it happened. Solid line = high confidence. Hatched line = low confidence.</p></div>
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">{['All','Gmail','Drive','Calendar','Search'].map(f=><button key={f} onClick={()=>setFeedFilter(f)} className={`px-3 py-2.5 rounded-full text-sm whitespace-nowrap min-h-[44px] ${feedFilter===f?'bg-white text-black font-bold':'chip'}`}>{f}</button>)}</div>
    <div className="space-y-3">{filteredFeed.map(f=><div key={f.id} className="rounded-2xl border border-white/10 bg-white/[.03] p-4"><div className="flex justify-between gap-2"><span className="text-xs px-2 py-1 rounded-full chip">{f.source}</span><span className="text-xs text-white/50">{f.time}</span></div><div className="font-semibold text-[15px] mt-2">{f.text}</div><div className="text-sm text-white/60 mt-1">WHY: {f.why}</div><div className="mt-3 flex items-center gap-2"><span className={`h-1.5 flex-1 rounded-full ${f.conf==='high'?'bg-emerald-500':'bg-[repeating-linear-gradient(45deg,#facc15_0_6px,transparent_6px_12px)] border border-yellow-400/40'}`}/><span className="text-xs">{f.conf==='high'?'High confidence':'Low confidence'}</span></div></div>)}</div>
    <div className="glass rounded-3xl p-4"><h4 className="font-bold text-[16px] flex gap-2"><SlidersHorizontal size={20}/> Autonomy Controls</h4>
      <div className="grid grid-cols-3 gap-1 mt-3 bg-white/5 rounded-full p-1">{(['Full Autonomy','Supervised Autonomy','Approval Required'] as const).map(m=><button key={m} onClick={()=>{setAutonomy(m); log(`Autonomy changed to ${m} · You`); toast(`Autonomy: ${m}`);}} className={`px-2 py-3 rounded-full text-[11px] sm:text-sm font-bold min-h-[48px] leading-tight ${autonomy===m?'google-bg text-white':'text-white/70'}`}>{m}</button>)}</div>
      <p className="text-sm text-white/70 mt-3">{autonomy==='Full Autonomy'?'Full: the agent acts and logs silently. Use only for low-risk, reversible work.':autonomy==='Supervised Autonomy'?'Supervised: low-risk actions auto-approve after a 5-second countdown you can stop. High-stakes actions still ask.':'Approval Required: every action waits for your Approve / Reject. Nothing moves without you.'}</p>
      <p className="text-sm mt-2 bg-blue-500/10 border border-blue-400/20 rounded-xl p-3">Status: <b>{autonomy}</b> · {autonomy==='Full Autonomy'?'Approvals will be logged silently.':autonomy==='Supervised Autonomy'?'Low-risk approvals auto-approve in 5s.':'All approvals stay pending until you decide.'}</p>
      <p className="text-xs text-white/50 mt-2">Progressive delegation: start in Approval Required, move to Supervised as trust grows, and use Full only for narrow, reversible tasks. Confidence legend: solid = high, hatched = low.</p>
      <button onClick={()=>requestApproval('Demo low-risk item',499)} className="mt-3 chip w-full py-3 rounded-full text-sm font-bold min-h-[48px]">Test autonomy with a ₹499 request</button>
    </div>
  </div>; }

  function MoneyPanel(){ return <div className="space-y-4">
    <div className="glass rounded-3xl p-4"><div className="text-sm text-[var(--muted)]">Total Balance</div><div className="text-3xl font-black mt-1">{fmt(balance)}</div><div className="text-sm text-emerald-400 mt-1">↑ Synced · Sandbox · {autonomy}</div><button onClick={()=>requestApproval('Quick Pay',499)} className="mt-4 google-bg text-white px-4 py-3 rounded-full text-[15px] font-bold w-full min-h-[48px]">Pay ₹499 (guarded)</button></div>
    <div className="grid grid-cols-2 gap-3">{[{l:'Spent',v:fmt(spent)},{l:'Saved',v:fmt(savedAmt)}].map(c=><div key={c.l} className="glass rounded-3xl p-4"><div className="text-sm text-[var(--muted)]">{c.l}</div><div className="text-lg font-black mt-1">{c.v}</div></div>)}</div>
    <div className="glass rounded-3xl p-4"><div className="flex justify-between items-center gap-2"><h3 className="font-bold text-[16px]">Approvals · {approvals.length}</h3><button onClick={approveAll} className="text-sm bg-emerald-500 text-white px-4 py-2.5 rounded-full font-bold min-h-[44px]">Approve all</button></div>
      <div className="space-y-3 mt-4">{approvals.length===0?<p className="text-[15px] text-[var(--muted)]">All clear. No pending approvals.</p>:approvals.map(a=><div key={a.id} className="bg-white/[.03] border border-[var(--line)] rounded-2xl p-4"><div className="flex justify-between gap-2"><div className="font-semibold text-[15px]">{a.title}</div>{a.autoIn!==undefined&&<span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded-full h-fit">Auto in {a.autoIn}s</span>}</div><div className="text-sm text-[var(--muted)] mt-1">{a.detail}</div>{a.autoIn!==undefined&&<button onClick={()=>setApprovals(v=>v.map(x=>x.id===a.id?{...x,autoIn:undefined}:x))} className="mt-2 chip px-3 py-2 rounded-full text-sm min-h-[44px]">Stop auto-approval</button>}<div className="grid grid-cols-2 gap-2 mt-3"><button onClick={()=>approve(a)} className="bg-emerald-500 text-white min-h-[48px] px-3 py-3 rounded-full text-[15px] font-bold flex gap-1 items-center justify-center"><Check size={18}/> Approve</button><button onClick={()=>deny(a)} className="bg-red-500 text-white min-h-[48px] px-3 py-3 rounded-full text-[15px] font-bold flex gap-1 items-center justify-center"><Ban size={18}/> Reject</button></div></div>)}</div>
      <h4 className="font-bold mt-6 text-[16px]">Recent transactions</h4><input value={txQ} onChange={e=>setTxQ(e.target.value)} placeholder="Search transactions…" className="w-full mt-3 bg-white/5 border border-[var(--line)] rounded-full px-4 py-3 text-[15px] min-h-[48px]"/>
      <div className="space-y-2 mt-3">{filteredTx.map(t=><div key={t.id} className="flex items-center gap-3 py-2"><span className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-[15px] font-bold shrink-0">{t.icon}</span><div className="flex-1 min-w-0"><div className="text-[15px] font-semibold truncate">{t.name} <span className="text-[var(--muted)] font-normal">· {t.cat}</span></div><div className="text-sm text-[var(--muted)]">{t.rule} · {t.time}</div></div><b className="text-[15px]">−{fmt(t.amount)}</b></div>)}</div>
      <div className="mt-5"><h4 className="font-bold text-[16px]">Audit Log</h4><div className="text-sm space-y-2 mt-2 text-[var(--muted)]">{audit.map((a,i)=><div key={i}>{a}</div>)}</div></div>
    </div>
    <div className="glass rounded-3xl p-4"><h3 className="font-bold text-[16px]">Create order</h3><div className="space-y-2 mt-3"><input value={orderName} onChange={e=>setOrderName(e.target.value)} placeholder="Order name — e.g. Notion Team" className="w-full bg-white/5 border border-[var(--line)] rounded-full px-4 py-3 text-[15px] min-h-[48px]"/><input value={orderAmt} onChange={e=>setOrderAmt(e.target.value)} inputMode="numeric" placeholder="Amount" className="w-full bg-white/5 border border-[var(--line)] rounded-full px-4 py-3 text-[15px] min-h-[48px]"/><button onClick={()=>createOrder()} className="google-bg text-white px-5 py-3 rounded-full text-[15px] font-bold w-full min-h-[48px]">Create order</button></div><div className="space-y-3 mt-4">{orders.map(o=><div key={o.id} className="rounded-2xl border border-[var(--line)] p-3 flex justify-between gap-2 items-center"><div><div className="font-bold text-sm">{o.name}</div><div className="text-xs opacity-60">{o.id} · {o.date} · {o.status}</div></div><div className="flex gap-2 items-center"><b>{fmt(o.amount)}</b><button disabled={o.status==='Refunded'} onClick={()=>refundOrder(o)} className="chip px-3 py-2 rounded-full text-xs min-h-[44px]">Refund</button></div></div>)}</div></div>
  </div>; }

  function ConnectPanel(){ return <div className="space-y-4">
    <div className="rounded-2xl border border-blue-400/30 bg-blue-500/10 p-4"><div className="font-bold text-sm">OAuth client marked <span className="bg-white/10 px-2 py-0.5 rounded">is_agentic</span> for Workspace MCP (Nov 11, 2026)</div><p className="text-sm text-white/70 mt-1">This is a third-party concept prototype. It does not claim real Google login or real data access — all data shown is demo / sandbox data.</p></div>
    <div className="flex items-center justify-between rounded-2xl border border-white/10 p-4"><div><div className="font-bold text-sm">Traffic Light Throttling</div><div className="text-xs text-white/60">Current load state</div></div><button onClick={()=>setTraffic(t=>t==='Green'?'Yellow':t==='Yellow'?'Red':'Green')} className="flex items-center gap-2 chip px-3 py-2 rounded-full min-h-[48px]"><span className={`w-3 h-3 rounded-full ${traffic==='Green'?'bg-emerald-400':traffic==='Yellow'?'bg-yellow-400':'bg-red-500'}`}/><b className="text-sm">{traffic}</b><span className="text-xs opacity-60">Tap to simulate</span></button></div>
    <div className="space-y-3">{CONNECT.map(c=><div key={c.name} className="rounded-2xl border border-white/10 bg-white/[.03] p-4"><div className="flex justify-between gap-2"><b className="text-[15px]">{c.name}</b><span className={`text-xs px-2 py-1 rounded-full h-fit ${c.status==='Connected'?'bg-emerald-500/20 text-emerald-300':'bg-amber-500/20 text-amber-300'}`}>{c.status}</span></div><div className="text-xs font-mono text-white/60 mt-1">{c.scope}</div><p className="text-sm text-white/70 mt-1">{c.desc}</p><p className="text-xs text-white/50 mt-1">Least privilege: only this scope is requested. No broad mailbox or drive access.</p>{c.name==='Gmail'&&<button onClick={()=>setSheet('consent')} className="mt-3 chip px-4 py-2.5 rounded-full text-sm font-bold min-h-[48px]">{gmailModify?'gmail.modify granted ✓':'Request gmail.modify — incremental auth'}</button>}</div>)}</div>
    <div className="glass rounded-3xl p-4"><h4 className="font-bold text-[16px]">Quota meters</h4>
      {[{l:'YouTube',v:32,note:'10,000 units / day'},{l:'Gmail',v:18,note:'6,000 units / min / user'},{l:'Gemini grounding',v:55,note:'$14 / 1k beyond 5k free'}].map(q=><div key={q.l} className="mt-4"><div className="flex justify-between text-sm"><span>{q.l}</span><span className="opacity-60">{q.note}</span></div><div className="h-2.5 bg-white/10 rounded-full mt-2 overflow-hidden"><div className="h-full google-bg transition-all duration-1000" style={{width:quotaOn?`${q.v}%`:'0%'}}/></div><div className="text-xs opacity-60 mt-1">{q.v}% used in this demo</div></div>)}
    </div>
  </div>; }

  function HomeCenter(){ return <div className="animate-slide space-y-4">
    <div className="relative overflow-hidden rounded-[28px] p-4 border border-[var(--line)]" style={{background:'linear-gradient(135deg,#1a2a4a,#3b1f4a 45%,#123a2e)'}}>
      <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full blur-3xl opacity-40 google-bg" style={{animation:'float 6s ease-in-out infinite'}}/>
      <div className="relative"><span className="chip rounded-full px-3 py-2 text-sm">Google Agentic Browser · Gemini inside</span>
      <h1 className="text-[clamp(2rem,9vw,2.75rem)] leading-[1.05] font-black mt-4">Touch grass.<br/><span className="google-grad">But faster.</span></h1>
      <p className="text-white/80 mt-3 text-[15px] leading-relaxed">Search, browse, pay — agentic. Your AI. Your Money. Your Rules.{space!=='All'&&` · Viewing the ${space} space.`}</p>
      <form onSubmit={e=>{e.preventDefault(); askGemini(askBox);}} className="mt-5 flex gap-2 bg-white rounded-full p-1.5 shadow-xl min-h-[52px] items-center"><Search className="ml-2 shrink-0 text-gray-500" size={20}/><input value={askBox} onChange={e=>setAskBox(e.target.value)} placeholder="Ask Gemini…" className="flex-1 min-w-0 bg-transparent text-gray-900 placeholder:text-gray-400 outline-none text-[15px]"/><button className="google-bg text-white px-4 py-2.5 rounded-full text-sm font-bold min-h-[44px]">Ask</button></form>
      <div className="flex flex-wrap gap-2 mt-4">{suggested.map(s=><button key={s} onClick={()=>askGemini(s)} className="bg-white/10 border border-white/20 px-3 py-2.5 rounded-full text-sm min-h-[44px]">{s}</button>)}</div>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3">{[{l:'Focus streak',v:'12 days',i:Timer},{l:'Trackers blocked',v:'184',i:Shield},{l:'Total Balance',v:fmt(balance),i:Wallet},{l:'Pending Approvals',v:String(approvals.length),i:Bell}].map(c=><div key={c.l} className="glass rounded-3xl p-4"><c.i size={22} className="text-blue-400"/><div className="text-xl font-black mt-2">{c.v}</div><div className="text-sm text-[var(--muted)]">{c.l}</div></div>)}</div>
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="glass rounded-3xl p-4"><div className="flex justify-between items-center gap-2"><h3 className="font-bold flex gap-2 items-center text-[16px]"><MessageSquare size={20}/> Quick Notes</h3><span className="text-xs text-[var(--muted)]">{apiStatus}</span></div>
        <div className="flex gap-2 mt-3"><input value={noteInput} onChange={e=>setNoteInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addNote()} placeholder="Add a note…" className="flex-1 min-w-0 bg-white/5 border border-[var(--line)] rounded-full px-4 py-3 text-[15px] min-h-[48px]"/><button onClick={addNote} className="google-bg text-white px-5 rounded-full text-[15px] font-bold min-h-[48px]">Add</button></div>
        <div className="space-y-2 mt-3">{notes.map(n=><div key={n.id} className="flex items-center gap-2 bg-white/[.03] border border-[var(--line)] rounded-2xl px-3 py-3"><button aria-label={n.done?'Mark not done':'Mark done'} onClick={()=>toggleNote(n)} className={`w-11 h-11 rounded-full border flex items-center justify-center shrink-0 ${n.done?'bg-emerald-500 border-emerald-500':'border-white/30'}`}>{n.done&&<Check size={18}/>}</button><span className={`flex-1 min-w-0 text-[15px] ${n.done?'line-through opacity-50':''}`}>{n.text}</span><button aria-label="Delete note" onClick={()=>deleteNote(n)} className="text-[var(--muted)] w-11 h-11 flex items-center justify-center shrink-0"><X size={20}/></button></div>)}</div>
      </div>
      <div className="glass rounded-3xl p-4"><h3 className="font-bold flex gap-2 items-center text-[16px]"><Zap size={20}/> Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2 mt-3">{[{l:'Open Money OS',a:goMoney},{l:'Approve all',a:approveAll},{l:'New Tab',a:newTab},{l:'Clean up tabs',a:cleanTabs}].map(b=><button key={b.l} onClick={b.a} className="chip rounded-2xl px-3 py-3 text-[15px] text-left hover:bg-white/10 min-h-[48px]">{b.l}</button>)}</div>
        <div className="mt-5"><div className="flex justify-between text-[15px]"><span>Focus Timer</span><b>{mm}:{ss}</b></div><div className="h-2.5 bg-white/10 rounded-full mt-2 overflow-hidden"><div className="h-full google-bg" style={{width:`${(focusSec/(25*60))*100}%`}}/></div><div className="flex gap-2 mt-3"><button onClick={()=>setFocusRunning(v=>!v)} className="flex-1 chip px-4 py-3 rounded-full text-[15px] min-h-[48px]">{focusRunning?'Pause focus':'Start focus'}</button><button onClick={()=>{setFocusRunning(false); setFocusSec(25*60);}} className="chip px-4 py-3 rounded-full text-[15px] min-h-[48px]">Reset</button></div></div>
      </div>
    </div>
    <div className="glass rounded-3xl p-4"><h3 className="font-bold text-[16px] flex gap-2 items-center"><FlaskConical size={20}/> Roadmap</h3><p className="text-sm text-[var(--muted)] mt-1">Tap a phase to expand its capabilities.</p><div className="space-y-2 mt-3">{ROADMAP.map((r,i)=><div key={r.phase} className="rounded-2xl border border-white/10 overflow-hidden"><button onClick={()=>setExpandedPhase(expandedPhase===i?-1:i)} className="w-full flex justify-between items-center p-4 text-left min-h-[52px]"><span><span className="block font-bold text-[15px]">{r.phase}</span><span className="block text-sm opacity-60">{r.title}</span></span><span className="flex items-center gap-2"><span className="text-xs chip px-2 py-1 rounded-full">{r.status}</span>{expandedPhase===i?<ChevronDown size={18}/>:<ChevronRight size={18}/>}</span></button>{expandedPhase===i&&<ul className="px-4 pb-4 space-y-1 text-sm text-white/70">{r.items.map(x=><li key={x}>• {x}</li>)}</ul>}</div>)}</div></div>
    <div className="glass rounded-3xl p-4"><h3 className="font-bold text-[16px]">Compliance — prototype disclosure</h3><p className="text-sm text-white/70 mt-2">Third-party concept prototype - not an official Google product. No real Google login, no real data access. All data is demo / sandbox data.</p>
      <div className="flex flex-wrap gap-2 mt-3"><button onClick={()=>setSheet('compliance')} className="chip px-4 py-3 rounded-full text-sm min-h-[48px]">Privacy controls</button><button onClick={()=>setSheet('compliance')} className="chip px-4 py-3 rounded-full text-sm min-h-[48px]">Consent log</button><button onClick={()=>setSheet('erase')} className="bg-red-500/20 text-red-200 px-4 py-3 rounded-full text-sm font-bold min-h-[48px]">Erase My Data</button></div>
      <p className="text-xs text-white/50 mt-3">GDPR Art. 22: high-stakes actions (payments, bookings, deletions) always allow human review. The agent never sends, pays, or deletes without the approval path shown above.</p>
    </div>
  </div>; }

  function CenterContent(){
    if(activeTab==='money'||mobileView==='money') return MoneyPanel();
    if(mobileView==='gemini') return <div className="glass rounded-3xl p-4 min-h-[520px] flex flex-col">{GeminiPanel()}</div>;
    if(mobileView==='activity') return ActivityPanel();
    if(mobileView==='more') return <div className="space-y-3">{ConnectPanel()}<button onClick={()=>setSheet('compliance')} className="chip w-full py-3 rounded-full text-sm min-h-[48px]">Compliance & Privacy</button></div>;
    if(activeTab==='home') return HomeCenter();
    return <div className="animate-slide space-y-4"><div className="glass rounded-3xl p-4"><div className="relative overflow-hidden rounded-2xl google-bg h-28 flex items-end p-4"><span className="relative text-white text-sm font-bold">{active.space} space · {active.domain}</span></div><h1 className="text-3xl font-black mt-4 leading-tight">{active.title}</h1><p className="text-[var(--muted)] mt-2 text-[15px]">This is a sandbox tab preview. Ask Gemini for a summary, or open Money OS for guarded checkout.</p><button onClick={()=>{setRightTab('Gemini'); askGemini('Summarize this page');}} className="google-bg text-white w-full min-h-[48px] px-4 py-3 rounded-full text-[15px] font-bold flex items-center justify-center gap-2 mt-4"><Sparkles size={18}/> Ask Gemini about this tab</button><button onClick={goMoney} className="chip w-full min-h-[48px] px-4 py-3 rounded-full text-[15px] mt-2">Open Money OS →</button></div><div className="glass rounded-3xl p-4"><div className="font-bold flex gap-2 items-center"><ShoppingBag size={20}/> Pay with guarded checkout</div><p className="text-sm text-[var(--muted)] mt-2">Mode: {autonomy} · {autonomy==='Full Autonomy'?'Will log silently':autonomy==='Supervised Autonomy'?'Low-risk auto-approves in 5s':'Will wait for approval'}</p><button onClick={()=>requestApproval(active.title,499)} className="bg-emerald-500 text-white w-full min-h-[48px] px-5 py-3 rounded-full font-bold text-[15px] mt-4">Request approval — ₹499</button></div></div>;
  }
  function RightPanel(){ return <div className="flex flex-col min-h-0">
    <div className="flex gap-1 bg-white/5 rounded-full p-1">{(['Gemini','Features','Wallet','Connect'] as const).map(t=><button key={t} onClick={()=>setRightTab(t)} className={`flex-1 px-2 py-3 rounded-full text-[13px] font-bold min-h-[48px] ${rightTab===t?'bg-white text-black':'text-white/70'}`}>{t}</button>)}</div>
    <div className="mt-3 flex-1 min-h-0 overflow-y-auto pr-1">{rightTab==='Gemini'&&{GeminiPanel()}}{rightTab==='Features'&&<>{ActivityPanel()}<div className="mt-4">{ConnectPanel()}</div></>}{rightTab==='Wallet'&&{MoneyPanel()}}{rightTab==='Connect'&&{ConnectPanel()}}</div>
  </div>; }

  const sheetTitle = sheet==='gemini'?'Gemini':sheet==='activity'?'Activity':sheet==='more'?'More':sheet==='compliance'?'Privacy & Compliance':sheet==='consent'?'Consent — gmail.modify':sheet==='erase'?'Erase My Data':'';
  return <div data-safe-area-inset-root style={{boxSizing:'border-box',paddingTop:'var(--safe-area-inset-top)',minHeight:'100vh',background:'#0b0e14',color:'#eef1f6'}} className="overflow-x-clip relative">
    <div className="relative z-10 mx-auto flex items-start justify-center gap-4 px-0 lg:px-4 lg:py-4">
      <aside className="hidden lg:block w-[264px] shrink-0 sticky top-4 space-y-3">
        <div className="glass rounded-3xl p-4"><div className="flex justify-between items-center"><b className="text-[15px]">Spaces</b><button onClick={()=>setSpace('All')} className="text-sm text-blue-400 min-h-[44px] px-2">All</button></div><div className="mt-2 space-y-1">{SPACES.map(s=><button key={s.name} onClick={()=>{setSpace(s.name); setMobileView('home');}} className={`w-full flex items-center gap-2.5 px-3 py-3 rounded-2xl text-left text-[15px] min-h-[48px] ${space===s.name?'bg-white/10 font-bold':'hover:bg-white/5'}`}><s.icon size={18} style={{color:s.color}}/><span className="flex-1">{s.name}</span><span className="text-xs opacity-50">{s.desc}</span></button>)}</div><p className="text-xs opacity-50 mt-2 px-1">Filtering: {space} · {space==='All'?txs.length:txs.filter(t=>t.space===space).length} transactions</p></div>
        <div className="glass rounded-3xl p-4"><div className="flex justify-between"><b className="text-[15px] flex gap-1.5"><Wallet size={18}/> Wallet Snapshot</b><span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300">Sandbox</span></div><div className="text-2xl font-black mt-2">{fmt(balance)}</div><div className="grid grid-cols-2 gap-2 mt-3 text-sm"><div className="chip rounded-xl p-2">Spent<br/><b>{fmt(spent)}</b></div><div className="chip rounded-xl p-2">Saved<br/><b>{fmt(savedAmt)}</b></div></div><button onClick={()=>requestApproval('Quick Pay',499)} className="google-bg text-white w-full py-3 rounded-full text-[15px] font-bold mt-3 min-h-[48px]">Pay</button><p className="text-xs opacity-50 mt-2">Approvals update this balance, Spent and the stats everywhere.</p></div>
        <div className="glass rounded-3xl p-4"><b className="text-[15px]">Pinned Apps</b><div className="grid grid-cols-4 gap-2 mt-3">{[{n:'Gmail',i:Mail,c:'#EA4335'},{n:'Figma',i:Figma,c:'#a259ff'},{n:'GitHub',i:Github,c:'#fff'},{n:'YouTube',i:Youtube,c:'#EA4335'}].map(p=><button key={p.n} onClick={()=>{toast(`${p.n} opened (demo)`);}} className="flex flex-col items-center gap-1 py-2 rounded-xl hover:bg-white/5 min-h-[52px]"><span className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><p.i size={18} style={{color:p.c}}/></span><span className="text-[11px]">{p.n}</span></button>)}</div></div>
      </aside>

      <div className="w-full max-w-[430px] shrink-0 lg:max-w-[620px] lg:rounded-[28px] lg:border lg:border-white/15 lg:shadow-2xl" style={{background:'#0b0e14'}}>
        <header data-safe-area-sticky-top style={{top:'var(--safe-area-inset-top)'}} className="sticky z-30 backdrop-blur-xl border-b border-white/10 bg-[#0b0e14]/90">
          <div className="px-3 pt-3 pb-2">
            <div className="flex items-center gap-2"><span className="w-11 h-11 rounded-full google-bg text-white flex items-center justify-center font-black text-xl shrink-0">G</span><div className="flex-1 min-w-0"><div className="font-black leading-tight truncate text-[15px]">Google Agentic Browser</div><div className="text-xs text-[var(--muted)] truncate">{active.domain}</div></div><button onClick={()=>setSheet('compliance')} className="chip px-3 py-2 rounded-full text-xs min-h-[44px]">Prototype</button></div>
            <button onClick={goMoney} className="bg-emerald-500 text-white px-3 py-2.5 rounded-full text-sm font-bold min-h-[44px] mt-2 w-full">Balance {fmt(balance)} <span className="opacity-80 font-normal">· Sandbox</span></button>
          </div>
          <div className="flex items-center gap-2 px-3 pb-2"><div className="flex gap-2 overflow-x-auto no-scrollbar flex-1 min-w-0 py-1">{tabs.map(t=><div key={t.id} className={`flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-full whitespace-nowrap shrink-0 ${activeTab===t.id?'bg-white text-black font-bold':'chip'}`}><button onClick={()=>{setActiveTab(t.id); setMobileView('home');}} className="flex items-center gap-1.5 min-h-[36px]"><span className="w-6 h-6 rounded-full google-bg text-white flex items-center justify-center text-[10px] font-black">{t.fav}</span><span className="max-w-[100px] truncate text-sm">{t.title}</span></button><button aria-label={`Close ${t.title}`} onClick={()=>closeTab(t.id)} className="w-9 h-9 flex items-center justify-center rounded-full"><X size={16}/></button></div>)}</div><button onClick={newTab} aria-label="New tab" className="w-11 h-11 rounded-full google-bg text-white flex items-center justify-center shrink-0"><Plus size={20}/></button></div>
          <div className="px-3 pb-3"><div className="flex items-center gap-1 bg-white/10 border border-white/10 rounded-full px-3 py-1.5 min-h-[52px]"><Lock size={16} className="text-emerald-400 shrink-0"/><input value={askBox} onChange={e=>setAskBox(e.target.value)} onKeyDown={e=>e.key==='Enter'&&askGemini(askBox)} placeholder={active.domain} className="bg-transparent flex-1 min-w-0 text-[15px] outline-none placeholder:text-white/50"/><button aria-label="Voice search" onClick={()=>toast('Voice search is listening…')} className="w-11 h-11 flex items-center justify-center shrink-0"><Mic size={18}/></button><button aria-label="Ask Gemini" onClick={()=>askGemini(askBox||'Summarize this page')} className="w-11 h-11 rounded-full google-bg text-white flex items-center justify-center shrink-0"><Sparkles size={18}/></button><button onClick={()=>setPalette(true)} className="chip px-2.5 py-2 rounded-full text-xs font-bold min-h-[44px] shrink-0 flex items-center gap-1"><Command size={14}/> ⌘K</button></div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pt-2"><button onClick={()=>setSpace('All')} className={`px-3 py-2.5 rounded-full text-sm whitespace-nowrap min-h-[44px] ${space==='All'?'bg-white text-black font-bold':'chip'}`}>All spaces</button>{SPACES.map(s=><button key={s.name} onClick={()=>setSpace(s.name)} className={`px-3 py-2.5 rounded-full text-sm whitespace-nowrap min-h-[44px] ${space===s.name?'bg-white text-black font-bold':'chip'}`}>{s.name}</button>)}</div></div>
        </header>
        <main className="px-4 pt-4 pb-32 lg:pb-8">{CenterContent()}</main>
      </div>

      <aside className="hidden lg:block w-[380px] shrink-0 sticky top-4 glass rounded-3xl p-4 max-h-[calc(100vh-2rem)] overflow-y-auto">{RightPanel()}</aside>
    </div>

    <nav className="lg:hidden fixed bottom-0 left-1/2 -translate-x-1/2 z-40 w-full max-w-[430px] bg-[#12161f]/95 backdrop-blur border-t border-white/10 flex justify-around px-1 pt-1 pb-2">
      <button onClick={goHome} className="flex flex-col items-center gap-0.5 min-w-[64px] min-h-[52px] justify-center text-[12px]"><Home size={22}/> Home</button>
      <button onClick={goMoney} className="flex flex-col items-center gap-0.5 min-w-[64px] min-h-[52px] justify-center text-[12px]"><Wallet size={22}/> Money</button>
      <button onClick={()=>{setMobileView('gemini'); setRightTab('Gemini');}} aria-label="Open Gemini" className="relative -top-5 w-16 h-16 rounded-full google-bg text-white flex items-center justify-center shadow-2xl border-4 border-[#0b0e14] shrink-0"><Sparkles size={26}/></button>
      <button onClick={()=>setMobileView('activity')} className="flex flex-col items-center gap-0.5 min-w-[64px] min-h-[52px] justify-center text-[12px]"><Activity size={22}/> Activity</button>
      <button onClick={()=>setSheet('more')} className="flex flex-col items-center gap-0.5 min-w-[64px] min-h-[52px] justify-center text-[12px]"><MoreHorizontal size={22}/> More</button>
    </nav>

    {(focusRunning&&showPipOnScroll)&&<div className="lg:hidden fixed bottom-[96px] right-3 z-40 glass rounded-2xl p-3 shadow-2xl flex items-center gap-2"><span className="w-9 h-9 rounded-full google-bg flex items-center justify-center"><Timer size={18}/></span><div><div className="font-black text-sm">{mm}:{ss}</div><div className="text-xs opacity-60">Focus · PiP</div></div><button onClick={()=>setFocusRunning(v=>!v)} className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center">{focusRunning?<Pause size={18}/>:<Play size={18}/>}</button><button aria-label="Close PiP" onClick={()=>setShowPipOnScroll(false)} className="w-9 h-9 flex items-center justify-center"><X size={16}/></button></div>}
    {pip&&<div className="hidden lg:block fixed bottom-4 right-4 z-50 glass rounded-3xl p-3 shadow-2xl w-[260px]"><div className="flex justify-between items-center"><b className="text-sm">PiP · Lo-fi Focus</b><button aria-label="Close PiP" onClick={()=>setPip(false)} className="w-11 h-11 flex items-center justify-center"><X size={18}/></button></div><div className="h-20 rounded-2xl google-bg mt-2 flex items-center justify-center"><button aria-label={playing?'Pause':'Play'} onClick={()=>setPlaying(v=>!v)} className="w-11 h-11 bg-white text-black rounded-full flex items-center justify-center">{playing?<Pause size={18}/>:<Play size={18} className="ml-0.5"/>}</button></div><p className="text-xs opacity-60 mt-2">{playing?'Playing':'Paused'} · Focus Timer {mm}:{ss}</p><button onClick={()=>setFocusRunning(v=>!v)} className="mt-2 chip w-full py-2.5 rounded-full text-sm min-h-[44px]">{focusRunning?'Pause timer':'Start timer'}</button></div>}
    {(focusRunning)&&<button onClick={()=>setPip(true)} className="hidden lg:flex fixed bottom-4 left-4 z-40 chip px-4 py-3 rounded-full text-sm min-h-[48px] items-center gap-2"><Timer size={18}/> Focus {mm}:{ss} · Open PiP</button>}

    <div className="fixed bottom-[96px] lg:bottom-6 left-1/2 -translate-x-1/2 z-[60] space-y-2 w-[min(92vw,400px)] pointer-events-none">{toasts.map(t=><div key={t.id} className="bg-white text-black rounded-full px-4 py-3 text-sm font-semibold shadow-2xl flex gap-2 items-center animate-slide"><CheckCircle2 size={18} className="text-emerald-600 shrink-0"/>{t.msg}</div>)}</div>

    {sheet&&<div className="fixed inset-0 z-[65] bg-black/70 backdrop-blur-sm flex justify-center items-end" onClick={()=>setSheet(null)}><div className="w-full max-w-[430px] bg-[#171c28] border border-white/15 rounded-t-[28px] shadow-2xl animate-slide flex flex-col max-h-[88vh] overflow-hidden" onClick={e=>e.stopPropagation()}>
      <div className="pt-2 pb-1 flex justify-center"><span className="w-12 h-1.5 rounded-full bg-white/25"/></div>
      <div className="flex items-center justify-between px-4 pb-2"><div><h3 className="font-black text-lg leading-tight">{sheetTitle}</h3><p className="text-xs text-white/50">{sheet==='more'?'Browser controls':sheet==='compliance'?'Demo / sandbox — no real Google login':'Review before you continue'}</p></div><button aria-label="Close sheet" onClick={()=>setSheet(null)} className="w-11 h-11 flex items-center justify-center"><X size={20}/></button></div>
      <div className="px-4 pb-5 overflow-y-auto flex-1 flex flex-col min-h-0">
        {sheet==='gemini'&&{GeminiPanel()}}{sheet==='activity'&&{ActivityPanel()}}
        {sheet==='more'&&<div className="space-y-3">{ConnectPanel()}<button onClick={()=>setSheet('compliance')} className="chip w-full py-3 rounded-full text-sm min-h-[48px]">Compliance & Privacy</button><button onClick={()=>setSheet('erase')} className="bg-red-500 text-white w-full py-3 rounded-full text-sm font-bold min-h-[48px]">Erase My Data</button></div>}
        {sheet==='compliance'&&<div className="space-y-4"><div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4"><b className="text-[15px]">Third-party concept prototype - not an official Google product</b><p className="text-sm text-white/70 mt-1">No real Google login. No real data access. All content is demo / sandbox data.</p></div>
          <button onClick={()=>{setMinimize(v=>!v); toast(`Data Minimization ${!minimize?'on':'off'} — Bounded Context`);}} className="w-full flex justify-between items-center bg-white/[.03] border border-white/10 rounded-2xl px-4 py-3 min-h-[52px] text-[15px]"><span>Data Minimization <span className="block text-xs opacity-60">Bounded Context — only data needed for the task</span></span><span className={`w-12 h-7 rounded-full p-0.5 flex shrink-0 ${minimize?'justify-end bg-emerald-500':'bg-white/20'}`}><span className="w-6 h-6 bg-white rounded-full"/></span></button>
          <div><h4 className="font-bold text-[15px] mb-2">Consent log</h4><div className="space-y-1 text-sm text-white/60">{consentLog.map((c,i)=><div key={i}>{c}</div>)}</div></div>
          <p className="text-sm text-white/60">GDPR Art. 22 — human review: high-stakes actions always show an approval path. The agent never pays, books, sends, or deletes without that path.</p>
          <button onClick={()=>setSheet('erase')} className="bg-red-500 text-white w-full py-3 rounded-full text-sm font-bold min-h-[48px]">Erase My Data</button></div>}
        {sheet==='consent'&&<div className="space-y-4"><p className="text-sm text-white/70">The agent is asking for one extra, narrow permission. You can deny it and keep using gmail.readonly.</p><div className="rounded-2xl border border-white/10 p-4"><b>gmail.modify</b><p className="text-sm opacity-70 mt-1">Needed to: archive a message you explicitly name. Not needed to: read, search, or draft.</p><p className="text-xs opacity-50 mt-2">Least privilege · Incremental auth · Revocable</p></div><div className="flex gap-2"><button onClick={()=>{setGmailModify(true); setConsentLog(c=>[...c,`${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} · gmail.modify granted · You`]); setSheet(null); toast('gmail.modify granted');}} className="flex-1 bg-emerald-500 text-white py-3 rounded-full text-sm font-bold min-h-[48px]">Allow</button><button onClick={()=>{setConsentLog(c=>[...c,`${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} · gmail.modify denied · You`]); setSheet(null); toast('gmail.modify denied — kept readonly');}} className="flex-1 chip py-3 rounded-full text-sm font-bold min-h-[48px]">Deny</button></div></div>}
        {sheet==='erase'&&<div className="space-y-4"><p className="text-sm text-white/70">This clears your Quick Notes, Gemini chat and Audit Log in this view. Orders are kept as transaction history unless you refund them individually.</p><p className="text-sm font-bold">Are you sure you want to erase your data?</p><div className="flex gap-2"><button onClick={eraseData} className="flex-1 bg-red-500 text-white py-3 rounded-full text-sm font-bold min-h-[48px]">Yes, erase my data</button><button onClick={()=>setSheet(null)} className="flex-1 chip py-3 rounded-full text-sm font-bold min-h-[48px]">Keep my data</button></div></div>}
      </div>
    </div></div>}

    {palette&&<div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex justify-center items-start" onClick={()=>setPalette(false)}><div className="w-full max-w-[430px] bg-[#171c28] border border-white/15 rounded-b-[28px] overflow-hidden shadow-2xl animate-slide" onClick={e=>e.stopPropagation()}><div className="flex gap-2 p-4 border-b border-white/10 items-center min-h-[64px]"><Command size={20} className="text-white/50"/><input autoFocus value={paletteQ} onChange={e=>setPaletteQ(e.target.value)} placeholder="Search commands…" className="flex-1 bg-transparent outline-none text-[16px] min-w-0"/><button aria-label="Close palette" onClick={()=>setPalette(false)} className="w-11 h-11 flex items-center justify-center"><X size={18}/></button></div><div className="max-h-[55vh] overflow-y-auto p-2">{commands.map(c=><button key={c.label} onClick={()=>{setPalette(false); setPaletteQ(''); runCommand(c.key);}} className="w-full text-left px-3 py-3 rounded-xl hover:bg-white/10 flex justify-between text-[15px] min-h-[48px]"><span>{c.label}</span><span className="text-white/40">↵</span></button>)}{commands.length===0&&<p className="p-4 text-sm text-white/50">No commands found.</p>}</div><div className="p-3 border-t border-white/10 text-xs text-white/40 flex justify-between"><span>Google Agentic Browser · ⌘K</span><span>Prototype · Sandbox</span></div></div></div>}
  </div>;
}
