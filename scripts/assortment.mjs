#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv} from './lib/csv.mjs';
import {table} from './lib/format.mjs';

export const commands={
 help:[],stores:[],products:[],
 'range-review':['store'],'category-review':['store'],'space-review':['store'],
 'slow-movers':['store','days'],'margin-review':['store'],'gaps':['store'],
 attention:['store'],compliance:['store'],actions:['store'],decisions:['store'],imports:['store'],history:['store'],
 'add-store':['code','name','cluster','currency','owner','due','unit-pricing','actor'],
 'review-store':['store','due','actor','reason'],
 'add-product':['sku','name','category','brand','actor'],
 'set-range':['store','product','status','reason','actor'],
 'record-label':['store','product','evidence','checked','actor'],
 'add-action':['store','title','owner','due','actor'],
 'close-action':['action','resolution','actor'],
 'add-decision':['store','product','recommendation','reason','evidence','actor'],
 log:['store','text','actor'],
 import:['store','file','map','start','end','currency','expected-count','source-ref','actor','dry-run'],
 export:['file'],'draft-range-review':['store'],
};
const relations=['stores','products','ranges','reports','observations','decisions','actions','events'];
export function parse(args){
 const cmd=args[0]||'help'; if(!(cmd in commands))throw Error(`Unknown command ${cmd}. Use help.`);
 const flags={};let vendor;
 for(let i=1;i<args.length;i++){
  const x=args[i];if(!x.startsWith('--')){if(cmd==='import'&&!vendor){vendor=x;continue;}throw Error(`Unexpected argument: ${x}`);}
  const k=x.slice(2).split('=')[0];if(!commands[cmd].includes(k)&&k!=='json')throw Error(`Unknown option --${k} for ${cmd}`);
  if(k in flags)throw Error(`Duplicate option --${k}`);
  if(['json','dry-run'].includes(k)){if(x.includes('='))throw Error(`${k} is a boolean flag`);flags[k]=true;}
  else {const value=x.includes('=')?x.slice(x.indexOf('=')+1):args[++i];if(!value||value.startsWith('--'))throw Error(`Missing value for --${k}`);flags[k]=value;}
 }
 if(cmd==='import'&&vendor!=='dotactiv')throw Error('Use import dotactiv');
 return {cmd,flags};
}
function req(f,k){if(typeof f[k]!=='string'||!f[k].trim())throw Error(`--${k} is required`);return f[k].trim();}
function choice(v,values,name){if(!values.includes(v))throw Error(`${name} must be ${values.join('|')}`);return v;}
function date(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw Error(`Invalid calendar date: ${v}`);return v;}
function numeric(v,label,places=3,optional=false){
 if(optional&&(v===''||v==null))return null;
 if(!new RegExp(`^\\d+(?:\\.\\d{1,${places}})?$`).test(String(v)))throw Error(`${label} must be a nonnegative number with at most ${places} decimal places`);
 const n=Number(v);if(!Number.isFinite(n)||n>1e10)throw Error(`${label} is too large`);return n;
}
function count(v){if(!/^\d+$/.test(v)||!Number.isSafeInteger(Number(v))||Number(v)<1)throw Error('expected-count must be a positive integer');return Number(v);}
function currency(v){if(!/^[A-Z]{3}$/.test(v))throw Error('Currency must be three uppercase letters');return v;}
function today(){return new Date().toISOString().slice(0,10);}
async function resolve(db,relation,value){
 const col=relation==='stores'?'code':relation==='products'?'sku':'title';
 const label=relation==='actions'?'title':'name';
 const rows=await db.query(`select * from ${relation} order by ${col},id`);
 let matches=rows.filter(r=>r.id===value||String(r[col]).toLowerCase()===value.toLowerCase()||String(r[label]).toLowerCase()===value.toLowerCase());
 if(!matches.length)matches=rows.filter(r=>r.id.startsWith(value.toLowerCase())||String(r[label]).toLowerCase().includes(value.toLowerCase()));
 if(matches.length!==1)throw Error(`${relation}: ${matches.length?'ambiguous':'no match'} for "${value}". Candidates:\n${(matches.length?matches:rows).map(r=>`${r.id} ${r[col]} ${r[label]}`).join('\n')}`);
 return matches[0];
}
async function event(db,store,kind,actor,detail){return db.query('insert into events(store_id,kind,actor,detail) values($1,$2,$3,$4) returning id',[store,kind,actor,JSON.stringify(detail)]);}
async function tx(db,fn){await db.exec('BEGIN');try{const out=await fn();await db.exec('COMMIT');return out;}catch(e){await db.exec('ROLLBACK');throw e;}}
export async function run(args,db){
 const {cmd,flags:f}=parse(args);
 if(cmd==='help')return Object.entries(commands).map(([command,options])=>({command,options:options.map(x=>`--${x}`).join(' ')}));
 if(cmd==='stores')return db.query('select id,code,name,cluster,currency,owner,review_due,unit_pricing_applies from stores order by code');
 if(cmd==='products')return db.query('select id,sku,name,category,brand from products order by sku');
 const store=f.store?await resolve(db,'stores',f.store):null;
 const scope=store?' where store_id=$1':'';const params=store?[store.id]:[];
 const read={
  'range-review':'select store_code,sku,product,category,range_status,period_start,period_end,currency,units,sales_amount,gross_margin_amount,stock_days from range_performance',
  'category-review':'select * from category_performance',
  'space-review':'select store_code,sku,product,period_start,period_end,currency,facings,width_mm,sales_per_facing_amount,sales_per_metre_amount from range_performance',
  'margin-review':'select store_code,sku,product,period_start,period_end,currency,sales_amount,cost_amount,gross_margin_amount,margin_percent from range_performance',
  gaps:'select store_code,sku,product,issue from assortment_gaps',
  attention:'select store_code,kind,item,owner,due_on from assortment_attention',
  compliance:'select store_code,sku,rule,finding,source from assortment_compliance',
  actions:'select id,store_id,title,owner,due_on,closed_on,resolution from actions',
  decisions:'select id,store_id,product_id,recommendation,rationale,evidence_ref,actor,snapshot,created_at from decisions',
  imports:'select id,store_id,period_start,period_end,currency,row_count,source_ref,source_sha256,mapping,actor from reports',
  history:'select id,store_id,kind,actor,detail,created_at from events',
 };
 if(cmd in read){
  // category summaries carry a store code instead of the internal key.
  const where=cmd==='category-review'&&store?' where store_code=$1':scope;
  return db.query(read[cmd]+where+' order by 1,2',cmd==='category-review'&&store?[store.code]:params);
 }
 if(cmd==='slow-movers'){
  const days=f.days?numeric(f.days,'days',3):60;
  return db.query(`select store_code,sku,product,period_end,units,stock_units,stock_days,
    case when units=0 then 'No units sold in this period' else 'Stock exceeds selected cover threshold' end reason
    from range_performance where stock_units>0 and (units=0 or stock_days>$1)${store?' and store_id=$2':''} order by store_code,sku`,store?[days,store.id]:[days]);
 }
 if(cmd==='import')return importReport(db,f,store);
 if(cmd==='export'){
  const out=path.resolve(req(f,'file'));const data={format:'retail-assortment-v1',exported_at:new Date().toISOString(),records:{}};
  await db.exec('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  try{for(const t of relations)data.records[t]=await db.query(`select * from ${t} order by id`);}finally{await db.exec('ROLLBACK');}
  fs.mkdirSync(path.dirname(out),{recursive:true,mode:0o700});fs.writeFileSync(out,JSON.stringify(data,null,2)+'\n',{flag:'wx',mode:0o600});
  return [{file:out,record_types:relations.length}];
 }
 if(cmd==='draft-range-review'){
  if(!store)throw Error('--store is required');
  const sections=[];for(const name of ['range-review','gaps','attention']){
   const rows=await run([name,`--store=${store.id}`],db);sections.push(`## ${name}\n\n${human(rows)}\n`);
  }
  const dir=path.join(process.env.OUTPUT_DIR||REPO_ROOT,'drafts');fs.mkdirSync(dir,{recursive:true,mode:0o700});
  const file=path.join(dir,`range-review-${store.code.replace(/[^a-z0-9-]/gi,'-')}-${randomUUID()}.md`);
  fs.writeFileSync(file,`# Private range review: ${store.name}\n\nDraft only. Check periods and currency before deciding. No shelf or selling-price changes made.\n\n${sections.join('\n')}`,{flag:'wx',mode:0o600});return [{file}];
 }
 const actor=req(f,'actor');
 return tx(db,async()=>{
  let result,kind=cmd;
  if(cmd==='add-store'){
   const applies=f['unit-pricing']?choice(f['unit-pricing'],['yes','no'],'unit-pricing')==='yes':false;
   result=await db.query('insert into stores(code,name,cluster,currency,owner,review_due,unit_pricing_applies) values($1,$2,$3,$4,$5,$6,$7) returning *',
   [req(f,'code'),req(f,'name'),req(f,'cluster'),currency(req(f,'currency')),req(f,'owner'),date(req(f,'due')),applies]);
  }else if(cmd==='add-product'){
   result=await db.query('insert into products(sku,name,category,brand) values($1,$2,$3,$4) returning *',[req(f,'sku'),req(f,'name'),req(f,'category'),f.brand||'']);
  }else if(cmd==='close-action'){
   const action=await resolve(db,'actions',req(f,'action'));
   result=await db.query('update actions set closed_on=current_date,resolution=$1 where id=$2 and closed_on is null returning *',[req(f,'resolution'),action.id]);
   if(!result.length)throw Error('Action is already closed');
  }else{
   if(!store)throw Error('--store is required');
   if(cmd==='review-store'){
    const before=await db.query('select * from stores where id=$1 for update',[store.id]);
    result=await db.query('update stores set review_due=$1 where id=$2 returning *',[date(req(f,'due')),store.id]);
    await event(db,store.id,'review-context',actor,{before:before[0],reason:req(f,'reason')});
   }else if(cmd==='add-action'){
    result=await db.query('insert into actions(store_id,title,owner,due_on) values($1,$2,$3,$4) returning *',[store.id,req(f,'title'),req(f,'owner'),date(req(f,'due'))]);
   }else if(cmd==='log'){
    result=await event(db,store.id,'note',actor,{text:req(f,'text')});return result;
   }else{
    const p=await resolve(db,'products',req(f,'product'));
    if(cmd==='set-range'){
     await db.query('select id from stores where id=$1 for update',[store.id]);
     const before=await db.query('select * from ranges where store_id=$1 and product_id=$2',[store.id,p.id]);
     result=await db.query(`insert into ranges(store_id,product_id,status,reason) values($1,$2,$3,$4)
       on conflict(store_id,product_id) do update set status=excluded.status,reason=excluded.reason returning *`,
       [store.id,p.id,choice(req(f,'status'),['active','paused','delisted'],'status'),req(f,'reason')]);
     await event(db,store.id,'range-before',actor,{before:before[0]||null});
    }else if(cmd==='record-label'){
     const checked=date(req(f,'checked'));if(checked>today())throw Error('A label check cannot be dated in the future');
     const before=await db.query('select * from ranges where store_id=$1 and product_id=$2 for update',[store.id,p.id]);
     result=await db.query('update ranges set unit_price_evidence=$1,label_checked_on=$2 where store_id=$3 and product_id=$4 returning *',[req(f,'evidence'),checked,store.id,p.id]);
     if(!result.length)throw Error('Set the product range first');
     await event(db,store.id,'label-before',actor,{before:before[0]});
    }else if(cmd==='add-decision'){
     const rows=await db.query('select * from range_performance where store_id=$1 and product_id=$2',[store.id,p.id]);
     if(!rows.length)throw Error('No product observation in the latest store report');
     if(Date.parse(today())-Date.parse(rows[0].period_end)>14*86400000)throw Error('Latest report is older than 14 days; import current evidence first');
     result=await db.query('insert into decisions(store_id,product_id,recommendation,rationale,evidence_ref,actor,snapshot) values($1,$2,$3,$4,$5,$6,$7) returning *',
       [store.id,p.id,choice(req(f,'recommendation'),['keep','review','delist'],'recommendation'),req(f,'reason'),req(f,'evidence'),actor,JSON.stringify(rows[0])]);
    }else throw Error(`Not implemented: ${cmd}`);
   }
  }
  await event(db,store?.id||result[0]?.store_id||(cmd==='add-store'?result[0].id:null),kind,actor,{result});return result;
 });
}
async function importReport(db,f,store){
 if(!store)throw Error('--store is required');
 const actor=req(f,'actor'),start=date(req(f,'start')),end=date(req(f,'end')),cur=currency(req(f,'currency'));
 if(start>end||end>today())throw Error('Report dates must be ordered and not in the future');
 if(cur!==store.currency)throw Error('Currency differs from store currency');
 const expected=count(req(f,'expected-count')),source=req(f,'source-ref');
 const mapping=JSON.parse(fs.readFileSync(req(f,'map'),'utf8'));if(!mapping||Array.isArray(mapping)||typeof mapping!=='object')throw Error('Mapping must be an object');
 const required=['sku','name','category','units','sales_amount'];
 const optional=['brand','cost_amount','stock_units','facings','width_mm'];
 for(const k of required)if(typeof mapping[k]!=='string'||!mapping[k].trim())throw Error(`Mapping missing ${k}`);
 for(const [k,v] of Object.entries(mapping))if(![...required,...optional].includes(k)||typeof v!=='string'||!v.trim())throw Error(`Invalid mapping field ${k}`);
 if(new Set(Object.values(mapping)).size!==Object.values(mapping).length)throw Error('Each source column can map to only one field');
 const raw=fs.readFileSync(req(f,'file'),'utf8'),hash=createHash('sha256').update(raw).digest('hex');
 const csv=parseCsv(raw);if(csv.length!==expected)throw Error(`Expected ${expected} rows, found ${csv.length}`);
 const seen=new Set();const rows=csv.map((r,i)=>{
  for(const col of Object.values(mapping))if(!(col in r))throw Error(`Mapped column missing: ${col}`);
  const val=k=>mapping[k]?r[mapping[k]].trim():'';
  const text=k=>{const v=val(k);if(!v)throw Error(`Row ${i+2}: empty ${k}`);return v;};
  const sku=text('sku');if(seen.has(sku))throw Error(`Duplicate SKU ${sku}: aggregate a product report to one row per SKU`);seen.add(sku);
  const n=(k,p=3)=>numeric(val(k),`Row ${i+2} ${k}`,p,optional.includes(k));
  const facings=n('facings');if(facings!==null&&!Number.isInteger(facings))throw Error('Facings must be an integer');
  const width=n('width_mm');if(width===0)throw Error('Product width must be positive or blank');
  return {sku,name:text('name'),category:text('category'),brand:val('brand'),units:n('units'),sales_amount:n('sales_amount',2),cost_amount:n('cost_amount',2),stock_units:n('stock_units'),facings,width_mm:width};
 });
 const canonical=o=>JSON.stringify(Object.fromEntries(Object.entries(o).sort(([a],[b])=>a.localeCompare(b))));
 return tx(db,async()=>{
  await db.query('select id from stores where id=$1 for update',[store.id]);
  const prior=await db.query('select * from reports where store_id=$1 and period_start<=$2 and period_end>=$3',[store.id,end,start]);
  if(prior.length){const old=prior[0];
   if(prior.length===1&&old.period_start===start&&old.period_end===end&&old.source_sha256===hash&&canonical(old.mapping)===canonical(mapping))return [{status:'unchanged',report_id:old.id,rows:old.row_count}];
   throw Error('Conflicting or overlapping report. Existing evidence was not changed.');
  }
  if(f['dry-run'])return [{status:'dry-run',rows:rows.length,store:store.code,period_start:start,period_end:end,currency:cur,missing_costs:rows.filter(r=>r.cost_amount===null).length}];
  const [report]=await db.query('insert into reports(store_id,period_start,period_end,currency,source_ref,source_sha256,mapping,row_count,actor) values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id',
   [store.id,start,end,cur,source,hash,JSON.stringify(mapping),rows.length,actor]);
  for(const r of rows){
   await db.query('insert into products(sku,name,category,brand) values($1,$2,$3,$4) on conflict(sku) do nothing',[r.sku,r.name,r.category,r.brand]);
   const [p]=await db.query('select id from products where sku=$1',[r.sku]);
   await db.query('insert into observations(report_id,product_id,source_sku,source_name,source_category,source_brand,units,sales_amount,cost_amount,stock_units,facings,width_mm) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
    [report.id,p.id,r.sku,r.name,r.category,r.brand,r.units,r.sales_amount,r.cost_amount,r.stock_units,r.facings,r.width_mm]);
  }
  await event(db,store.id,'import',actor,{report_id:report.id,rows:rows.length,source_ref:source,sha256:hash});
  return [{status:'imported',report_id:report.id,rows:rows.length}];
 });
}
export function human(rows){if(!Array.isArray(rows))return JSON.stringify(rows,null,2);if(!rows.length)return '(none)';const cols=Object.keys(rows[0]);return table(rows,cols.map(key=>({key,label:key.replaceAll('_',' '),format:v=>v===null?'unknown':typeof v==='object'?JSON.stringify(v):v})));}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){let db;try{parse(process.argv.slice(2));db=await getDb();const result=await run(process.argv.slice(2),db);console.log(process.argv.includes('--json')?JSON.stringify(result,null,2):human(result));}catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}}
