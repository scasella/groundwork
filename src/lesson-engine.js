import {digest} from './engine.js';

export const LESSON_CHECKER = 'groundwork-beginner-checker/1';
export const LESSON_CONFIG = Object.freeze({maxCases:100});
export const PEOPLE = Object.freeze([
  Object.freeze({id:'maya-chen',first:'Maya',last:'Chen'}),
  Object.freeze({id:'maya-patel',first:'Maya',last:'Patel'}),
  Object.freeze({id:'leo-ortiz',first:'Leo',last:'Ortiz'}),
  Object.freeze({id:'noor-ali',first:'Noor',last:'Ali'}),
]);
// Independent, literal expected answers. Candidate code does not call these tables.
const BADGES = {
  first:['Maya','Maya','Leo','Noor'],
  full:['Maya Chen','Maya Patel','Leo Ortiz','Noor Ali'],
};
const STATES = [[false,false],[true,false],[false,true],[true,true]];
const TRANSITIONS = {'00':{milk:'10',bread:'01',reset:'00'},'10':{bread:'11',reset:'00'},'01':{milk:'11',reset:'00'},'11':{reset:'00'}};
const ROWS = {
  '00':[{id:'milk',name:'Milk',bought:false},{id:'bread',name:'Bread',bought:false}],
  '10':[{id:'milk',name:'Milk',bought:true},{id:'bread',name:'Bread',bought:false}],
  '01':[{id:'milk',name:'Milk',bought:false},{id:'bread',name:'Bread',bought:true}],
  '11':[{id:'milk',name:'Milk',bought:true},{id:'bread',name:'Bread',bought:true}],
};
const VISIBLE = {'00':['milk','bread'],'10':['bread'],'01':['milk'],'11':[]};
const RECEIPTS = {'00':[],'10':['Milk'],'01':['Bread'],'11':['Milk','Bread']};
const REFERENCE_ID=digest({BADGES,STATES,TRANSITIONS,ROWS,VISIBLE,RECEIPTS});
export const lessonScope = kind => kind==='badge'
  ? 'Checked only the four fictional people offered here. Other names, typing, and printing are not covered.'
  : 'Checked all four bought/not-bought combinations for Milk and Bread and every supported button. Real purchases, sharing, and saving across devices are not covered.';
export function validatePolicy(kind,policy){
  if(!(kind==='badge'?['first','full']:kind==='shopping'?['hide','all']:[]).includes(policy))throw Error('Unsupported lesson rule');
}
export function lessonContract(kind,policy){
  validatePolicy(kind,policy);
  return {schema:'groundwork-beginner-contract/1',kind,policy,
    domain:kind==='badge'?{people:structuredClone(PEOPLE)}:{items:['milk','bread'],states:structuredClone(STATES),initial:[false,false],actions:'view; mark a still-needed item bought; reset'},
    promise:kind==='badge'?(policy==='first'?'Display exactly the first-name field.':'Display the first-name field, one space, then the last-name field.')
      :`Mark only the requested item bought; reset clears both flags. ${policy==='hide'?'Show only still-needed items.':'Show both items with their bought status.'} Preserve Milk/Bread order and report bought items separately.`,
    assumptions:['JavaScript runtime, prepared generator, independent reference tables, and checker are trusted.','Operations happen one at a time.'],
    exclusions:[lessonScope(kind),'Browser rendering and accessibility need separate UI validation.','No arbitrary source import, live AI repair, independent proof kernel, or production guarantee.']};
}
export function makeLessonRule(kind,policy,revision=1){const contract=lessonContract(kind,policy);return {kind,policy,revision,contract,id:digest(contract)};}
function validRule(rule){if(rule.id!==digest(rule.contract)||JSON.stringify(rule.contract)!==JSON.stringify(lessonContract(rule.kind,rule.policy)))throw Error('Rule identity or supported contract mismatch');}
export function lessonSource(kind,policy,variant='correct'){
  validatePolicy(kind,policy);if(!['correct','buggy'].includes(variant))throw Error('Unsupported prepared variant');
  if(kind==='badge')return `// Groundwork prepared badge module v1\nexport function run(person) {\n  const first = person.${variant==='buggy'?'last':'first'};\n  return { text: ${policy==='full'?"first + ' ' + person.last":'first'} };\n}\n`;
  return `// Groundwork prepared shopping module v1\nexport function run(state, action = 'view') {\n  if (!Array.isArray(state) || state.length !== 2 || state.some(x => typeof x !== 'boolean')) throw new Error('Unsupported list state');\n  const next = state.slice();\n  if (action === 'reset') next.fill(false);\n  else if (action !== 'view') {\n    const index = ['milk', 'bread'].indexOf(action);\n    if (index < 0 || next[index]) throw new Error('Only a still-needed item can be marked bought');\n    next[index] = true;\n  }\n  const rows = [{ id: 'milk', name: 'Milk', bought: next[0] }, { id: 'bread', name: 'Bread', bought: next[1] }];\n  const visible = ${variant==='buggy'?"next.some(Boolean) ? [] : rows":policy==='hide'?'rows.filter(row => !row.bought)':'rows'};\n  return { state: next, rows: visible, receipt: rows.filter(row => row.bought).map(row => row.name) };\n}\n`;
}
export function makeLessonArtifact(kind,policy,revision=1,variant='correct'){
  const source=lessonSource(kind,policy,variant);return {kind,policy,revision,variant,source,id:digest(source)};
}
const cache=new Map();
export function lessonExecutable(artifact){
  if(!artifact||artifact.id!==digest(artifact.source)||artifact.source!==lessonSource(artifact.kind,artifact.policy,artifact.variant))throw Error('Executable identity or prepared source mismatch');
  if(!cache.has(artifact.id))cache.set(artifact.id,new Function('"use strict";\n'+artifact.source.replace('export function run','function run')+'\nreturn run;')());
  return cache.get(artifact.id);
}
export function expectedBadge(policy,index){validatePolicy('badge',policy);if(!PEOPLE[index])throw Error('Unsupported person');return {text:BADGES[policy][index]};}
export function expectedShopping(policy,state,action='view'){
  validatePolicy('shopping',policy);
  const key=Object.keys(ROWS).find(key=>JSON.stringify([...key].map(x=>x==='1'))===JSON.stringify(state));
  if(!key)throw Error('Unsupported reference state');
  const next=action==='view'?key:TRANSITIONS[key][action];if(!next)throw Error('Unsupported reference action');
  return structuredClone({state:[...next].map(x=>x==='1'),rows:policy==='all'?ROWS[next]:ROWS[next].filter(row=>VISIBLE[next].includes(row.id)),receipt:RECEIPTS[next]});
}
function binding(rule,artifact,config){return {ruleRevision:rule.revision,ruleId:digest(rule.contract),sourceRevision:artifact.revision,sourceId:digest(artifact.source),checker:LESSON_CHECKER,referenceId:REFERENCE_ID,configId:digest(config)};}
function validateConfig(config){if(!Number.isInteger(config.maxCases)||config.maxCases<1||config.maxCases>100)throw Error('Unsupported case budget');}
export function checkLesson(rule,artifact,config=LESSON_CONFIG){
  rule=structuredClone(rule);artifact=structuredClone(artifact);config=structuredClone(config);
  const report={kind:'exhaustive-finite-check',binding:binding(rule,artifact,config),rule,artifact,configuration:config,startedAt:new Date().toISOString(),scope:lessonScope(rule.kind),assumptions:rule.contract.assumptions,exclusions:rule.contract.exclusions,cases:[],outcome:'inconclusive',complete:false};
  try{
    validRule(rule);validateConfig(config);const run=lessonExecutable(artifact);
    if(artifact.kind!==rule.kind)throw Error('Artifact domain differs from rule');
    const cases=rule.kind==='badge'?PEOPLE.map((person,index)=>({input:structuredClone(person),expected:expectedBadge(rule.policy,index)}))
      :STATES.flatMap(state=>['view',...Object.keys(TRANSITIONS[state.map(Number).join('')])].map(action=>({input:structuredClone(state),action,expected:expectedShopping(rule.policy,state,action)})));
    report.bounds={supportedCases:cases.length,people:rule.kind==='badge'?4:undefined,states:rule.kind==='shopping'?4:undefined,transitions:rule.kind==='shopping'?8:undefined};
    for(const c of cases){
      if(report.cases.length>=config.maxCases)throw Error('Case budget exhausted before completing the supported domain');
      const actual=run(structuredClone(c.input),c.action);
      report.cases.push({...c,actual,outcome:JSON.stringify(c.expected)===JSON.stringify(actual)?'passed':'failed'});
    }
    report.complete=true;report.outcome=report.cases.some(c=>c.outcome==='failed')?'failed':'passed';
    report.message=report.outcome==='passed'?'Every supported case matched the approved rule.':'A reproducible mismatch was found.';
  }catch(error){report.message=error.message;}
  report.properties=(rule.kind==='badge'?['text']:['state','rows','receipt']).map(field=>({field,outcome:report.cases.some(c=>JSON.stringify(c.expected[field])!==JSON.stringify(c.actual[field]))?'failed':report.complete?'passed':'inconclusive'}));
  report.finishedAt=new Date().toISOString();report.id=digest(report);return report;
}
export function lessonCurrency(report,rule,artifact,config=LESSON_CONFIG){
  try{validRule(rule);lessonExecutable(artifact);validateConfig(config);const {id,...body}=report;
    return id===digest(body)&&JSON.stringify(report.binding)===JSON.stringify(binding(rule,artifact,config))?'current':'stale';
  }catch{return 'stale';}
}
