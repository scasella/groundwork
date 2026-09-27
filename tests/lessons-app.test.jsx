// @vitest-environment jsdom
import React from 'react';
import {test,expect,beforeEach,afterEach,vi} from 'vitest';
import {render,screen,fireEvent,cleanup,within} from '@testing-library/react';
import {Lessons} from '../src/Lessons.jsx';
import {LESSON_KEY} from '../src/lesson-session.js';
beforeEach(()=>vi.spyOn(window,'scrollTo').mockImplementation(()=>{}));
afterEach(()=>{cleanup();localStorage.clear();vi.restoreAllMocks();});
const click=name=>fireEvent.click(screen.getByRole('button',{name,exact:true}));
const saved=()=>JSON.parse(localStorage.getItem(LESSON_KEY));

test('starts with badge, repairs and finishes undecided, then offers shopping without discarding badge history',()=>{
 render(<Lessons/>);expect(screen.getByRole('heading',{name:'Make a name badge.'})).toBeTruthy();click('Use this rule & check');
 expect(screen.getByLabelText('Actual badge').textContent).toContain('Chen');click('Apply prepared repair & check');
 expect(screen.getByRole('heading',{name:'Now it follows your rule.'})).toBeTruthy();fireEvent.change(screen.getByLabelText('Example person'),{target:{value:'2'}});expect(screen.getByLabelText('Live badge').textContent).toContain('Leo');
 click('Leave undecided');expect(saved().lessons.badge.acceptances).toHaveLength(0);click('Try the shopping list');expect(screen.getByRole('heading',{name:'A list that follows your rule.'})).toBeTruthy();
 click('Use this rule & check');expect(screen.getByRole('heading',{name:'Bread should still be here.'})).toBeTruthy();click('Apply prepared repair & check');click('Mark Milk bought');
 const sample=screen.getByRole('region',{name:'Live practice'});expect(within(sample).getByRole('button',{name:'Mark Bread bought'})).toBeTruthy();expect(within(sample).queryByRole('button',{name:'Mark Milk bought'})).toBe(null);expect(sample.textContent).toContain('Bought: Milk');
 click('Try changing the rule');expect(screen.getByRole('region',{name:'Proposed rule change'}).textContent).toContain('Show bought items too');click('Approve new rule & check');click('Accept this practice version');
 expect(saved().lessons.shopping.acceptances).toHaveLength(1);expect(saved().lessons.shopping.evidence).toHaveLength(3);expect(saved().lessons.badge.evidence).toHaveLength(2);
 cleanup();render(<Lessons/>);expect(screen.getByRole('heading',{name:'Accepted for this practice example.'})).toBeTruthy();
});
test('badge comparison is symmetric and acceptance is not inherited on changing the rule',()=>{
 render(<Lessons/>);fireEvent.click(screen.getByRole('radio',{name:'Full name'}));click('Use this rule & check');expect(screen.getByLabelText('Actual badge').textContent).toContain('Chen Chen');
 click('Apply prepared repair & check');click('Accept this practice version');click('Try changing the rule');expect(screen.getByRole('heading',{name:'Would first names feel more informal?'})).toBeTruthy();
 click('Keep my rule');expect(saved().lessons.badge.rule.policy).toBe('full');expect(saved().lessons.badge.acceptances).toHaveLength(1);
 click('Try changing the rule');click('Approve new rule & check');expect(saved().lessons.badge.rule.policy).toBe('first');expect(screen.getByRole('button',{name:'Accept this practice version'})).toBeTruthy();expect(saved().lessons.badge.acceptances).toHaveLength(1);
});
test('corrupt and unwritable storage never claims progress is saved, and reset is deliberate',()=>{
 localStorage.setItem(LESSON_KEY,'broken');render(<Lessons/>);expect(screen.getByRole('alert').textContent).toContain('not been overwritten');click('Use this rule & check');expect(localStorage.getItem(LESSON_KEY)).toBe('broken');click('Review reset options');click('Keep working');expect(localStorage.getItem(LESSON_KEY)).toBe('broken');cleanup();localStorage.clear();
 vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw Error('Quota');});render(<Lessons/>);expect(screen.getByRole('alert').textContent).toContain('not saved');expect(screen.queryByText('Progress saved in this browser')).toBe(null);
});
test('a historical pass from older checking conditions asks for a fresh check and cannot be accepted',async()=>{
 const {newLessons,startLesson,repairLesson}=await import('../src/lesson-session.js');const {digest}=await import('../src/engine.js');const root=newLessons();root.lessons.badge=repairLesson(startLesson(root.lessons.badge));
 const report=root.lessons.badge.evidence.at(-1);report.binding.checker='older-checker';const {id,...body}=report;report.id=digest(body);root.lessons.badge.phase='done';localStorage.setItem(LESSON_KEY,JSON.stringify(root));
 render(<Lessons/>);expect(screen.getByText('FRESH CHECK NEEDED')).toBeTruthy();expect(screen.queryByRole('button',{name:'Accept this practice version'})).toBe(null);click('Check this version again');expect(screen.getByText('CHECK PASSED')).toBeTruthy();expect(saved().lessons.badge.evidence).toHaveLength(3);
});
test('second click of a double-click cannot buy the next item after the first disappears',()=>{
 render(<Lessons/>);fireEvent.click(screen.getByRole('button',{name:/Shopping list/}));click('Use this rule & check');click('Apply prepared repair & check');fireEvent.click(screen.getByRole('button',{name:'Mark Milk bought'}),{detail:1});fireEvent.click(screen.getByRole('button',{name:'Mark Bread bought'}),{detail:2});expect(saved().lessons.shopping.sample).toEqual([true,false]);fireEvent.click(screen.getByRole('button',{name:'Mark Bread bought'}),{detail:1});expect(saved().lessons.shopping.sample).toEqual([true,true]);
});
