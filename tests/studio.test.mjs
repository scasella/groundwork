import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {KINDS,defaults,validateConfig} from '../src/studio/config.js';
import {artifactFor,executable} from '../src/studio/programs.js';
import {checkProject,canKeep,currency,expectedPattern} from '../src/studio/engine.js';
import {htmlExport,patternSvg,editableExport,exportIdentity} from '../src/studio/exports.js';
import {newStudio,newProject,checkDraft,editProject,keepProject,currentArtifact,isKept,restoreStudio,importProject,loadStudio} from '../src/studio/session.js';
import {digest} from '../src/engine.js';
test('all four prepared project families complete their finite checks, including both creative rules',()=>{
 for(const kind of KINDS)for(const rule of kind==='pattern'?['mirror','turn']:kind==='story'?['back','restart']:kind==='garden'?['free','shared']:[null]){
  const c=defaults(kind);if(rule)c[{pattern:'symmetry',story:'navigation',garden:'water'}[kind]]=rule;
  const a=artifactFor(kind,c),r=checkProject(a);assert.equal(r.outcome,'passed',r.message);assert.equal(r.complete,true);assert.ok(r.states>0);assert.ok(r.transitions>0);assert.equal(currency(r,a),'current');assert.equal(canKeep(r,a),true);assert.deepEqual(r.binding.exports,exportIdentity(a));
  if(kind==='memory'){assert.equal(r.states,272);assert.equal(r.transitions,2720);}
  if(kind==='story')assert.equal(r.transitions,28);
 }
});
test('pattern basis marks test every cell under both symmetries; SVG decodes to those actual cells',()=>{
 for(const symmetry of ['mirror','turn'])for(let mark=0;mark<32;mark++){
  const c={...defaults('pattern'),symmetry,seed:Array(32).fill(0)};c.seed[mark]=3;const a=artifactFor('pattern',c),cells=executable(a)();assert.deepEqual(cells,expectedPattern(c));assert.equal(cells.filter(v=>v===3).length,2);assert.equal(checkProject(a).outcome,'passed');
 }
 const a=artifactFor('pattern',defaults('pattern')),dom=new JSDOM(patternSvg(a),{contentType:'image/svg+xml'});assert.equal(dom.window.document.querySelectorAll('rect').length,1024);assert.equal(dom.window.document.querySelectorAll('script,foreignObject,image').length,0);dom.window.close();
});
test('memory ignores self matches, third clicks, and clicking matched cards; reset preserves the chosen board',()=>{
 const run=executable(artifactFor('memory',defaults('memory'))),deck=run(null,{type:'deck'});let state=run(null);const other=deck.findIndex(x=>x!==deck[0]),partner=deck.findIndex((x,i)=>i!==0&&x===deck[0]);state=run(state,{type:'select',index:0});assert.deepEqual(run(state,{type:'select',index:0}),state);state=run(state,{type:'select',index:other});assert.equal(state.pending,true);assert.deepEqual(run(state,{type:'select',index:partner}),state);state=run(state,{type:'next'});state=run(run(state,{type:'select',index:0}),{type:'select',index:partner});assert.equal(state.matched,1+2**partner);assert.deepEqual(run(state,{type:'select',index:0}),state);assert.deepEqual(run(state,{type:'reset'}),run(null));assert.deepEqual(deck,run(null,{type:'deck'}));
});
test('story follows edited destinations, visits endings, and Back differs from Restart-only',()=>{
 const c=defaults('story');c.scenes.start.choices[0].to='endB';let run=executable(artifactFor('story',c)),state=run(run(null),{type:'choose',index:0});assert.equal(state.node,'endB');assert.equal(run(state,{type:'back'}).node,'start');c.navigation='restart';run=executable(artifactFor('story',c));assert.deepEqual(run(state,{type:'back'}),state);assert.equal(checkProject(artifactFor('story',c)).outcome,'passed');c.scenes.left.choices[0].to='start';assert.throws(()=>validateConfig('story',c),/destination/);
});
test('garden shared drops are consumed only by actual growth and Next turn refills them',()=>{
 const c={...defaults('garden'),water:'shared'},run=executable(artifactFor('garden',c));let s=run(null);s=run(run(s,{type:'water',index:0}),{type:'water',index:0});assert.deepEqual(s,{stages:[2,0,0],water:1});assert.deepEqual(run(s,{type:'water',index:0}),s);s=run(s,{type:'water',index:1});assert.equal(s.water,0);assert.deepEqual(run(s,{type:'water',index:2}),s);assert.deepEqual(run(s,{type:'next'}),{stages:[2,1,0],water:3});
});
test('unsupported source and incomplete budgets fail closed; changed conditions invalidate a pass',()=>{
 for(const kind of KINDS){const a=artifactFor(kind,defaults(kind)),r=checkProject(a);assert.equal(checkProject(a,{budget:1}).outcome,'inconclusive');assert.equal(canKeep(checkProject(a,{budget:1}),a),false);const changed={...a,source:a.source+'\n// edited'};changed.id=digest(changed.source);assert.throws(()=>executable(changed),/mismatch/);assert.equal(checkProject(changed).outcome,'inconclusive');assert.equal(currency(r,changed),'stale');assert.equal(currency(r,a,{budget:99}),'stale');const tampered=structuredClone(r);tampered.contract.assumptions.push('new assumption');assert.equal(currency(tampered,a),'stale');}
});
test('downloaded module and inline HTML module have the exact checked source and behavior',async()=>{
 for(const kind of KINDS){const a=artifactFor(kind,defaults(kind)),loaded=await import('data:text/javascript;base64,'+Buffer.from(a.source).toString('base64')),run=executable(a),html=htmlExport(a);assert.ok(html.includes(a.source));assert.equal(loaded.run.toString(),run.toString());assert.deepEqual(loaded.run(null),run(null));assert.ok(!/<script[^>]+src=|<link[^>]+href=/.test(html));const dom=new JSDOM(html);assert.equal(dom.window.document.querySelectorAll('script').length,1);assert.equal(dom.window.document.querySelector('meta[name="groundwork-artifact"]').content,a.id);dom.window.close();}
});
test('untrusted project words remain text in HTML/SVG and cannot close inline scripts',()=>{
 const text='A <tag> & "quote" </script> end';for(const kind of KINDS){const c=defaults(kind);c.title=text;if(kind==='story')c.scenes.start.body=text;const a=artifactFor(kind,c),html=htmlExport(a),dom=new JSDOM(html);assert.equal(dom.window.document.querySelector('h1').textContent,text);assert.equal(dom.window.document.querySelectorAll('script').length,1);assert.equal(dom.window.document.querySelectorAll('tag').length,0);assert.ok(a.source.includes('\\u003c'));dom.window.close();if(kind==='pattern'){const svg=new JSDOM(patternSvg(a),{contentType:'image/svg+xml'});assert.equal(svg.window.document.querySelector('title').textContent,text);svg.window.close();}}
});
test('all projects keep historical decisions, restore as drafts, and snapshot their original settings',()=>{
 const studio=newStudio();for(const kind of KINDS){let p=keepProject(checkDraft(studio.projects[kind]));assert.equal(isKept(p),true);const original=JSON.stringify(p.reports[0]);p=editProject(p,{...p.config,title:'Changed'});assert.equal(isKept(p),false);assert.equal(currency(p.reports[0],currentArtifact(p)),'stale');assert.throws(()=>keepProject(p),/complete check/);assert.equal(JSON.stringify(p.reports[0]),original);p=keepProject(checkDraft(p));assert.equal(p.decisions.length,2);studio.projects[kind]=p;}const restored=restoreStudio(JSON.stringify(studio));for(const p of Object.values(restored.projects))assert.equal(isKept(p),true);assert.deepEqual(restored,studio);
});
test('editable imports carry settings only; malformed stored histories preserve original bytes',()=>{
 const p=keepProject(checkDraft(newProject('story'))),a=currentArtifact(p),raw=editableExport(a),imported=importProject(raw);assert.deepEqual(Object.keys(imported),['kind','config']);assert.equal(editProject(p,imported.config).reports.length,1);assert.equal(isKept(editProject(p,imported.config)),false);assert.throws(()=>importProject(raw.repeat(10000)),/100 KB/);assert.throws(()=>importProject('{"format":"unknown"}'));
 const s=newStudio();s.projects.story=p;s.projects.story.decisions[0].sourceId='wrong';const invalid=JSON.stringify(s);assert.throws(()=>restoreStudio(invalid),/Keep decision/);const loaded=loadStudio({getItem:()=>invalid});assert.equal(loaded.recovery.raw,invalid);assert.equal(loaded.data.projects.story.reports.length,0);
});
test('checked exports are immutable snapshots bound to the report, separate from later drafts',()=>{
 let p=checkDraft(newProject('pattern'));const r=p.reports[0],html=r.outputs.html;assert.equal(digest(html),r.binding.exports.html);assert.equal(digest(r.outputs.svg),r.binding.exports.svg);p=editProject(p,{...p.config,title:'Another design'});assert.equal(p.reports[0].outputs.html,html);assert.notEqual(htmlExport(currentArtifact(p)),html);assert.equal(currency(r,currentArtifact(p)),'stale');const altered=structuredClone(r);altered.outputs.html+='changed';assert.equal(currency(altered,r.artifact),'stale');
});
