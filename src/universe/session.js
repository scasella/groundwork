import {digest} from '../engine.js';
import {defaultProgram,makeArtifact,makeScene,validateWorld,validateLaw,executable,interruptedEvidence} from './engine.js';
export const UNIVERSE_KEY='groundwork.universe.v1';
export const clone=value=>JSON.parse(JSON.stringify(value));
export function freshSession(){
 const artifact=makeArtifact(defaultProgram()),world=makeScene('basin'),law={matter:true,species:true,stone:true};
 return {schema:1,current:{artifact,world,law,origin:'prepared'},draft:artifact,law,lawRevision:1,seed:world,step:0,reports:[],decisions:[],history:[],running:null};
}
function artifactCheck(a){executable(a);return clone(a);}
export function loadSession(storageKey,storage){
 let raw=null;
 try{
  raw=(storage||globalThis.localStorage).getItem(storageKey);if(!raw)return {session:freshSession(),recovery:null};
  const s=JSON.parse(raw);
  if(s.schema!==1||!s.current||!Array.isArray(s.reports)||!Array.isArray(s.decisions)||!Array.isArray(s.history)||!Number.isSafeInteger(s.lawRevision)||s.lawRevision<1||!Number.isInteger(s.step)||s.step<0||s.step>80)throw Error('Unsupported saved workshop');
  s.current.artifact=artifactCheck(s.current.artifact);s.current.world=validateWorld(s.current.world);s.current.law=validateLaw(s.current.law);s.draft=artifactCheck(s.draft);s.law=validateLaw(s.law);s.seed=validateWorld(s.seed);
  const text=v=>typeof v==='string';
  const stamp=v=>text(v)&&Number.isFinite(Date.parse(v));
  for(const report of s.reports){
   if(!report||!text(report.id)||!['pass','fail','inconclusive'].includes(report.outcome)||!Array.isArray(report.properties)||!Array.isArray(report.witnesses)||!text(report.message)||!Number.isInteger(report.checked)||report.checked<0||report.checked>2048||report.total!==2048||!report.engineTests||(!Number.isInteger(report.engineTests.checked)||report.engineTests.checked<0)||!text(report.engineTests.outcome))throw Error('Invalid saved evidence');
   artifactCheck(report.artifact);validateLaw(report.law);
   if(report.properties.some(p=>!p||!text(p.key)||!text(p.label)||!['pass','fail','inconclusive'].includes(p.outcome)))throw Error('Invalid evidence properties');
   for(const w of report.witnesses){if(!w||!text(w.property)||!Array.isArray(w.before)||!Array.isArray(w.after)||w.before.length!==4||w.after.length!==4||[...w.before,...w.after].some(v=>!Number.isInteger(v)||v<0||v>3)||!w.context||![0,1,2,3].includes(w.context.direction)||![0,1].includes(w.context.phase)||!(w.ruleId===null||text(w.ruleId)))throw Error('Invalid witness');}
   const {id,...body}=report;if(id!==digest(body))throw Error('Evidence integrity mismatch');
  }
  for(const decision of s.decisions){artifactCheck(decision.artifact);validateWorld(decision.world);validateLaw(decision.law);if(!stamp(decision.at)||!text(decision.reportId)||!Number.isSafeInteger(decision.lawRevision)||decision.lawRevision<1||typeof decision.html!=='string'||decision.htmlDigest!==digest(decision.html)||!decision.html.includes(decision.artifact.source)||!Number.isInteger(decision.comparisonStep)||decision.comparisonStep<0||decision.comparisonStep>80)throw Error('Invalid historical export');validateWorld(decision.comparisonSeed);const r=s.reports.find(r=>r.id===decision.reportId);if(!r||r.outcome!=='pass'||!r.complete||r.checked!==2048||r.engineTests.outcome!=='pass'||r.properties.some(p=>p.outcome!=='pass')||r.witnesses.length||r.binding?.lawRevision!==decision.lawRevision||JSON.stringify(r.artifact)!==JSON.stringify(decision.artifact)||JSON.stringify(r.law)!==JSON.stringify(decision.law))throw Error('Historical decision has no matching passing evidence');}
  for(const h of s.history){if(!h||!text(h.label)||!stamp(h.at))throw Error('Invalid history entry');if(h.step!==undefined&&(!Number.isInteger(h.step)||h.step<0||h.step>80))throw Error('Invalid historical step');if(h.artifact)artifactCheck(h.artifact);if(h.currentArtifact)artifactCheck(h.currentArtifact);if(h.world)validateWorld(h.world);if(h.law)validateLaw(h.law);if(h.newLaw)validateLaw(h.newLaw);}
  if(s.current.origin==='human'&&!s.decisions.some(d=>JSON.stringify(d.artifact)===JSON.stringify(s.current.artifact)&&JSON.stringify(d.world)===JSON.stringify(s.current.world)&&JSON.stringify(d.law)===JSON.stringify(s.current.law)))throw Error('Current human version has no saved decision');
  if(!['prepared','human'].includes(s.current.origin))throw Error('Invalid current origin');
  if(s.running&&(!Number.isInteger(s.running.checked)||s.running.checked<0||s.running.checked>2048))throw Error('Invalid interrupted check');
  if(s.running){s.reports.push(interruptedEvidence(s.draft,s.law,{lawRevision:s.lawRevision,message:'Check interrupted by refresh. Run a fresh check.',checked:s.running.checked||0}));s.running=null;}
  return {session:clone(s),recovery:null};
 }catch(error){return {session:freshSession(),recovery:{raw,message:error.message}};}
}
export function timeline(artifact,seed,steps=80){const step=executable(artifact).step,frames=[seed.slice()];for(let i=0;i<steps;i++)frames.push(step(frames[i]));return frames;}
export function checkpoint(session,label){return {at:new Date().toISOString(),label,artifact:clone(session.draft),currentArtifact:clone(session.current.artifact),law:clone(session.law),lawRevision:session.lawRevision,world:session.seed.slice(),step:session.step};}
