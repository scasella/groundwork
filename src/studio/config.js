export const KINDS=['pattern','memory','story','garden'];
export const TITLES={pattern:'Pattern Postcards',memory:'Match My World',story:'Your Tiny Adventure',garden:'Tiny Impossible Garden'};
export const SYMBOLS=['sun','moon','star','planet','fish','cat','butterfly','flower','leaf','plant','tree','acorn'];
export const FAMILIES={bloom:['acorn','plant','flower'],flutter:['acorn','leaf','butterfly'],cosmic:['acorn','moon','planet']};
export const THEMES={mint:['#163c35','#8ce0be','#f8e9bd'],dusk:['#38244b','#d6b2f3','#ffe3aa'],ocean:['#173750','#a3d9ef','#f5c9a5']};
const scene=(title,body,choices=[])=>({title,body,choices});
export function defaults(kind){
 const base={title:TITLES[kind]};
 if(kind==='pattern')return {...base,title:'Little waves',symmetry:'mirror',palette:['#153c36','#8ce0be','#f8e9bd','#e98972'],seed:Array.from({length:32},(_,i)=>[0,0,1,2,0,1,2,3][(i+Math.floor(i/4))%8])};
 if(kind==='memory')return {...base,title:'A little universe',symbols:['sun','moon','star','planet'],seed:7,theme:'dusk'};
 if(kind==='story')return {...base,title:'The moonlit letter',theme:'dusk',navigation:'back',scenes:{
 start:scene('A letter at your door','A silver envelope says: “Something wonderful is waiting.” Where will you look?',[{label:'Follow the lanterns',to:'left'},{label:'Visit the old observatory',to:'right'}]),
 left:scene('The lantern path','The lights lead to a garden gate. A tiny bell hangs beside it.',[{label:'Ring the bell',to:'endA'},{label:'Look through the gate',to:'endB'}]),
 right:scene('Among the stars','A telescope points toward a bright new star. There is a folded map on the desk.',[{label:'Look through the telescope',to:'endB'},{label:'Unfold the map',to:'endA'}]),
 endA:scene('You found the gathering','Your friends are waiting with warm drinks and a place just for you.'),
 endB:scene('A new beginning','The night is full of possibilities. You tuck the letter away and make a wish.') }};
 if(kind==='garden')return {...base,title:'My pocket planet',theme:'mint',water:'free',pots:[{name:'Pip',family:'bloom'},{name:'Miso',family:'flutter'},{name:'Orbit',family:'cosmic'}]};
 throw Error('Unknown starter project');
}
function obj(x){if(!x||typeof x!=='object'||Array.isArray(x))throw Error('Project settings must be an object');}
function word(x,max,label){if(typeof x!=='string'||x.length>max)throw Error(`${label} must be text of at most ${max} characters`);return x;}
function option(x,choices,label){if(!choices.includes(x))throw Error(`Unsupported ${label}`);return x;}
function integer(x,min,max){if(!Number.isInteger(x)||x<min||x>max)throw Error('Number outside the supported range');return x;}
function list(x,n){if(!Array.isArray(x)||x.length!==n)throw Error(`Expected ${n} entries`);return x;}
export function validateConfig(kind,value){
 option(kind,KINDS,'project');obj(value);const out={title:word(value.title,60,'Title')};
 if(kind==='pattern')return {...out,symmetry:option(value.symmetry,['mirror','turn'],'symmetry'),palette:list(value.palette,4).map(c=>{if(typeof c!=='string'||!/^#[0-9a-f]{6}$/i.test(c))throw Error('Use six-digit colors');return c.toLowerCase();}),seed:list(value.seed,32).map(n=>integer(n,0,3))};
 out.theme=option(value.theme,Object.keys(THEMES),'theme');
 if(kind==='memory'){const symbols=list(value.symbols,4).map(x=>option(x,SYMBOLS,'symbol'));if(new Set(symbols).size!==4)throw Error('Choose four different symbols');return {...out,symbols,seed:integer(value.seed,0,65535)};}
 if(kind==='garden')return {...out,water:option(value.water,['free','shared'],'water rule'),pots:list(value.pots,3).map(p=>{obj(p);return {name:word(p.name,24,'Creature name'),family:option(p.family,Object.keys(FAMILIES),'creature family')};})};
 out.navigation=option(value.navigation,['back','restart'],'navigation');obj(value.scenes);out.scenes={};
 for(const id of ['start','left','right','endA','endB']){const s=value.scenes[id];obj(s);out.scenes[id]={title:word(s.title,60,'Scene title'),body:word(s.body,500,'Scene text'),choices:list(s.choices,id.startsWith('end')?0:2).map(c=>{obj(c);return {label:word(c.label,60,'Choice label'),to:option(c.to,id==='start'?['left','right','endA','endB']:['endA','endB'],'destination')};})};}
 return out;
}
export function ruleSummary(kind,c){
 if(kind==='pattern')return c.symmetry==='mirror'?'Each left-hand mark has a matching mark reflected across the tile.':'Each left-hand mark has a matching mark half a turn around the tile.';
 if(kind==='memory')return 'Four pairs. A card cannot match itself. Cards with different symbols stay visible until you choose Next turn. Matched cards stay face up.';
 if(kind==='story')return `Every forward choice follows its named destination and reaches an ending within two choices. ${c.navigation==='back'?'Back lets the reader retrace a choice.':'The reader starts over to try another route.'}`;
 return c.water==='free'?'Each click grows only that creature, up to three stages. Water never runs out.':'Each click grows only that creature and uses one of three shared drops. Next turn refills the water; grown creatures use none.';
}
export const LIMITS={pattern:'The check covers symmetry and exported cells. It does not establish beauty, color contrast, printer colors, or originality.',memory:'The check covers one chosen eight-card arrangement. It does not establish random fairness, fun, browser input handling, or accessibility.',story:'The check covers five-scene navigation. It does not establish story quality, the meaning or suitability of your words, or browser accessibility.',garden:'The check covers discrete growth and water rules. It does not establish fun, balance, animation, or wellbeing effects.'};
export const ASSUMPTIONS=['Sequential actions in a JavaScript runtime.','The prepared generator, independent reference rules, exporter, and checker are trusted.','Local history is editable and unsigned. Hashes identify bytes; they do not authenticate them.'];
export function safeJson(value){return JSON.stringify(value).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');}
