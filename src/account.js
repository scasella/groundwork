import {digest} from './engine.js';
export function accountStorageKey(base,user){return user?`${base}.account.${digest(user.id)}`:base;}
export function accountPath(action,returnTo='/'){
  const base='https://same-site.invalid';let destination='/';
  if(typeof returnTo==='string'&&returnTo.startsWith('/')&&!returnTo.startsWith('//')){
    try{const parsed=new URL(returnTo,base);if(parsed.origin===base&&!['/signin-with-chatgpt','/signout-with-chatgpt','/callback'].includes(parsed.pathname))destination=parsed.pathname+parsed.search+parsed.hash;}catch{}
  }
  return `/${action==='out'?'signout':'signin'}-with-chatgpt?return_to=${encodeURIComponent(destination)}`;
}
export async function readAccount(fetcher,signal,{required=false}={}){
  const response=await fetcher('/api/session',{credentials:'same-origin',cache:'no-store',signal});
  const json=response.headers.get('content-type')?.includes('application/json');
  // Standalone static hosting and Vite's dev server have no account endpoint.
  if(!required&&!json&&(response.ok||response.status===404))return {available:false,user:null};
  if(!response.ok||!json)throw Error('Sign-in status is unavailable. Please retry.');
  const value=await response.json();
  if(!value||typeof value.available!=='boolean'||!(value.user===null||value.available&&typeof value.user?.id==='string'&&value.user.id.trim()))throw Error('Invalid sign-in response. Please retry.');
  if(required&&!value.available)throw Error('Sites sign-in is not configured.');
  return {available:value.available,user:value.user?{id:value.user.id}:null};
}
