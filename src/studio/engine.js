import {digest} from '../engine.js';
import {validateConfig,ruleSummary,LIMITS,ASSUMPTIONS} from './config.js';
import {executable} from './programs.js';
import {exportIdentity,patternSvg,htmlExport} from './exports.js';
export const CHECKER='groundwork-starters-finite/1';
export const BUDGET=10000;
export function contractFor(kind,settings){const config=validateConfig(kind,settings);return {kind,config,domain:kind==='pattern'?{seedCells:32,tileCells:64,svgCells:1024,paletteSize:4}:{initial:initialFor(kind),actions:actionsFor(kind),reachability:'Explore reachable states until closure or the transition budget'},promise:ruleSummary(kind,config),assumptions:ASSUMPTIONS.slice(),exclusions:[LIMITS[kind],'Prepared finite programs only; no arbitrary code verification or theorem-kernel proof.']};}
// Independent expected answers: never call a generated function to compute them.
export function expectedPattern(c){return Array.from({length:64},(_,i)=>{const y=Math.floor(i/8),x=i%8;return c.seed[(x<4?y:c.symmetry==='mirror'?y:7-y)*4+(x<4?x:7-x)];});}
export function reference(kind,c,state,action,deck){
 if(kind==='memory'){
  if(action.type==='reset')return {matched:0,open:[],pending:false};
  const {matched,open,pending}=state;
  if(action.type==='next')return pending?{matched,open:[],pending:false}:structuredClone(state);
  const index=action.index;
  if(action.type!=='select'||pending||open.includes(index)||(matched&(2**index)))return structuredClone(state);
  if(!open.length)return {matched,open:[index],pending:false};
  return deck[open[0]]===deck[index]?{matched:matched+2**open[0]+2**index,open:[],pending:false}:{matched,open:[open[0],index],pending:true};
 }
 if(kind==='story'){
  if(action.type==='reset')return {node:'start',history:[]};
  if(action.type==='back'&&c.navigation==='back'&&state.history.length)return {node:state.history.at(-1),history:state.history.slice(0,-1)};
  if(action.type==='choose'&&c.scenes[state.node].choices[action.index])return {node:c.scenes[state.node].choices[action.index].to,history:[...state.history,state.node]};
  return structuredClone(state);
 }
 if(action.type==='reset')return {stages:[0,0,0],water:3};
 const allowed=action.type==='water'&&state.stages[action.index]<2&&(c.water==='free'||state.water>0);
 return {stages:state.stages.map((n,i)=>allowed&&action.index===i?n+1:n),water:action.type==='next'&&c.water==='shared'?3:allowed&&c.water==='shared'?state.water-1:state.water};
}
const actionsFor=kind=>kind==='memory'?[...Array.from({length:8},(_,index)=>({type:'select',index})),{type:'next'},{type:'reset'}]:kind==='story'?[{type:'choose',index:0},{type:'choose',index:1},{type:'back'},{type:'reset'}]:[...Array.from({length:3},(_,index)=>({type:'water',index})),{type:'next'},{type:'reset'}];
const initialFor=kind=>kind==='memory'?{matched:0,open:[],pending:false}:kind==='story'?{node:'start',history:[]}:{stages:[0,0,0],water:3};
function binding(artifact,contract,budget){return {sourceId:digest(artifact.source),revision:artifact.revision,contractId:digest(contract),checker:CHECKER,budget,exports:exportIdentity(artifact)};}
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function checkProject(artifact,{budget=BUDGET}={}){
 const snapshot=structuredClone(artifact),contract=contractFor(snapshot.kind,snapshot.config);
 const report={kind:'finite-exhaustive-check',artifact:snapshot,contract,configuration:{budget},binding:null,outcome:'inconclusive',complete:false,states:0,transitions:0,properties:[],startedAt:new Date().toISOString(),limits:LIMITS[snapshot.kind]};
 try{
  if(!Number.isInteger(budget)||budget<1||budget>10000)throw Error('Unsupported transition budget');
  const run=executable(snapshot),c=contract.config,kind=snapshot.kind;report.binding=binding(snapshot,contract,budget);report.outputs={html:htmlExport(snapshot),...(kind==='pattern'?{svg:patternSvg(snapshot)}:{})};
  const compare=(expected,actual,trace,property)=>{if(!equal(expected,actual)){report.outcome='failed';report.witness={initial:kind==='pattern'?null:initialFor(kind),trace,expected,actual,property};throw Error(`Mismatch: ${property}`);}};
  if(kind==='pattern'){
   if(budget<64)throw Error('Budget exhausted before checking all cells');
   const expected=expectedPattern(c);compare(expected,run(),[],'tile cells follow the chosen symmetry and marks');report.states=1;report.transitions=64;
   const svg=patternSvg(snapshot),rects=[...svg.matchAll(/<rect x="(\d+)" y="(\d+)" width="10" height="10" fill="(#[0-9a-f]{6})"\/>/g)];
   compare(1024,rects.length,[],'SVG contains all 1024 repeated cells');
   for(let i=0;i<rects.length;i++){const [,x,y,color]=rects[i],row=Math.floor(i/32),col=i%32;compare([col*10,row*10,c.palette[expected[(row%8)*8+col%8]]],[Number(x),Number(y),color],[],'SVG geometry and colors match checked cells');}
   report.properties=['64 tile cells match the chosen marks and symmetry','1024 SVG cells match the checked tile'];
  }else{
   let deck;
   if(kind==='memory'){deck=run(null,{type:'deck'});compare([...c.symbols,...c.symbols].sort(),deck.slice().sort(),[],'each approved symbol occurs twice');compare(deck,run(null,{type:'deck'}),[],'chosen arrangement is repeatable');report.board=deck.slice();}
   const initial=initialFor(kind);compare(initial,run(null,{type:'init'}),[],'initial state');
   const queue=[{state:initial,trace:[]}],seen=new Set([JSON.stringify(initial)]),actions=actionsFor(kind);
   for(let head=0;head<queue.length;head++){
    const {state,trace}=queue[head];
    for(const action of actions){
     if(report.transitions>=budget)throw Error('Transition budget exhausted before reaching closure');
     const expected=reference(kind,c,state,action,deck),actual=run(structuredClone(state),structuredClone(action));report.transitions++;
     compare(expected,actual,[...trace,action],'state transition');const key=JSON.stringify(expected);
     if(!seen.has(key)){seen.add(key);queue.push({state:expected,trace:[...trace,action]});}
    }
    report.states=seen.size;
   }
   report.properties=kind==='memory'?['Four approved pairs','Distinct cards are required for a match','Pending turns ignore further card clicks','Matched cards persist until restart']:kind==='story'?['Every choice follows its selected destination','All supported forward routes end within two choices','Back and restart follow the selected rule']:['Only the watered pot grows','Growth stays in three stages','Shared or unlimited water follows the selected rule'];
  }
  report.complete=true;report.outcome='passed';report.message='Every supported case matched your settings.';
 }catch(error){report.message=error.message;}
 report.finishedAt=new Date().toISOString();report.id=digest(report);return report;
}
export function currency(report,artifact,{budget=BUDGET}={}){
 try{const {id,...body}=report;if(id!==digest(body)||!report.outputs||digest(report.outputs.html)!==report.binding?.exports.html||(report.outputs.svg&&digest(report.outputs.svg)!==report.binding?.exports.svg))return 'stale';const contract=contractFor(artifact.kind,artifact.config);executable(artifact);return equal(report.binding,binding(artifact,contract,budget))?'current':'stale';}catch{return 'stale';}
}
export function canKeep(report,artifact){return !!report&&report.outcome==='passed'&&report.complete&&currency(report,artifact)==='current';}
