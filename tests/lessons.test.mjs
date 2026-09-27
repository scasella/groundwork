import test from 'node:test';
import assert from 'node:assert/strict';
import {digest} from '../src/engine.js';
import {PEOPLE,makeLessonRule,makeLessonArtifact,lessonExecutable,checkLesson,lessonCurrency,expectedShopping} from '../src/lesson-engine.js';
import {newLesson,newLessons,startLesson,repairLesson,proposeLesson,approveLessonChange,acceptLesson,lessonAcceptance,lessonCanAccept,lessonSample,restoreLessons} from '../src/lesson-session.js';

test('badge checks both policies against independent answers and reproduces wrong-field defect',()=>{
 for(const policy of ['first','full']){
  const rule=makeLessonRule('badge',policy),bad=makeLessonArtifact('badge',policy,1,'buggy'),fixed=makeLessonArtifact('badge',policy,2);
  const failed=checkLesson(rule,bad),passed=checkLesson(rule,fixed);
  assert.equal(failed.outcome,'failed');assert.equal(failed.cases.length,4);assert.deepEqual(lessonExecutable(bad)(failed.cases[0].input),failed.cases[0].actual);
  assert.equal(passed.outcome,'passed');assert.equal(passed.complete,true);assert.equal(passed.cases.length,4);
  assert.equal(passed.cases[0].actual.text,policy==='first'?'Maya':'Maya Chen');assert.equal(failed.cases[0].actual.text,policy==='first'?'Chen':'Chen Chen');
 }
});
test('shopping explores all four states, four views and eight enabled transitions under each policy',()=>{
 for(const policy of ['hide','all']){
  const rule=makeLessonRule('shopping',policy),artifact=makeLessonArtifact('shopping',policy);
  const report=checkLesson(rule,artifact);assert.equal(report.outcome,'passed');assert.equal(report.cases.length,12);assert.equal(report.bounds.states,4);assert.equal(report.bounds.transitions,8);
  const bad=makeLessonArtifact('shopping',policy,1,'buggy'),failure=checkLesson(rule,bad),w=failure.cases.find(c=>c.outcome==='failed');assert.equal(failure.outcome,'failed');assert.deepEqual(w.input,[false,false]);assert.equal(w.action,'milk');assert.deepEqual(w.actual.rows,[]);assert.deepEqual(lessonExecutable(bad)(w.input,w.action),w.actual);
  const result=lessonExecutable(artifact)([false,false],'milk');assert.deepEqual(result.state,[true,false]);assert.deepEqual(result.rows.map(r=>r.name),policy==='hide'?['Bread']:['Milk','Bread']);assert.deepEqual(result.receipt,['Milk']);
 }
});
test('badge and shopping downloads execute the same module bytes as live samples and checker',async()=>{
 for(const kind of ['badge','shopping'])for(const policy of kind==='badge'?['first','full']:['hide','all']){
  const artifact=makeLessonArtifact(kind,policy);const module=await import('data:text/javascript;base64,'+Buffer.from(artifact.source).toString('base64'));
  const report=checkLesson(makeLessonRule(kind,policy),artifact);for(const c of report.cases)assert.deepEqual(module.run(c.input,c.action),c.actual);
 }
});
test('both lessons retain failures, repair without changing rule, and require fresh optional acceptance after intent revision',()=>{
 for(const kind of ['badge','shopping']){
  let s=startLesson(newLesson(kind));const rule=s.rule.id,bad=s.artifact.id;assert.equal(lessonCanAccept(s),false);assert.throws(()=>acceptLesson(s));
  s=repairLesson(s);assert.equal(s.rule.id,rule);assert.notEqual(s.artifact.id,bad);s=acceptLesson(s);const accepted=lessonAcceptance(s),old=s.evidence.at(-1);
  s=proposeLesson(s);assert.equal(lessonCanAccept(s),false);assert.equal(lessonAcceptance(s),null);s=approveLessonChange(s);
  assert.notEqual(s.rule.id,rule);assert.equal(s.rule.revision,2);assert.equal(s.evidence.length,3);assert.equal(s.acceptances[0].evidenceId,accepted.evidenceId);assert.equal(lessonAcceptance(s),null);assert.equal(lessonCurrency(old,s.rule,s.artifact),'stale');
  assert.equal(s.evidence.at(-1).outcome,'passed');s=acceptLesson(s);assert.equal(s.acceptances.length,2);
 }
});
test('second lesson can reverse either badge choice and neither finishing nor keeping a rule accepts it',()=>{
 let s=repairLesson(startLesson({...newLesson('badge'),choice:'full'}));s=proposeLesson(s);assert.equal(s.draft.policy,'first');s={...s,draft:null,phase:'done'};assert.equal(s.acceptances.length,0);assert.equal(s.rule.policy,'full');assert.equal(lessonCanAccept(s),true);
});
test('identity, assumptions, checking configuration and corrupted evidence fail closed',()=>{
 const s=repairLesson(startLesson(newLesson('badge'))),e=s.evidence.at(-1);
 const edited={...s.artifact,source:s.artifact.source+'\n'};assert.equal(lessonCurrency(e,s.rule,edited),'stale');assert.equal(checkLesson(s.rule,edited).outcome,'inconclusive');assert.throws(()=>lessonExecutable({...edited,id:digest(edited.source)}));
 const rule=structuredClone(s.rule);rule.contract.assumptions.push('Extra assumption');rule.id=digest(rule.contract);assert.equal(lessonCurrency(e,rule,s.artifact),'stale');assert.equal(checkLesson(rule,s.artifact).outcome,'inconclusive');
 assert.equal(lessonCurrency(e,s.rule,s.artifact,{maxCases:1}),'stale');const budget=checkLesson(s.rule,s.artifact,{maxCases:1});assert.equal(budget.outcome,'inconclusive');assert.equal(budget.complete,false);assert.equal(budget.cases.length,1);
 const corrupt=structuredClone(e);corrupt.outcome='failed';assert.equal(lessonCurrency(corrupt,s.rule,s.artifact),'stale');
});
test('snapshots, persistence and independent lesson progress survive without aliasing',()=>{
 const root=newLessons();root.lessons.badge=acceptLesson(repairLesson(startLesson(root.lessons.badge)));root.lessons.shopping=repairLesson(startLesson(root.lessons.shopping));root.lessons.shopping=lessonSample(root.lessons.shopping,'milk');root.selected='shopping';
 const restored=restoreLessons(JSON.stringify(root));assert.equal(lessonAcceptance(restored.lessons.badge).evidenceId,lessonAcceptance(root.lessons.badge).evidenceId);assert.deepEqual(restored.lessons.shopping.sample,[true,false]);
 const s=root.lessons.badge,old=structuredClone(s.evidence);s.rule.contract.assumptions.push('later');s.artifact.policy='full';assert.deepEqual(s.evidence,old);
 const invalid=structuredClone(restored);invalid.lessons.badge.evidence[0].outcome='passed';assert.throws(()=>restoreLessons(JSON.stringify(invalid)));
});
test('shopping disabled actions and unsupported input cannot silently mutate items',()=>{
 const run=lessonExecutable(makeLessonArtifact('shopping','hide'));assert.throws(()=>run([true,false],'milk'));assert.throws(()=>run([false,false],'eggs'));assert.throws(()=>run([false],'view'));assert.deepEqual(run([true,true],'reset'),expectedShopping('hide',[false,false]));
});
test('mutating a returned evidence input cannot alter the independent checker domain',()=>{
 const rule=makeLessonRule('shopping','hide'),artifact=makeLessonArtifact('shopping','hide');const first=checkLesson(rule,artifact);first.cases[0].input[0]=true;
 const next=checkLesson(rule,artifact);assert.equal(next.outcome,'passed');assert.equal(next.cases.length,12);assert.deepEqual(next.cases[0].input,[false,false]);assert.ok(next.properties.every(p=>p.outcome==='passed'));
});
test('malformed lesson decisions and revisions are rejected before rendering',()=>{
 const root=newLessons();root.lessons.badge=acceptLesson(repairLesson(startLesson(root.lessons.badge)));
 for(const mutate of [s=>s.acceptances=[null],s=>s.artifact.revision={bad:'value'},s=>s.rule.revision={bad:'value'},s=>s.approvals=[null],s=>s.changes=[null]]){
  const broken=structuredClone(root);mutate(broken.lessons.badge);assert.throws(()=>restoreLessons(JSON.stringify(broken)));
 }
});
