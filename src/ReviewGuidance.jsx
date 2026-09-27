import React from 'react';

export const actionLabel = action => action === 'pop' ? 'Remove oldest' : action.replace('push:', 'Add ');

export function TabBar({id,label,items,value,onChange}) {
  function navigate(event,index) {
    const next = event.key === 'ArrowRight' ? (index+1)%items.length
      : event.key === 'ArrowLeft' ? (index+items.length-1)%items.length
      : event.key === 'Home' ? 0 : event.key === 'End' ? items.length-1 : null;
    if(next === null)return;
    event.preventDefault();
    onChange(items[next][0]);
    event.currentTarget.parentElement.querySelectorAll('[role="tab"]')[next].focus();
  }
  return <div className="tabs" role="tablist" aria-label={label}>
    {items.map(([key,text],index)=><button key={key} id={`${id}-${key}`} role="tab"
      aria-selected={value===key} aria-controls={`${id}-panel`} tabIndex={value===key?0:-1}
      onKeyDown={event=>navigate(event,index)} onClick={()=>onChange(key)}>{text}</button>)}
  </div>;
}

export function PlainScope({config}) {
  return <div className="plain-scope">
    <p><strong>The promise:</strong> hold at most {config.capacity} records. When full, {config.policy==='drop-oldest'
      ? 'discard the oldest record and keep the new one.'
      : 'keep the waiting records and discard the incoming one.'}</p>
    <ul>
      <li>Only the labels A and B, starting with an empty queue.</li>
      <li>One operation finishes before the next begins. Simultaneous access was not checked.</li>
      <li>Checking is limited to this JavaScript program. Translation to native machine code and real audio speed or hardware behavior were not checked.</li>
    </ul>
    <p>The JavaScript runtime, code generator, and checker are trusted; this check does not prove that those tools are correct. No independent proof kernel is connected.</p>
  </div>;
}

export function QueueContext() {
  return <p className="queue-context">Imagine diagnostic notes waiting to be read: keeping the newest notes helps show what just happened; keeping the backlog preserves notes still waiting for review. A and B are two example record labels, not recorded audio. This tutorial does not measure sound or timing.</p>;
}
