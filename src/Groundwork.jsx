import React from 'react';
import {App} from './App.jsx';
import {Lessons} from './Lessons.jsx';
export function Groundwork(){
  return new URLSearchParams(window.location.search).get('example')==='audio'
    ? <App onBeginner={()=>window.location.assign(window.location.pathname)}/>
    : <Lessons/>;
}
