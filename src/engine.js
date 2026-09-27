import { sha256 } from '@noble/hashes/sha2.js';
export const ENGINE_VERSION = 'groundwork-queue-checker/2.0';
export const TEMPLATE_VERSION = 'queue-template/2.0';
export const DEFAULT_CONFIG = {capacity:3,policy:'drop-oldest'};
export const DEFAULT_CHECK_CONFIG = {maxTransitions:10000,alphabet:['A','B'],initialState:[]};
export const digest = value => Array.from(sha256(new TextEncoder().encode(typeof value==='string'?value:JSON.stringify(value))),b=>b.toString(16).padStart(2,'0')).join('');
export function validateConfig(c){if(!c||!Number.isInteger(c.capacity)||c.capacity<1||c.capacity>6||!['drop-oldest','drop-newest'].includes(c.policy))throw new Error('Supported capacity is 1–6; choose a supported discard policy.');return c;}
export function formalContract(config){validateConfig(config);return {schema:'finite-queue-contract/2',capacity:config.capacity,alphabet:['A','B'],initial:[],actions:['push:A','push:B','pop'],overflow:config.policy,acceptance:{capacity:'length(next.queue) <= capacity',queue:config.policy==='drop-oldest'?'push: suffix(queue ++ value, capacity)':'push: prefix(queue ++ value, capacity)',pop:'output = head(queue) or null; next.queue = tail(queue)',discard:config.policy==='drop-oldest'?'on overflow: dropped = head(queue)':'on overflow: dropped = incoming value'},assumptions:['Atomic sequential operations','Records are A or B','JavaScript runtime, generator and checker are trusted'],exclusions:['Concurrent access','Native compilation correctness','Real hardware timing','Arbitrary record values','A theorem-kernel-checked proof']};}
export function makeSpec(config,revision=1,goal='Keep the audio loop responsive'){const contract=formalContract(config);return {revision,goal,config:{...config},contract,id:digest({goal,contract}),createdAt:new Date().toISOString()};}
// Acceptance conditions are evaluated independently of candidate source.
export function contractStep(queue,action,contract){
 const c=contract;if(!c.actions.includes(action))throw new Error('Unsupported action');
 if(action==='pop')return {queue:queue.filter((_,i)=>i>0),output:queue.length?queue[0]:null,dropped:null};
 const value=action.split(':')[1],combined=queue.concat(value),overflow=combined.length>c.capacity;
 return {queue:c.overflow==='drop-oldest'?combined.slice(-c.capacity):combined.slice(0,c.capacity),output:null,dropped:overflow?(c.overflow==='drop-oldest'?combined[0]:value):null};
}
export function sourceFor(config,variant='correct'){
 validateConfig(config);if(!['correct','unbounded','reversed'].includes(variant))throw new Error('Unknown candidate variant');
 const body=variant==='unbounded'?'  next.push(value);\n  return { queue: next, output: null, dropped: null };':`  let dropped = null;\n  if (next.length === CAPACITY) {\n${config.policy==='drop-newest'?'    return { queue: next, output: null, dropped: value };':'    dropped = next.shift();'}\n  }\n  next.push(value);${variant==='reversed'?'\n  next.reverse();':''}\n  return { queue: next, output: null, dropped };`;
 return `// ${TEMPLATE_VERSION}\n// Executable A/B queue. Atomic sequential operations only.\nconst CAPACITY = ${config.capacity};\nexport function step(queue, action) {\n  if (!Array.isArray(queue) || queue.length > CAPACITY ||\n      queue.some(value => value !== 'A' && value !== 'B')) {\n    throw new Error('Queue state is outside the supported domain');\n  }\n  if (!['push:A', 'push:B', 'pop'].includes(action)) {\n    throw new Error('Unsupported action');\n  }\n  const next = queue.slice();\n  if (action === 'pop') {\n    return { queue: next.slice(1), output: next[0] ?? null, dropped: null };\n  }\n  const value = action.slice(5);\n${body}\n}\n`;
}
export function makeImplementation(config,revision=1,variant='correct',reason='Generate from approved contract'){
 const source=sourceFor(config,variant);return {revision,config:{...config},variant,source,id:digest(source),template:TEMPLATE_VERSION,reason,createdAt:new Date().toISOString()};
}
const executableCache=new Map();
export function executable(artifact){
 if(!artifact||artifact.id!==digest(artifact.source))throw new Error('Implementation identity does not match its source.');
 // Only deterministic bundled templates may be evaluated; no arbitrary code import.
 if(artifact.source!==sourceFor(artifact.config,artifact.variant))throw new Error('Source is outside the supported template.');
 if(!executableCache.has(artifact.id))executableCache.set(artifact.id,new Function('"use strict";\n'+artifact.source.replace('export function step','function step')+'\nreturn step;')());
 return executableCache.get(artifact.id);
}
export function runTrace(artifact,operations,initial=[]){const step=executable(artifact);let queue=initial.slice();return operations.map((operation,index)=>{const before=queue.slice();try{const result=step(queue.slice(),operation);queue=result.queue.slice();return {index:index+1,before,operation,...result};}catch(error){return {index:index+1,before,operation,error:error.message,queue:queue.slice()};}});}
export function previewDifference(oldSpec,newSpec){const size=Math.max(oldSpec.config.capacity,newSpec.config.capacity),initial=Array.from({length:size},(_,i)=>i%2?'B':'A');const before=initial.slice(0,oldSpec.config.capacity),after=initial.slice(0,newSpec.config.capacity);return {operation:'push:B',before:{initial:before,result:contractStep(before,'push:B',oldSpec.contract)},after:{initial:after,result:contractStep(after,'push:B',newSpec.contract)}};}
export function validateCheckConfig(config){if(!config||!Number.isInteger(config.maxTransitions)||config.maxTransitions<1||config.maxTransitions>10000||JSON.stringify(config.alphabet)!=='["A","B"]'||JSON.stringify(config.initialState)!=='[]')throw new Error('Unsupported checking configuration');return config;}
export function binding(spec,implementation,configuration=DEFAULT_CHECK_CONFIG){return {specificationRevision:spec.revision,specificationId:digest({goal:spec.goal,contract:spec.contract}),implementationRevision:implementation?.revision??null,implementationId:implementation?digest(implementation.source):null,checker:ENGINE_VERSION,configurationId:digest(configuration)};}
function reportBase(spec,impl,configuration){return {kind:'bounded-model-checking',binding:binding(spec,impl,configuration),specification:structuredClone(spec),implementation:structuredClone(impl),checker:{name:ENGINE_VERSION,configuration:structuredClone(configuration)},bounds:{alphabet:['A','B'],capacity:spec.config.capacity,initial:[],maxTransitions:configuration.maxTransitions,possibleValidStates:2**(spec.config.capacity+1)-1,depth:'Reachability closure; no fixed depth cutoff'},assumptions:[...spec.contract.assumptions],exclusions:[...spec.contract.exclusions],correspondence:'Checker and live sample execute the same stored JavaScript module source via executable(artifact). No separate implementation model or native compilation.',startedAt:new Date().toISOString()};}
export function* checkSteps(spec,implementation,configuration=DEFAULT_CHECK_CONFIG){
 spec=structuredClone(spec);implementation=structuredClone(implementation);configuration=structuredClone(configuration);
 const base=reportBase(spec,implementation,configuration),start=performance.now(),queue=[{state:[],path:[]}],seen=new Set(['[]']);let transitions=0,maxDepth=0,complete=false;const violations=[];const checks={capacity:[],queue:[],outputs:[]};
 const finish=(outcome,message)=>{const report={...base,outcome,message,complete,states:seen.size,transitions,maxDepth,violations,properties:Object.entries(checks).map(([id,errors])=>({id,statement:{capacity:spec.contract.acceptance.capacity,queue:spec.contract.acceptance.queue+'; '+spec.contract.acceptance.pop,outputs:spec.contract.acceptance.discard}[id],outcome:errors.length?'failed':complete?'passed':'inconclusive',counterexamples:errors})),elapsedMs:+(performance.now()-start).toFixed(3),finishedAt:new Date().toISOString()};report.id=digest(report);return report;};
 try{
  validateCheckConfig(configuration);validateConfig(spec.config);
  if(spec.id!==digest({goal:spec.goal,contract:spec.contract}))throw new Error('Specification identity mismatch');
  if(JSON.stringify(spec.contract)!==JSON.stringify(formalContract(spec.config)))throw new Error('Contract is outside supported deterministic schema');
  const step=executable(implementation);
  for(let index=0;index<queue.length;index++){
   const {state,path}=queue[index];
   for(const action of spec.contract.actions){
    if(transitions>=configuration.maxTransitions)return finish(violations.length?'failed':'inconclusive','Transition budget exhausted before closure.');
    const expected=contractStep(state,action,spec.contract),actual=step(state.slice(),action);transitions++;maxDepth=Math.max(maxDepth,path.length+1);
    const failing=[];
    if(!Array.isArray(actual.queue)||actual.queue.length>spec.config.capacity)failing.push('capacity');
    if(JSON.stringify(actual.queue)!==JSON.stringify(expected.queue))failing.push('queue');
    if(actual.output!==expected.output||actual.dropped!==expected.dropped)failing.push('outputs');
    if(failing.length){const witness={initial:[],operations:[...path,action],before:state,operation:action,expected,actual,properties:failing};violations.push(witness);for(const property of failing)checks[property].push(witness);}
    if(Array.isArray(actual.queue)&&actual.queue.length<=spec.config.capacity&&actual.queue.every(x=>['A','B'].includes(x))){const key=JSON.stringify(actual.queue);if(!seen.has(key)){seen.add(key);queue.push({state:actual.queue,path:[...path,action]});}}
    yield {states:seen.size,transitions,violations:violations.length,maxDepth};
   }
  }
  complete=violations.length===0;return finish(violations.length?'failed':'passed',violations.length?'A reproducible contract violation was found.':'Reachability closure completed without a violation.');
 }catch(error){return finish('inconclusive','Checker error: '+error.message);}
}
export function checkArtifact(spec,impl,config=DEFAULT_CHECK_CONFIG){const it=checkSteps(spec,impl,config);let value;do{value=it.next();}while(!value.done);return value.value;}
export function interruptedEvidence(spec,impl,config,progress={},reason='Check interrupted'){const base=reportBase(spec,impl,config);const r={...base,outcome:'inconclusive',complete:false,message:reason,states:progress.states||0,transitions:progress.transitions||0,violations:[],properties:['capacity','queue','outputs'].map(id=>({id,outcome:'inconclusive',statement:'Run did not complete',counterexamples:[]})),finishedAt:new Date().toISOString()};r.id=digest(r);return r;}
export function evidenceCurrency(evidence,spec,impl,config=DEFAULT_CHECK_CONFIG){if(!evidence||!impl)return 'stale';try{validateCheckConfig(config);executable(impl);if(JSON.stringify(spec.contract)!==JSON.stringify(formalContract(spec.config)))return 'stale';}catch{return 'stale';}return JSON.stringify(evidence.binding)===JSON.stringify(binding(spec,impl,config))&&evidence.implementation.id===digest(impl.source)&&spec.id===digest({goal:spec.goal,contract:spec.contract})?'current':'stale';}
