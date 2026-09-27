// @vitest-environment jsdom
import React from 'react';
import {test,expect,afterEach,vi} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {Groundwork} from '../src/Groundwork.jsx';
import {accountStorageKey} from '../src/account.js';
import {LESSON_KEY} from '../src/lesson-session.js';
afterEach(()=>{cleanup();localStorage.clear();vi.restoreAllMocks();});
test('authenticated workspaces do not load or overwrite guest progress',async()=>{
 const guest='preserve-guest-data';localStorage.setItem(LESSON_KEY,guest);vi.spyOn(window,'fetch').mockResolvedValue(Response.json({available:true,user:{id:'example-user'}}));vi.spyOn(window,'scrollTo').mockImplementation(()=>{});
 render(<Groundwork/>);await screen.findByRole('heading',{name:'Make a name badge.'});expect(screen.getByText('Signed in with ChatGPT')).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'Use this rule & check'}));expect(localStorage.getItem(LESSON_KEY)).toBe(guest);expect(JSON.parse(localStorage.getItem(accountStorageKey(LESSON_KEY,{id:'example-user'}))).lessons.badge.evidence).toHaveLength(1);
});
test('unavailable identity does not silently fall back to a guest workspace',async()=>{
 vi.spyOn(window,'fetch').mockRejectedValue(new Error('offline'));render(<Groundwork/>);await screen.findByRole('button',{name:'Retry sign-in status'});expect(screen.queryByRole('heading',{name:'Make a name badge.'})).toBe(null);expect(localStorage.getItem(LESSON_KEY)).toBe(null);
});
