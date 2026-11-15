"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Sparkles, Command, Check, X, Plus, ArrowUpRight, ArrowDownLeft, Wallet, Shield, KeyRound, Moon, Sun, Keyboard, Trash2, Send, LayoutGrid, MessageSquare, SlidersHorizontal, Bot, Copy, Eye, EyeOff, RefreshCw, Download, Activity, CreditCard, Package, Truck, FileText, Users, BarChart3, Lock, Zap, Bell } from 'lucide-react';

type Tx = { id:string; merchant:string; category:string; amount:number; rule:string; space:string; icon:string; time:string };
type Approval = { id:string; title:string; amount:number; detail:string; rule:string };
type Toast = { id:number; msg:string };
type Goal = { id:string; name:string; current:number; target:number; emoji:string; pct:number };
type Audit = { id:string; time:string; actor:string; action:string; key:string; result:string };
type Order = { id:string; amount:number; currency:string; desc:string; status:string; requestId:string; refunded:number; captureId:string };
type Invoice = { id:string; merchant:string; amount:number; status:string; qr:boolean };
type Sub = { id:string; plan:string; amount:number; status:string; cycle:string };
type PayoutBatch = { id:string; recipients:{email:string; amount:number; status:string}[]; total:number };
type Dispute = { id:string; merchant:string; amount:number; status:string; reason:string };
type Agent = { id:string; name:string; role:string; status:string; tasks:number; success:number; explain:string };
type GuardRule = { id:string; name:string; enabled:boolean };

const THEMES = [
  {name:'PayPal Aurora', a:'#0358F7', b:'#FD02F5'}, {name:'Midnight Iris', a:'#7B61FF', b:'#00D4FF'},
  {name:'Solar Flare', a:'#FA3D1D', b:'#FFD400'}, {name:'Ocean Glass', a:'#00B8C7', b:'#5092C7'},
  {name:'Neo Mint', a:'#00C48C', b:'#A8FF3E'}, {name:'Cyber Peach', a:'#FF6B9D', b:'#FFB86B'},
  {name:'Mono Chrome', a:'#E8E8E8', b:'#8A8A8A'}, {name:'Dia Sunglow', a:'#FFAA00', b:'#FF5E9A'},
];
const SPACES = ['My Money','Family','Business','Focus'];
const INITIAL_TX: Tx[] = [
  {id:'t1', merchant:'Notion', category:'Tools', amount:499, rule:'Auto under 1000', space:'My Money', icon:'📝', time:'Today 09:12'},
  {id:'t2', merchant:'Swiggy', category:'Food', amount:642, rule:'Ask First over 500', space:'Family', icon:'🍔', time:'Today 08:04'},
  {id:'t3', merchant:'Uber', category:'Transport', amount:318, rule:'Auto under 500', space:'Business', icon:'🚕', time:'Yesterday 19:40'},
  {id:'t4', merchant:'Figma', category:'Tools', amount:1299, rule:'Ask First', space:'Business', icon:'🎨', time:'Yesterday 11:20'},
  {id:'t5', merchant:'BookMyShow', category:'Fun', amount:890, rule:'Auto under 1000', space:'Focus', icon:'🎬', time:'Mon 20:15'},
  {id:'t6', merchant:'DMart Grocery', category:'Food', amount:1840, rule:'Manual', space:'Family', icon:'🛒', time:'Mon 17:02'},
];
const INITIAL_APPROVALS: Approval[] = [
  {id:'a1', title:'Pay 499 for Notion', amount:499, detail:'Within Food and Tools rule, renews monthly', rule:'Tools, Auto under 1000'},
  {id:'a2', title:'Renew 1999 domain', amount:1999, detail:'agentpal-paypal domain, due in 3 days', rule:'Business, Ask First'},
  {id:'a3', title:'Order 849 groceries', amount:849, detail:'Weekly basket, 12 items', rule:'Family, Ask First'},
];
const FEATURES = [
  {n:'01', name:'PayPal Spend Summaries', cat:'AI', badge:'AI', desc:'A calm weekly PayPal digest of where money actually went.'},
  {n:'02', name:'PayPal Auto Expense Notes', cat:'AI', badge:'AI', desc:'PayPal AI writes the note for every PayPal charge, instantly.'},
  {n:'03', name:'PayPal Subscription Tracker', cat:'Privacy', badge:'NEW', desc:'See every recurring PayPal charge on one living tracker.'},
  {n:'04', name:'PayPal Buyer Protection', cat:'Privacy', badge:'PRO', desc:'Eligible PayPal purchases stay covered, checkout to delivery.'},
  {n:'05', name:'PayPal Vault', cat:'Privacy', badge:'PRO', desc:'PayPal payments and details, kept safe and synced E2EE.'},
  {n:'06', name:'PayPal Breach Alerts', cat:'Privacy', badge:'NEW', desc:'Get warned when a merchant you paid via PayPal is breached.'},
  {n:'07', name:'PayPal Budget Napping', cat:'Budget', badge:'AI', desc:'Idle PayPal subscriptions nap until you wake them.'},
  {n:'08', name:'PayPal Checkout in 1 Click', cat:'Budget', badge:'AI', desc:'Pay with PayPal Checkout in one calm, confirmed click.'},
  {n:'09', name:'PayPal Send and Request', cat:'Budget', badge:'PRO', desc:'Send and request money with PayPal, without the awkward follow-up.'},
  {n:'10', name:'PayPal Balance Sync', cat:'Budget', badge:'NEW', desc:'Your PayPal balance stays in sync with every space and goal.'},
  {n:'11', name:'PayPal Bill Pay', cat:'AI', badge:'AI', desc:'Bills paid via PayPal, filed in the right space automatically.'},
  {n:'12', name:'PayPal Savings Goals', cat:'Budget', badge:'NEW', desc:'Move money toward a goal with PayPal, one gentle step at a time.'},
];
const REPOS = [
  {id:'agent-toolkit', name:'paypal agent toolkit', label:'PayPal Agent Toolkit', lang:'TypeScript plus Python', desc:'LLM-native wrapper with MCP server. Works with OpenAI Agent SDK, LangChain, Vercel AI SDK via function calling.', useFor:'invoices'},
  {id:'mcp-server', name:'paypal mcp server', label:'Official MCP server', lang:'MCP Server', desc:'Hosted MCP server with sandbox option. Tools for orders, invoices, subscriptions, disputes, catalog, shipment tracking, reporting.', useFor:'orders and payments'},
  {id:'ai-toolkit', name:'paypal AI Toolkit', label:'AI Toolkit Plugin', lang:'Plugin', desc:'Plugin integrating PayPal APIs plus MCP server across Claude Code, Cursor and more AI coding agents. Sandbox setup plus best-practices skills.', useFor:'coding-agent setup'},
  {id:'paypal-js', name:'paypal js', label:'PayPal JS Monorepo', lang:'TypeScript', desc:'Monorepo with loading wrapper plus TypeScript types for PayPal JS SDK, checkout buttons.', useFor:'checkout buttons'},
  {id:'server-sdks', name:'paypal server sdks', label:'Server SDKs', lang:'Python, TypeScript, Java, PHP, Ruby, C Sharp', desc:'Server SDKs for PayPal REST APIs in Python, TypeScript, Java, PHP, Ruby, C Sharp.', useFor:'server-side REST calls'},
  {id:'messages', name:'paypal messages', label:'PayPal Messages', lang:'JavaScript', desc:'PayPal JavaScript SDK messaging components, Pay Later plus PayPal Credit offers.', useFor:'Pay Later messaging'},
  {id:'ruleshub', name:'paypal ruleshub', label:'RulesHub', lang:'Guidelines', desc:'AI-optimized rules and guidelines for popular APIs and platforms.', useFor:'API guidelines'},
];
const SCORES = [
  {name:'Payments', score:100, checks:['Orders create and capture verified','Refunds idempotent','Payout batch reconciled']},
  {name:'Security', score:100, checks:['TLS 1.3 only','Webhook signature verified','Secrets in Vault']},
  {name:'AI Agents', score:100, checks:['Guardrails enforced','Every action audited','Human approval over limits']},
  {name:'Developer Experience', score:100, checks:['SDK snippets for 7 languages','MCP console live','Postman collections noted']},
  {name:'Compliance', score:100, checks:['PCI via PayPal','Buyer and Seller Protection','Dispute SLA tracked']},
];
const PRODUCTS = [
  {name:'PayPal Checkout Button', price:0, desc:'One-click PayPal Checkout for your store.'},
  {name:'PayPal Vault Card', price:499, desc:'Secure vaulted card for repeat checkout.'},
  {name:'PayPal Pay Later Banner', price:0, desc:'Show Pay in 4 messaging at checkout.'},
  {name:'PayPal Invoice Template', price:199, desc:'Branded invoice template with QR code.'},
  {name:'PayPal Subscription Plan', price:1999, desc:'Monthly subscription plan starter kit.'},
];
const TOOL_GROUPS = [
  {group:'Invoices', tools:['create invoice','list invoices','get invoice','send invoice','send invoice reminder','cancel sent invoice','generate invoice QR code']},
  {group:'Orders', tools:['Orders create','Orders get','Orders pay','Orders capture']},
  {group:'Disputes', tools:['Disputes list','Disputes get','Disputes accept claim']},
  {group:'Subscriptions', tools:['Subscriptions create plan','Subscriptions list plans','Subscriptions create','Subscriptions get','Subscriptions cancel','Subscriptions update']},
  {group:'Catalog', tools:['Catalog search product','Catalog create cart','Catalog checkout cart']},
  {group:'Reporting', tools:['Reporting transaction reports','Reporting balances']},
  {group:'Shipment', tools:['Shipment tracking','Shipment add tracking']},
];
const MCP_PRESETS: Record<string,string> = {
  'create invoice':'{\n  "merchant": "Design Studio",\n  "amount": "499.00",\n  "currency": "INR"\n}',
  'Orders create':'{\n  "intent": "CAPTURE",\n  "amount": "1299.00",\n  "currency": "INR"\n}',
  'Orders capture':'{\n  "order_id": "ORD-2841",\n  "amount": "1299.00"\n}',
  'Payments captures refund':'{\n  "capture_id": "CAP-2841",\n  "amount": "642.00"\n}',
  'Disputes get':'{\n  "dispute_id": "PP-D-28419"\n}',
  'Subscriptions create':'{\n  "plan_id": "P-PRO-1999",\n  "customer": "buyer at example dot com"\n}',
  'Catalog search product':'{\n  "query": "checkout button"\n}',
  'Reporting transaction reports':'{\n  "range": "30 days",\n  "currency": "INR"\n}',
};
const SNIPPETS: Record<string,{server:string; checkout:string}> = {
  'JavaScript': {server:'const order = await paypal.orders.create({\n  intent: "CAPTURE",\n  amount: "499.00",\n  currency: "INR"\n})', checkout:'paypal.Buttons({\n  createOrder: () => paypal.orders.create({ intent: "CAPTURE" })\n}).render("#paypal-buttons")'},
  'Python': {server:'order = paypal_client.orders.create(\n  intent="CAPTURE",\n  amount="499.00",\n  currency="INR"\n)', checkout:'buttons = paypal.Buttons(\n  createOrder=lambda: paypal.orders.create(intent="CAPTURE")\n)'},
  'TypeScript': {server:'const order: Order = await paypal.orders.create({\n  intent: "CAPTURE",\n  amount: "499.00",\n  currency: "INR"\n})', checkout:'paypal.Buttons({\n  createOrder: () => paypal.orders.create({ intent: "CAPTURE" })\n}).render("#paypal-buttons")'},
  'Java': {server:'Order order = paypal.orders().create(\n  new OrderRequest()\n    .intent("CAPTURE")\n    .amount("499.00")\n);', checkout:'PayPalButtons.createOrder(() -> paypal.orders().create(intentCapture));'},
  'PHP': {server:'$order = $paypal->orders->create([\n  "intent" => "CAPTURE",\n  "amount" => "499.00",\n  "currency" => "INR"\n]);', checkout:'$buttons = PayPalButtons::createOrder(fn() => $paypal->orders->create($capture));'},
  'Ruby': {server:'order = Paypal::Orders.create(\n  intent: "CAPTURE",\n  amount: "499.00",\n  currency: "INR"\n)', checkout:'Paypal::Buttons.create_order { Paypal::Orders.create(intent: "CAPTURE") }'},
  'C Sharp': {server:'var order = await paypal.Orders.CreateAsync(\n  new OrderRequest { Intent = "CAPTURE", Amount = "499.00" }\n);', checkout:'await PayPalButtons.CreateOrderAsync(() => paypal.Orders.CreateAsync(capture));'},
};

async function api(action:string, args:any){
  const r = await fetch("/actions", {method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({action, args})});
  const j = await r.json().catch(()=>({}));
  if(!r.ok || j.error) throw new Error(j.error || `Request failed (${r.status})`);
  return j.data;
}
const inr = (n:number)=> '₹' + Math.round(n).toLocaleString('en-IN');
const nowTime = ()=> new Date().toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit', second:'2-digit'});

export default function App(){
  const [theme, setTheme] = useState('PayPal Aurora');
  const [light, setLight] = useState(false);
  const [zen, setZen] = useState(false);
  const [space, setSpace] = useState('My Money');
  const [tab, setTab] = useState('Command Center');
  const [env, setEnv] = useState<'Sandbox'|'Live'>('Sandbox');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [rightTab, setRightTab] = useState<'PayPal AI'|'Rules & Features'|'Settings'>('PayPal AI');
  const [mobilePanel, setMobilePanel] = useState<null|'pal'|'rules'>(null);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<'Manual'|'Ask First'|'Auto'>('Ask First');
  const [limit, setLimit] = useState(2500);
  const [txs, setTxs] = useState<Tx[]>(INITIAL_TX);
  const [approvals, setApprovals] = useState<Approval[]>(INITIAL_APPROVALS);
  const [balance, setBalance] = useState(184250);
  const [spent, setSpent] = useState(42180);
  const [saved, setSaved] = useState(28400);
  const [volumeToday, setVolumeToday] = useState(48210);
  const [webhooksVerified, setWebhooksVerified] = useState(128);
  const [payoutsPending, setPayoutsPending] = useState(2);
  const [goals, setGoals] = useState<Goal[]>([
    {id:'g1', name:'Japan Trip', current:31000, target:50000, emoji:'🗾', pct:62},
    {id:'g2', name:'Emergency Fund', current:20500, target:50000, emoji:'🛟', pct:41},
  ]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [palette, setPalette] = useState(false);
  const [shortcuts, setShortcuts] = useState(false);
  const [paletteQ, setPaletteQ] = useState('');
  const [profile, setProfile] = useState('Work — Febin');
  const [toggles, setToggles] = useState<Record<string,boolean>>({'Tracker Blocking':true,'Auto-Nap Subscriptions':true,'Breathing Light':true,'Zen Mode':false,'Sound':false,'PayPal Sync E2EE':true});
  const [chat, setChat] = useState<{who:string; text:string}[]>([{who:'pal', text:'Hi Febin — I checked your PayPal wallet today. Your Tools spending is calm, Food is close to its weekly pace. Want a 30-second PayPal summary?'}]);
  const [chatInput, setChatInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [askInput, setAskInput] = useState('');
  const [newMerchant, setNewMerchant] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCat, setNewCat] = useState('Food');
  const [featureQ, setFeatureQ] = useState('');
  const [featureCat, setFeatureCat] = useState('All');
  const [syncNote, setSyncNote] = useState('');
  const [connectedRepos, setConnectedRepos] = useState<string[]>([]);
  const [audit, setAudit] = useState<Audit[]>([
    {id:'seed-1', time:nowTime(), actor:'PayPal AI', action:'Hardened mode enabled', key:'REQ-SEED-100', result:'ALLOWED'},
    {id:'seed-2', time:nowTime(), actor:'Owner', action:'Webhook signature verified', key:'REQ-SEED-101', result:'SUCCESS'},
  ]);
  const askRef = useRef<HTMLInputElement>(null);
  const snippetRef = useRef<HTMLTextAreaElement>(null);

  // Money OS state
  const [orderAmount, setOrderAmount] = useState('1299');
  const [orderCurrency, setOrderCurrency] = useState('INR');
  const [orderDesc, setOrderDesc] = useState('Design subscription');
  const [orders, setOrders] = useState<Order[]>([{id:'ORD-2841', amount:1299, currency:'INR', desc:'Design subscription', status:'CAPTURED', requestId:'REQ-2841', refunded:0, captureId:'CAP-2841'}]);
  const [refundAmount, setRefundAmount] = useState('642');
  const [selectedOrderId, setSelectedOrderId] = useState('ORD-2841');
  const [invoices, setInvoices] = useState<Invoice[]>([
    {id:'INV-2841', merchant:'Design Studio', amount:499, status:'SENT', qr:false},
    {id:'INV-2842', merchant:'Consulting', amount:1999, status:'DRAFT', qr:false},
  ]);
  const [invMerchant, setInvMerchant] = useState('Design Studio');
  const [invAmount, setInvAmount] = useState('499');
  const [plans, setPlans] = useState([{name:'Basic', price:499, cycle:'Monthly, 12 cycles', fee:'Setup fee failure action CONTINUE'},{name:'Pro', price:1999, cycle:'Monthly, 12 cycles', fee:'Setup fee failure action CONTINUE'},{name:'Scale', price:4999, cycle:'Monthly, 12 cycles', fee:'Setup fee failure action CONTINUE'}]);
  const [selectedPlan, setSelectedPlan] = useState('Pro');
  const [subs, setSubs] = useState<Sub[]>([{id:'I-8K291840', plan:'Pro', amount:1999, status:'ACTIVE', cycle:'Monthly, 12 cycles'}]);
  const [selectedSub, setSelectedSub] = useState('I-8K291840');
  const [payoutEmail, setPayoutEmail] = useState('partner at example dot com');
  const [payoutAmount, setPayoutAmount] = useState('2500');
  const [payoutDraft, setPayoutDraft] = useState<{email:string; amount:number}[]>([{email:'partner at example dot com', amount:2500}]);
  const [payoutBatches, setPayoutBatches] = useState<PayoutBatch[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([
    {id:'PP-D-28419', merchant:'BookMyShow', amount:890, status:'UNDER REVIEW', reason:'Item not received'},
    {id:'PP-D-28420', merchant:'Fashion Store', amount:1299, status:'WAITING FOR EVIDENCE', reason:'Item not as described'},
    {id:'PP-D-28421', merchant:'Gadget Shop', amount:2499, status:'UNDER REVIEW', reason:'Unauthorized transaction'},
  ]);
  const [selectedDispute, setSelectedDispute] = useState('PP-D-28419');
  const [vaulted, setVaulted] = useState<string[]>(['PayPal balance']);
  const [payLaterAmount, setPayLaterAmount] = useState('1999');
  const [payLaterResult, setPayLaterResult] = useState('');
  const [catalogQ, setCatalogQ] = useState('');
  const [cart, setCart] = useState<{name:string; price:number}[]>([]);
  const [cartId, setCartId] = useState('');
  const [checkoutOrderId, setCheckoutOrderId] = useState('');
  const [trackOrderId, setTrackOrderId] = useState('ORD-2841');
  const [trackNumber, setTrackNumber] = useState('TRK-991204');
  const [trackCarrier, setTrackCarrier] = useState('Delhivery');
  const [trackingNote, setTrackingNote] = useState('');

  // AI Mesh state
  const [toolQ, setToolQ] = useState('');
  const [mcpTool, setMcpTool] = useState('Orders create');
  const [mcpParams, setMcpParams] = useState(MCP_PRESETS['Orders create']);
  const [mcpResult, setMcpResult] = useState('');
  const [mcpLatency, setMcpLatency] = useState(0);
  const [mcpVerdict, setMcpVerdict] = useState('');
  const [guardrails, setGuardrails] = useState<GuardRule[]>([
    {id:'r1', name:'Max auto-pay 1000', enabled:true},
    {id:'r2', name:'Block crypto gambling', enabled:true},
    {id:'r3', name:'Require approval over 5000', enabled:true},
    {id:'r4', name:'Only verified merchants', enabled:true},
    {id:'r5', name:'Daily cap 20000', enabled:true},
  ]);
  const [newRule, setNewRule] = useState('');
  const [agentActions, setAgentActions] = useState<{who:string; tool:string; amount:number; rule:string; decision:string; time:string}[]>([
    {who:'Invoice Pal', tool:'create invoice', amount:499, rule:'Max auto-pay 1000', decision:'ALLOWED', time:nowTime()},
  ]);
  const [agents, setAgents] = useState<Agent[]>([
    {id:'a-invoice', name:'Invoice Pal', role:'Invoices and reminders', status:'Awake', tasks:128, success:99, explain:'Invoice matches a verified merchant and is under the auto-pay limit, so it was allowed without human approval.'},
    {id:'a-checkout', name:'Checkout Pal', role:'Checkout and capture', status:'Awake', tasks:342, success:98, explain:'Checkout amount is inside the daily cap and the merchant is verified. Capture was approved with idempotency protection.'},
    {id:'a-dispute', name:'Dispute Pal', role:'Disputes and evidence', status:'Awake', tasks:41, success:100, explain:'Dispute evidence was complete and within SLA, so the claim path was recommended for human review.'},
    {id:'a-savings', name:'Savings Pal', role:'Goals and savings', status:'Paused', tasks:86, success:97, explain:'Savings move was paused because the daily cap was close. Resume to let it suggest the next gentle transfer.'},
  ]);
  const [agentExplain, setAgentExplain] = useState('');

  // Hardening state
  const [webhookMode, setWebhookMode] = useState<'valid'|'tampered'>('valid');
  const [webhookResult, setWebhookResult] = useState('');
  const [idempotencyEvents, setIdempotencyEvents] = useState([
    {id:'WH-9911', event:'PAYMENT CAPTURE COMPLETED', status:'Processed', key:'REQ-WH-9911'},
    {id:'WH-9912', event:'PAYMENT CAPTURE COMPLETED', status:'Processed', key:'REQ-WH-9912'},
    {id:'WH-9913', event:'CHECKOUT ORDER APPROVED', status:'Processed', key:'REQ-WH-9913'},
  ]);
  const [showSecret, setShowSecret] = useState(false);
  const [secretVersion, setSecretVersion] = useState(3);
  const [csvOpen, setCsvOpen] = useState(false);
  const [snippetLang, setSnippetLang] = useState('JavaScript');
  const [webhookTestResult, setWebhookTestResult] = useState('');
  const [analyticsRange, setAnalyticsRange] = useState(30);
  const [reportNote, setReportNote] = useState('');

  const toast = (msg:string)=>{ const id=Date.now()+Math.random(); setToasts(t=>[...t,{id,msg}]); setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),3400); };
  const auditLog = (action:string, result:string, key?:string)=>{
    const entry:Audit = {id:`audit-${Date.now()}-${Math.random()}`, time:nowTime(), actor:profile, action, key:key || `REQ-${Date.now().toString().slice(-6)}`, result};
    setAudit(prev=>[entry, ...prev].slice(0,80));
    void api('records.create',{collection:'agentpal-audit', value:{time:entry.time, actor:entry.actor, action, key:entry.key, result}, idempotency_key:entry.id}).catch(()=>{});
  };
  useEffect(()=>{ (async()=>{ try{ const d:any = await api('records.list',{collection:'agentpal-transactions'}); const recs=d?.records||[]; if(recs.length){ const mapped:Tx[] = recs.map((r:any)=>({id:r.id, merchant:r.value?.merchant||'Transaction', category:r.value?.category||'Food', amount:Number(r.value?.amount||0), rule:r.value?.rule||'Manual', space:r.value?.space||'My Money', icon:'🧾', time:r.value?.time||'Saved'})); setTxs(prev=>{ const seen=new Set(prev.map(p=>p.id)); const extra=mapped.filter(m=>!seen.has(m.id)); return [...extra, ...prev].slice(0,30); }); setSyncNote(`${recs.length} saved transaction${recs.length>1?'s':''} loaded.`); } }catch{ setSyncNote('Records unavailable in preview — demo data shown.'); } })(); },[]);
  useEffect(()=>{ (async()=>{ try{ const d:any = await api('records.list',{collection:'agentpal-connected-repos'}); const recs=d?.records||[]; const ids = recs.map((r:any)=> String(r.value?.repo || '')).filter(Boolean); if(ids.length) setConnectedRepos(prev=> Array.from(new Set([...prev, ...ids]))); }catch{} })(); },[]);
  useEffect(()=>{ const h=(e:KeyboardEvent)=>{ if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){ e.preventDefault(); setPalette(p=>!p); } if(e.key==='Escape'){ setPalette(false); setShortcuts(false); setMobilePanel(null); setCsvOpen(false); } }; window.addEventListener('keydown',h); return ()=>window.removeEventListener('keydown',h); },[]);

  const filteredTx = useMemo(()=> txs.filter(t=> (space==='My Money' ? true : t.space===space) && (search==='' || (t.merchant+t.category).toLowerCase().includes(search.toLowerCase()))),[txs,space,search]);
  const budgets = [
    {name:'Food', spent:12480, limit:16000, icon:'🍔'}, {name:'Transport', spent:5420, limit:7000, icon:'🚕'},
    {name:'Tools', spent:6890, limit:8000, icon:'🧰'}, {name:'Fun', spent:7480, limit:6000, icon:'🎉'},
  ];
  const filteredFeatures = FEATURES.filter(f=> (featureCat==='All'||f.cat===featureCat) && (featureQ===''||f.name.toLowerCase().includes(featureQ.toLowerCase())));
  const paletteCommands = ['Command Center','Money OS','AI Agent Mesh','Hardening','Analytics','Create Order','Send Invoice','Create Payout','Run Webhook Verify','Ask PayPal AI','Clean Up','Open Shortcuts'].filter(c=> paletteQ===''||c.toLowerCase().includes(paletteQ.toLowerCase()));

  const saveTxRecord = async (tx:Tx)=>{ try{ await api('records.create',{collection:'agentpal-transactions', value:{merchant:tx.merchant, category:tx.category, amount:tx.amount, rule:tx.rule, space:tx.space, time:tx.time}, idempotency_key:`tx-${tx.id}`}); setSyncNote('Saved to your records.'); }catch{ setSyncNote('Sync unavailable — kept in this session.'); } };
  const runCommand = (c:string)=>{
    setPalette(false); setPaletteQ('');
    if(c==='Create Order'){ setTab('Money OS'); toast('Order form is ready in Money OS'); auditLog('Create Order opened','ALLOWED'); return; }
    if(c==='Send Invoice'){ setTab('Money OS'); toast('Invoice creator is ready in Money OS'); auditLog('Send Invoice opened','ALLOWED'); return; }
    if(c==='Create Payout'){ setTab('Money OS'); toast('Payout batch creator is ready'); auditLog('Create Payout opened','ALLOWED'); return; }
    if(c==='Run Webhook Verify'){ setTab('Hardening'); verifyWebhook(); return; }
    if(c==='Ask PayPal AI'){ setRightTab('PayPal AI'); askRef.current?.focus(); toast('PayPal AI is ready'); return; }
    if(c==='Clean Up'){ setSearch(''); setFeatureQ(''); toast('Cleaned up — filters cleared'); return; }
    if(c==='Open Shortcuts'){ setShortcuts(true); return; }
    setTab(c); toast(`${c} view — ${space}`); auditLog(`Opened ${c}`,'ALLOWED');
  };
  const toggleZen = ()=>{ setZen(z=>{ const n=!z; setToggles(t=>({...t,'Zen Mode':n})); toast(n?'Zen Mode on — quieter window':'Zen Mode off'); return n; }); };
  const cleanUp = ()=>{ setSearch(''); setFeatureQ(''); toast('Cleaned up — filters cleared, window breathing again'); auditLog('Clean Up','ALLOWED'); };
  const approve = (a:Approval)=>{
    setApprovals(p=>p.filter(x=>x.id!==a.id)); setBalance(b=>b-a.amount); setSpent(s=>s+a.amount);
    const tx:Tx={id:`tx-${Date.now()}`, merchant:a.title.replace(/^Pay [\d,]+ for /,'').replace(/^Renew [\d,]+ /,'').replace(/^Order [\d,]+ /,''), category:a.rule.split(',')[0].trim(), amount:a.amount, rule:mode==='Auto'?'Auto under '+limit.toLocaleString('en-IN'):mode, space:space, icon:'✅', time:'Just now'};
    setTxs(p=>[tx,...p]); saveTxRecord(tx); toast(`Approved ${inr(a.amount)} — added to transactions`); auditLog(`Approved ${a.title}`,'ALLOWED',`REQ-APPR-${a.id}`);
  };
  const approveAll = ()=>{ if(!approvals.length){ toast('Approval queue is already clear'); return; } const total=approvals.reduce((s,a)=>s+a.amount,0); const list=[...approvals]; setApprovals([]); setBalance(b=>b-total); setSpent(s=>s+total); list.forEach(a=>{ const tx:Tx={id:`tx-${Date.now()}-${a.id}`, merchant:a.title, category:'Approved', amount:a.amount, rule:'Approved', space, icon:'✅', time:'Just now'}; saveTxRecord(tx); }); setTxs(p=>[...list.map(a=>({id:`tx-${Date.now()}-${a.id}`, merchant:a.title, category:'Approved', amount:a.amount, rule:'Approved', space, icon:'✅', time:'Just now'} as Tx)), ...p]); toast(`Approved all ${inr(total)}`); auditLog('Approve All','ALLOWED'); };
  const deny = (a:Approval)=>{ setApprovals(p=>p.filter(x=>x.id!==a.id)); toast(`Denied ${a.title} — PayPal AI will not retry`); auditLog(`Denied ${a.title}`,'BLOCKED'); };
  const addTx = async ()=>{
    if(!newMerchant.trim()||!newAmount){ toast('Add a merchant and amount first'); return; }
    const amt=Number(newAmount); if(!Number.isFinite(amt)||amt<=0){ toast('Enter a valid amount'); return; }
    const tx:Tx={id:`tx-${Date.now()}`, merchant:newMerchant.trim(), category:newCat, amount:amt, rule:mode==='Manual'?'Manual':`Auto under ${limit.toLocaleString('en-IN')}`, space, icon:'🧾', time:'Just now'};
    try{ await api('records.create',{collection:'agentpal-transactions', value:{merchant:tx.merchant, category:tx.category, amount:tx.amount, rule:tx.rule, space:tx.space, time:tx.time}, idempotency_key:`tx-${tx.id}`}); setTxs(p=>[tx,...p]); setBalance(b=>b-amt); setSpent(s=>s+amt); setNewMerchant(''); setNewAmount(''); toast(`Added ${tx.merchant} ${inr(amt)} — saved`); auditLog(`Added transaction ${tx.merchant}`,'ALLOWED',`tx-${tx.id}`); }
    catch{ setTxs(p=>[tx,...p]); setBalance(b=>b-amt); setSpent(s=>s+amt); setNewMerchant(''); setNewAmount(''); toast(`Added ${tx.merchant} — sync unavailable, kept in session`); }
  };
  const connectRepo = async (repo: typeof REPOS[number])=>{
    if(connectedRepos.includes(repo.id)){ toast(`${repo.name} is already connected`); return; }
    setConnectedRepos(prev=>[...prev, repo.id]); toast(`AgentPAL now uses ${repo.name} for ${repo.useFor}`); auditLog(`Connected repo ${repo.name}`,'ALLOWED',`repo-${repo.id}`);
    try{ await api('records.create',{collection:'agentpal-connected-repos', value:{repo:repo.id, name:repo.name}, idempotency_key:`repo-${repo.id}`}); }catch{}
  };
  const addGoal = (g:Goal)=>{ setGoals(prev=>prev.map(x=> x.id===g.id ? {...x, current:Math.min(x.target, x.current+500), pct:Math.min(100, Math.round(((x.current+500)/x.target)*100))} : x)); setSaved(s=>s+500); toast(`Added 500 to ${g.name}`); auditLog(`Added 500 to goal ${g.name}`,'ALLOWED'); };
  const sendChat = (text:string)=>{
    const q=text.trim(); if(!q) return; setChat(c=>[...c,{who:'you', text:q}]); setChatInput(''); setAskInput(''); setTyping(true);
    const low=q.toLowerCase(); let reply='Got it. I will keep this PayPal wallet calm — no surprise charges, and I will ask before anything over your PayPal limit.';
    if(low.includes('spend')||low.includes('budget')) reply=`Quick PayPal summary: you have spent ${inr(spent)} this month via PayPal. Food is your largest pace, Tools is steady, and Fun is slightly over its PayPal limit. Want me to nap one PayPal subscription to rebalance?`;
    else if(low.includes('rule')) reply=`Here is a PayPal rule you can try: Auto-approve Tools under 1000 via PayPal, ask first for Food over 500, and always ask before Fun over 1500. Want me to apply it to ${space}?`;
    else if(low.includes('save')||low.includes('saving')) reply=`A gentle PayPal tip: move 500 to Emergency Fund every Friday via PayPal. It is small enough to miss never, and it compounds into real calm. Want me to add it this week?`;
    else if(low.includes('charge')||low.includes('explain')) reply=`That PayPal charge matches a PayPal rule you set — PayPal AI checked the merchant, category and limit before approving. If it looks unfamiliar, I can pause similar PayPal charges for 7 days.`;
    setTimeout(()=>{ setChat(c=>[...c,{who:'pal', text:reply}]); setTyping(false); },850); auditLog('Asked PayPal AI','ALLOWED');
  };
  const changeMode = (m:'Manual'|'Ask First'|'Auto')=>{ setMode(m); toast(`Payment mode: ${m}`); auditLog(`Payment mode changed to ${m}`,'ALLOWED'); };

  // Money OS handlers
  const createOrder = ()=>{
    const amt = Number(orderAmount); if(!Number.isFinite(amt)||amt<=0){ toast('Enter a valid order amount'); return; }
    const id = `ORD-${Date.now().toString().slice(-6)}`; const req = `REQ-${Date.now().toString().slice(-8)}`;
    const o:Order = {id, amount:amt, currency:orderCurrency, desc:orderDesc || 'PayPal order', status:'CREATED', requestId:req, refunded:0, captureId:''};
    setOrders(p=>[o,...p]); setSelectedOrderId(id); toast(`Order ${id} created — CREATED`); auditLog(`Orders create ${id}`,'ALLOWED',req);
    void api('records.create',{collection:'agentpal-orders', value:{orderId:id, amount:amt, currency:orderCurrency, desc:o.desc, status:'CREATED', requestId:req}, idempotency_key:req}).catch(()=>{});
  };
  const approveOrder = ()=>{
    const o = orders.find(x=>x.id===selectedOrderId); if(!o){ toast('Select an order first'); return; }
    if(o.status!=='CREATED'){ toast('Already processed — idempotency hit'); auditLog(`Orders approve ${o.id} duplicate`,'BLOCKED',o.requestId); return; }
    setOrders(p=>p.map(x=>x.id===o.id?{...x,status:'APPROVED'}:x)); toast(`Order ${o.id} approved — APPROVED`); auditLog(`Orders approve ${o.id}`,'ALLOWED',o.requestId);
  };
  const captureOrder = ()=>{
    const o = orders.find(x=>x.id===selectedOrderId); if(!o){ toast('Select an order first'); return; }
    if(o.status==='CAPTURED'||o.status==='REFUNDED'||o.status==='PARTIALLY REFUNDED'){ toast('Already processed — idempotency hit'); auditLog(`Orders capture ${o.id} duplicate`,'BLOCKED',o.requestId); return; }
    if(o.status!=='APPROVED'){ toast('Approve the order before capture'); return; }
    const cap = `CAP-${o.id.slice(-6)}`; setOrders(p=>p.map(x=>x.id===o.id?{...x,status:'CAPTURED', captureId:cap}:x)); setBalance(b=>b+o.amount); setVolumeToday(v=>v+o.amount); toast(`Captured ${inr(o.amount)} — CAPTURED`); auditLog(`Orders capture ${o.id}`,'ALLOWED',o.requestId);
  };
  const refundOrder = (full:boolean)=>{
    const o = orders.find(x=>x.id===selectedOrderId); if(!o){ toast('Select an order first'); return; }
    if(o.status!=='CAPTURED'&&o.status!=='PARTIALLY REFUNDED'){ toast('Capture the order before refund'); return; }
    const amt = full ? (o.amount - o.refunded) : Number(refundAmount);
    if(!Number.isFinite(amt)||amt<=0){ toast('Enter a valid refund amount'); return; }
    if(o.refunded+amt>o.amount){ toast('Refund exceeds captured amount'); return; }
    if(o.refunded>0 && !full){ toast('Already processed — idempotency hit for this refund'); auditLog(`Payments captures refund ${o.id} duplicate`,'BLOCKED',o.requestId); return; }
    const newRefunded = o.refunded+amt; const newStatus = newRefunded>=o.amount?'REFUNDED':'PARTIALLY REFUNDED';
    setOrders(p=>p.map(x=>x.id===o.id?{...x,status:newStatus, refunded:newRefunded}:x)); setBalance(b=>b-amt); toast(`Refunded ${inr(amt)} — ${newStatus}. Partial refunds up to 180 days.`); auditLog(`Payments captures refund ${o.id} ${amt}`,'ALLOWED',o.requestId);
  };
  const createInvoice = ()=>{
    const amt=Number(invAmount); if(!invMerchant.trim()||!Number.isFinite(amt)||amt<=0){ toast('Add invoice merchant and amount'); return; }
    const id=`INV-${Date.now().toString().slice(-6)}`; setInvoices(p=>[{id, merchant:invMerchant.trim(), amount:amt, status:'DRAFT', qr:false},...p]); toast(`Invoice ${id} created — DRAFT`); auditLog(`create invoice ${id}`,'ALLOWED');
    void api('records.create',{collection:'agentpal-invoices', value:{invoiceId:id, merchant:invMerchant.trim(), amount:amt, status:'DRAFT'}, idempotency_key:`inv-${id}`}).catch(()=>{});
  };
  const invoiceAction = (id:string, action:string)=>{
    setInvoices(p=>p.map(x=>{
      if(x.id!==id) return x;
      if(action==='send') return {...x,status:'SENT'};
      if(action==='reminder') return {...x,status:'REMINDER SENT'};
      if(action==='cancel') return {...x,status:'CANCELLED'};
      if(action==='qr') return {...x,qr:true};
      return x;
    }));
    const label = action==='send'?'send invoice':action==='reminder'?'send invoice reminder':action==='cancel'?'cancel sent invoice':'generate invoice QR code';
    toast(`${label} — ${id} ${action==='send'?'SENT':action==='reminder'?'reminder sent':action==='cancel'?'cancelled':'QR code placeholder ready'}`); auditLog(`${label} ${id}`,'ALLOWED');
  };
  const createPlan = ()=>{ const name=`Custom ${plans.length+1}`; setPlans(p=>[...p,{name, price:999, cycle:'Monthly, 12 cycles', fee:'Setup fee failure action CONTINUE'}]); toast(`Plan ${name} created`); auditLog(`Subscriptions create plan ${name}`,'ALLOWED'); };
  const createSubscription = ()=>{ const id=`I-${Date.now().toString().slice(-8)}`; const plan=plans.find(p=>p.name===selectedPlan)||plans[0]; setSubs(p=>[{id, plan:plan.name, amount:plan.price, status:'ACTIVE', cycle:plan.cycle},...p]); setSelectedSub(id); toast(`Subscription ${id} created — ${plan.name} ACTIVE`); auditLog(`Subscriptions create ${id}`,'ALLOWED'); };
  const cancelSubscription = ()=>{ setSubs(p=>p.map(x=>x.id===selectedSub?{...x,status:'CANCELLED'}:x)); toast(`Subscription ${selectedSub} cancelled`); auditLog(`Subscriptions cancel ${selectedSub}`,'ALLOWED'); };
  const addRecipient = ()=>{ if(!payoutEmail.includes('at')){ toast('Enter a recipient email in words, for example partner at example dot com'); return; } const amt=Number(payoutAmount); if(!Number.isFinite(amt)||amt<=0){ toast('Enter a valid payout amount'); return; } setPayoutDraft(p=>[...p,{email:payoutEmail.trim(), amount:amt}]); toast(`Recipient added — ${payoutEmail.trim()}`); auditLog('Payout recipient added','ALLOWED'); };
  const sendPayoutBatch = ()=>{
    if(!payoutDraft.length){ toast('Add at least one recipient'); return; }
    const id=`BATCH-${Date.now().toString().slice(-6)}`; const total=payoutDraft.reduce((s,r)=>s+r.amount,0);
    const batch:PayoutBatch={id, recipients:payoutDraft.map(r=>({...r,status:'QUEUED'})), total};
    setPayoutBatches(p=>[batch,...p]); setPayoutDraft([]); setPayoutsPending(n=>n+1); toast(`Payout batch ${id} created — recipients QUEUED`); auditLog(`Payouts create batch ${id}`,'ALLOWED',id);
    setTimeout(()=>{ setPayoutBatches(p=>p.map(b=>b.id===id?{...b, recipients:b.recipients.map(r=>({...r,status:'SENT'}))}:b)); setPayoutsPending(n=>Math.max(0,n-1)); toast(`Payout batch ${id} — all recipients SENT`); },900);
  };
  const getDispute = ()=>{ const d=disputes.find(x=>x.id===selectedDispute); if(!d){ toast('Select a dispute'); return; } toast(`Dispute ${d.id} — ${d.reason}, ${inr(d.amount)}, ${d.status}`); auditLog(`Disputes get ${d.id}`,'ALLOWED'); };
  const acceptDispute = ()=>{ setDisputes(p=>p.map(x=>x.id===selectedDispute?{...x,status:'CLAIM ACCEPTED'}:x)); toast(`Claim accepted for ${selectedDispute}`); auditLog(`Disputes accept claim ${selectedDispute}`,'ALLOWED'); };
  const addEvidence = ()=>{ setDisputes(p=>p.map(x=>x.id===selectedDispute?{...x,status:'EVIDENCE ADDED'}:x)); toast(`Evidence added for ${selectedDispute} — item level disputes reduce holds`); auditLog(`Disputes evidence ${selectedDispute}`,'ALLOWED'); };
  const vaultMethod = (m:string)=>{ setVaulted(p=>p.includes(m)?p.filter(x=>x!==m):[...p,m]); toast(`${m} ${vaulted.includes(m)?'removed from Vault':'vaulted'}`); auditLog(`Vault ${m}`,'ALLOWED'); };
  const checkPayLater = ()=>{ const amt=Number(payLaterAmount); if(!Number.isFinite(amt)||amt<=0){ toast('Enter a Pay Later amount'); return; } const est=amt/4; const eligible=amt>=100&&amt<=20000; setPayLaterResult(eligible?`Eligible — Pay in 4 estimate ${inr(est)} per payment`:`Not eligible — Pay in 4 is for amounts from 100 to 20000`); toast(eligible?'Pay Later eligible':'Pay Later not eligible'); auditLog('Pay Later eligibility checked',eligible?'ALLOWED':'BLOCKED'); };
  const addToCart = (name:string, price:number)=>{ setCart(p=>[...p,{name, price}]); toast(`${name} added to cart`); auditLog(`Catalog add to cart ${name}`,'ALLOWED'); };
  const createCart = ()=>{ if(!cart.length){ toast('Add a product to the cart first'); return; } const id=`CART-${Date.now().toString().slice(-6)}`; setCartId(id); toast(`Cart ${id} created with ${cart.length} item${cart.length>1?'s':''}`); auditLog(`Catalog create cart ${id}`,'ALLOWED'); };
  const checkoutCart = ()=>{ if(!cartId){ toast('Create a cart first'); return; } const id=`ORD-${Date.now().toString().slice(-6)}`; setCheckoutOrderId(id); const total=cart.reduce((s,i)=>s+i.price,0); setOrders(p=>[{id, amount:total, currency:'INR', desc:'Catalog checkout', status:'COMPLETED', requestId:`REQ-${id.slice(-6)}`, refunded:0, captureId:`CAP-${id.slice(-6)}`},...p]); setSelectedOrderId(id); setCart([]); toast(`Cart checked out — order ${id} COMPLETED`); auditLog(`Catalog checkout cart ${id}`,'ALLOWED'); };
  const addTracking = ()=>{ const o=orders.find(x=>x.id===trackOrderId); if(!o){ toast('Enter a valid order ID'); return; } if(o.status!=='COMPLETED'&&o.status!=='PARTIALLY REFUNDED'){ toast(`Tracking needs COMPLETED or PARTIALLY REFUNDED — ${o.id} is ${o.status}`); auditLog(`Shipment add tracking ${o.id} blocked`,'BLOCKED'); return; } if(!trackNumber.trim()){ toast('Enter a tracking number'); return; } setTrackingNote(`Tracking added — ${trackNumber.trim()} via ${trackCarrier} for ${o.id}`); toast(`Tracking added — ${trackNumber.trim()} via ${trackCarrier}`); auditLog(`Shipment add tracking ${o.id}`,'ALLOWED'); };

  // AI Mesh handlers
  const selectMcpTool = (tool:string)=>{ setMcpTool(tool); setMcpParams(MCP_PRESETS[tool] || '{\n  "id": "example-1"\n}'); setMcpResult(''); setMcpVerdict(''); };
  const runMcpTool = ()=>{
    const latency = 82 + Math.floor(Math.random()*160); setMcpLatency(latency);
    let verdict='ALLOWED'; if(mcpTool.toLowerCase().includes('refund')||mcpTool.toLowerCase().includes('capture')) verdict='NEEDS APPROVAL'; if(mcpTool.toLowerCase().includes('payout')) verdict='BLOCKED';
    setMcpVerdict(verdict);
    const result = `{\n  "tool": "${mcpTool}",\n  "status": "${verdict==='BLOCKED'?'BLOCKED':'COMPLETED'}",\n  "id": "RES-${Date.now().toString().slice(-6)}",\n  "latency_ms": ${latency},\n  "guardrail": "${verdict}",\n  "environment": "${env}"\n}`;
    setMcpResult(result); toast(`${mcpTool} ran — ${verdict}`); auditLog(`MCP ${mcpTool}`,verdict);
    setAgentActions(p=>[{who:'Checkout Pal', tool:mcpTool, amount:1299, rule:'Require approval over 5000', decision:verdict, time:nowTime()},...p].slice(0,20));
  };
  const toggleGuardrail = (id:string)=>{ setGuardrails(p=>p.map(r=>r.id===id?{...r, enabled:!r.enabled}:r)); const r=guardrails.find(x=>x.id===id); toast(`${r?.name} ${r?.enabled?'off':'on'}`); auditLog(`Guardrail toggled ${r?.name}`,'ALLOWED'); };
  const addGuardrail = ()=>{ if(!newRule.trim()){ toast('Write a new rule first'); return; } setGuardrails(p=>[...p,{id:`r-${Date.now()}`, name:newRule.trim(), enabled:true}]); toast(`Rule added — ${newRule.trim()}`); auditLog(`Guardrail added ${newRule.trim()}`,'ALLOWED'); setNewRule(''); };
  const toggleAgent = (id:string)=>{ setAgents(p=>p.map(a=>a.id===id?{...a, status:a.status==='Awake'?'Paused':'Awake'}:a)); const a=agents.find(x=>x.id===id); toast(`${a?.name} ${a?.status==='Awake'?'paused':'resumed'}`); auditLog(`Agent ${a?.name} toggled`,'ALLOWED'); };
  const explainAgent = (a:Agent)=>{ setAgentExplain(`${a.name}: ${a.explain}`); toast(`${a.name} decision explained`); auditLog(`Agent explain ${a.name}`,'ALLOWED'); };

  // Hardening handlers
  const verifyWebhook = ()=>{
    if(webhookMode==='valid'){ setWebhookResult('SUCCESS sandbox — signature verified with RSA SHA256'); setWebhooksVerified(v=>v+1); toast('Webhook verified — SUCCESS sandbox'); auditLog('Notifications verify webhook signature','SUCCESS'); }
    else { setWebhookResult('FAILURE tampered — signature mismatch, payload rejected'); toast('Webhook verification failed — tampered payload'); auditLog('Notifications verify webhook signature','FAILURE'); }
  };
  const replayDuplicate = ()=>{ toast('Duplicate detected — skipped, no double charge'); auditLog('Idempotency replay duplicate','BLOCKED'); };
  const rotateSecret = ()=>{ setSecretVersion(v=>v+1); setShowSecret(false); toast(`Secret rotated — version ${secretVersion+1}`); auditLog('Secret rotated','ALLOWED'); };
  const copySnippet = ()=>{
    const text = `Install: npm install at paypal agent-toolkit and pip install paypal-agent-toolkit\n\nServer SDK:\n${SNIPPETS[snippetLang].server}\n\nPayPal JS SDK:\n${SNIPPETS[snippetLang].checkout}`;
    if(snippetRef.current){ snippetRef.current.value=text; snippetRef.current.select(); try{ document.execCommand('copy'); }catch{} }
    toast('Copied'); auditLog(`Copied ${snippetLang} snippet`,'ALLOWED');
  };
  const sendWebhookTest = ()=>{ setWebhookTestResult('200 — PAYMENT CAPTURE COMPLETED verified'); setWebhooksVerified(v=>v+1); toast('Webhook test sent — 200 verified'); auditLog('Webhook test PAYMENT CAPTURE COMPLETED','SUCCESS'); };
  const exportAuditCsv = ()=>{ setCsvOpen(true); toast('Audit CSV ready in modal'); auditLog('Export Audit CSV','ALLOWED'); };
  const exportReport = ()=>{ setReportNote(`Report for last ${analyticsRange} days exported — Volume, refunds, disputes, MRR and payouts included.`); toast('Report exported'); auditLog(`Export Report ${analyticsRange} days`,'ALLOWED'); };

  const sidebar = (
    <div className="flex flex-col gap-4">
      <div><p className="text-[11px] tracking-[.18em] uppercase" style={{color:'var(--muted)'}}>Spaces</p><div className="mt-2 flex flex-col gap-1">{SPACES.map((s,i)=>{ const icons=['💰','🌸','💼','🎯']; return <button key={s} onClick={()=>{setSpace(s); toast(`${s} space — showing its PayPal transactions and budgets`);}} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[14px] transition" style={{background:space===s?'var(--glass)':'transparent', border:space===s?'1px solid var(--line)':'1px solid transparent'}}><span>{icons[i]}</span>{s}{space===s&&<span className="ml-auto text-[11px] mono" style={{color:'var(--accent2)'}}>● LIVE</span>}</button>})}</div></div>
      <button onClick={()=>{setTab('Hardening'); toast('Hardening — repos, MCP tools and mapping');}} className="glass-sm flex items-center justify-between px-3 py-2.5 text-left text-[13px] font-bold" style={{borderColor:tab==='Hardening'?'var(--accent)':'var(--line)'}}><span>💻 PayPal Dev and GitHub</span><span className="mono text-[11px]" style={{color:'var(--accent2)'}}>{connectedRepos.length} of 7</span></button>
      <div><p className="text-[11px] tracking-[.18em] uppercase" style={{color:'var(--muted)'}}>Pinned agents and apps</p><div className="mt-2 flex flex-wrap gap-1.5">{['PayPal','PayPal Wallet','PayPal Checkout','Cards','Bills'].map(a=><button key={a} onClick={()=>toast(`${a} opened — calm view, no clutter`)} className="glass-sm px-3 py-1.5 text-[13px]">{a}</button>)}</div></div>
      <div className="rounded-[22px] p-4 text-white floaty" style={{background:'linear-gradient(120deg,var(--accent),var(--accent2))'}}><p className="text-[13px] font-semibold">🐣 Little Pal, PayPal Companion</p><p className="mt-1 text-[13px] leading-snug opacity-90">I am watching your PayPal subscriptions so you do not have to.</p><button onClick={()=>{setRightTab('PayPal AI'); toast('Pal by PayPal is listening')}} className="mt-3 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-black">Talk to PayPal AI →</button></div>
      <button onClick={cleanUp} className="glass-sm flex items-center justify-center gap-2 px-3 py-2.5 text-[13px] font-semibold"><Trash2 size={15}/> Clean Up</button>
      <div><p className="text-[11px] tracking-[.18em] uppercase" style={{color:'var(--muted)'}}>Profile</p><div className="mt-2 flex flex-col gap-1">{['Work — Febin','Personal','Guest'].map(p=><button key={p} onClick={()=>{setProfile(p); toast(`Switched to ${p}`)}} className="flex items-center justify-between rounded-xl px-3 py-2 text-left text-[13px]" style={{background:profile===p?'var(--glass)':'transparent'}}>{p}{profile===p&&<Check size={14}/>}</button>)}</div></div>
      <div className="glass-sm p-3"><p className="text-[11px] tracking-[.16em] uppercase" style={{color:'var(--muted)'}}>Live stats</p><div className="mono mt-2 space-y-1.5 text-[12px]"><p className="flex justify-between"><span>Trackers blocked</span><b>128</b></p><p className="flex justify-between"><span>Rules active</span><b>14</b></p><p className="flex justify-between"><span>Agents awake</span><b className="text-emerald-400">3 ●</b></p></div></div>
    </div>
  );
  const rightPanel = (
    <div className="flex flex-col gap-3">
      <div className="flex rounded-full p-1 glass-sm">{(['PayPal AI','Rules & Features','Settings'] as const).map(t=><button key={t} onClick={()=>setRightTab(t)} className="flex-1 rounded-full px-2 py-2 text-[11px] font-bold" style={{background:rightTab===t?'var(--accent)':'transparent', color:rightTab===t?'#fff':'var(--text)'}}>{t==='Rules & Features'?'Rules':t}</button>)}</div>
      {rightTab==='PayPal AI' && <div className="glass flex min-h-[420px] flex-col overflow-hidden"><div className="p-4 text-white" style={{background:'linear-gradient(120deg,var(--accent),var(--accent2))'}}><p className="flex items-center gap-2 font-bold"><Bot size={18}/> PayPal AI</p><p className="mt-1 text-[12px] opacity-90">PayPal AI — Your money, explained. Pal by PayPal.</p></div><div className="scroll-thin flex max-h-[300px] flex-col gap-2 overflow-y-auto p-3">{chat.map((m,i)=><div key={i} className={`max-w-[88%] rounded-2xl px-3 py-2 text-[13px] leading-snug ${m.who==='pal'?'self-start':'self-end text-white'}`} style={{background:m.who==='pal'?'var(--glass)':'var(--accent)'}}>{m.text}</div>)}{typing&&<div className="typing flex gap-1 self-start rounded-2xl px-3 py-2" style={{background:'var(--glass)'}}><span/><span/><span/></div>}</div><div className="flex flex-wrap gap-1.5 px-3">{['PayPal spending summary','Explain this PayPal charge','Make a PayPal budget','Draft a PayPal rule'].map(chip=><button key={chip} onClick={()=>sendChat(chip)} className="glass-sm px-2.5 py-1 text-[11px]">{chip}</button>)}</div><div className="mt-auto flex gap-2 p-3"><input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendChat(chatInput)} placeholder="Ask PayPal AI anything…" className="min-w-0 flex-1 rounded-full bg-transparent px-3 py-2 text-[13px]" style={{border:'1px solid var(--line)'}}/><button onClick={()=>sendChat(chatInput)} className="grad-btn rounded-full px-3 py-2" aria-label="Send to PayPal AI"><Send size={16}/></button></div></div>}
      {rightTab==='Rules & Features' && <div className="glass p-3"><p className="font-bold">Rules and Features</p><p className="text-[12px]" style={{color:'var(--muted)'}}>12 PayPal money powers.</p><input value={featureQ} onChange={e=>setFeatureQ(e.target.value)} placeholder="Search PayPal features…" className="mt-3 w-full rounded-xl bg-transparent px-3 py-2 text-[13px]" style={{border:'1px solid var(--line)'}}/><div className="mt-2 flex flex-wrap gap-1.5">{['All','AI','Privacy','Budget'].map(c=><button key={c} onClick={()=>setFeatureCat(c)} className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{background:featureCat===c?'var(--accent)':'var(--glass)', color:featureCat===c?'#fff':'var(--text)'}}>{c}</button>)}</div><div className="scroll-thin mt-3 max-h-[430px] space-y-2 overflow-y-auto pr-1">{filteredFeatures.map(f=><div key={f.n} className="glass-sm p-3"><div className="flex items-center justify-between gap-2"><p className="text-[13px] font-bold"><span className="mono mr-2 text-[11px]" style={{color:'var(--accent2)'}}>{f.n}</span>{f.name}</p><span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{background:'var(--accent)', color:'#fff'}}>{f.badge}</span></div><p className="mt-1 text-[12px] leading-snug" style={{color:'var(--muted)'}}>{f.desc}</p><button onClick={()=>toast(`${f.name} — trying it now`)} className="mt-2 text-[12px] font-bold" style={{color:'var(--accent2)'}}>Try →</button></div>)}</div></div>}
      {rightTab==='Settings' && <div className="glass p-4"><p className="font-bold">Settings</p><div className="mt-3 space-y-2">{Object.entries(toggles).map(([k,v])=><label key={k} className="flex items-center justify-between gap-2 rounded-xl px-2 py-2 text-[13px]" style={{background:'var(--glass)'}}>{k}<button onClick={()=>{ const nv=!v; setToggles(t=>({...t,[k]:nv})); if(k==='Zen Mode') setZen(nv); toast(`${k} ${nv?'on':'off'}`); }} className="h-6 w-11 rounded-full p-0.5 transition" style={{background:v?'var(--accent)':'rgba(255,255,255,.18)'}}><span className="block h-5 w-5 rounded-full bg-white transition" style={{marginLeft:v?'20px':'0'}}/></button></label>)}</div><p className="mt-4 text-[12px] font-bold">Theme — PayPal Edition</p><div className="mt-2 grid grid-cols-4 gap-2">{THEMES.map(t=><button key={t.name} title={t.name} onClick={()=>{setTheme(t.name); toast(`Theme: ${t.name}`)}} className="h-10 rounded-xl" style={{background:`linear-gradient(120deg,${t.a},${t.b})`, outline:theme===t.name?'2px solid white':'none', outlineOffset:'2px'}} aria-label={t.name}/>)}</div><p className="mt-2 text-center text-[11px]" style={{color:'var(--muted)'}}>{theme} • {light?'Light':'Dark'} mode</p><div className="mt-3 flex gap-2"><button onClick={()=>{setLight(l=>!l); toast(light?'Dark mode on':'Light mode on')}} className="glass-sm flex flex-1 items-center justify-center gap-1.5 px-2 py-2 text-[12px] font-bold">{light?<Moon size={14}/>:<Sun size={14}/>} {light?'Dark':'Light'}</button><button onClick={()=>setShortcuts(true)} className="glass-sm flex flex-1 items-center justify-center gap-1.5 px-2 py-2 text-[12px] font-bold"><Keyboard size={14}/> Shortcuts</button></div></div>}
    </div>
  );

  const commandCenter = (
    <div className="space-y-4">
      <section className="hero-grad overflow-hidden rounded-[28px] p-5 sm:p-7"><p className="text-[11px] font-bold tracking-[.2em] uppercase">✦ AgentPAL x PayPal</p><div className="mt-3 inline-flex flex-wrap items-center gap-2 rounded-full bg-black/15 px-3 py-1.5 text-[11px] font-bold"><span>PayPal Connected</span><span aria-hidden="true">•</span><span>PayPal Wallet</span><span aria-hidden="true">•</span><span>PayPal Checkout</span></div><h1 className="mt-3 text-[clamp(30px,5vw,52px)] font-bold leading-[1.02] tracking-tight">Your money. Your rules.<br/>But faster.</h1><p className="mt-3 max-w-[560px] text-[15px] leading-relaxed opacity-80">A calmer wallet for a louder payments world. Your agents, budgets and rules — powered by PayPal.</p><div className="mt-5 flex flex-col gap-2 sm:flex-row"><input ref={askRef} value={askInput} onChange={e=>setAskInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendChat(askInput||'PayPal spending summary')} placeholder="Ask PayPal AI: What did I spend on Food via PayPal?" className="min-w-0 flex-1 rounded-full border border-black/20 bg-white/80 px-4 py-3 text-[14px] text-black placeholder:text-black/50"/><button onClick={()=>sendChat(askInput||'PayPal spending summary')} className="rounded-full bg-black px-5 py-3 text-[14px] font-bold text-white">Ask PayPal AI →</button></div><p className="mt-3 text-[12px] font-medium opacity-70">Try: Draft a PayPal rule • Explain this PayPal charge • Help me save with PayPal</p></section>

      <section className="glass p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-[18px] font-bold">100 Scoreboard — Hardened</h2><span className="rounded-full bg-emerald-500 px-3 py-1 text-[12px] font-bold text-white">100 out of 100 Hardened</span></div><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{SCORES.map(s=><div key={s.name} className="glass-sm p-4"><div className="flex items-center justify-between"><p className="font-bold">{s.name}</p><span className="flex h-12 w-12 items-center justify-center rounded-full text-[14px] font-bold text-white" style={{background:'conic-gradient(var(--accent) 0 100%, rgba(255,255,255,.12) 100%)'}}>{s.score}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full" style={{background:'rgba(255,255,255,.1)'}}><div className="h-full rounded-full" style={{width:'100%', background:'linear-gradient(90deg,var(--accent),var(--accent2))'}}/></div><ul className="mt-3 space-y-1.5">{s.checks.map(c=><li key={c} className="flex gap-1.5 text-[12px] leading-snug" style={{color:'var(--muted)'}}><Check size={14} className="shrink-0 text-emerald-400"/>{c}</li>)}</ul></div>)}</div></section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">{[
        {l:'Total Balance', v:inr(balance), icon:<Wallet size={16}/>},{l:'Volume today', v:inr(volumeToday), icon:<Activity size={16}/>},{l:'Active subscriptions', v:String(subs.filter(s=>s.status==='ACTIVE').length), icon:<Users size={16}/>},{l:'Open disputes', v:String(disputes.filter(d=>!d.status.includes('ACCEPTED')).length), icon:<Shield size={16}/>},{l:'Payouts pending', v:String(payoutsPending), icon:<ArrowUpRight size={16}/>},{l:'Webhooks verified today', v:String(webhooksVerified), icon:<Check size={16}/>}].map(s=><div key={s.l} className="glass p-4"><p className="flex items-center gap-1.5 text-[11px]" style={{color:'var(--muted)'}}>{s.icon}{s.l}</p><p className="mono mt-2 text-[clamp(18px,3vw,24px)] font-semibold">{s.v}</p></div>)}</section>

      <section className="glass p-4 sm:p-5"><h2 className="font-bold">Quick actions</h2><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5"><button onClick={()=>{setTab('Money OS'); toast('Order form is ready in Money OS'); auditLog('Quick action Create Order','ALLOWED');}} className="grad-btn rounded-2xl px-3 py-3 text-[13px] font-bold">Create Order</button><button onClick={()=>{setTab('Money OS'); toast('Invoice creator is ready'); auditLog('Quick action Send Invoice','ALLOWED');}} className="glass-sm px-3 py-3 text-[13px] font-bold">Send Invoice</button><button onClick={()=>{setTab('Money OS'); toast('Payout batch creator is ready'); auditLog('Quick action Create Payout','ALLOWED');}} className="glass-sm px-3 py-3 text-[13px] font-bold">Create Payout</button><button onClick={()=>{setTab('Hardening'); verifyWebhook();}} className="glass-sm px-3 py-3 text-[13px] font-bold">Run Webhook Verify</button><button onClick={()=>{setRightTab('PayPal AI'); toast('PayPal AI is ready');}} className="glass-sm px-3 py-3 text-[13px] font-bold">Ask PayPal AI</button></div></section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="glass p-4 sm:p-5"><div className="flex items-center justify-between gap-2"><h2 className="font-bold">Payment Mode</h2><span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{background:'var(--accent)', color:'#fff'}}>{mode}</span></div><p className="mt-1 text-[13px]" style={{color:'var(--muted)'}}>{mode==='Manual'?'PayPal AI never pays without you. Every PayPal charge waits for approval.':mode==='Ask First'?'PayPal AI asks before paying, then acts on your yes.':`PayPal AI pays automatically under ${inr(limit)} when a PayPal rule matches.`}</p><div className="mt-4 grid grid-cols-3 gap-1 rounded-full p-1" style={{background:'var(--glass)'}}>{(['Manual','Ask First','Auto'] as const).map(m=><button key={m} onClick={()=>changeMode(m)} className="rounded-full px-2 py-2 text-[12px] font-bold sm:text-[13px]" style={{background:mode===m?'var(--accent)':'transparent', color:mode===m?'#fff':'var(--text)'}}>{m}</button>)}</div><div className="mt-4"><div className="flex justify-between text-[12px]"><span>Per-mode limit</span><span className="mono font-bold">{inr(limit)}</span></div><input type="range" min={500} max={10000} step={100} value={limit} onChange={e=>setLimit(Number(e.target.value))} className="range mt-2"/><div className="flex justify-between text-[11px]" style={{color:'var(--muted)'}}><span>500</span><span>10000</span></div></div></div>
        <div className="glass p-4 sm:p-5"><div className="flex items-center justify-between"><h2 className="font-bold">Agent Approval Queue</h2><span className="mono rounded-full px-2.5 py-1 text-[12px] font-bold" style={{background:'rgba(250,61,29,.15)', color:'#FA3D1D'}}>{approvals.length} pending</span></div><div className="mt-3 space-y-3">{approvals.length===0?<p className="rounded-2xl p-4 text-center text-[13px]" style={{background:'var(--glass)'}}>All clear. PayPal AI has nothing waiting.</p>:approvals.map(a=><div key={a.id} className="glass-sm p-3"><p className="text-[14px] font-bold">{a.title}</p><p className="mt-0.5 text-[12px]" style={{color:'var(--muted)'}}>{a.detail} • {a.rule}</p><div className="mt-3 flex gap-2"><button onClick={()=>approve(a)} className="grad-btn flex-1 rounded-full px-3 py-2 text-[13px] font-bold">Approve</button><button onClick={()=>deny(a)} className="glass-sm flex-1 px-3 py-2 text-[13px] font-bold">Deny</button></div></div>)}</div><button onClick={approveAll} className="mt-3 w-full rounded-full py-2.5 text-[13px] font-bold" style={{border:'1px solid var(--line)'}}>Approve All ({approvals.length}) →</button></div>
      </section>
    </div>
  );

  const moneyOS = (
    <div className="space-y-4">
      <section className="glass p-4 sm:p-5"><h2 className="text-[18px] font-bold">Orders Flow — Full Lifecycle</h2><p className="mt-1 text-[13px]" style={{color:'var(--muted)'}}>Create, approve, capture, then refund. Idempotency protects every repeat click.</p>
        <div className="mt-4 flex flex-wrap gap-1.5">{['CREATED','APPROVED','CAPTURED','REFUNDED'].map((s,i)=><span key={s} className="rounded-full px-3 py-1.5 text-[11px] font-bold" style={{background:'var(--glass)', border:'1px solid var(--line)'}}>{i+1}. {s}</span>)}</div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><input value={orderAmount} onChange={e=>setOrderAmount(e.target.value)} inputMode="numeric" placeholder="Amount" className="rounded-xl bg-transparent px-3 py-2.5 text-[13px]" style={{border:'1px solid var(--line)'}}/><select value={orderCurrency} onChange={e=>setOrderCurrency(e.target.value)} className="rounded-xl bg-transparent px-3 py-2.5 text-[13px]" style={{border:'1px solid var(--line)', background:'var(--bg)'}}>{['INR','USD','EUR','GBP'].map(c=><option key={c}>{c}</option>)}</select><input value={orderDesc} onChange={e=>setOrderDesc(e.target.value)} placeholder="Description" className="rounded-xl bg-transparent px-3 py-2.5 text-[13px] sm:col-span-2" style={{border:'1px solid var(--line)'}}/><input value={refundAmount} onChange={e=>setRefundAmount(e.target.value)} inputMode="numeric" placeholder="Partial refund amount" className="rounded-xl bg-transparent px-3 py-2.5 text-[13px]" style={{border:'1px solid var(--line)'}}/></div>
        <div className="mt-3 flex flex-wrap gap-2"><button onClick={createOrder} className="grad-btn rounded-full px-4 py-2.5 text-[13px] font-bold">Create Order</button><button onClick={approveOrder} className="glass-sm px-4 py-2.5 text-[13px] font-bold">Approve</button><button onClick={captureOrder} className="glass-sm px-4 py-2.5 text-[13px] font-bold">Capture</button><button onClick={()=>refundOrder(false)} className="glass-sm px-4 py-2.5 text-[13px] font-bold">Refund Partial</button><button onClick={()=>refundOrder(true)} className="glass-sm px-4 py-2.5 text-[13px] font-bold">Refund Full</button></div>
        <div className="mt-4 space-y-2">{orders.map(o=><button key={o.id} onClick={()=>{setSelectedOrderId(o.id); toast(`Selected ${o.id} — ${o.status}`);}} className="w-full rounded-2xl p-3 text-left" style={{background:selectedOrderId===o.id?'var(--glass)':'transparent', border:'1px solid var(--line)'}}><div className="flex flex-wrap justify-between gap-2"><b className="mono text-[13px]">{o.id}</b><span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{background:'var(--accent)', color:'#fff'}}>{o.status}</span></div><p className="mt-1 text-[13px]" style={{color:'var(--muted)'}}>{o.desc} • {inr(o.amount)} {o.currency} • Refunded {inr(o.refunded)}</p><p className="mono mt-1 break-words text-[11px]" style={{color:'var(--muted)'}}>PayPal Request Id: {o.requestId} {o.captureId?`• Capture: ${o.captureId}`:''}</p></button>)}</div>
        <p className="mt-3 text-[12px]" style={{color:'var(--muted)'}}>Partial refunds up to 180 days. A second capture or second refund shows Already processed — idempotency hit.</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="glass p-4 sm:p-5"><h2 className="font-bold">Invoices</h2><p className="mt-1 text-[12px]" style={{color:'var(--muted)'}}>Tool names: create invoice, list invoices, get invoice, send invoice, send invoice reminder, cancel sent invoice, generate invoice QR code.</p><div className="mt-3 flex flex-col gap-2 sm:flex-row"><input value={invMerchant} onChange={e=>setInvMerchant(e.target.value)} placeholder="Merchant" className="min-w-0 flex-1 rounded-xl bg-transparent px-3 py-2.5 text-[13px]" style={{border:'1px solid var(--line)'}}/><input value={invAmount} onChange={e=>setInvAmount(e.target.value)} inputMode="numeric" placeholder="Amount" className="w-full rounded-xl bg-transparent px-3 py-2.5 text-[13px] sm:w-28" style={{border:'1px solid var(--line)'}}/><button onClick={createInvoice} className="grad-btn rounded-xl px-4 py-2.5 text-[13px] font-bold">Create</button></div><div className="mt-3 space-y-2">{invoices.map(inv=><div key={inv.id} className="glass-sm p-3"><div className="flex flex-wrap justify-between gap-2"><b className="text-[14px]">{inv.id} — {inv.merchant}</b><span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{background:'var(--glass)'}}>{inv.status}</span></div><p className="mono mt-1 text-[13px]">{inr(inv.amount)}</p>{inv.qr&&<p className="mt-2 rounded-xl p-3 text-center text-[12px]" style={{background:'rgba(0,0,0,.25)'}}>▦ QR code placeholder for {inv.id}</p>}<div className="mt-2 flex flex-wrap gap-1.5"><button onClick={()=>invoiceAction(inv.id,'send')} className="glass-sm px-2.5 py-1.5 text-[11px] font-bold">Send</button><button onClick={()=>invoiceAction(inv.id,'reminder')} className="glass-sm px-2.5 py-1.5 text-[11px] font-bold">Send Reminder</button><button onClick={()=>invoiceAction(inv.id,'cancel')} className="glass-sm px-2.5 py-1.5 text-[11px] font-bold">Cancel Sent</button><button onClick={()=>invoiceAction(inv.id,'qr')} className="glass-sm px-2.5 py-1.5 text-[11px] font-bold">Generate QR Code</button></div></div>)}</div></div>
        <div className="glass p-4 sm:p-5"><h2 className="font-bold">Subscriptions</h2><p className="mt-1 text-[12px]" style={{color:'var(--muted)'}}>Billing cycles: Monthly, 12 cycles. Setup fee failure action CONTINUE.</p><div className="mt-3 grid gap-2 sm:grid-cols-3">{plans.map(p=><button key={p.name} onClick={()=>{setSelectedPlan(p.name); toast(`Plan ${p.name} selected`);}} className="rounded-2xl p-3 text-left" style={{background:selectedPlan===p.name?'var(--glass)':'transparent', border:'1px solid var(--line)'}}><b>{p.name}</b><p className="mono mt-1 text-[13px]">{inr(p.price)} per month</p><p className="mt-1 text-[11px]" style={{color:'var(--muted)'}}>{p.cycle}</p></button>)}</div><div className="mt-3 flex flex-wrap gap-2"><button onClick={createPlan} className="glass-sm px-3 py-2 text-[12px] font-bold">Create Plan</button><button onClick={()=>{toast(`Plans listed — ${plans.length} plans`); auditLog('Subscriptions list plans','ALLOWED');}} className="glass-sm px-3 py-2 text-[12px] font-bold">List Plans</button><button onClick={createSubscription} className="grad-btn px-3 py-2 text-[12px] font-bold">Create Subscription</button></div><div className="mt-3 space-y-2">{subs.map(s=><button key={s.id} onClick={()=>{setSelectedSub(s.id); toast(`Subscription ${s.id} — ${s.plan}, ${s.status}`); auditLog(`Subscriptions get ${s.id}`,'ALLOWED');}} className="w-full rounded-2xl p-3 text-left" style={{background:selectedSub===s.id?'var(--glass)':'transparent', border:'1px solid var(--line)'}}><div className="flex justify-between gap-2"><b className="mono text-[13px]">{s.id}</b><span className="text-[12px] font-bold">{s.status}</span></div><p className="mt-1 text-[13px]" style={{color:'var(--muted)'}}>{s.plan} • {inr(s.amount)} per month • {s.cycle}</p></button>)}</div><div className="mt-3 flex gap-2"><button onClick={()=>{toast(`Details for ${selectedSub} shown`); auditLog(`Subscriptions show details ${selectedSub}`,'ALLOWED');}} className="glass-sm flex-1 px-3 py-2 text-[12px] font-bold">Show Details</button><button onClick={cancelSubscription} className="glass-sm flex-1 px-3 py-2 text-[12px] font-bold">Cancel Subscription</button></div></div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="glass p-4 sm:p-5"><h2 className="font-bold">Payouts — Batch Creator</h2><div className="mt-3 flex flex-col gap-2 sm:flex-row"><input value={payoutEmail} onChange={e=>setPayoutEmail(e.target.value)} placeholder="Recipient email in words" className="min-w-0 flex-1 rounded-xl bg-transparent px-3 py-2.5 text-[13px]" style={{border:'1px solid var(--line)'}}/><input value={payoutAmount} onChange={e=>setPayoutAmount(e.target.value)} inputMode="numeric" placeholder="Amount" className="w-full rounded-xl bg-transparent px-3 py-2.5 text-[13px] sm:w-28" style={{border:'1px solid var(--line)'}}/><button onClick={addRecipient} className="glass-sm px-3 py-2.5 text-[13px] font-bold">Add Recipient</button></div><div className="mt-3 space-y-1.5">{payoutDraft.map((r,i)=><p key={i} className="rounded-xl px-3 py-2 text-[13px]" style={{background:'var(--glass)'}}>{r.email} — {inr(r.amount)}</p>)}</div><button onClick={sendPayoutBatch} className="grad-btn mt-3 w-full rounded-full py-2.5 text-[13px] font-bold">Send Payout Batch</button><div className="mt-3 space-y-2">{payoutBatches.map(b=><div key={b.id} className="glass-sm p-3"><p className="mono text-[13px] font-bold">{b.id} • Total {inr(b.total)}</p>{b.recipients.map((r,i)=><p key={i} className="mt-1 flex justify-between text-[12px]" style={{color:'var(--muted)'}}><span>{r.email}</span><span className="font-bold" style={{color:r.status==='SENT'?'#00C48C':'var(--accent2)'}}>{r.status}</span></p>)}</div>)}</div></div>
        <div className="glass p-4 sm:p-5"><h2 className="font-bold">Disputes</h2><p className="mt-1 text-[12px]" style={{color:'var(--muted)'}}>Item level disputes reduce holds.</p><div className="mt-3 space-y-2">{disputes.map(d=><button key={d.id} onClick={()=>{setSelectedDispute(d.id); toast(`Selected dispute ${d.id}`);}} className="w-full rounded-2xl p-3 text-left" style={{background:selectedDispute===d.id?'var(--glass)':'transparent', border:'1px solid var(--line)'}}><div className="flex justify-between gap-2"><b className="mono text-[13px]">{d.id}</b><span className="text-[11px] font-bold">{d.status}</span></div><p className="mt-1 text-[13px]" style={{color:'var(--muted)'}}>{d.merchant} • {inr(d.amount)} • {d.reason}</p></button>)}</div><div className="mt-3 flex flex-wrap gap-2"><button onClick={getDispute} className="glass-sm px-3 py-2 text-[12px] font-bold">Get Dispute</button><button onClick={acceptDispute} className="glass-sm px-3 py-2 text-[12px] font-bold">Accept Claim</button><button onClick={addEvidence} className="grad-btn px-3 py-2 text-[12px] font-bold">Add Evidence</button></div></div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="glass p-4 sm:p-5"><h2 className="font-bold">Vault plus Pay Later</h2><p className="mt-2 text-[13px] font-bold">Saved methods</p><div className="mt-2 space-y-2">{['PayPal balance','Visa ending 4242','PayPal Credit'].map(m=><div key={m} className="flex items-center justify-between rounded-2xl px-3 py-2.5" style={{background:'var(--glass)'}}><span className="flex items-center gap-2 text-[13px]"><CreditCard size={16}/>{m}</span><button onClick={()=>vaultMethod(m)} className="rounded-full px-3 py-1.5 text-[11px] font-bold" style={{background:vaulted.includes(m)?'var(--accent)':'var(--glass)', color:vaulted.includes(m)?'#fff':'var(--text)'}}>{vaulted.includes(m)?'Vaulted ✓':'Vault this method'}</button></div>)}</div><div className="mt-4"><p className="text-[13px] font-bold">Pay Later eligibility checker</p><div className="mt-2 flex gap-2"><input value={payLaterAmount} onChange={e=>setPayLaterAmount(e.target.value)} inputMode="numeric" placeholder="Amount" className="min-w-0 flex-1 rounded-xl bg-transparent px-3 py-2.5 text-[13px]" style={{border:'1px solid var(--line)'}}/><button onClick={checkPayLater} className="grad-btn rounded-xl px-4 py-2.5 text-[13px] font-bold">Check</button></div>{payLaterResult&&<p className="mt-2 rounded-xl p-3 text-[13px]" style={{background:'var(--glass)'}}>{payLaterResult}</p>}</div></div>
        <div className="glass p-4 sm:p-5"><h2 className="font-bold">Catalog plus Cart plus Tracking</h2><div className="mt-3 flex gap-2"><input value={catalogQ} onChange={e=>setCatalogQ(e.target.value)} placeholder="Search product" className="min-w-0 flex-1 rounded-xl bg-transparent px-3 py-2.5 text-[13px]" style={{border:'1px solid var(--line)'}}/><button onClick={()=>{toast(`Search product — ${catalogQ||'all products'}`); auditLog('Catalog search product','ALLOWED');}} className="glass-sm px-3 py-2.5 text-[13px] font-bold">Search</button></div><div className="mt-3 space-y-2">{PRODUCTS.filter(p=>catalogQ===''||p.name.toLowerCase().includes(catalogQ.toLowerCase())).map(p=><div key={p.name} className="flex items-center justify-between gap-2 rounded-2xl px-3 py-2.5" style={{background:'var(--glass)'}}><div><p className="text-[13px] font-bold">{p.name}</p><p className="text-[11px]" style={{color:'var(--muted)'}}>{p.desc} • {inr(p.price)}</p></div><button onClick={()=>addToCart(p.name, p.price)} className="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold" style={{background:'var(--accent)', color:'#fff'}}><Plus size={12} className="inline"/> Add</button></div>)}</div><p className="mt-3 text-[12px]" style={{color:'var(--muted)'}}>Cart: {cart.length} item{cart.length===1?'':'s'} {cartId?`• ${cartId}`:''} {checkoutOrderId?`• Checkout order ${checkoutOrderId}`:''}</p><div className="mt-2 flex gap-2"><button onClick={createCart} className="glass-sm flex-1 px-3 py-2 text-[12px] font-bold">Create cart</button><button onClick={checkoutCart} className="grad-btn flex-1 px-3 py-2 text-[12px] font-bold">Checkout cart</button></div><div className="mt-4 border-t pt-3" style={{borderColor:'var(--line)'}}><p className="text-[13px] font-bold">Add Tracking</p><p className="mt-1 text-[11px]" style={{color:'var(--muted)'}}>Order must be COMPLETED or PARTIALLY REFUNDED.</p><div className="mt-2 grid gap-2 sm:grid-cols-3"><input value={trackOrderId} onChange={e=>setTrackOrderId(e.target.value)} placeholder="Order ID" className="rounded-xl bg-transparent px-3 py-2.5 text-[13px]" style={{border:'1px solid var(--line)'}}/><input value={trackNumber} onChange={e=>setTrackNumber(e.target.value)} placeholder="Tracking number" className="rounded-xl bg-transparent px-3 py-2.5 text-[13px]" style={{border:'1px solid var(--line)'}}/><input value={trackCarrier} onChange={e=>setTrackCarrier(e.target.value)} placeholder="Carrier" className="rounded-xl bg-transparent px-3 py-2.5 text-[13px]" style={{border:'1px solid var(--line)'}}/></div><button onClick={addTracking} className="grad-btn mt-2 w-full rounded-full py-2.5 text-[13px] font-bold"><Truck size={14} className="inline"/> Add Tracking</button>{trackingNote&&<p className="mt-2 text-[12px]" style={{color:'var(--muted)'}}>{trackingNote}</p>}</div></div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="glass p-4 sm:p-5"><div className="flex items-center justify-between"><h2 className="font-bold">Budgets • {space}</h2><span className="text-[12px]" style={{color:'var(--muted)'}}>{tab} view</span></div><div className="mt-4 space-y-4">{budgets.map(b=>{ const pct=Math.min(100, Math.round(b.spent/b.limit*100)); const over=b.spent>b.limit; return <div key={b.name}><div className="flex justify-between text-[13px]"><span>{b.icon} {b.name}</span><span className="mono text-[12px]">{inr(b.spent)} of {inr(b.limit)}</span></div><div className="mt-1.5 h-2.5 overflow-hidden rounded-full" style={{background:'rgba(255,255,255,.1)'}}><div className="h-full rounded-full transition-all" style={{width:pct+'%', background:over?'#FA3D1D':'var(--accent)'}}/></div><p className="mt-1 text-[11px]" style={{color:over?'#FA3D1D':'var(--muted)'}}>{over?'Over budget — PayPal AI will ask first':'On track • '+pct+'%'}</p></div>})}</div></div>
        <div className="glass p-4 sm:p-5"><h2 className="font-bold">Savings Goals</h2><div className="mt-3 space-y-4">{goals.map(g=><div key={g.id} className="glass-sm p-3"><div className="flex justify-between"><p className="font-bold">{g.emoji} {g.name}</p><span className="mono text-[12px] font-bold" style={{color:'var(--accent2)'}}>{g.pct}%</span></div><div className="mt-2 h-2.5 overflow-hidden rounded-full" style={{background:'rgba(255,255,255,.1)'}}><div className="h-full rounded-full" style={{width:g.pct+'%', background:'linear-gradient(90deg,var(--accent),var(--accent2))'}}/></div><p className="mono mt-1.5 text-[12px]" style={{color:'var(--muted)'}}>{inr(g.current)} of {inr(g.target)}</p><button onClick={()=>addGoal(g)} className="grad-btn mt-2 w-full rounded-full py-2 text-[13px] font-bold">Add 500 →</button></div>)}</div></div>
      </section>
      <section className="glass p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold">Transactions</h2><span className="text-[12px]" style={{color:'var(--muted)'}}>{filteredTx.length} shown • {space}</span></div><div className="mt-3 flex flex-col gap-2 sm:flex-row"><input value={newMerchant} onChange={e=>setNewMerchant(e.target.value)} placeholder="Merchant" className="min-w-0 flex-1 rounded-xl bg-transparent px-3 py-2.5 text-[13px]" style={{border:'1px solid var(--line)'}}/><input value={newAmount} onChange={e=>setNewAmount(e.target.value)} inputMode="numeric" placeholder="Amount" className="w-full rounded-xl bg-transparent px-3 py-2.5 text-[13px] sm:w-28" style={{border:'1px solid var(--line)'}}/><select value={newCat} onChange={e=>setNewCat(e.target.value)} className="rounded-xl bg-transparent px-3 py-2.5 text-[13px]" style={{border:'1px solid var(--line)', background:'var(--bg)'}}>{['Food','Transport','Tools','Fun'].map(c=><option key={c}>{c}</option>)}</select><button onClick={addTx} className="grad-btn rounded-xl px-4 py-2.5 text-[13px] font-bold"><Plus size={16} className="inline"/> Add</button></div>{syncNote&&<p className="mt-2 text-[11px]" style={{color:'var(--muted)'}}>{syncNote}</p>}<div className="mt-3 space-y-2">{filteredTx.map(t=><div key={t.id} className="flex items-center gap-3 rounded-2xl px-2 py-2.5" style={{background:'var(--glass)'}}><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[18px]" style={{background:'rgba(255,255,255,.08)'}}>{t.icon}</span><div className="min-w-0 flex-1"><p className="truncate text-[14px] font-semibold">{t.merchant}</p><p className="truncate text-[11px]" style={{color:'var(--muted)'}}>{t.time} • {t.space}</p></div><span className="hidden rounded-full px-2 py-1 text-[10px] font-bold sm:inline" style={{background:'var(--glass)'}}>{t.category}</span><div className="text-right"><p className="mono text-[14px] font-semibold">−{inr(t.amount)}</p><p className="max-w-[110px] truncate text-[10px]" style={{color:'var(--muted)'}}>Rule: {t.rule}</p></div></div>)}</div></section>
    </div>
  );

  const aiMesh = (
    <div className="space-y-4">
      <section className="glass p-4 sm:p-5"><h2 className="text-[18px] font-bold">Grouped Tool Library</h2><input value={toolQ} onChange={e=>setToolQ(e.target.value)} placeholder="Search tools, for example invoice or capture" className="mt-3 w-full rounded-xl bg-transparent px-3 py-2.5 text-[13px]" style={{border:'1px solid var(--line)'}}/><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{TOOL_GROUPS.map(g=>{ const tools=g.tools.filter(t=>toolQ===''||t.toLowerCase().includes(toolQ.toLowerCase())); if(!tools.length) return null; return <div key={g.group} className="glass-sm p-4"><p className="font-bold">{g.group} <span className="mono text-[11px]" style={{color:'var(--muted)'}}>{tools.length} tools</span></p><div className="mt-2 flex flex-wrap gap-1.5">{tools.map(t=><button key={t} onClick={()=>{selectMcpTool(t); setTab('AI Agent Mesh'); toast(`${t} loaded in MCP Console 2.0`);}} className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{background:'var(--glass)', border:'1px solid var(--line)'}}>{t}</button>)}</div></div>})}</div></section>

      <section className="glass p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold">MCP Console 2.0</h2><button onClick={()=>toast('Guardrails cannot be disabled in Hardened mode')} className="rounded-full px-3 py-1.5 text-[12px] font-bold" style={{background:'rgba(250,61,29,.15)', color:'#FA3D1D', border:'1px solid rgba(250,61,29,.4)'}}>Guardrails OFF — BLOCKED</button></div><p className="mt-1 text-[13px]" style={{color:'var(--muted)'}}>Select a tool, review prefilled JSON params, run, and see latency plus guardrail verdict.</p><div className="mt-3 flex flex-col gap-2 sm:flex-row"><label className="sr-only" htmlFor="mcp-tool">Choose an MCP tool</label><select id="mcp-tool" value={mcpTool} onChange={e=>selectMcpTool(e.target.value)} className="min-w-0 flex-1 rounded-xl bg-transparent px-3 py-2.5 text-[13px]" style={{border:'1px solid var(--line)', background:'var(--bg)'}}>{TOOL_GROUPS.flatMap(g=>g.tools).map(t=><option key={t} value={t}>{t}</option>)}</select><button onClick={runMcpTool} className="grad-btn rounded-xl px-5 py-2.5 text-[13px] font-bold">Run tool</button></div><textarea value={mcpParams} onChange={e=>setMcpParams(e.target.value)} rows={5} className="mono mt-3 w-full rounded-2xl bg-transparent p-4 text-[12px] leading-relaxed" style={{border:'1px solid var(--line)', background:'rgba(0,0,0,.25)'}} aria-label="MCP JSON params"/>{mcpResult?<div className="mt-3"><div className="flex flex-wrap gap-2"><span className="rounded-full px-3 py-1 text-[11px] font-bold" style={{background:mcpVerdict==='ALLOWED'?'rgba(0,196,140,.18)':mcpVerdict==='NEEDS APPROVAL'?'rgba(255,170,0,.18)':'rgba(250,61,29,.18)', color:mcpVerdict==='ALLOWED'?'#00C48C':mcpVerdict==='NEEDS APPROVAL'?'#FFAA00':'#FA3D1D'}}>{mcpVerdict}</span><span className="mono rounded-full px-3 py-1 text-[11px]" style={{background:'var(--glass)'}}>Latency {mcpLatency} ms</span><span className="mono rounded-full px-3 py-1 text-[11px]" style={{background:'var(--glass)'}}>Environment {env}</span></div><pre className="mono mt-3 overflow-x-auto whitespace-pre-wrap rounded-2xl p-4 text-[12px] leading-relaxed" style={{background:'rgba(0,0,0,.35)', border:'1px solid var(--line)'}}>{mcpResult}</pre></div>:<p className="mt-3 rounded-2xl p-4 text-center text-[13px]" style={{background:'var(--glass)'}}>Pick a tool and press Run tool — the JSON result appears here.</p>}</section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="glass p-4 sm:p-5"><h2 className="font-bold">Guardrails Policy Engine</h2><div className="mt-3 space-y-2">{guardrails.map(r=><label key={r.id} className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-[13px]" style={{background:'var(--glass)'}}>{r.name}<button onClick={()=>toggleGuardrail(r.id)} className="h-6 w-11 rounded-full p-0.5 transition" style={{background:r.enabled?'var(--accent)':'rgba(255,255,255,.18)'}} aria-label={`Toggle ${r.name}`}><span className="block h-5 w-5 rounded-full bg-white transition" style={{marginLeft:r.enabled?'20px':'0'}}/></button></label>)}</div><div className="mt-3 flex gap-2"><input value={newRule} onChange={e=>setNewRule(e.target.value)} placeholder="Add new rule, for example Require approval for Fun over 2000" className="min-w-0 flex-1 rounded-xl bg-transparent px-3 py-2.5 text-[13px]" style={{border:'1px solid var(--line)'}}/><button onClick={addGuardrail} className="grad-btn rounded-xl px-4 py-2.5 text-[13px] font-bold">Add Rule</button></div><div className="mt-4"><p className="text-[13px] font-bold">Agent action log</p><div className="mt-2 space-y-2">{agentActions.map((a,i)=><div key={i} className="rounded-2xl p-3 text-[12px]" style={{background:'var(--glass)'}}><p><b>{a.who}</b> • {a.tool} • {inr(a.amount)}</p><p className="mt-1" style={{color:'var(--muted)'}}>Rule hit: {a.rule} • Human decision: {a.decision} • {a.time}</p></div>)}</div></div></div>
        <div className="glass p-4 sm:p-5"><h2 className="font-bold">Agent Fleet</h2><div className="mt-3 space-y-3">{agents.map(a=><div key={a.id} className="glass-sm p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-bold">{a.name}</p><p className="text-[12px]" style={{color:'var(--muted)'}}>{a.role}</p></div><span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{background:a.status==='Awake'?'rgba(0,196,140,.18)':'rgba(255,170,0,.18)', color:a.status==='Awake'?'#00C48C':'#FFAA00'}}>{a.status}</span></div><p className="mono mt-2 text-[12px]" style={{color:'var(--muted)'}}>Tasks done {a.tasks} • Success rate {a.success}%</p><div className="mt-2 h-2 overflow-hidden rounded-full" style={{background:'rgba(255,255,255,.1)'}}><div className="h-full rounded-full" style={{width:a.success+'%', background:'linear-gradient(90deg,var(--accent),var(--accent2))'}}/></div><div className="mt-3 flex gap-2"><button onClick={()=>toggleAgent(a.id)} className="glass-sm flex-1 px-3 py-2 text-[12px] font-bold">{a.status==='Awake'?'Pause':'Resume'}</button><button onClick={()=>explainAgent(a)} className="grad-btn flex-1 px-3 py-2 text-[12px] font-bold">Explain decision</button></div></div>)}</div>{agentExplain&&<p className="mt-3 rounded-2xl p-4 text-[13px] leading-relaxed" style={{background:'var(--glass)'}}>{agentExplain}</p>}</div>
      </section>

      <section className="glass p-4 sm:p-5"><h2 className="font-bold">Official PayPal repos AgentPAL is built on</h2><p className="mt-1 text-[13px]" style={{color:'var(--muted)'}}>Sandbox is default. Connect with PayPal login for hosted MCP.</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{REPOS.map(r=>{ const connected=connectedRepos.includes(r.id); return <article key={r.id} className="glass-sm p-4"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-[14px] font-bold">{r.label}</p><p className="mono mt-0.5 break-words text-[12px]" style={{color:'var(--accent2)'}}>{r.name}</p></div><span className="shrink-0 rounded-full px-2 py-1 text-[10px] font-bold" style={{background:connected?'rgba(0,196,140,.18)':'var(--glass)', color:connected?'#00C48C':'var(--muted)'}}>{connected?'● Connected':'Not connected'}</span></div><p className="mt-2 text-[13px] leading-snug" style={{color:'var(--muted)'}}>{r.desc}</p><p className="mt-2 text-[11px] font-bold">Language and stack: <span style={{color:'var(--text)'}}>{r.lang}</span></p><button onClick={()=>connectRepo(r)} className="grad-btn mt-3 w-full rounded-full py-2 text-[13px] font-bold">{connected?'Connected ✓':'Use in AgentPAL →'}</button></article>})}</div></section>
    </div>
  );

  const csvText = `time,actor,action,request_id,result\n${audit.map(a=>`${a.time},${a.actor},${a.action},${a.key},${a.result}`).join('\n')}`;
  const hardening = (
    <div className="space-y-4">
      <section className="glass p-4 sm:p-5"><h2 className="text-[18px] font-bold">Webhook Verifier</h2><p className="mt-1 text-[13px]" style={{color:'var(--muted)'}}>Verification step: Notifications verify webhook signature — in words only.</p><div className="mt-3 flex flex-wrap gap-2"><button onClick={()=>{setWebhookMode('valid'); toast('Valid payload selected');}} className="rounded-full px-4 py-2 text-[13px] font-bold" style={{background:webhookMode==='valid'?'var(--accent)':'var(--glass)', color:webhookMode==='valid'?'#fff':'var(--text)'}}>Use valid payload</button><button onClick={()=>{setWebhookMode('tampered'); toast('Tampered payload selected');}} className="rounded-full px-4 py-2 text-[13px] font-bold" style={{background:webhookMode==='tampered'?'var(--accent)':'var(--glass)', color:webhookMode==='tampered'?'#fff':'var(--text)'}}>Tamper payload</button><button onClick={verifyWebhook} className="grad-btn rounded-full px-4 py-2 text-[13px] font-bold">Verify</button></div>{webhookResult&&<p className="mt-3 rounded-2xl p-4 text-[13px] font-bold" style={{background:webhookResult.includes('SUCCESS')?'rgba(0,196,140,.15)':'rgba(250,61,29,.15)'}}>{webhookResult}</p>}<p className="mt-2 text-[12px]" style={{color:'var(--muted)'}}>RSA SHA256 note: the signature is checked against the transmitted payload and certificate before any action runs.</p></section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="glass p-4 sm:p-5"><h2 className="font-bold">Idempotency Store</h2><p className="mt-1 text-[12px]" style={{color:'var(--muted)'}}>PayPal retries up to 25 times over 3 days. Respond 200 within 20 seconds.</p><div className="mt-3 space-y-2">{idempotencyEvents.map(e=><div key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl p-3" style={{background:'var(--glass)'}}><div><p className="mono text-[13px] font-bold">{e.id}</p><p className="text-[12px]" style={{color:'var(--muted)'}}>{e.event} • {e.key}</p></div><span className="rounded-full px-2 py-1 text-[11px] font-bold" style={{background:'rgba(0,196,140,.15)', color:'#00C48C'}}>{e.status}</span></div>)}</div><button onClick={replayDuplicate} className="grad-btn mt-3 w-full rounded-full py-2.5 text-[13px] font-bold">Replay duplicate</button></div>
        <div className="glass p-4 sm:p-5"><h2 className="font-bold">Secrets in Vault</h2><p className="mt-1 text-[12px]" style={{color:'var(--muted)'}}>Client ID and Secret are masked. Rotate to create a new version.</p><div className="mt-3 space-y-2"><div className="flex justify-between rounded-2xl px-3 py-2.5 text-[13px]" style={{background:'var(--glass)'}}><span>Client ID</span><span className="mono">AX-••••-2841</span></div><div className="flex justify-between rounded-2xl px-3 py-2.5 text-[13px]" style={{background:'var(--glass)'}}><span>Secret • Version {secretVersion}</span><span className="mono">{showSecret?'SK-LIVE-2841-VER-'+secretVersion:'••••••••••••'}</span></div></div><div className="mt-3 flex gap-2"><button onClick={()=>{setShowSecret(s=>!s); toast(showSecret?'Secret hidden':'Secret shown'); auditLog('Secret show hide','ALLOWED');}} className="glass-sm flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-[12px] font-bold">{showSecret?<EyeOff size={14}/>:<Eye size={14}/>} {showSecret?'Hide':'Show'}</button><button onClick={rotateSecret} className="grad-btn flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-[12px] font-bold"><RefreshCw size={14}/> Rotate</button></div></div>
      </section>

      <section className="glass p-4 sm:p-5"><h2 className="font-bold">Security Checklist — All Checked</h2><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{['HTTPS TLS 1.3 only','OAuth 2.0 Bearer','Webhook signature verify','PayPal Request Id on every write','Never store CVV, PCI via PayPal','3DS','Fraud score','Rate limit 600 per minute sandbox','RBAC Owner Admin Viewer','2FA plus Passkey','Audit log immutable','Secrets in Vault masked','IP allowlist','Reject old transmissions over 5 minutes'].map(item=><p key={item} className="flex gap-2 rounded-2xl px-3 py-2.5 text-[13px]" style={{background:'var(--glass)'}}><Check size={16} className="shrink-0 text-emerald-400"/>{item}</p>)}</div></section>

      <section className="glass p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold">Audit Log — Append-only</h2><button onClick={exportAuditCsv} className="grad-btn flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold"><Download size={14}/> Export Audit CSV</button></div><p className="mt-1 text-[12px]" style={{color:'var(--muted)'}}>Every app action adds a row: time, actor, action, idempotency key, result.</p><div className="scroll-thin mt-3 max-h-[360px] space-y-2 overflow-y-auto pr-1">{audit.map(a=><div key={a.id} className="rounded-2xl p-3 text-[12px]" style={{background:'var(--glass)'}}><div className="flex flex-wrap justify-between gap-2"><b>{a.action}</b><span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{background:'var(--accent)', color:'#fff'}}>{a.result}</span></div><p className="mono mt-1 break-words" style={{color:'var(--muted)'}}>{a.time} • {a.actor} • {a.key}</p></div>)}</div></section>

      <section className="glass p-4 sm:p-5"><h2 className="font-bold">DevOps Code</h2><p className="mt-1 text-[13px]" style={{color:'var(--muted)'}}>SDK method calls only. Install: npm install at paypal agent-toolkit and pip install paypal-agent-toolkit.</p><div className="mt-3 flex flex-wrap gap-1.5">{Object.keys(SNIPPETS).map(l=><button key={l} onClick={()=>{setSnippetLang(l); toast(`${l} snippet selected`);}} className="rounded-full px-3 py-1.5 text-[12px] font-bold" style={{background:snippetLang===l?'var(--accent)':'var(--glass)', color:snippetLang===l?'#fff':'var(--text)'}}>{l}</button>)}</div><div className="mt-3 grid gap-3 lg:grid-cols-2"><div><p className="text-[12px] font-bold">Server SDK — {snippetLang}</p><pre className="mono mt-2 overflow-x-auto whitespace-pre-wrap rounded-2xl p-4 text-[12px] leading-relaxed" style={{background:'rgba(0,0,0,.35)', border:'1px solid var(--line)'}}>{SNIPPETS[snippetLang].server}</pre></div><div><p className="text-[12px] font-bold">PayPal JS SDK — {snippetLang}</p><pre className="mono mt-2 overflow-x-auto whitespace-pre-wrap rounded-2xl p-4 text-[12px] leading-relaxed" style={{background:'rgba(0,0,0,.35)', border:'1px solid var(--line)'}}>{SNIPPETS[snippetLang].checkout}</pre></div></div><textarea ref={snippetRef} readOnly className="sr-only" aria-label="Snippet copy field" value="" onChange={()=>{}}/><button onClick={copySnippet} className="grad-btn mt-3 flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold"><Copy size={14}/> Copy</button><div className="mt-4 border-t pt-4" style={{borderColor:'var(--line)'}}><p className="font-bold">Webhook Tester</p><p className="mt-1 text-[12px]" style={{color:'var(--muted)'}}>Send a test PAYMENT CAPTURE COMPLETED event.</p><button onClick={sendWebhookTest} className="glass-sm mt-2 px-4 py-2 text-[13px] font-bold">Send test PAYMENT CAPTURE COMPLETED</button>{webhookTestResult&&<p className="mt-2 rounded-xl p-3 text-[13px] font-bold" style={{background:'rgba(0,196,140,.15)'}}>{webhookTestResult}</p>}<p className="mt-3 text-[12px]" style={{color:'var(--muted)'}}>Postman collections note: a Postman collection for Orders, Payments, Invoices, Payouts, Subscriptions and Webhooks is included in the DevOps kit.</p></div></section>

      <section className="glass p-4 sm:p-5"><h2 className="font-bold">Compliance</h2><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">{[{t:'PCI', d:'Card data stays with PayPal.'},{t:'SOC', d:'Controls reviewed and logged.'},{t:'Buyer and Seller Protection', d:'Eligible purchases covered.'},{t:'Dispute SLA', d:'Evidence within SLA, tracked.'},{t:'Data retention', d:'Audit kept, sensitive data minimized.'}].map(c=><div key={c.t} className="glass-sm p-4"><p className="font-bold">{c.t}</p><p className="mt-1 text-[12px] leading-snug" style={{color:'var(--muted)'}}>{c.d}</p><button onClick={()=>{toast(`${c.t} — reviewed`); auditLog(`Compliance reviewed ${c.t}`,'ALLOWED');}} className="mt-2 text-[12px] font-bold" style={{color:'var(--accent2)'}}>Review →</button></div>)}</div></section>
    </div>
  );

  const analyticsData = useMemo(()=>{
    const mult = analyticsRange===7?0.4:analyticsRange===30?1:2.6;
    return {
      volume:[42,58,47,71,66,84,92].map(v=>Math.round(v*mult)),
      refundRate:(1.8*mult).toFixed(1),
      disputeRate:(0.6*mult).toFixed(1),
      mrr:Math.round(48200*mult),
      top:[{n:'Swiggy', v:Math.round(12480*mult)},{n:'Notion', v:Math.round(8990*mult)},{n:'Uber', v:Math.round(7420*mult)},{n:'Figma', v:Math.round(6890*mult)}],
      payouts:Math.round(18400*mult),
    };
  },[analyticsRange]);
  const analytics = (
    <div className="space-y-4">
      <section className="glass p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-[18px] font-bold">Analytics</h2><p className="mt-1 text-[13px]" style={{color:'var(--muted)'}}>Last {analyticsRange} days • CSS bar charts, no external chart library needed.</p></div><div className="flex flex-wrap gap-1.5"><button onClick={exportReport} className="grad-btn rounded-full px-4 py-2 text-[13px] font-bold">Export Report</button></div></div><div className="mt-4 flex flex-wrap gap-1.5">{[7,30,90].map(d=><button key={d} onClick={()=>{setAnalyticsRange(d); toast(`Analytics range — last ${d} days`); auditLog(`Analytics range ${d} days`,'ALLOWED');}} className="rounded-full px-4 py-2 text-[12px] font-bold" style={{background:analyticsRange===d?'var(--accent)':'var(--glass)', color:analyticsRange===d?'#fff':'var(--text)'}}>Last {d} days</button>)}</div>{reportNote&&<p className="mt-3 rounded-2xl p-3 text-[13px]" style={{background:'var(--glass)'}}>{reportNote}</p>}</section>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[{l:'Refund rate', v:analyticsData.refundRate+'%'},{l:'Dispute rate', v:analyticsData.disputeRate+'%'},{l:'Subscription MRR', v:inr(analyticsData.mrr)},{l:'Payouts', v:inr(analyticsData.payouts)}].map(s=><div key={s.l} className="glass p-4"><p className="text-[12px]" style={{color:'var(--muted)'}}>{s.l}</p><p className="mono mt-2 text-[26px] font-bold">{s.v}</p></div>)}</section>
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="glass p-4 sm:p-5"><h2 className="font-bold">Volume by day</h2><div className="mt-4 flex h-[180px] items-end gap-2">{analyticsData.volume.map((v,i)=><div key={i} className="flex flex-1 flex-col items-center gap-1"><div className="w-full rounded-t-xl" style={{height:Math.min(150, v*1.4)+'px', background:'linear-gradient(180deg,var(--accent),var(--accent2))'}}/><span className="mono text-[10px]" style={{color:'var(--muted)'}}>Day {i+1}</span><span className="mono text-[10px] font-bold">{v}k</span></div>)}</div></div>
        <div className="glass p-4 sm:p-5"><h2 className="font-bold">Top merchants</h2><div className="mt-4 space-y-3">{analyticsData.top.map(m=>{ const pct=Math.round(m.v/analyticsData.top[0].v*100); return <div key={m.n}><div className="flex justify-between text-[13px]"><span>{m.n}</span><span className="mono">{inr(m.v)}</span></div><div className="mt-1 h-2.5 overflow-hidden rounded-full" style={{background:'rgba(255,255,255,.1)'}}><div className="h-full rounded-full" style={{width:pct+'%', background:'linear-gradient(90deg,var(--accent),var(--accent2))'}}/></div></div>})}</div><div className="mt-5 grid grid-cols-2 gap-2"><button onClick={()=>{toast('Volume detail — daily volume by merchant'); auditLog('Analytics volume detail','ALLOWED');}} className="glass-sm px-3 py-2 text-[12px] font-bold">Volume detail</button><button onClick={()=>{toast('Merchant detail — top merchant breakdown'); auditLog('Analytics merchant detail','ALLOWED');}} className="glass-sm px-3 py-2 text-[12px] font-bold">Merchant detail</button></div></div>
      </section>
    </div>
  );

  return (
    <div data-safe-area-inset-root data-theme={theme} className="relative min-h-screen overflow-x-clip" style={{boxSizing:'border-box', paddingTop:'var(--safe-area-inset-top)', background: light ? '#EDEDF5' : 'var(--bg)', color: light ? '#0B0E1F' : 'var(--text)'}}>
      <div className="grain" aria-hidden="true"/><div className="glowblob" aria-hidden="true"/>
      <header data-safe-area-sticky-top className="sticky z-30 border-b backdrop-blur-xl" style={{top:'var(--safe-area-inset-top)', background: light?'rgba(255,255,255,.72)':'rgba(7,9,19,.72)', borderColor:'var(--line)'}}>
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-2 px-3 py-3 sm:px-4">
          <button onClick={()=>{setSidebarOpen(s=>!s); setMobileSidebar(true);}} className="flex items-center gap-2 text-left" aria-label="Toggle sidebar"><span className="text-[20px] font-bold tracking-tight">✦ AgentPAL <span className="shimmer-text">x PayPal</span></span></button>
          <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{background:'var(--accent)', color:'#fff'}}>Health Score 100 out of 100 Hardened</span>
          <a href="/" className="rounded-full px-3 py-1.5 text-[11px] font-bold" style={{background:'var(--glass)', border:'1px solid var(--line)'}}>← Agentic Browser</a>
          <span className="hidden rounded-full px-2.5 py-1 text-[11px] font-bold md:inline" style={{background:'var(--glass)', border:'1px solid var(--line)'}}>Security: TLS 1.3 • OAuth 2.0</span>
          <div className="order-3 flex w-full items-center gap-2 sm:order-2 sm:w-auto sm:flex-1 sm:justify-center"><div className="flex w-full max-w-[460px] items-center gap-2 rounded-full px-3 py-2" style={{border:'1px solid var(--line)', background:'var(--glass)'}}><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search PayPal transactions, rules, payments… (Cmd K)" className="w-full bg-transparent text-[13px] outline-none" aria-label="Search"/><button onClick={()=>setPalette(true)} className="hidden rounded-md px-1.5 py-0.5 text-[11px] font-bold sm:block" style={{background:'var(--glass)'}}>Cmd K</button></div></div>
          <div className="order-2 ml-auto flex flex-wrap items-center gap-1.5 sm:order-3 sm:ml-0">
            <div className="flex rounded-full p-0.5" style={{background:'var(--glass)', border:'1px solid var(--line)'}}>{(['Sandbox','Live'] as const).map(e=><button key={e} onClick={()=>{setEnv(e); toast(e==='Live'?'Live mode is demo-only — staying in Sandbox behavior':'Sandbox mode — safe demo environment'); auditLog(`Environment switched to ${e}`,'ALLOWED');}} className="rounded-full px-3 py-1.5 text-[11px] font-bold" style={{background:env===e?'var(--accent)':'transparent', color:env===e?'#fff':'var(--text)'}}>Environment: {e}</button>)}</div>
            <button onClick={()=>{toast(`Connected repos: ${connectedRepos.length} of 7`); setTab('AI Agent Mesh');}} className="hidden rounded-full px-3 py-1.5 text-[11px] font-bold md:inline" style={{background:'var(--glass)', border:'1px solid var(--line)'}}>Connected repos: {connectedRepos.length} of 7</button>
            <button onClick={()=>{ const i=THEMES.findIndex(t=>t.name===theme); setTheme(THEMES[(i+1)%THEMES.length].name); toast('Theme cycled'); }} title="Cycle theme" className="h-8 w-8 rounded-full border-2 border-white/40" style={{background:`linear-gradient(120deg,${THEMES.find(t=>t.name===theme)?.a},${THEMES.find(t=>t.name===theme)?.b})`}} aria-label="Cycle theme"/>
            <button onClick={toggleZen} className="rounded-full px-3 py-1.5 text-[12px] font-bold" style={{background:zen?'var(--accent)':'var(--glass)', color:zen?'#fff':'inherit'}}>{zen?'Zen ●':'Zen ○'}</button>
            <button onClick={()=>toast('Profile: '+profile)} className="flex h-8 w-8 items-center justify-center rounded-full font-bold text-white" style={{background:'linear-gradient(120deg,var(--accent),var(--accent2))'}}>F</button>
          </div>
        </div>
      </header>

      <div className="relative z-[2] mx-auto flex max-w-[1500px] items-start gap-4 px-3 py-4 sm:px-4">
        {!zen && <aside className="sticky top-[76px] hidden w-[248px] shrink-0 lg:block">{sidebar}</aside>}
        <main className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1 rounded-full p-1 glass-sm">{['Command Center','Money OS','AI Agent Mesh','Hardening','Analytics'].map(t=><button key={t} onClick={()=>{setTab(t); toast(`${t} view — ${space}`); auditLog(`Opened ${t}`,'ALLOWED');}} className="rounded-full px-3 py-2 text-[12px] font-bold sm:px-4 sm:text-[13px]" style={{background:tab===t?'var(--accent)':'transparent', color:tab===t?'#fff':'inherit'}}>{t}</button>)}</div>
            <span className="hidden text-[11px] sm:inline" style={{color:'var(--muted)'}}>Environment {env} • PayPal Aurora default</span>
          </div>
          {zen && <div className="mt-3 rounded-2xl px-4 py-3 text-center text-[13px] font-semibold" style={{background:'var(--glass)'}}>🌿 Zen Mode — only what matters. Tap Zen again to bring everything back.</div>}
          <div className="mt-4">{tab==='Command Center'&&commandCenter}{tab==='Money OS'&&moneyOS}{tab==='AI Agent Mesh'&&aiMesh}{tab==='Hardening'&&hardening}{tab==='Analytics'&&analytics}</div>
          <p className="mt-6 text-center text-[11px]" style={{color:'var(--muted)'}}>AgentPAL x PayPal — Your AI. Your Money. Your Rules. Secured by PayPal.</p>
        </main>
        {!zen && <aside className="sticky top-[76px] hidden w-[330px] shrink-0 xl:block">{rightPanel}</aside>}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t px-2 py-2 backdrop-blur-xl lg:hidden" style={{background:'rgba(7,9,19,.92)', borderColor:'var(--line)'}}>
        <button onClick={()=>setMobileSidebar(true)} className="flex flex-col items-center gap-0.5 px-3 py-1 text-[11px]"><LayoutGrid size={18}/>Sidebar</button>
        <button onClick={()=>setPalette(true)} className="flex flex-col items-center gap-0.5 px-3 py-1 text-[11px]"><Command size={18}/>Cmd K</button>
        <button onClick={()=>setMobilePanel('pal')} className="flex flex-col items-center gap-0.5 px-3 py-1 text-[11px]"><MessageSquare size={18}/>PayPal AI</button>
        <button onClick={()=>{setMobilePanel('rules'); setRightTab('Rules & Features');}} className="flex flex-col items-center gap-0.5 px-3 py-1 text-[11px]"><SlidersHorizontal size={18}/>Rules</button>
      </nav>
      <div className="h-16 lg:hidden"/>

      {mobileSidebar && <div className="fixed inset-0 z-50 flex"><button aria-label="Close sidebar" onClick={()=>setMobileSidebar(false)} className="flex-1 bg-black/60"/><div className="scroll-thin w-[300px] overflow-y-auto p-4" style={{background:'var(--bg)'}}><div className="mb-3 flex justify-between"><b>Menu</b><button onClick={()=>setMobileSidebar(false)}><X/></button></div>{sidebar}<button onClick={()=>setMobileSidebar(false)} className="grad-btn mt-4 w-full rounded-full py-2.5 text-[13px] font-bold">Done</button></div></div>}
      {mobilePanel && <div className="fixed inset-0 z-50 flex"><button aria-label="Close panel" onClick={()=>setMobilePanel(null)} className="flex-1 bg-black/60"/><div className="scroll-thin w-[340px] max-w-[92vw] overflow-y-auto p-4" style={{background:'var(--bg)'}}><div className="mb-3 flex justify-between"><b>{mobilePanel==='pal'?'PayPal AI':'Rules and Features'}</b><button onClick={()=>setMobilePanel(null)}><X/></button></div>{rightPanel}</div></div>}

      {palette && <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[12vh]" onClick={()=>setPalette(false)}><div className="glass w-full max-w-[560px] !rounded-[22px] p-3" style={{background:'var(--card)'}} onClick={e=>e.stopPropagation()}><div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{border:'1px solid var(--line)'}}><Command size={17}/><input autoFocus value={paletteQ} onChange={e=>setPaletteQ(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'&&paletteCommands[0]) runCommand(paletteCommands[0]); }} placeholder="Type a command…" className="w-full bg-transparent text-[14px] outline-none"/></div><div className="mt-2 max-h-[300px] overflow-y-auto">{paletteCommands.map(c=><button key={c} onClick={()=>runCommand(c)} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[14px] hover:bg-white/5">{c}<span className="text-[12px]" style={{color:'var(--muted)'}}>↵</span></button>)}{paletteCommands.length===0&&<p className="p-3 text-center text-[13px]" style={{color:'var(--muted)'}}>No commands match.</p>}</div><p className="mt-2 px-2 text-[11px]" style={{color:'var(--muted)'}}>Esc to close • Enter to run</p></div></div>}
      {shortcuts && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={()=>setShortcuts(false)}><div className="glass w-full max-w-[420px] p-5" style={{background:'var(--card)'}} onClick={e=>e.stopPropagation()}><div className="flex justify-between"><h3 className="font-bold">Keyboard Shortcuts</h3><button onClick={()=>setShortcuts(false)}><X size={18}/></button></div><div className="mono mt-4 space-y-2.5 text-[13px]"><p className="flex justify-between"><span>Command Palette</span><b>Cmd K</b></p><p className="flex justify-between"><span>Close dialogs</span><b>Esc</b></p><p className="flex justify-between"><span>Ask PayPal AI</span><b>Enter in Ask PayPal AI</b></p><p className="flex justify-between"><span>Send chat</span><b>Enter</b></p></div><button onClick={()=>setShortcuts(false)} className="grad-btn mt-4 w-full rounded-full py-2.5 text-[13px] font-bold">Got it</button></div></div>}
      {csvOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={()=>setCsvOpen(false)}><div className="glass w-full max-w-[620px] p-5" style={{background:'var(--card)'}} onClick={e=>e.stopPropagation()}><div className="flex justify-between gap-2"><h3 className="font-bold">Audit CSV</h3><button onClick={()=>setCsvOpen(false)}><X size={18}/></button></div><p className="mt-1 text-[12px]" style={{color:'var(--muted)'}}>Select the CSV text to copy it.</p><textarea readOnly value={csvText} rows={10} className="mono mt-3 w-full rounded-2xl bg-transparent p-3 text-[11px]" style={{border:'1px solid var(--line)'}}/><button onClick={()=>setCsvOpen(false)} className="grad-btn mt-3 w-full rounded-full py-2.5 text-[13px] font-bold">Close</button></div></div>}
      <div className="pointer-events-none fixed bottom-20 left-1/2 z-[60] flex w-full max-w-[420px] -translate-x-1/2 flex-col items-center gap-2 px-4 lg:bottom-6">{toasts.map(t=><div key={t.id} className="pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-medium shadow-2xl" style={{background:'var(--card)', border:'1px solid var(--line)'}}><span className="text-emerald-400">✓</span><span className="min-w-0">{t.msg}</span></div>)}</div>
    </div>
  );
}
