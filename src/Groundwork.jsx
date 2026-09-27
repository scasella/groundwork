import React,{useEffect,useState} from 'react';
import {App} from './App.jsx';
import {Lessons} from './Lessons.jsx';
import {AccountControls} from './AccountControls.jsx';
import {accountStorageKey,readAccount} from './account.js';
import {SESSION_KEY} from './session.js';
import {LESSON_KEY} from './lesson-session.js';
export function Groundwork(){
  const [account,setAccount]=useState(null),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
  useEffect(()=>{
    let cancelled=false;const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),5000);
    setError('');
    readAccount(window.fetch.bind(window),controller.signal).then(result=>{if(!cancelled)setAccount(result);}).catch(()=>{if(!cancelled)setError('We could not determine your sign-in status. Retry to open the right workspace.');}).finally(()=>clearTimeout(timer));
    return()=>{cancelled=true;clearTimeout(timer);controller.abort();};
  },[attempt]);
  if(!account)return <main className="lesson-main account-loading"><h1>Groundwork</h1><p role="status">{error||'Opening your workspace…'}</p>{error&&<button className="btn primary" onClick={()=>setAttempt(n=>n+1)}>Retry sign-in status</button>}</main>;
  const controls=<AccountControls account={account}/>;
  return new URLSearchParams(window.location.search).get('example')==='audio'
    ? <App key={accountStorageKey(SESSION_KEY,account.user)} storageKey={accountStorageKey(SESSION_KEY,account.user)} accountControls={controls} onBeginner={()=>window.location.assign(window.location.pathname)}/>
    : <Lessons key={accountStorageKey(LESSON_KEY,account.user)} storageKey={accountStorageKey(LESSON_KEY,account.user)} accountControls={controls}/>;
}
