import {digest} from '../engine.js';
import {validateConfig,safeJson} from './config.js';
// Literal templates keep source identity stable across development and minified builds.
const PROGRAMS={
pattern:String.raw`export function run() {
 const cells=Array(64).fill(0);
 for(let y=0;y<8;y++)for(let x=0;x<4;x++){
  const value=CONFIG.seed[y*4+x]; cells[y*8+x]=value;
  const otherY=CONFIG.symmetry==='mirror'?y:7-y;
  cells[otherY*8+7-x]=value;
 }
 return cells;
}`,
memory:String.raw`export function run(state,action={type:'init'}) {
 const deck=CONFIG.symbols.flatMap(s=>[s,s]); let seed=CONFIG.seed;
 for(let i=7;i>0;i--){seed=(seed*1664525+1013904223)>>>0;const j=seed%(i+1);[deck[i],deck[j]]=[deck[j],deck[i]];}
 if(action.type==='deck')return deck;
 if(!state||action.type==='reset')return {matched:0,open:[],pending:false};
 const next={matched:state.matched,open:state.open.slice(),pending:state.pending};
 if(action.type==='next'&&next.pending){next.open=[];next.pending=false;}
 if(action.type==='select'){
  const i=action.index;
  if(!Number.isInteger(i)||i<0||i>7||next.pending||(next.matched&(1<<i))||next.open.includes(i))return next;
  next.open.push(i);
  if(next.open.length===2){const [a,b]=next.open;if(deck[a]===deck[b]){next.matched|=(1<<a)|(1<<b);next.open=[];}else next.pending=true;}
 }
 return next;
}`,
story:String.raw`export function run(state,action={type:'init'}) {
 if(!state||action.type==='reset')return {node:'start',history:[]};
 const next={node:state.node,history:state.history.slice()};
 if(action.type==='back'&&CONFIG.navigation==='back'&&next.history.length)next.node=next.history.pop();
 if(action.type==='choose'){
  const choice=CONFIG.scenes[next.node].choices[action.index];
  if(choice){next.history.push(next.node);next.node=choice.to;}
 }
 return next;
}`,
garden:String.raw`export function run(state,action={type:'init'}) {
 if(!state||action.type==='reset')return {stages:[0,0,0],water:3};
 const next={stages:state.stages.slice(),water:state.water};
 if(action.type==='next'&&CONFIG.water==='shared')next.water=3;
 if(action.type==='water'){
  const i=action.index;
  if(Number.isInteger(i)&&i>=0&&i<3&&next.stages[i]<2&&(CONFIG.water==='free'||next.water>0)){
   next.stages[i]++;if(CONFIG.water==='shared')next.water--;
  }
 }
 return next;
}`};
export function sourceFor(kind,settings){const config=validateConfig(kind,settings);return `// Groundwork ${kind} prepared module v1\nconst CONFIG = ${safeJson(config)};\n${PROGRAMS[kind]}\n`;}
export function artifactFor(kind,settings,revision=1){if(!Number.isSafeInteger(revision)||revision<1)throw Error('Invalid revision');const config=validateConfig(kind,settings),source=sourceFor(kind,config);return {kind,config,revision,source,id:digest(source)};}
const cache=new Map();
export function executable(artifact){
 if(!artifact||!Number.isSafeInteger(artifact.revision)||artifact.revision<1||artifact.id!==digest(artifact.source)||artifact.source!==sourceFor(artifact.kind,artifact.config))throw Error('Source identity or supported template mismatch');
 if(!cache.has(artifact.id)){if(cache.size>=32)cache.delete(cache.keys().next().value);cache.set(artifact.id,new Function('"use strict";\n'+artifact.source.replace('export function run','function run')+'\nreturn run;')());}
 return cache.get(artifact.id);
}
