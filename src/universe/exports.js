import { executable, validateProgram, validateWorld, validateLaw } from './engine.js';

const safeJson = value => JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
const LICENSE = `<!-- Groundwork exported player — MIT License
Copyright (c) 2026 scasella
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
-->`;
const STYLE = String.raw`
:root{color-scheme:dark;font:16px system-ui,sans-serif;background:#12171a;color:#e7ecec}*{box-sizing:border-box}body{margin:0;padding:24px}main{max-width:1000px;margin:auto}h1{font-size:clamp(30px,5vw,48px);letter-spacing:-1.5px;font-weight:600;margin:10px 0 16px}h2{font-size:18px}p{color:#b0c3c8;line-height:1.75}.layout{display:grid;grid-template-columns:minmax(0,620px) minmax(200px,1fr);gap:28px;align-items:start}canvas{display:block;width:100%;height:auto;aspect-ratio:1;image-rendering:pixelated;background:#0a1625;border:1px solid #3d5c68;touch-action:none;border-radius:8px}button,select{font:inherit;min-height:42px;background:#213037;color:#ecf5f2;border:1px solid #50676b;border-radius:6px;padding:9px 13px;cursor:pointer}button:focus-visible,select:focus-visible,canvas:focus-visible,summary:focus-visible{outline:3px solid #8bdfcf;outline-offset:4px}button[aria-pressed=true],#play{background:#62d6c4;border-color:#62d6c4;color:#10221f}button:disabled{opacity:.45;cursor:default}.tools{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0}.tools label{display:flex;gap:8px;align-items:center}small,summary{font-size:12px;color:#adc6ca;line-height:1.8}.stats{padding:18px;background:#19262c;border:1px solid #334d58;border-radius:8px;font-size:14px;line-height:2}.stats strong{color:#f2c66f;font-weight:500}.guide{font-size:13px}.rule{margin:14px 0;border-top:1px solid #3b4b51;padding-top:12px;overflow-wrap:anywhere}.rule b{display:block;font-size:14px}.rule code{font-size:12px;color:#a2cbcf;display:block;margin:6px 0;white-space:pre-wrap}details{margin-top:24px}summary{cursor:pointer}footer{font-size:12px;border-top:1px solid #35464d;margin-top:30px;padding-top:18px;color:#9db6bf;line-height:1.8}.identity{overflow-wrap:anywhere;font-family:monospace}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}@media(max-width:720px){body{padding:18px}.layout{grid-template-columns:1fr;gap:12px}h1{font-size:34px}}
`;
const PLAYER = String.raw`
const palette=['#0a1625','#edb959','#55baf4','#8390a4'],names=['Empty','Sand','Water','Stone'];
const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d');
let world=initial.slice(),paused=true,ticks=0,brush=1,cursor={x:32,y:32},painting=false,lastPoint=null,lastFrame=0,manualDelta=0;
const matter=w=>w.reduce((n,c)=>n+Number(c!==0),0),baseline=matter(initial);
const status=document.querySelector('#status'),stats=document.querySelector('#stats'),play=document.querySelector('#play');
function draw(){
 ctx.imageSmoothingEnabled=false;ctx.fillStyle=palette[0];ctx.fillRect(0,0,512,512);
 for(let i=0;i<4096;i++)if(world[i]){ctx.fillStyle=palette[world[i]];ctx.fillRect((i%64)*8,Math.floor(i/64)*8,8,8);}
 if(document.activeElement===canvas){ctx.strokeStyle='#ffffff';ctx.lineWidth=2;ctx.strokeRect(cursor.x*8+1,cursor.y*8+1,6,6);}
 const count=matter(world),delta=count-baseline-manualDelta;
 stats.replaceChildren();const strong=document.createElement('strong');strong.textContent=count.toLocaleString()+' grains';stats.append(strong,document.createElement('br'),document.createTextNode('Step '+ticks),document.createElement('br'),document.createTextNode('Brush change: '+(manualDelta>=0?'+':'')+manualDelta),document.createElement('br'),document.createTextNode('Physics change: '+(delta>=0?'+':'')+delta));
 play.textContent=paused?'Run world':'Pause';status.textContent=paused?'Paused. Paint, step, or run your world.':'Your saved physics is running.';
}
function advance(){world=step(world);ticks++;draw();}
function point(event){const r=canvas.getBoundingClientRect();return {x:Math.max(0,Math.min(63,Math.floor((event.clientX-r.left)/r.width*64))),y:Math.max(0,Math.min(63,Math.floor((event.clientY-r.top)/r.height*64)))};}
function paint(from,to){const steps=Math.max(Math.abs(to.x-from.x),Math.abs(to.y-from.y),1),size=Number(document.querySelector('#size').value);for(let j=0;j<=steps;j++){const x=Math.round(from.x+(to.x-from.x)*j/steps),y=Math.round(from.y+(to.y-from.y)*j/steps);for(let dy=0;dy<size;dy++)for(let dx=0;dx<size;dx++){const xx=x+dx-Math.floor(size/2),yy=y+dy-Math.floor(size/2);if(xx<0||xx>63||yy<0||yy>63)continue;const i=yy*64+xx;manualDelta+=Number(brush!==0)-Number(world[i]!==0);world[i]=brush;}}draw();}
canvas.onpointerdown=event=>{if(event.button!==0)return;event.preventDefault();canvas.focus({preventScroll:true});painting=true;canvas.setPointerCapture(event.pointerId);cursor=point(event);lastPoint=cursor;paint(cursor,cursor);};
canvas.onpointermove=event=>{if(!painting)return;cursor=point(event);paint(lastPoint,cursor);lastPoint=cursor;};
const endPaint=()=>{painting=false;lastPoint=null;};canvas.onpointerup=endPaint;canvas.onpointercancel=endPaint;canvas.onlostpointercapture=endPaint;
canvas.onfocus=draw;canvas.onblur=()=>{endPaint();draw();};canvas.onkeydown=event=>{const move={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[event.key];if(move){event.preventDefault();cursor={x:Math.max(0,Math.min(63,cursor.x+move[0])),y:Math.max(0,Math.min(63,cursor.y+move[1]))};draw();}else if((event.key===' '||event.key==='Enter')&&!event.repeat){event.preventDefault();paint(cursor,cursor);}};
for(const button of document.querySelectorAll('[data-brush]'))button.onclick=()=>{brush=Number(button.dataset.brush);for(const b of document.querySelectorAll('[data-brush]'))b.setAttribute('aria-pressed',String(b===button));canvas.setAttribute('aria-label','Interactive universe. Paint '+names[brush]+'. Arrow keys move the cursor; Enter paints.');};
play.onclick=()=>{paused=!paused;draw();};document.querySelector('#step').onclick=()=>{paused=true;advance();};document.querySelector('#reset').onclick=()=>{paused=true;world=initial.slice();ticks=0;manualDelta=0;draw();};
const list=document.querySelector('#rules');
for(const r of authorProgram.rules){const item=document.createElement('div');item.className='rule';const title=document.createElement('b');title.textContent=(r.enabled?'':'Disabled: ')+(r.name||'Untitled rule');const body=document.createElement('code');body.textContent='Before: '+r.match.map(v=>v<0?'Any':names[v]).join(' | ')+'\nAfter: '+r.output.map(v=>v<4?['original top-left','original top-right','original bottom-left','original bottom-right'][v]:names[v-4]).join(' | ');item.append(title,body);list.append(item);}
if(!authorProgram.rules.length)list.textContent='Prepared falling sand and spreading water.';
function frame(time){if(!paused&&!document.hidden&&time-lastFrame>=100){advance();lastFrame=time;}requestAnimationFrame(frame);}draw();requestAnimationFrame(frame);
`;
export function htmlExport(artifact, world, law) {
  executable(artifact);
  const initial = validateWorld(world), constitution = validateLaw(law);
  if (/<\/script/i.test(artifact.source)) throw Error('Artifact source cannot be safely embedded as an inline module');
  const promises = ['Keep total matter', ...(constitution.species ? ['keep each material'] : []), ...(constitution.stone ? ['keep stone cells fixed'] : [])].join('; ');
  return `<!doctype html>\n${LICENSE}\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="groundwork-artifact" content="${artifact.id}"><link rel="icon" href="data:,"><title>A universe made in Groundwork</title><style>${STYLE}</style></head><body><main><p>Made in Groundwork</p><h1>Your rules. A different universe.</h1><div class="layout"><section><canvas width="512" height="512" tabindex="0" role="group" aria-label="Interactive universe. Paint Sand. Arrow keys move the cursor; Enter paints."></canvas><div class="tools" aria-label="Brushes"><button data-brush="1" aria-pressed="true">Sand</button><button data-brush="2" aria-pressed="false">Water</button><button data-brush="3" aria-pressed="false">Stone</button><button data-brush="0" aria-pressed="false">Erase</button><label>Brush size <select id="size"><option value="1">1 cell</option><option value="3" selected>3 cells</option><option value="6">6 cells</option></select></label></div><div class="tools"><button id="play">Run world</button><button id="step">One step</button><button id="reset">Reset to saved world</button></div><p id="status" role="status"></p></section><aside><div class="stats" id="stats"></div><p class="guide">Paint and play with the exact saved program. Edges wrap. Brush edits add or remove matter on purpose; the counter tracks them separately.</p><h2>Chosen promises</h2><p class="guide">${promises}.</p><small>A live count is a diagnostic, not a proof. This player does not run the checker or import a human acceptance decision.</small><details><summary>Read the authored rules</summary><div id="rules"></div></details></aside></div><footer>Offline player: no network, account, or API key needed. Reload restarts at the saved world. Groundwork's checks cover all 2,048 local block/context cases plus separate whole-engine fixtures; they are not Bend/Lean proofs of every world or a verified renderer.<p class="identity">Program revision ${artifact.revision} · SHA-256 ${artifact.id}</p></footer></main><script type="module">\n${artifact.source}\n{ const initial=${safeJson(initial)},authorProgram=${safeJson(artifact.program)};\n${PLAYER}\n}\n</script></body></html>\n`;
}
export function projectExport(artifact, world, law) {
  executable(artifact);
  return JSON.stringify({ format: 'groundwork-universe/1', program: validateProgram(artifact.program), world: validateWorld(world), law: validateLaw(law) }, null, 2);
}
export function parseProject(text) {
  if (typeof text !== 'string' || text.length > 100000) throw Error('Choose an editable universe JSON smaller than 100 KB');
  const data = JSON.parse(text);
  if (!data || data.format !== 'groundwork-universe/1') throw Error('This is not an editable Groundwork universe');
  return { program: validateProgram(data.program), world: validateWorld(data.world), law: validateLaw(data.law) };
}
