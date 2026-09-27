import {KINDS,defaults,validateConfig} from './config.js';
import {artifactFor,executable} from './programs.js';
import {checkProject,canKeep,currency} from './engine.js';
import {digest} from '../engine.js';
export const STUDIO_KEY='groundwork.starters.v1';
export function newProject(kind){return {kind,config:defaults(kind),revision:1,reports:[],decisions:[]};}
export function newStudio(){return {schema:1,projects:Object.fromEntries(KINDS.map(k=>[k,newProject(k)]))};}
export const currentArtifact=p=>artifactFor(p.kind,p.config,p.revision);
export const currentReport=p=>p.reports.at(-1);
export function editProject(project,settings){return {...project,config:validateConfig(project.kind,settings),revision:project.revision+1};}
export function checkDraft(project){const report=checkProject(currentArtifact(project));return {...project,reports:project.reports.some(r=>r.id===report.id)?project.reports:[...project.reports,report]};}
export function keepProject(project){const report=currentReport(project);if(!canKeep(report,currentArtifact(project)))throw Error('Run a complete check of these settings before keeping a checked version');if(project.decisions.some(d=>d.reportId===report.id))return project;return {...project,decisions:[...project.decisions,{reportId:report.id,sourceId:report.artifact.id,revision:project.revision,at:new Date().toISOString(),decision:'kept-after-review'}]};}
export function isKept(project){const report=currentReport(project);return canKeep(report,currentArtifact(project))&&project.decisions.some(d=>d.reportId===report.id);}
export function importProject(raw){if(typeof raw!=='string'||raw.length>100000)throw Error('Choose a Groundwork project JSON smaller than 100 KB');const data=JSON.parse(raw);if(data.format!=='groundwork-project/1')throw Error('This is not an editable Groundwork project');return {kind:data.kind,config:validateConfig(data.kind,data.config)};}
function assert(test,message){if(!test)throw Error(message);}
export function restoreStudio(raw){
 const s=JSON.parse(raw);assert(s&&s.schema===1&&s.projects,'Unsupported starter workspace');
 for(const kind of KINDS){const p=s.projects[kind];assert(p&&p.kind===kind,'Missing starter project');p.config=validateConfig(kind,p.config);currentArtifact(p);assert(Array.isArray(p.reports)&&Array.isArray(p.decisions),'Missing project history');
  for(const r of p.reports){assert(r&&r.artifact&&r.artifact.kind===kind&&r.contract&&Array.isArray(r.properties)&&r.properties.every(x=>typeof x==='string')&&['passed','failed','inconclusive'].includes(r.outcome)&&typeof r.message==='string'&&typeof r.id==='string'&&typeof r.complete==='boolean','Malformed check history');executable(r.artifact);const {id,...body}=r;assert(id===digest(body),'Check history identity mismatch');assert(r.artifact.revision<=p.revision,'History is newer than the draft');assert(r.outcome!=='passed'||r.complete,'Incomplete result claimed a pass');}
  for(const d of p.decisions){assert(d&&d.decision==='kept-after-review'&&typeof d.at==='string','Malformed keep decision');const r=p.reports.find(r=>r.id===d.reportId);assert(r&&r.outcome==='passed'&&r.complete&&d.sourceId===r.artifact.id&&d.revision===r.artifact.revision,'Keep decision does not identify a completed passing revision');}
 }
 return s;
}
export function loadStudio(storage,key=STUDIO_KEY){let raw=null;try{raw=storage.getItem(key);return {data:raw?restoreStudio(raw):newStudio(),recovery:null};}catch(error){return {data:newStudio(),recovery:{raw,message:error.message}};}}
export function historyLabel(report,project){return `${report.outcome} · ${currency(report,currentArtifact(project))==='current'?'current settings':'historical settings'}`;}
