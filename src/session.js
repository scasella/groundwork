import {record,strings,fields,revision,booleans} from './storage-validation.js';
import {makeSpec,makeImplementation,DEFAULT_CONFIG,DEFAULT_CHECK_CONFIG,digest,evidenceCurrency,interruptedEvidence,formalContract,executable,validateCheckConfig} from './engine.js';
export const SESSION_KEY='groundwork.v2';
export function newSession(){const spec=makeSpec(DEFAULT_CONFIG);return {schema:2,name:'audio-core',spec,specifications:[structuredClone(spec)],implementations:[],implementation:null,changes:[],evidence:[],acceptances:[],approvals:[],approved:false,started:false,guide:true,seedDefect:true,checkConfig:structuredClone(DEFAULT_CHECK_CONFIG),activeRun:null,latestEvidenceId:null,rules:[],draft:null,sample:{queue:[],events:[],artifactId:null},view:'overview'};}
const stamp=()=>new Date().toISOString();
export function proposeSpec(s,config,goal=s.spec.goal){const proposed=makeSpec(config,s.approved?s.spec.revision+1:s.spec.revision,goal);if(!s.approved)return {...s,spec:proposed,specifications:[structuredClone(proposed)],draft:null};return {...s,draft:{type:'requirement-change',previous:structuredClone(s.spec),proposed,at:stamp()}};}
export function approveSpec(s){
 if(s.draft){const {previous,proposed}=s.draft;return {...s,spec:proposed,specifications:[...s.specifications,structuredClone(proposed)],approved:true,approvals:[...s.approvals,{specId:proposed.id,revision:proposed.revision,at:stamp()}],changes:[...s.changes,{id:digest(s.draft),kind:'requirement-change',from:previous.id,to:proposed.id,before:structuredClone(previous),after:structuredClone(proposed),approvedAt:stamp(),explanation:'Human changed the desired behavior; previous correctness is unchanged.'}],draft:null,activeRun:null,latestEvidenceId:null};}
 return {...s,approved:true,started:true,approvals:[...s.approvals,{specId:s.spec.id,revision:s.spec.revision,at:stamp()}]};
}
export function generateImplementation(s,variant='correct',kind='implementation-generation'){
 if(!s.approved||s.draft)throw new Error('Approve the proposed interpretation first.');
 const artifact=makeImplementation(s.spec.config,s.implementations.length+1,variant,kind);
 return {...s,implementation:artifact,implementations:[...s.implementations,structuredClone(artifact)],changes:[...s.changes,{kind,from:s.implementation?.id||null,to:artifact.id,specificationId:s.spec.id,at:stamp(),explanation:kind==='tutorial-repair'?'Prepared deterministic template repair; no live agent.':kind==='tutorial-code-regression'?'Introduced the prepared code-only overflow defect. The approved requirement did not change.':kind==='tutorial-initial'&&variant==='unbounded'?'Prepared deliberately faulty tutorial executable; checking must establish whether it satisfies the approved contract.':'Generated from the approved structured contract.'}],latestEvidenceId:null,activeRun:null,sample:{queue:[],events:[],artifactId:artifact.id}};
}
export function beginRun(s){if(!s.approved||s.draft||!s.implementation)throw new Error('An approved spec and implementation are required.');return {...s,activeRun:{id:crypto.randomUUID(),spec:structuredClone(s.spec),implementation:structuredClone(s.implementation),configuration:structuredClone(s.checkConfig),startedAt:stamp()},latestEvidenceId:null};}
export function finishRun(s,result,runId=s.activeRun?.id){
 const current=!!s.activeRun&&s.activeRun.id===runId&&evidenceCurrency(result,s.spec,s.implementation,s.checkConfig)==='current';
 if(s.evidence.some(e=>e.id===result.id))return s;
 return {...s,activeRun:current?null:s.activeRun,evidence:[...s.evidence,structuredClone(result)],latestEvidenceId:current?result.id:s.latestEvidenceId};
}
export function cancelRun(s,progress,reason){if(!s.activeRun)return s;const r=interruptedEvidence(s.activeRun.spec,s.activeRun.implementation,s.activeRun.configuration,progress,reason);return finishRun(s,r);}
export function latestEvidence(s){return s.evidence.find(e=>e.id===s.latestEvidenceId)||null;}
export function canAccept(s,acknowledged=true){const e=latestEvidence(s);return !!(acknowledged&&s.approved&&!s.draft&&!s.activeRun&&e&&e.outcome==='passed'&&e.complete&&evidenceCurrency(e,s.spec,s.implementation,s.checkConfig)==='current');}
export function acceptChange(s){if(!canAccept(s))throw new Error('Current complete passing evidence is required.');if(currentAcceptance(s))return s;const e=latestEvidence(s);return {...s,acceptances:[...s.acceptances,{id:digest({evidence:e.id,at:stamp()}),evidenceId:e.id,specificationId:s.spec.id,implementationId:s.implementation.id,at:stamp(),scope:'Finite sequential A/B JavaScript queue only',remainingLimitations:structuredClone(e.exclusions)}]};}
export function currentAcceptance(s){const e=latestEvidence(s);return canAccept(s)?s.acceptances.findLast(a=>a.evidenceId===e.id)||null:null;}
export function changeCheckConfig(s,config){validateCheckConfig(config);return {...s,checkConfig:structuredClone(config),latestEvidenceId:null,activeRun:null,changes:[...s.changes,{kind:'checking-configuration',before:structuredClone(s.checkConfig),after:structuredClone(config),at:stamp()}]};}
export function sampleStep(s,operation){if(!s.implementation)throw new Error('Build an implementation first.');const before=s.sample.artifactId===s.implementation.id?s.sample.queue:[],result=executable(s.implementation)(before.slice(),operation);return {...s,sample:{artifactId:s.implementation.id,queue:result.queue,events:[...(s.sample.artifactId===s.implementation.id?s.sample.events:[]),{before,operation,...result}]}};}
export function restoreSession(raw){
 const s=JSON.parse(raw);
 if(!s||s.schema!==2)throw new Error('Unsupported session');
 const validSpec=spec=>{fields(spec,['goal','id'],'specification');revision(spec.revision,'specification');if(!spec||spec.id!==digest({goal:spec.goal,contract:spec.contract})||JSON.stringify(spec.contract)!==JSON.stringify(formalContract(spec.config)))throw new Error('Invalid specification');};
 validSpec(s.spec);validateCheckConfig(s.checkConfig);
 for(const key of ['evidence','changes','implementations','specifications','acceptances','approvals','rules'])if(!Array.isArray(s[key]))throw new Error('Invalid session '+key);
 if(typeof s.name!=='string'||!s.sample||!Array.isArray(s.sample.queue)||!Array.isArray(s.sample.events))throw new Error('Invalid session details');
 booleans(s,['approved','started','guide','seedDefect'],'session');
 if(!['overview','intent','review','history','plan','run','knowledge'].includes(s.view))throw Error('Invalid session view');
 strings(s.rules,'conventions');
 const validArtifact=artifact=>{revision(record(artifact,'implementation').revision,'implementation');executable(artifact);};
 const validQueue=queue=>{if(!Array.isArray(queue)||queue.some(x=>x!=='A'&&x!=='B'))throw Error('Invalid sample records');};
 validQueue(s.sample.queue);
 if(s.sample.artifactId!==null&&typeof s.sample.artifactId!=='string')throw Error('Invalid sample artifact identity');
 for(const event of s.sample.events){record(event,'sample event');validQueue(event.before);validQueue(event.queue);if(!['push:A','push:B','pop'].includes(event.operation)||![null,'A','B'].includes(event.output)||![null,'A','B'].includes(event.dropped))throw Error('Invalid sample event');}
 for(const a of s.acceptances){fields(a,['id','evidenceId','specificationId','implementationId','at','scope'],'acceptance');strings(a.remainingLimitations,'acceptance limits');}
 for(const a of s.approvals){fields(a,['specId','at'],'approval');revision(a.revision,'approval');}
 for(const c of s.changes){fields(c,['kind'],'change');if(c.explanation!==undefined&&typeof c.explanation!=='string')throw Error('Invalid change explanation');if(c.kind==='requirement-change'){validSpec(c.before);validSpec(c.after);}}
 s.specifications.forEach(validSpec);s.implementations.forEach(validArtifact);
 if(s.implementation)validArtifact(s.implementation);
 if(s.draft){validSpec(s.draft.previous);validSpec(s.draft.proposed);}
 for(const e of s.evidence){
  const {id,...record}=e;
  if(id!==digest(record)||!['passed','failed','inconclusive'].includes(e.outcome)||!Array.isArray(e.properties)||!Array.isArray(e.violations))throw new Error('Invalid evidence record');
 }
 if(s.latestEvidenceId&&!s.evidence.some(e=>e.id===s.latestEvidenceId))throw new Error('Missing evidence');
 if(s.activeRun){record(s.activeRun,'active run');fields(s.activeRun,['startedAt'],'active run');if(s.activeRun.id!==undefined&&typeof s.activeRun.id!=='string')throw Error('Invalid active run identity');validSpec(s.activeRun.spec);validArtifact(s.activeRun.implementation);validateCheckConfig(s.activeRun.configuration);return cancelRun(s,{},'Check interrupted by refresh. Run it again.');}
 return s;
}
export function projectExport(s){return {format:'groundwork-project/2',project:s.name,current:{specification:s.spec,implementation:s.implementation,checkingConfiguration:s.checkConfig,evidence:latestEvidence(s),acceptance:currentAcceptance(s)},history:{specifications:s.specifications,implementations:s.implementations,changes:s.changes,evidence:s.evidence,acceptances:s.acceptances,approvals:s.approvals},knowledge:s.rules,productionReady:false,scope:'Executable finite sequential A/B queue; no arbitrary formalization, native compilation, concurrency or hardware guarantees.'};}
