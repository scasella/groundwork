import {record,strings,fields,revision,booleans} from './storage-validation.js';
import {digest} from './engine.js';
import {makeLessonRule,makeLessonArtifact,lessonExecutable,checkLesson,lessonCurrency,PEOPLE} from './lesson-engine.js';
export const LESSON_KEY='groundwork.lessons.v1';
const copy=x=>structuredClone(x);
export function newLesson(kind){return {kind,choice:kind==='badge'?'first':'hide',phase:'choose',rule:null,artifact:null,rules:[],artifacts:[],evidence:[],approvals:[],acceptances:[],changes:[],draft:null,sample:kind==='badge'?0:[false,false],revised:false};}
export function newLessons(){return {schema:1,selected:'badge',lessons:{badge:newLesson('badge'),shopping:newLesson('shopping')}};}
export const lessonResult=s=>s.evidence.at(-1)||null;
export function lessonCanAccept(s){const e=lessonResult(s);return !!(!s.draft&&e?.outcome==='passed'&&e.complete&&lessonCurrency(e,s.rule,s.artifact)==='current');}
export function lessonAcceptance(s){return lessonCanAccept(s)?s.acceptances.findLast(a=>a.evidenceId===lessonResult(s).id)||null:null;}
function generateAndCheck(s,rule,variant,reason){
  const artifact=makeLessonArtifact(s.kind,rule.policy,s.artifacts.length+1,variant);
  const result=checkLesson(rule,artifact);
  return {...s,rule,artifact,phase:'result',draft:null,sample:s.kind==='badge'?0:[false,false],artifacts:[...s.artifacts,copy(artifact)],evidence:[...s.evidence,result],changes:[...s.changes,{reason,ruleId:rule.id,sourceId:artifact.id,at:new Date().toISOString()}]};
}
export function startLesson(s){
  if(s.rule)throw Error('This lesson already has an approved rule');
  const rule=makeLessonRule(s.kind,s.choice);
  return generateAndCheck({...s,rules:[copy(rule)],approvals:[{ruleId:rule.id,at:new Date().toISOString()}]},rule,'buggy','Initial prepared defect');
}
export function recheckLesson(s){if(!s.rule||s.draft)throw Error('An approved rule is required');const result=checkLesson(s.rule,s.artifact);return {...s,phase:'result',evidence:s.evidence.some(e=>e.id===result.id)?s.evidence:[...s.evidence,result]};}
export function repairLesson(s){if(!s.rule||s.draft)throw Error('An approved rule is required');return generateAndCheck(s,s.rule,'correct','Prepared repair; rule unchanged');}
export function proposeLesson(s){if(!lessonCanAccept(s))throw Error('Complete the repair lesson first');const policy=s.kind==='badge'?(s.rule.policy==='first'?'full':'first'):(s.rule.policy==='hide'?'all':'hide');return {...s,phase:'result',draft:makeLessonRule(s.kind,policy,s.rule.revision+1)};}
export function approveLessonChange(s){
  if(!s.draft)throw Error('Review a proposed rule first');const rule=s.draft;
  return generateAndCheck({...s,revised:true,rules:[...s.rules,copy(rule)],approvals:[...s.approvals,{ruleId:rule.id,at:new Date().toISOString()}]},rule,'correct','Human changed desired behavior; earlier correctness is unchanged');
}
export function acceptLesson(s){if(!lessonCanAccept(s))throw Error('Current complete passing evidence required');if(lessonAcceptance(s))return s;const e=lessonResult(s);return {...s,acceptances:[...s.acceptances,{ruleId:s.rule.id,sourceId:s.artifact.id,evidenceId:e.id,scope:e.scope,remainingLimits:copy(e.exclusions),at:new Date().toISOString()}]};}
export function lessonSample(s,action){
  const run=lessonExecutable(s.artifact);
  if(s.kind==='badge'){if(!PEOPLE[action])throw Error('Choose a supplied fictional person');run(PEOPLE[action]);return {...s,sample:action};}
  return {...s,sample:run(s.sample,action).state};
}
export function restoreLessons(raw){
  const root=JSON.parse(raw);if(root?.schema!==1||!['badge','shopping'].includes(root.selected))throw Error('Unsupported lesson session');
  for(const kind of ['badge','shopping']){
    const s=root.lessons?.[kind];if(s?.kind!==kind||!['choose','result','done'].includes(s.phase))throw Error('Invalid lesson');
    for(const key of ['rules','artifacts','evidence','approvals','acceptances','changes'])if(!Array.isArray(s[key]))throw Error('Missing lesson history');
    booleans(s,['revised'],'lesson');
    for(const a of s.acceptances){fields(a,['ruleId','sourceId','evidenceId','scope','at'],'acceptance');strings(a.remainingLimits,'acceptance limits');}
    for(const a of s.approvals)fields(a,['ruleId','at'],'approval');
    for(const c of s.changes)fields(c,['reason','ruleId','sourceId','at'],'change');
    makeLessonRule(kind,s.choice);
    for(const rule of [...s.rules,...(s.rule?[s.rule]:[]),...(s.draft?[s.draft]:[])]){revision(record(rule,'rule').revision,'rule');if(rule.kind!==kind||rule.id!==digest(rule.contract)||JSON.stringify(rule.contract)!==JSON.stringify(makeLessonRule(kind,rule.policy).contract))throw Error('Invalid stored rule');}
    for(const artifact of [...s.artifacts,...(s.artifact?[s.artifact]:[])]){revision(record(artifact,'artifact').revision,'artifact');if(artifact.kind!==kind)throw Error('Wrong lesson artifact');lessonExecutable(artifact);}
    for(const e of s.evidence){const {id,...body}=e;if(id!==digest(body)||!Array.isArray(e.cases))throw Error('Damaged stored evidence');}
    if(kind==='badge'?!Number.isInteger(s.sample)||!PEOPLE[s.sample]:!Array.isArray(s.sample)||s.sample.length!==2||s.sample.some(x=>typeof x!=='boolean'))throw Error('Invalid sample');
    if(s.rule&&s.evidence.length&&lessonCurrency(lessonResult(s),s.rule,s.artifact)!=='current')s.phase='result';
    if((!!s.rule)!=(!!s.artifact)||s.phase!=='choose'&&!s.rule)throw Error('Incomplete lesson artifacts');
  }
  return root;
}
