import test from 'node:test';
import assert from 'node:assert/strict';
import {makeSpec,makeImplementation,checkArtifact,runTrace,executable,evidenceCurrency,previewDifference,DEFAULT_CHECK_CONFIG,digest} from '../src/engine.js';
import {newSession,approveSpec,proposeSpec,generateImplementation,beginRun,finishRun,cancelRun,latestEvidence,canAccept,acceptChange,currentAcceptance,changeCheckConfig,sampleStep,restoreSession} from '../src/session.js';
const built=(variant='correct')=>generateImplementation(approveSpec(newSession()),variant);
const checked=s=>finishRun(beginRun(s),checkArtifact(s.spec,s.implementation,s.checkConfig));
test('all 12 capacity/policy combinations close over the finite domain',()=>{for(let capacity=1;capacity<=6;capacity++)for(const policy of ['drop-oldest','drop-newest']){const config={capacity,policy},r=checkArtifact(makeSpec(config),makeImplementation(config));assert.equal(r.outcome,'passed');assert.equal(r.states,2**(capacity+1)-1);assert.equal(r.transitions,r.states*3);assert.equal(r.complete,true);}});
test('actual defective executable yields a reproducible witness; prepared repair passes',()=>{let s=checked(built('unbounded'));const failure=latestEvidence(s),w=failure.violations[0];assert.equal(failure.outcome,'failed');assert.equal(w.operations.length,4);assert.deepEqual(runTrace(s.implementation,w.operations).at(-1).queue,w.actual.queue);assert.equal(canAccept(s),false);const specId=s.spec.id;s=checked(generateImplementation(s,'correct','tutorial-repair'));assert.equal(s.spec.id,specId);assert.equal(latestEvidence(s).outcome,'passed');assert.equal(evidenceCurrency(failure,s.spec,s.implementation,s.checkConfig),'stale');});
test('live sample, exported module and checker share executable bytes',async()=>{let s=built();const module=await import('data:text/javascript;base64,'+Buffer.from(s.implementation.source).toString('base64'));let q=[];for(const action of ['push:A','push:B','push:A','push:B','pop']){const expected=module.step(q,action);s=sampleStep(s,action);assert.deepEqual(s.sample.queue,expected.queue);assert.deepEqual(executable(s.implementation)(q,action),expected);q=expected.queue;}assert.equal(checkArtifact(s.spec,s.implementation).outcome,'passed');});
test('requirement revision preserves history, changes behavior, requires fresh acceptance',()=>{let s=acceptChange(checked(built()));const old=latestEvidence(s);s=proposeSpec(s,{capacity:3,policy:'drop-newest'});assert.equal(canAccept(s),false);const difference=previewDifference(s.spec,s.draft.proposed);assert.notDeepEqual(difference.before.result,difference.after.result);s=approveSpec(s);assert.equal(evidenceCurrency(old,s.spec,s.implementation,s.checkConfig),'stale');assert.equal(currentAcceptance(s),null);assert.equal(s.evidence.length,1);assert.equal(s.acceptances.length,1);s=checked(generateImplementation(s));assert.equal(latestEvidence(s).outcome,'passed');assert.equal(currentAcceptance(s),null);s=acceptChange(s);assert.equal(s.acceptances.length,2);});
test('code-only regression cannot retain passing evidence or acceptance',()=>{let s=acceptChange(checked(built()));const old=latestEvidence(s),spec=s.spec.id;s=generateImplementation(s,'unbounded');assert.equal(s.spec.id,spec);assert.equal(evidenceCurrency(old,s.spec,s.implementation,s.checkConfig),'stale');assert.equal(canAccept(s),false);assert.equal(latestEvidence(checked(s)).outcome,'failed');});
test('changed source bytes and assumptions invalidate evidence',()=>{const s=checked(built()),e=latestEvidence(s);const changed={...s.implementation,source:s.implementation.source+'\n'};assert.equal(evidenceCurrency(e,s.spec,changed),'stale');assert.equal(checkArtifact(s.spec,changed).outcome,'inconclusive');const spec=structuredClone(s.spec);spec.contract.assumptions.push('new assumption');spec.id=digest({goal:spec.goal,contract:spec.contract});assert.equal(evidenceCurrency(e,spec,s.implementation),'stale');assert.equal(checkArtifact(spec,s.implementation).outcome,'inconclusive');});
test('budget exhaustion, interruption, refresh and process errors fail closed',()=>{let s=checked(built());const old=latestEvidence(s);s=changeCheckConfig(s,{...DEFAULT_CHECK_CONFIG,maxTransitions:1});assert.equal(evidenceCurrency(old,s.spec,s.implementation,s.checkConfig),'stale');s=checked(s);assert.equal(latestEvidence(s).outcome,'inconclusive');assert.equal(canAccept(s),false);const active=beginRun(built());for(const ended of [cancelRun(active,{},'Stopped'),restoreSession(JSON.stringify(active))]){assert.equal(latestEvidence(ended).outcome,'inconclusive');assert.equal(canAccept(ended),false);assert.equal(ended.activeRun,null);}const broken={...active.implementation,id:'wrong'};assert.equal(checkArtifact(active.spec,broken).outcome,'inconclusive');});
test('ordinary refresh preserves evidence, acceptance and runnable artifact',()=>{const s=acceptChange(checked(built()));const restored=restoreSession(JSON.stringify(s));assert.equal(currentAcceptance(restored).id,currentAcceptance(s).id);assert.deepEqual(restored.evidence,s.evidence);assert.equal(sampleStep(restored,'push:B').sample.queue[0],'B');});
test('independent contract detects order mutation',()=>{const s=checked(built('reversed'));assert.equal(latestEvidence(s).outcome,'failed');assert.ok(latestEvidence(s).violations.some(w=>w.properties.includes('queue')));});
test('evidence, active runs, configuration history and acceptance own nested snapshots',()=>{
 let s=checked(built());const report=structuredClone(latestEvidence(s));
 s.spec.contract.assumptions.push('later change');s.implementation.config.capacity=6;s.checkConfig.alphabet.push('C');
 assert.deepEqual(latestEvidence(s),report);
 let active=beginRun(built());active.spec.contract.assumptions.push('later');assert.equal(active.activeRun.spec.contract.assumptions.includes('later'),false);
 let accepted=acceptChange(checked(built()));latestEvidence(accepted).exclusions.push('later');assert.equal(accepted.acceptances[0].remainingLimitations.includes('later'),false);
 const config={...DEFAULT_CHECK_CONFIG,alphabet:['A','B'],initialState:[],maxTransitions:1};let changed=changeCheckConfig(built(),config);config.alphabet.push('C');assert.deepEqual(changed.checkConfig.alphabet,['A','B']);assert.deepEqual(changed.changes.at(-1).after.alphabet,['A','B']);
});
test('late completion cannot terminate or supply evidence for a newer run',()=>{
 const old=beginRun(built());const result=checkArtifact(old.spec,old.implementation);let newer=beginRun(generateImplementation(old,'unbounded'));const id=newer.activeRun.id;
 newer=finishRun(newer,result,old.activeRun.id);assert.equal(newer.activeRun.id,id);assert.equal(latestEvidence(newer),null);assert.equal(canAccept(newer),false);assert.equal(newer.evidence.length,1);
 const stopped=cancelRun(old,{},'Stopped');const late=finishRun(stopped,result,old.activeRun.id);assert.equal(latestEvidence(late).outcome,'inconclusive');assert.equal(canAccept(late),false);
});
test('malformed restores fail closed and first-time capacity choice is not a revision',()=>{
 const s=checked(built());for(const mutate of [x=>delete x.rules,x=>delete x.sample,x=>x.evidence[0].outcome='failed',x=>x.spec.contract.assumptions.push('extra')]){const broken=structuredClone(s);mutate(broken);assert.throws(()=>restoreSession(JSON.stringify(broken)));}
 const draft=proposeSpec(newSession(),{capacity:6,policy:'drop-newest'});assert.equal(draft.draft,null);assert.equal(draft.spec.revision,1);assert.equal(draft.spec.config.capacity,6);
});
test('malformed stored UI histories and active artifacts are rejected before rendering',()=>{
 const passing=acceptChange(checked(built()));
 for(const mutate of [s=>s.acceptances=[null],s=>s.rules=[{bad:'value'}],s=>s.sample.queue=[{bad:'value'}],s=>s.changes=[{kind:'tutorial-repair',explanation:{bad:'value'}}],s=>s.implementation.revision={bad:'value'}]){
  const s=structuredClone(passing);mutate(s);assert.throws(()=>restoreSession(JSON.stringify(s)));
 }
 const active=beginRun(built());active.activeRun.implementation.revision={bad:'revision'};assert.throws(()=>restoreSession(JSON.stringify(active)));
});
test('legitimate overflow demonstration survives restore and advanced acceptance is idempotent',()=>{
 let s=built('unbounded');for(const operation of ['push:A','push:B','push:A','push:B'])s=sampleStep(s,operation);
 const restored=restoreSession(JSON.stringify(s));assert.deepEqual(restored.sample.queue,['A','B','A','B']);assert.equal(restored.sample.events.length,4);
 const accepted=acceptChange(checked(built()));assert.deepEqual(acceptChange(accepted),accepted);
});
