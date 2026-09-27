import test from 'node:test';
import assert from 'node:assert/strict';
import {accountResponse} from '../worker/chatgpt-auth.js';
import {accountPath,accountStorageKey,readAccount} from '../src/account.js';
test('Sites identity requires explicit runtime enablement and both trusted headers',async()=>{
 const headers={'oai-authenticated-user-id':'example-user','oai-authenticated-user-email':'example@example.test'};
 const request=new Request('https://site.example/api/session',{headers});
 assert.deepEqual(await accountResponse(request,{}).json(),{available:false,user:null});
 const enabled=accountResponse(request,{GROUNDWORK_CHATGPT_AUTH:'enabled'});assert.deepEqual(await enabled.json(),{available:true,user:{id:'example-user'}});assert.match(enabled.headers.get('cache-control'),/no-store/);
 const partial=new Request('https://site.example/api/session',{headers:{'oai-authenticated-user-id':'example-user'}});assert.deepEqual(await accountResponse(partial,{GROUNDWORK_CHATGPT_AUTH:'enabled'}).json(),{available:true,user:null});
 assert.equal(accountResponse(new Request('https://site.example/api/session',{method:'POST'}),{}).status,405);assert.equal(accountResponse(new Request('https://site.example/'),{}),null);
});
test('auth navigation remains relative, account keys are isolated, and failures do not select a workspace',async()=>{
 for(const unsafe of ['https://evil.example','//evil.example','/\\evil.example','/signin-with-chatgpt','/signout-with-chatgpt','/callback'])assert.equal(accountPath('in',unsafe),'/signin-with-chatgpt?return_to=%2F');
 assert.equal(accountPath('out','/?example=audio'),'/signout-with-chatgpt?return_to=%2F%3Fexample%3Daudio');
 assert.equal(accountStorageKey('base',null),'base');assert.notEqual(accountStorageKey('base',{id:'a'}),accountStorageKey('base',{id:'b'}));
 assert.deepEqual(await readAccount(async()=>new Response('<html>Local dev</html>',{headers:{'content-type':'text/html'}})),{available:false,user:null});
 await assert.rejects(()=>readAccount(async()=>new Response('<html>Unexpected redirect</html>',{headers:{'content-type':'text/html'}}),undefined,{required:true}));
 await assert.rejects(()=>readAccount(async()=>Response.json({available:true,user:{id:''}})));await assert.rejects(()=>readAccount(async()=>new Response('error',{status:500})));
});
