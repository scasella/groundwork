import React,{useEffect,useState} from 'react';
import {App} from './App.jsx';
import {Studio} from './studio/Studio.jsx';
import {STUDIO_KEY} from './studio/session.js';
import {Lessons} from './Lessons.jsx';
import {AccountControls} from './AccountControls.jsx';
import {accountStorageKey,readAccount} from './account.js';
import {SESSION_KEY} from './session.js';
import {LESSON_KEY} from './lesson-session.js';
export function Groundwork(){
  const [account,setAccount]=useState(null),[error,setError]=useState(''),[attempt,setAttempt]=useState(0),[checking,setChecking]=useState(true);
  useEffect(()=>{const refresh=()=>{setChecking(true);setAttempt(n=>n+1);};const visibility=()=>{if(document.visibilityState==='visible')refresh();else setChecking(true);};window.addEventListener('focus',refresh);window.addEventListener('pageshow',refresh);document.addEventListener('visibilitychange',visibility);return()=>{window.removeEventListener('focus',refresh);window.removeEventListener('pageshow',refresh);document.removeEventListener('visibilitychange',visibility);};},[]);
  useEffect(()=>{
    let cancelled=false;const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),5000);
    setError('');
    readAccount(window.fetch.bind(window),controller.signal,{required:import.meta.env.PROD&&import.meta.env.VITE_GROUNDWORK_SITES&&!['localhost','127.0.0.1','[::1]'].includes(window.location.hostname)}).then(result=>{if(!cancelled){setAccount(result);setChecking(false);}}).catch(()=>{if(!cancelled)setError('We could not determine your sign-in status. Retry to open the right workspace.');}).finally(()=>clearTimeout(timer));
    return()=>{cancelled=true;clearTimeout(timer);controller.abort();};
  },[attempt]);
  const waiting=<main className="lesson-main account-loading"><h1>Groundwork</h1><p role="status">{error||'Opening your workspace…'}</p>{error&&<button className="btn primary" onClick={()=>{setChecking(true);setAttempt(n=>n+1);}}>Retry sign-in status</button>}</main>;
  if(!account)return waiting;
  const controls=<AccountControls account={account}/>;
  const workspace=new URLSearchParams(window.location.search).get('example')==='audio'
    ? <App key={accountStorageKey(SESSION_KEY,account.user)} storageKey={accountStorageKey(SESSION_KEY,account.user)} accountControls={controls} onBeginner={()=>window.location.assign(window.location.pathname)}/>
    : new URLSearchParams(window.location.search).has('studio')
    ? <Studio key={accountStorageKey(STUDIO_KEY,account.user)} storageKey={accountStorageKey(STUDIO_KEY,account.user)} accountControls={controls}/>
    : <Lessons key={accountStorageKey(LESSON_KEY,account.user)} storageKey={accountStorageKey(LESSON_KEY,account.user)} accountControls={controls}/>;
  return <>{(checking||error)&&waiting}<div className="account-workspace" hidden={checking||!!error}>{workspace}</div></>;
}
