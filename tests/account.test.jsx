// @vitest-environment jsdom
import React from 'react';
import {test,expect,afterEach,vi} from 'vitest';
import {render,screen,fireEvent,cleanup,waitFor} from '@testing-library/react';
import {Groundwork} from '../src/Groundwork.jsx';
import {accountStorageKey} from '../src/account.js';
import {LESSON_KEY} from '../src/lesson-session.js';
afterEach(()=>{cleanup();localStorage.clear();vi.restoreAllMocks();});
test('authenticated workspaces do not load or overwrite guest progress',async()=>{
 const guest='preserve-guest-data';localStorage.setItem(LESSON_KEY,guest);vi.spyOn(window,'fetch').mockImplementation(async()=>Response.json({available:true,user:{id:'example-user'}}));vi.spyOn(window,'scrollTo').mockImplementation(()=>{});
 render(<Groundwork/>);await screen.findByRole('heading',{name:'Make a name badge.'});expect(screen.getByText('Signed in with ChatGPT')).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'Use this rule & check'}));expect(localStorage.getItem(LESSON_KEY)).toBe(guest);expect(JSON.parse(localStorage.getItem(accountStorageKey(LESSON_KEY,{id:'example-user'}))).lessons.badge.evidence).toHaveLength(1);
});
test('unavailable identity does not silently fall back to a guest workspace',async()=>{
 vi.spyOn(window,'fetch').mockRejectedValue(new Error('offline'));render(<Groundwork/>);await screen.findByRole('button',{name:'Retry sign-in status'});expect(screen.queryByRole('heading',{name:'Make a name badge.'})).toBe(null);expect(localStorage.getItem(LESSON_KEY)).toBe(null);
});

test('returning to a stale tab revalidates identity and opens the new account workspace',async()=>{
 let id='account-a';vi.spyOn(window,'fetch').mockImplementation(async()=>Response.json({available:true,user:{id}}));vi.spyOn(window,'scrollTo').mockImplementation(()=>{});render(<Groundwork/>);await screen.findByRole('button',{name:'Use this rule & check'});fireEvent.click(screen.getByRole('button',{name:'Use this rule & check'}));expect(screen.getByText('CHECK FOUND A MISTAKE')).toBeTruthy();
 id='account-b';fireEvent.focus(window);await screen.findByRole('button',{name:'Use this rule & check'});await waitFor(()=>expect(JSON.parse(localStorage.getItem(accountStorageKey(LESSON_KEY,{id}))).lessons.badge.evidence).toHaveLength(0));expect(JSON.parse(localStorage.getItem(accountStorageKey(LESSON_KEY,{id:'account-a'}))).lessons.badge.evidence).toHaveLength(1);
 vi.mocked(window.fetch).mockRejectedValue(new Error('offline'));fireEvent.focus(window);await screen.findByRole('button',{name:'Retry sign-in status'});expect(screen.queryByRole('button',{name:'Use this rule & check'})).toBe(null);
});

test('starter workspaces follow the same account isolation and leave existing lessons untouched',async()=>{
 const {STUDIO_KEY}=await import('../src/studio/session.js');window.history.replaceState(null,'','/?archive=starters&studio=pattern');localStorage.setItem(STUDIO_KEY,'guest-starter-data');localStorage.setItem(LESSON_KEY,'guest-lessons');vi.spyOn(window,'fetch').mockImplementation(async()=>Response.json({available:true,user:{id:'starter-user'}}));render(<Groundwork/>);await screen.findByRole('heading',{name:'Make a little art.'});fireEvent.change(screen.getByLabelText('Give it a title'),{target:{value:'Account artwork'}});expect(localStorage.getItem(STUDIO_KEY)).toBe('guest-starter-data');expect(localStorage.getItem(LESSON_KEY)).toBe('guest-lessons');expect(JSON.parse(localStorage.getItem(accountStorageKey(STUDIO_KEY,{id:'starter-user'}))).projects.pattern.config.title).toBe('Account artwork');window.history.replaceState(null,'','/');
});

test('universe replaces the normal starter route and isolates its account from guest and archived work',async()=>{
 const {UNIVERSE_KEY}=await import('../src/universe/session.js');const {STUDIO_KEY}=await import('../src/studio/session.js');window.history.replaceState(null,'','/?studio=1');localStorage.setItem(UNIVERSE_KEY,'guest-universe');localStorage.setItem(STUDIO_KEY,'archived-creations');vi.spyOn(window,'fetch').mockImplementation(async()=>Response.json({available:true,user:{id:'world-maker'}}));render(<Groundwork/>);await screen.findByRole('heading',{name:'Make your own physics.'});expect(screen.queryByRole('heading',{name:'Pattern Postcards'})).toBe(null);fireEvent.click(screen.getByRole('button',{name:'Make my first rule'}));expect(localStorage.getItem(UNIVERSE_KEY)).toBe('guest-universe');expect(localStorage.getItem(STUDIO_KEY)).toBe('archived-creations');expect(JSON.parse(localStorage.getItem(accountStorageKey(UNIVERSE_KEY,{id:'world-maker'}))).draft.program.rules).toHaveLength(1);window.history.replaceState(null,'','/');
});
