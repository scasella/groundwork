import React from 'react';
import {accountPath} from './account.js';
export function AccountControls({account}){
  if(!account.available)return null;
  const returnTo=window.location.pathname+window.location.search;
  return <details className="account-menu"><summary>{account.user?'Signed in with ChatGPT':'Sign in with ChatGPT'}</summary><div><strong>{account.user?'Your ChatGPT workspace':'Optional ChatGPT sign-in'}</strong><p>{account.user?'This account has separate lesson progress on this browser.':'Signing in opens separate lesson progress on this browser. Your guest progress stays available after signing out.'}</p><p>Progress is not synced across devices. Sign-in does not give this app access to your conversations.</p><a className="btn secondary" href={accountPath(account.user?'out':'in',returnTo)} target="_top">{account.user?'Sign out':'Continue with ChatGPT'}</a></div></details>;
}
