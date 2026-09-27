import React,{useState,useMemo,useEffect,useRef} from 'react';
import {executable} from './programs.js';
import {patternSvg} from './exports.js';
import {ICONS} from './symbols.js';
import {FAMILIES,THEMES} from './config.js';
export function Symbol({name}){return <span className="studio-symbol" aria-hidden="true" dangerouslySetInnerHTML={{__html:ICONS[name]}}/>;}
export function Preview({artifact,compact=false}){
 const run=useMemo(()=>executable(artifact),[artifact.id]);
 const [state,setState]=useState(()=>run(null,{type:'init'}));
 const {kind,config:c}=artifact,colors=THEMES[c.theme]||THEMES.mint;
 const sceneHeading=useRef(null),lastScene=useRef(state?.node);
 useEffect(()=>{if(kind==='story'&&lastScene.current!==state.node){sceneHeading.current?.focus({preventScroll:true});lastScene.current=state.node;}},[kind,state]);
 const act=action=>event=>{if(event.detail<=1)setState(old=>run(old,action));};
 let body;
 if(kind==='pattern')body=<div className="studio-pattern" dangerouslySetInnerHTML={{__html:patternSvg(artifact)}}/>;
 if(kind==='memory'){
  const deck=run(null,{type:'deck'}),status=state.matched===255?'All four pairs found!':state.pending?'Different symbols. Choose Next turn when you are ready.':state.open.length?'Choose one more card.':'Choose two cards.';
  body=<><p className="play-status" role="status">{status}</p><div className="memory-board">{deck.map((symbol,i)=>{const up=!!(state.matched&(1<<i))||state.open.includes(i);return <button key={i} className={`memory-card ${up?'is-up':''}`} aria-label={`Card ${i+1}: ${up?symbol:'face down'}`} aria-pressed={up} aria-disabled={up||state.pending} onClick={act({type:'select',index:i})}>{up?<Symbol name={symbol}/>:<span>{i+1}</span>}</button>;})}</div><div className="actions"><button className="btn primary" disabled={!state.pending} onClick={act({type:'next'})}>Next turn</button><button className="text-btn" onClick={act({type:'reset'})}>Play this board again</button></div></>;
 }
 if(kind==='story'){
  const scene=c.scenes[state.node];body=<><section className="adventure-scene"><span className="scene-star"><Symbol name="moon"/></span><h3 ref={sceneHeading} tabIndex={-1}>{scene.title||'Untitled scene'}</h3><p>{scene.body}</p><div className="story-choices">{scene.choices.map((choice,i)=><button className="btn secondary" key={i} onClick={act({type:'choose',index:i})}>{choice.label||`Choice ${i+1}`} <span aria-hidden="true">→</span></button>)}</div>{!scene.choices.length&&<p className="story-ending">The end. Try another path whenever you like.</p>}</section><div className="actions">{c.navigation==='back'&&<button className="btn secondary" disabled={!state.history.length} onClick={act({type:'back'})}>Back</button>}<button className="text-btn" onClick={act({type:'reset'})}>Start over</button></div><p className="sr-only" role="status">{scene.title}. {scene.choices.length?'Choose where your story goes.':'The end.'}</p></>;
 }
 if(kind==='garden')body=<><p className="play-status" role="status">{c.water==='shared'?`${state.water} of 3 shared drops left. Next turn refills them.`:'Water as often as you like. Each creature has three stages.'}</p><div className="garden-pots">{c.pots.map((p,i)=><section className="garden-pot" key={i}><div className={`garden-growth stage-${state.stages[i]}`}><Symbol name={FAMILIES[p.family][state.stages[i]]}/></div><h3>{p.name||`Creature ${i+1}`}</h3><p>{['A little seed','Growing curious','Fully grown'][state.stages[i]]}</p><button className="btn secondary" onClick={act({type:'water',index:i})} disabled={state.stages[i]===2||(c.water==='shared'&&!state.water)}>Water {p.name||`creature ${i+1}`}</button></section>)}</div><div className="actions">{c.water==='shared'&&<button className="btn primary" onClick={act({type:'next'})}>Next turn · refill water</button>}<button className="text-btn" onClick={act({type:'reset'})}>Plant again</button></div></>;
 return <div className={`studio-play ${compact?'compact':''} play-${kind}`} style={{'--play-paper':colors[0],'--play-ink':colors[1],'--play-accent':colors[2]}}>{!compact&&<h2>{c.title||'My untitled project'}</h2>}{body}</div>;
}
