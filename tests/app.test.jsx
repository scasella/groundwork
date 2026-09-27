// @vitest-environment jsdom
import React from 'react';
import {test,expect,afterEach,beforeEach,vi} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {App} from '../src/App.jsx';
import {SESSION_KEY} from '../src/session.js';
beforeEach(()=>{vi.spyOn(window,'scrollTo').mockImplementation(()=>{});});
afterEach(()=>{cleanup();localStorage.clear();vi.restoreAllMocks();});
const click=name=>fireEvent.click(screen.getByRole('button',{name}));
const session=()=>JSON.parse(localStorage.getItem(SESSION_KEY));
test('new user repairs code, changes intent, accepts, refreshes, and detects code regression',async()=>{
 render(<App/>);click('Start guided project');click('Approve interpretation & check');
 await screen.findByText('Bounded check failed',{}, {timeout:5000});
 expect(session().evidence[0].violations[0].operations).toHaveLength(4);
 click('Apply tutorial repair & recheck');await screen.findByText('Bounded check passed',{}, {timeout:5000});
 for(const name of ['Add A','Add B','Add A','Add B'])click(name);
 expect(session().sample.queue).toEqual(['B','A','B']);
 click(/Compare a different policy/);expect(screen.getByText('Different intent. Different correct behavior.')).toBeTruthy();
 click('Approve change & check');await screen.findByText('Bounded check passed',{}, {timeout:5000});
 expect(session().spec.config.policy).toBe('drop-newest');expect(session().evidence).toHaveLength(3);
 expect(screen.getByRole('button',{name:'Accept this revision'}).disabled).toBe(true);
 fireEvent.click(screen.getByRole('checkbox',{name:'Acknowledge verification limits'}));click('Accept this revision');
 expect(session().acceptances).toHaveLength(1);cleanup();render(<App/>);expect(screen.getByText('Accepted, with limits.')).toBeTruthy();
 click('Introduce code-only defect');expect(screen.getByText('Previous evidence is stale for this change.')).toBeTruthy();
 click('Check current executable');await screen.findByText('Bounded check failed',{}, {timeout:5000});
 expect(session().evidence.at(-1).outcome).toBe('failed');expect(session().acceptances).toHaveLength(1);
},15000);
test('stop and refresh cannot pass; rerun is accessible',async()=>{
 render(<App/>);click('Start guided project');click('Approve interpretation & check');click('Stop check');
 expect(screen.getByText('Check inconclusive')).toBeTruthy();expect(screen.getByRole('button',{name:'Accept this revision'}).disabled).toBe(true);
 click('Run a fresh check');cleanup();render(<App/>);
 await waitFor(()=>expect(session().activeRun).toBe(null));expect(session().evidence.at(-1).message).toMatch(/interrupted by refresh/);
 expect(screen.getByRole('button',{name:'Run a fresh check'})).toBeTruthy();
});
test('invalid storage is preserved and write failure never claims it is saved',()=>{
 localStorage.setItem(SESSION_KEY,'{broken');render(<App/>);
 expect(screen.getByRole('alert').textContent).toContain('has not been overwritten');expect(localStorage.getItem(SESSION_KEY)).toBe('{broken');
 expect(screen.queryByText('Session saved locally')).toBe(null);click('Start guided project');expect(localStorage.getItem(SESSION_KEY)).toBe('{broken');
 cleanup();localStorage.clear();const original=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw new Error('quota');};
 try{render(<App/>);expect(screen.getByRole('alert').textContent).toContain('Saving failed');expect(screen.queryByText('Session saved locally')).toBe(null);}finally{Storage.prototype.setItem=original;}
});
test('keyboard focus survives live sample and acknowledgement state updates',async()=>{
 const {default:userEvent}=await import('@testing-library/user-event');const user=userEvent.setup();render(<App/>);click('Start guided project');
 fireEvent.click(screen.getByRole('checkbox',{name:/Start with a deliberately faulty/}));click('Approve interpretation & check');await screen.findByText('Bounded check passed',{}, {timeout:5000});
 const add=screen.getByRole('button',{name:'Add A',exact:true});add.focus();await user.keyboard('{Enter}');expect(document.activeElement).toBe(add);expect(session().sample.queue).toEqual(['A']);
 const ack=screen.getByRole('checkbox',{name:'Acknowledge verification limits'});ack.focus();await user.keyboard(' ');expect(document.activeElement).toBe(ack);expect(screen.getByRole('button',{name:'Accept this revision'}).disabled).toBe(false);
});
test('tabs support arrow, Home and End navigation with panel association',async()=>{
 const {default:userEvent}=await import('@testing-library/user-event');const user=userEvent.setup();render(<App/>);click('Start guided project');
 const plain=screen.getByRole('tab',{name:'Plain language'}),exact=screen.getByRole('tab',{name:'Exact contract'});
 plain.focus();await user.keyboard('{ArrowRight}');expect(document.activeElement).toBe(exact);expect(exact.getAttribute('aria-selected')).toBe('true');expect(screen.getByRole('tabpanel').getAttribute('aria-labelledby')).toBe(exact.id);
 await user.keyboard('{ArrowRight}');expect(document.activeElement).toBe(plain);await user.keyboard('{End}');expect(document.activeElement).toBe(exact);await user.keyboard('{Home}');expect(document.activeElement).toBe(plain);expect(exact.tabIndex).toBe(-1);
});
test('comparison precedes approval, jump controls focus destinations, limits never imply acceptance',async()=>{
 const scroll=vi.fn();const original=Element.prototype.scrollIntoView;Element.prototype.scrollIntoView=scroll;
 try{
 render(<App/>);click('Start guided project');fireEvent.click(screen.getByRole('checkbox',{name:/Start with a deliberately faulty/}));click('Approve interpretation & check');await screen.findByText('Bounded check passed',{}, {timeout:5000});
 click('Try this behavior');expect(document.activeElement.id).toBe('live-sample');expect(scroll).toHaveBeenCalled();
 fireEvent.click(screen.getAllByRole('button',{name:'Review limits & decide'})[0]);expect(document.activeElement.id).toBe('acceptance-limits');expect(screen.getByRole('button',{name:'Accept this revision'}).disabled).toBe(true);expect(session().acceptances).toHaveLength(0);
 click('Compare a different policy');const comparison=screen.getByRole('region',{name:'Behavior change to approve'}),approve=screen.getByRole('button',{name:'Approve change & check'});
 expect(comparison.parentElement).toBe(approve.parentElement);expect(comparison.compareDocumentPosition(approve)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();expect(comparison.textContent).toContain('Discarded: B (incoming)');
 click('Discard proposal; keep approved intent');expect(session().draft).toBe(null);expect(session().spec.revision).toBe(1);expect(session().acceptances).toHaveLength(0);
 }finally{Element.prototype.scrollIntoView=original;}
});
test('malformed acceptance and legacy migration recover without overwriting original data',async()=>{
 const {newSession,approveSpec,generateImplementation,beginRun,finishRun}=await import('../src/session.js');const {checkArtifact}=await import('../src/engine.js');
 let s=generateImplementation(approveSpec(newSession()));s=finishRun(beginRun(s),checkArtifact(s.spec,s.implementation));s.acceptances=[null];const raw=JSON.stringify(s);localStorage.setItem(SESSION_KEY,raw);render(<App/>);expect(screen.getByRole('alert').textContent).toContain('has not been overwritten');expect(localStorage.getItem(SESSION_KEY)).toBe(raw);
 cleanup();localStorage.clear();const old=JSON.stringify({name:{bad:'name'}});localStorage.setItem('groundwork.v1',old);render(<App/>);expect(screen.getByRole('alert').textContent).toContain('has not been overwritten');expect(localStorage.getItem('groundwork.v1')).toBe(old);expect(localStorage.getItem(SESSION_KEY)).toBe(null);
});
